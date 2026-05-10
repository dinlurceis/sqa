package com.doan.WEB_TMDT.module.auth;

import com.doan.WEB_TMDT.common.dto.ApiResponse;
import com.doan.WEB_TMDT.module.auth.dto.OtpVerifyRequest;
import com.doan.WEB_TMDT.module.auth.dto.RegisterRequest;
import com.doan.WEB_TMDT.module.auth.entity.*;
import com.doan.WEB_TMDT.module.auth.repository.*;
import com.doan.WEB_TMDT.module.auth.service.AuthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;

/**
 * Test suite cho AuthServiceImpl.
 * Bao gồm: sendOtp, verifyOtpAndRegister.
 * - Mock mailSender để không gửi email thật.
 * - Test mọi nhánh điều kiện: email/phone exists, OTP invalid/expired/verified.
 * - Phát hiện lỗi thiết kế: OTP lưu trước khi gửi mail.
 */
@DisplayName("AUTH SERVICE TEST")
class AuthServiceImplTest extends BaseIntegrationTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private OtpRepository otpRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    
    // HELPER METHODS
    

    private RegisterRequest taoRegisterRequest(String email, String phone, String fullName) {
        RegisterRequest req = new RegisterRequest();
        req.setEmail(email);
        req.setPhone(phone);
        req.setFullName(fullName);
        req.setPassword("TestPass123");
        req.setAddress("Test Address");
        return req;
    }

    private User taoUserVaCustomer(String email, String phone) {
        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode("TestPass123"))
                .role(Role.CUSTOMER)
                .status(Status.ACTIVE)
                .build();
        Customer c = Customer.builder().user(user).fullName("Test").phone(phone).build();
        user.setCustomer(c);
        return userRepository.save(user);
    }

    private OtpVerification taoOtp(String email, String phone, String code,
            LocalDateTime expiresAt, boolean verified) {
        OtpVerification otp = OtpVerification.builder()
                .email(email)
                .phone(phone)
                .fullName("OTP User")
                .address("Test Addr")
                .encodedPassword(passwordEncoder.encode("TestPass123"))
                .otpCode(code)
                .createdAt(LocalDateTime.now().minusMinutes(2))
                .expiresAt(expiresAt)
                .verified(verified)
                .build();
        return otpRepository.save(otp);
    }

    
    // sendOtp

    @Test
    @DisplayName("TC_AUTH_001 - Gửi OTP thành công - lưu đủ thông tin vào DB")
    void TC_AUTH_001_sendOtp_success() {
        // Mục đích nghiệp vụ: Khi khách hàng đăng ký, hệ thống tạo mã OTP 6 số,
        // lưu vào DB kèm thông tin đăng ký, và gửi qua email để xác minh.
        long otpTruoc = otpRepository.count();

        RegisterRequest req = taoRegisterRequest("otptest@test.com", "0902000001", "OTP Test User");
        ApiResponse result = authService.sendOtp(req);

        assertTrue(result.isSuccess(), "Gửi OTP phải thành công");
        assertEquals("Mã OTP đã được gửi đến email của bạn!", result.getMessage());
        assertNull(result.getData());

        // Verify OTP được lưu vào DB đúng
        otpRepository.flush();
        assertEquals(otpTruoc + 1, otpRepository.count(), "Phải tạo đúng 1 OTP record");

        // Lấy OTP vừa lưu từ DB và kiểm tra từng thuộc tính
        List<OtpVerification> allOtps = otpRepository.findAll();
        OtpVerification saved = allOtps.stream()
                .filter(o -> "otptest@test.com".equals(o.getEmail()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("OTP không được lưu vào DB"));

        assertNotNull(saved.getId(), "OTP phải có id");
        assertEquals("otptest@test.com", saved.getEmail());
        assertEquals("OTP Test User", saved.getFullName());
        assertEquals("0902000001", saved.getPhone());
        assertEquals("Test Address", saved.getAddress());
        assertFalse(saved.isVerified(), "OTP mới tạo phải chưa xác minh (verified=false)");
        assertNotNull(saved.getOtpCode(), "OTP code phải được tạo");
        assertEquals(6, saved.getOtpCode().length(), "OTP phải có đúng 6 ký tự");
        assertTrue(saved.getOtpCode().matches("\\d{6}"), "OTP phải gồm 6 chữ số");
        assertNotNull(saved.getCreatedAt(), "CreatedAt phải được set");
        assertNotNull(saved.getExpiresAt(), "ExpiresAt phải được set");
        assertTrue(saved.getExpiresAt().isAfter(saved.getCreatedAt()), "ExpiresAt phải sau CreatedAt");
        // ExpiresAt phải khoảng 5 phút sau createdAt
        long diffSeconds = java.time.Duration.between(saved.getCreatedAt(), saved.getExpiresAt()).getSeconds();
        assertTrue(diffSeconds >= 290 && diffSeconds <= 310, "OTP hết hạn sau ~5 phút, thực tế: " + diffSeconds + "s");
        assertNotNull(saved.getEncodedPassword(), "Mật khẩu mã hóa phải được lưu");
        assertTrue(saved.getEncodedPassword().startsWith("$2a$"), "Mật khẩu phải được BCrypt");
    }

    @Test
    @DisplayName("TC_AUTH_002 - Gửi OTP thất bại khi email đã tồn tại trong bảng users")
    void TC_AUTH_002_sendOtp_fail_emailDaTonTaiTrongUsers() {
        // Mục đích nghiệp vụ: Email đã được dùng cho tài khoản hiện có → từ chối gửi
        // OTP,
        // không lãng phí tài nguyên và không gây nhầm lẫn cho người dùng.
        taoUserVaCustomer("existemail@test.com", "0902000002");
        long otpTruoc = otpRepository.count();

        RegisterRequest req = taoRegisterRequest("existemail@test.com", "0902000099", "Test");
        ApiResponse result = authService.sendOtp(req);

        assertFalse(result.isSuccess());
        assertEquals("Email đã được sử dụng!", result.getMessage());
        assertNull(result.getData());

        // Không tạo OTP record
        otpRepository.flush();
        assertEquals(otpTruoc, otpRepository.count(), "Không được tạo OTP khi email đã tồn tại");
    }

    @Test
    @DisplayName("TC_AUTH_003 - Gửi OTP thất bại khi số điện thoại đã tồn tại trong customers")
    void TC_AUTH_003_sendOtp_fail_phoneDaTonTaiTrongCustomers() {
        // Mục đích nghiệp vụ: SĐT đã được dùng → từ chối gửi OTP, tránh trùng dữ liệu.
        taoUserVaCustomer("otheracc@test.com", "0902000003");
        long otpTruoc = otpRepository.count();

        RegisterRequest req = taoRegisterRequest("brandnew@test.com", "0902000003", "Brand New");
        ApiResponse result = authService.sendOtp(req);

        assertFalse(result.isSuccess());
        assertEquals("Số điện thoại đã tồn tại!", result.getMessage());

        // Không tạo OTP record
        otpRepository.flush();
        assertEquals(otpTruoc, otpRepository.count(), "Không được tạo OTP khi SĐT đã tồn tại");
    }

    @Test
    @DisplayName("TC_AUTH_004 - Gửi OTP thất bại khi gửi email lỗi - phát hiện lỗi thiết kế OTP lưu trước mail")
    void TC_AUTH_004_sendOtp_fail_guiEmailLoi_otpVanLuuVaoDB() {
        // Mục đích nghiệp vụ: Khi SMTP lỗi, service trả về lỗi.
        // [BUG DETECTION] OTP đã được lưu vào DB TRƯỚC khi gửi mail.
        // Nếu gửi mail lỗi, OTP vẫn tồn tại trong DB → đây là bug thiết kế:
        // service không rollback lưu OTP khi mail lỗi.
        doThrow(new RuntimeException("SMTP connection refused"))
                .when(mailSender).send(any(SimpleMailMessage.class));

        long otpTruoc = otpRepository.count();

        RegisterRequest req = taoRegisterRequest("mailerr@test.com", "0902000004", "Mail Error User");
        ApiResponse result = authService.sendOtp(req);

        assertFalse(result.isSuccess(), "Phải trả về lỗi khi không gửi được email");
        assertEquals("Không thể gửi email OTP. Vui lòng thử lại sau!", result.getMessage());

        // Kiểm tra DB state sau khi mail lỗi
        otpRepository.flush();
        long otpSau = otpRepository.count();

        System.out.println("=== BUG CHECK: OTP trước=" + otpTruoc + ", sau=" + otpSau);
        // Hành vi ĐÚNG: OTP không được lưu khi mail lỗi (otpSau == otpTruoc)
        // Hành vi HIỆN TẠI (bug): OTP đã lưu trước khi gửi mail (otpSau == otpTruoc +
        // 1)
        assertEquals(otpTruoc, otpSau,
                "BUG DETECTED: OTP bị lưu vào DB dù gửi email thất bại! " +
                        "AuthServiceImpl cần @Transactional để rollback lưu OTP khi gửi mail lỗi.");
    }

    
    // verifyOtpAndRegister
    

    @Test
    @DisplayName("TC_AUTH_005 - Xác minh OTP thành công và tạo tài khoản mới")
    void TC_AUTH_005_verifyOtpAndRegister_success() {
        // Mục đích nghiệp vụ: OTP hợp lệ, chưa xác minh, còn hiệu lực → tạo tài khoản
        // customer mới, đánh dấu OTP đã xác minh.
        taoOtp("verifyok@test.com", "0902000005", "654321",
                LocalDateTime.now().plusMinutes(3), false);

        long userTruoc = userRepository.count();
        long custTruoc = customerRepository.count();

        OtpVerifyRequest req = new OtpVerifyRequest();
        req.setEmail("verifyok@test.com");
        req.setOtpCode("654321");

        ApiResponse result = authService.verifyOtpAndRegister(req);

        assertTrue(result.isSuccess());
        assertEquals("Xác minh OTP thành công, tài khoản đã được tạo!", result.getMessage());
        assertNotNull(result.getData());

        // Kiểm tra OTP được đánh dấu verified=true trong DB
        otpRepository.flush();
        List<OtpVerification> otps = otpRepository.findAll();
        OtpVerification updatedOtp = otps.stream()
                .filter(o -> "verifyok@test.com".equals(o.getEmail()))
                .findFirst().orElseThrow();
        assertTrue(updatedOtp.isVerified(), "OTP phải được đánh dấu verified=true");

        // Kiểm tra user và customer được tạo
        userRepository.flush();
        assertEquals(userTruoc + 1, userRepository.count(), "Phải tạo đúng 1 user");
        assertEquals(custTruoc + 1, customerRepository.count(), "Phải tạo đúng 1 customer");

        Optional<User> newUser = userRepository.findByEmail("verifyok@test.com");
        assertTrue(newUser.isPresent(), "User phải được tạo trong DB");
        assertEquals(Role.CUSTOMER, newUser.get().getRole());
        assertEquals(Status.ACTIVE, newUser.get().getStatus());
        assertNotNull(newUser.get().getCustomer());
        assertEquals("OTP User", newUser.get().getCustomer().getFullName());
        assertEquals("0902000005", newUser.get().getCustomer().getPhone());
        assertEquals("Test Addr", newUser.get().getCustomer().getAddress());
    }

    @Test
    @DisplayName("TC_AUTH_006 - Xác minh OTP thất bại khi OTP code không đúng")
    void TC_AUTH_006_verifyOtpAndRegister_fail_otpCodeSai() {
        // Mục đích nghiệp vụ: OTP sai phải bị từ chối, không tạo tài khoản.
        taoOtp("otpwrong@test.com", "0902000006", "111111",
                LocalDateTime.now().plusMinutes(5), false);

        long userTruoc = userRepository.count();

        OtpVerifyRequest req = new OtpVerifyRequest();
        req.setEmail("otpwrong@test.com");
        req.setOtpCode("999999"); // Sai code

        ApiResponse result = authService.verifyOtpAndRegister(req);

        assertFalse(result.isSuccess());
        assertEquals("Mã OTP không hợp lệ!", result.getMessage());
        assertNull(result.getData());

        // DB không thay đổi - không tạo user
        userRepository.flush();
        assertEquals(userTruoc, userRepository.count(), "Không được tạo user khi OTP sai");
    }

    @Test
    @DisplayName("TC_AUTH_007 - Xác minh OTP thất bại khi OTP đã được xác minh trước đó")
    void TC_AUTH_007_verifyOtpAndRegister_fail_otpDaXacMinh() {
        // Mục đích nghiệp vụ: OTP chỉ được dùng một lần. OTP đã verified phải bị từ
        // chối
        // để ngăn tái sử dụng mã OTP (replay attack).
        taoOtp("otpused@test.com", "0902000007", "222222",
                LocalDateTime.now().plusMinutes(5), true); // verified = true

        long userTruoc = userRepository.count();

        OtpVerifyRequest req = new OtpVerifyRequest();
        req.setEmail("otpused@test.com");
        req.setOtpCode("222222");

        ApiResponse result = authService.verifyOtpAndRegister(req);

        assertFalse(result.isSuccess());
        assertEquals("Mã OTP này đã được xác minh!", result.getMessage());
        assertNull(result.getData());

        // Không tạo user mới
        assertEquals(userTruoc, userRepository.count(), "Không được tạo user khi OTP đã xác minh");
    }

    @Test
    @DisplayName("TC_AUTH_008 - Xác minh OTP thất bại khi OTP đã hết hạn")
    void TC_AUTH_008_verifyOtpAndRegister_fail_otpHetHan() {
        // Mục đích nghiệp vụ: OTP có thời hạn 5 phút. OTP quá hạn phải bị từ chối
        // để bảo mật - ngăn dùng OTP cũ bị intercepted.
        taoOtp("otpexpired@test.com", "0902000008", "333333",
                LocalDateTime.now().minusMinutes(1), false); // expiresAt đã qua

        long userTruoc = userRepository.count();

        OtpVerifyRequest req = new OtpVerifyRequest();
        req.setEmail("otpexpired@test.com");
        req.setOtpCode("333333");

        ApiResponse result = authService.verifyOtpAndRegister(req);

        assertFalse(result.isSuccess());
        assertEquals("Mã OTP đã hết hạn!", result.getMessage());
        assertNull(result.getData());

        // DB không thay đổi - không tạo user
        assertEquals(userTruoc, userRepository.count(), "Không được tạo user khi OTP hết hạn");

        // Kiểm tra OTP không bị đánh dấu verified
        otpRepository.flush();
        List<OtpVerification> otps = otpRepository.findAll();
        OtpVerification otp = otps.stream()
                .filter(o -> "otpexpired@test.com".equals(o.getEmail()))
                .findFirst().orElseThrow();
        assertFalse(otp.isVerified(), "OTP hết hạn không được đánh dấu verified");
    }

    @Test
    @DisplayName("TC_AUTH_009 - Xác minh OTP thất bại khi email không tồn tại trong OTP table")
    void TC_AUTH_009_verifyOtpAndRegister_fail_emailKhongCoTrongOtp() {
        // Mục đích nghiệp vụ: Nếu không tìm thấy OTP theo email+code → OTP không hợp
        // lệ.
        // Test edge case: email đúng nhưng không có OTP nào trong DB.
        long userTruoc = userRepository.count();

        OtpVerifyRequest req = new OtpVerifyRequest();
        req.setEmail("notexistinemail@test.com");
        req.setOtpCode("555555");

        ApiResponse result = authService.verifyOtpAndRegister(req);

        assertFalse(result.isSuccess());
        assertEquals("Mã OTP không hợp lệ!", result.getMessage());

        // DB không thay đổi
        assertEquals(userTruoc, userRepository.count(), "Không được tạo user");
    }

    @Test
    @DisplayName("TC_AUTH_010 - Xác minh OTP với thời điểm hết hạn đúng bằng hiện tại - edge case boundary")
    void TC_AUTH_010_verifyOtpAndRegister_edgeCase_expiresAtBoundary() {
        // Mục đích nghiệp vụ: Giá trị biên - OTP hết hạn đúng vào thời điểm hiện tại
        // (hoặc 1 giây trước) phải được coi là đã hết hạn.
        taoOtp("boundary@test.com", "0902000009", "777777",
                LocalDateTime.now().minusSeconds(1), false); // Hết hạn 1 giây trước

        OtpVerifyRequest req = new OtpVerifyRequest();
        req.setEmail("boundary@test.com");
        req.setOtpCode("777777");

        ApiResponse result = authService.verifyOtpAndRegister(req);

        assertFalse(result.isSuccess());
        assertEquals("Mã OTP đã hết hạn!", result.getMessage());
    }

    @Test
    @DisplayName("TC_AUTH_011 - Từ chối đăng ký khi dữ liệu OTP đầu vào null để tránh lưu rác vào DB")
    void TC_AUTH_011_sendOtp_fail_nullInput_ShouldRejectAndNotPersist() {
        // Mục đích nghiệp vụ: Dữ liệu đăng ký null là invalid data, service phải từ chối
        // ngay, không được tạo OTP record rác và không được thay đổi số lượng bản ghi.
        long userTruoc = userRepository.count();
        long customerTruoc = customerRepository.count();
        long otpTruoc = otpRepository.count();

        RegisterRequest req = taoRegisterRequest(null, null, null);
        req.setAddress(null);

        ApiResponse result = authService.sendOtp(req);

        // Bug-hunting: kỳ vọng là invalid request phải bị chặn, nhưng service hiện tại
        // có thể vẫn lưu OTP rồi gửi mail mock thành công.
        assertFalse(result.isSuccess(), "Invalid input không được trả về success");

        otpRepository.flush();
        userRepository.flush();
        customerRepository.flush();

        assertEquals(userTruoc, userRepository.count(), "Không được tạo thêm user khi input null");
        assertEquals(customerTruoc, customerRepository.count(), "Không được tạo thêm customer khi input null");
        assertEquals(otpTruoc, otpRepository.count(), "Không được tạo OTP record khi input null");
    }

    @Test
    @DisplayName("TC_AUTH_012 - Từ chối đăng ký khi email rỗng để tránh tạo OTP với dữ liệu không hợp lệ")
    void TC_AUTH_012_sendOtp_fail_emptyEmail_ShouldRejectAndNotPersist() {
        // Mục đích nghiệp vụ: Email rỗng là dữ liệu không hợp lệ, không được cho phép
        // tạo OTP vì sẽ làm bẩn bảng otp_verification và gây khó xác minh sau này.
        long otpTruoc = otpRepository.count();

        RegisterRequest req = taoRegisterRequest("", "0902000010", "Empty Email User");

        ApiResponse result = authService.sendOtp(req);

        // Bug-hunting: service đúng ra phải chặn invalid email.
        assertFalse(result.isSuccess(), "Email rỗng không được phép tạo OTP thành công");

        otpRepository.flush();
        assertEquals(otpTruoc, otpRepository.count(), "Không được tạo OTP khi email rỗng");
    }

    @Test
    @DisplayName("TC_AUTH_013 - Từ chối verify OTP khi email đã có tài khoản để tránh ghi đè logic đăng ký")
    void TC_AUTH_013_verifyOtpAndRegister_existingEmailShouldFailAndNotChangeDB() {
        // Mục đích nghiệp vụ: Nếu email đã có user/customer, luồng verify OTP cho
        // đăng ký mới phải bị chặn; không được trả success giả và không được bật verified.
        taoUserVaCustomer("dupverify@test.com", "0902000011");
        taoOtp("dupverify@test.com", "0902000011", "888888",
                LocalDateTime.now().plusMinutes(5), false);

        long userTruoc = userRepository.count();
        long customerTruoc = customerRepository.count();
        long otpTruoc = otpRepository.count();

        OtpVerifyRequest req = new OtpVerifyRequest();
        req.setEmail("dupverify@test.com");
        req.setOtpCode("888888");

        ApiResponse result = authService.verifyOtpAndRegister(req);

        // Bug-hunting: auth service đang nuốt error từ userService và vẫn trả success.
        assertFalse(result.isSuccess(), "Không được trả success khi email đã tồn tại");

        userRepository.flush();
        customerRepository.flush();
        otpRepository.flush();

        assertEquals(userTruoc, userRepository.count(), "Không được tạo thêm user khi email trùng");
        assertEquals(customerTruoc, customerRepository.count(), "Không được tạo thêm customer khi email trùng");
        assertEquals(otpTruoc, otpRepository.count(), "Không được tạo thêm OTP khi verify thất bại");

        OtpVerification otp = otpRepository.findByEmailAndOtpCode("dupverify@test.com", "888888")
                .orElseThrow(() -> new AssertionError("OTP phải tồn tại trong DB để kiểm tra trạng thái"));
        assertFalse(otp.isVerified(), "OTP không được đánh dấu verified khi luồng đăng ký thất bại");
    }
}
