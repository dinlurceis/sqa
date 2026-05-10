package com.doan.WEB_TMDT.module.auth;

import com.doan.WEB_TMDT.common.dto.ApiResponse;
import com.doan.WEB_TMDT.module.auth.dto.ChangePasswordRequest;
import com.doan.WEB_TMDT.module.auth.dto.FirstChangePasswordRequest;
import com.doan.WEB_TMDT.module.auth.dto.LoginRequest;
import com.doan.WEB_TMDT.module.auth.dto.LoginResponse;
import com.doan.WEB_TMDT.module.auth.entity.*;
import com.doan.WEB_TMDT.module.auth.repository.*;
import com.doan.WEB_TMDT.module.auth.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Test suite cho UserServiceImpl.
 * Bao gồm: registerCustomer, login, changePassword, firstChangePassword, getCurrentUser.
 * Mỗi test đều: capture count trước → thực hiện → assert return + DB → verify count sau.
 * @Transactional từ BaseIntegrationTest đảm bảo rollback sau mỗi test.
 */
@DisplayName("AUTH SERVICE TEST")
class UserServiceImplTest extends BaseIntegrationTest {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    
    // HELPER METHODS - tạo dữ liệu test nhanh
    

    /** Tạo và lưu user CUSTOMER với thông tin đầy đủ */
    private User taoCustomer(String email, String phone, String fullName) {
        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode("TestPass123"))
                .role(Role.CUSTOMER)
                .status(Status.ACTIVE)
                .build();
        Customer customer = Customer.builder()
                .user(user).fullName(fullName).phone(phone).address("123 Lê Lợi").build();
        user.setCustomer(customer);
        return userRepository.save(user);
    }

    /** Tạo và lưu user EMPLOYEE với position và trạng thái firstLogin tùy chọn */
    private User taoEmployee(String email, String phone, String fullName, Position position, boolean firstLogin) {
        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode("TestPass123"))
                .role(Role.EMPLOYEE)
                .status(Status.ACTIVE)
                .build();
        Employee emp = Employee.builder()
                .user(user).fullName(fullName).phone(phone)
                .position(position).firstLogin(firstLogin).build();
        user.setEmployee(emp);
        return userRepository.save(user);
    }

    
    // registerCustomer
    

    @Test
    @DisplayName("TC_USER_001 - Đăng ký khách hàng mới thành công")
    void TC_USER_001_registerCustomer_success() {
        // Mục đích nghiệp vụ: Hệ thống phải cho phép đăng ký tài khoản khách hàng mới
        // với đầy đủ thông tin hợp lệ, lưu đúng vào bảng users và customers.
        long userTruoc = userRepository.count();
        long custTruoc = customerRepository.count();

        ApiResponse result = userService.registerCustomer(
                "newcust@test.com", "Pass123test", "Nguyễn Văn A", "0901000001", "123 Lê Lợi");

        // Assert return value
        assertTrue(result.isSuccess(), "Phải đăng ký thành công");
        assertEquals("Tạo tài khoản khách hàng thành công!", result.getMessage());
        assertNotNull(result.getData());

        // Assert DB - lấy từ DB để kiểm tra toàn bộ thuộc tính
        userRepository.flush();
        Optional<User> savedUser = userRepository.findByEmail("newcust@test.com");
        assertTrue(savedUser.isPresent(), "User phải được lưu vào DB");
        User u = savedUser.get();
        assertNotNull(u.getId());
        assertEquals("newcust@test.com", u.getEmail());
        assertEquals(Role.CUSTOMER, u.getRole());
        assertEquals(Status.ACTIVE, u.getStatus());
        assertTrue(passwordEncoder.matches("Pass123test", u.getPassword()), "Password phải được mã hóa đúng");

        // Kiểm tra Customer record
        assertNotNull(u.getCustomer());
        Customer c = u.getCustomer();
        assertNotNull(c.getId());
        assertEquals("Nguyễn Văn A", c.getFullName());
        assertEquals("0901000001", c.getPhone());
        assertEquals("123 Lê Lợi", c.getAddress());

        // Kiểm tra số lượng record - không insert thừa
        assertEquals(userTruoc + 1, userRepository.count(), "Phải tạo đúng 1 user mới");
        assertEquals(custTruoc + 1, customerRepository.count(), "Phải tạo đúng 1 customer mới");
    }

    @Test
    @DisplayName("TC_USER_002 - Đăng ký thất bại khi email đã tồn tại")
    void TC_USER_002_registerCustomer_fail_emailDaTonTai() {
        // Mục đích nghiệp vụ: Không cho phép trùng email - phải từ chối và không tạo user mới.
        taoCustomer("duplicate@test.com", "0901000002", "Nguyen B");
        long userTruoc = userRepository.count();
        long custTruoc = customerRepository.count();

        ApiResponse result = userService.registerCustomer(
                "duplicate@test.com", "Pass123", "Nguyen C", "0901000099", "456 Test");

        assertFalse(result.isSuccess(), "Phải từ chối email trùng");
        assertEquals("Email đã tồn tại!", result.getMessage());
        assertNull(result.getData());

        // DB không thay đổi
        assertEquals(userTruoc, userRepository.count(), "Không được tạo thêm user");
        assertEquals(custTruoc, customerRepository.count(), "Không được tạo thêm customer");
    }

    @Test
    @DisplayName("TC_USER_003 - Đăng ký thất bại khi số điện thoại đã tồn tại")
    void TC_USER_003_registerCustomer_fail_phoneDaTonTai() {
        // Mục đích nghiệp vụ: Không cho phép trùng SĐT - phải từ chối và không tạo user mới.
        taoCustomer("existing@test.com", "0901000003", "Nguyen D");
        long userTruoc = userRepository.count();
        long custTruoc = customerRepository.count();

        ApiResponse result = userService.registerCustomer(
                "brandnew@test.com", "Pass123", "Nguyen E", "0901000003", "789 Test");

        assertFalse(result.isSuccess(), "Phải từ chối SĐT trùng");
        assertEquals("Số điện thoại đã tồn tại!", result.getMessage());
        assertNull(result.getData());

        // DB không thay đổi
        assertEquals(userTruoc, userRepository.count(), "Không được tạo thêm user");
        assertEquals(custTruoc, customerRepository.count(), "Không được tạo thêm customer");
    }

    @Test
    @DisplayName("TC_USER_004 - Đăng ký với password đã BCrypt không bị encode lại")
    void TC_USER_004_registerCustomer_passwordBcryptKhongEncodeThemlai() {
        // Mục đích nghiệp vụ: Nếu mật khẩu đã được BCrypt (từ OTP flow), hệ thống không
        // được encode lại lần nữa vì sẽ làm sai mật khẩu.
        String bcryptPw = passwordEncoder.encode("rawPass123");
        assertTrue(bcryptPw.startsWith("$2a$"), "BCrypt password phải bắt đầu bằng $2a$");

        ApiResponse result = userService.registerCustomer(
                "bcryptuser@test.com", bcryptPw, "BCrypt User", "0901000004", "Test Addr");

        assertTrue(result.isSuccess());

        userRepository.flush();
        User u = userRepository.findByEmail("bcryptuser@test.com").orElseThrow();
        // Password phải y chang - không bị double encode
        assertEquals(bcryptPw, u.getPassword(), "Password BCrypt đã mã hóa không được encode lại");
        assertTrue(passwordEncoder.matches("rawPass123", u.getPassword()));
    }

    @Test
    @DisplayName("TC_USER_005 - Đăng ký với address null - cho phép address tùy chọn")
    void TC_USER_005_registerCustomer_addressNull() {
        // Mục đích nghiệp vụ: Trường address là không bắt buộc, cho phép null.
        ApiResponse result = userService.registerCustomer(
                "nulladdr@test.com", "Pass123", "Null Addr", "0901000005", null);

        assertTrue(result.isSuccess());
        userRepository.flush();
        User u = userRepository.findByEmail("nulladdr@test.com").orElseThrow();
        assertNotNull(u.getCustomer());
        assertNull(u.getCustomer().getAddress(), "Address có thể là null");
    }

    
    // login
    

    @Test
    @DisplayName("TC_USER_006 - Login thành công với tài khoản CUSTOMER")
    void TC_USER_006_login_success_customer() {
        // Mục đích nghiệp vụ: Khách hàng đăng nhập đúng nhận token và thông tin đầy đủ.
        taoCustomer("custlogin@test.com", "0901000006", "Khach Hang Test");

        LoginRequest req = new LoginRequest();
        req.setEmail("custlogin@test.com");
        req.setPassword("TestPass123");

        ApiResponse result = userService.login(req);

        assertTrue(result.isSuccess());
        assertEquals("Đăng nhập thành công!", result.getMessage());
        assertNotNull(result.getData());

        // Kiểm tra toàn bộ thuộc tính LoginResponse
        LoginResponse lr = (LoginResponse) result.getData();
        assertNotNull(lr.getToken(), "Token phải được tạo");
        assertFalse(lr.getToken().isBlank(), "Token không được rỗng");
        assertNotNull(lr.getUserId(), "UserId phải có giá trị");
        assertEquals("custlogin@test.com", lr.getEmail());
        assertEquals("Khach Hang Test", lr.getFullName());
        assertEquals("0901000006", lr.getPhone());
        assertEquals("123 Lê Lợi", lr.getAddress());
        assertEquals("CUSTOMER", lr.getRole());
        assertEquals("ACTIVE", lr.getStatus());
        assertNull(lr.getPosition(), "CUSTOMER không có position");
        assertNull(lr.getEmployeeId(), "CUSTOMER không có employeeId");
    }

    @Test
    @DisplayName("TC_USER_007 - Login thành công với EMPLOYEE có position, firstLogin=false")
    void TC_USER_007_login_success_employee_withPosition() {
        // Mục đích nghiệp vụ: Nhân viên đã đổi mật khẩu lần đầu đăng nhập thành công,
        // trả về thêm position và employeeId.
        taoEmployee("emplelogin@test.com", "0901000007", "Nhan Vien Test", Position.SALE, false);

        LoginRequest req = new LoginRequest();
        req.setEmail("emplelogin@test.com");
        req.setPassword("TestPass123");

        ApiResponse result = userService.login(req);

        assertTrue(result.isSuccess());
        assertEquals("Đăng nhập thành công!", result.getMessage());

        LoginResponse lr = (LoginResponse) result.getData();
        assertNotNull(lr.getToken());
        assertEquals("emplelogin@test.com", lr.getEmail());
        assertEquals("Nhan Vien Test", lr.getFullName());
        assertEquals("EMPLOYEE", lr.getRole());
        assertEquals("SALE", lr.getPosition());
        assertNotNull(lr.getEmployeeId(), "Employee phải có employeeId");
        assertEquals("ACTIVE", lr.getStatus());
    }

    @Test
    @DisplayName("TC_USER_008 - Login thất bại khi email không tồn tại")
    void TC_USER_008_login_fail_emailKhongTonTai() {
        // Mục đích nghiệp vụ: Email không tồn tại trong hệ thống phải bị từ chối đăng nhập.
        LoginRequest req = new LoginRequest();
        req.setEmail("notexist@test.com");
        req.setPassword("anypass");

        ApiResponse result = userService.login(req);

        assertFalse(result.isSuccess());
        assertEquals("Email không tồn tại!", result.getMessage());
        assertNull(result.getData());
    }

    @Test
    @DisplayName("TC_USER_009 - Login thất bại khi sai mật khẩu")
    void TC_USER_009_login_fail_saiMatKhau() {
        // Mục đích nghiệp vụ: Mật khẩu không đúng phải bị từ chối, bảo vệ tài khoản.
        taoCustomer("passtest@test.com", "0901000009", "Pass Test User");

        LoginRequest req = new LoginRequest();
        req.setEmail("passtest@test.com");
        req.setPassword("SaiMatKhau!");

        ApiResponse result = userService.login(req);

        assertFalse(result.isSuccess());
        assertEquals("Mật khẩu không đúng!", result.getMessage());
        assertNull(result.getData());
    }

    @Test
    @DisplayName("TC_USER_010 - Login thất bại khi tài khoản INACTIVE")
    void TC_USER_010_login_fail_taiKhoanInactive() {
        // Mục đích nghiệp vụ: Tài khoản bị vô hiệu hóa không được phép đăng nhập.
        User user = User.builder()
                .email("inactive@test.com")
                .password(passwordEncoder.encode("TestPass123"))
                .role(Role.CUSTOMER)
                .status(Status.INACTIVE)
                .build();
        userRepository.save(user);

        LoginRequest req = new LoginRequest();
        req.setEmail("inactive@test.com");
        req.setPassword("TestPass123");

        ApiResponse result = userService.login(req);

        assertFalse(result.isSuccess());
        assertEquals("Tài khoản đang bị khóa!", result.getMessage());
    }

    @Test
    @DisplayName("TC_USER_011 - Login thất bại khi tài khoản LOCKED")
    void TC_USER_011_login_fail_taiKhoanLocked() {
        // Mục đích nghiệp vụ: Tài khoản bị khóa (LOCKED) không được phép đăng nhập.
        User user = User.builder()
                .email("locked@test.com")
                .password(passwordEncoder.encode("TestPass123"))
                .role(Role.CUSTOMER)
                .status(Status.LOCKED)
                .build();
        userRepository.save(user);

        LoginRequest req = new LoginRequest();
        req.setEmail("locked@test.com");
        req.setPassword("TestPass123");

        ApiResponse result = userService.login(req);

        assertFalse(result.isSuccess());
        assertEquals("Tài khoản đang bị khóa!", result.getMessage());
    }

    @Test
    @DisplayName("TC_USER_012 - Login EMPLOYEE firstLogin=true phải yêu cầu đổi mật khẩu")
    void TC_USER_012_login_employee_firstLoginTrue_requireChangePassword() {
        // Mục đích nghiệp vụ: Nhân viên mới đăng nhập lần đầu phải bị buộc đổi mật khẩu
        // trước khi vào hệ thống, đảm bảo bảo mật.
        taoEmployee("firstlogemp@test.com", "0901000012", "First Login Emp", Position.CSKH, true);

        LoginRequest req = new LoginRequest();
        req.setEmail("firstlogemp@test.com");
        req.setPassword("TestPass123");

        ApiResponse result = userService.login(req);

        assertTrue(result.isSuccess());
        assertEquals("Đăng nhập lần đầu. Yêu cầu đổi mật khẩu!", result.getMessage());
        assertNotNull(result.getData());

        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) result.getData();
        assertEquals(true, data.get("requireChangePassword"), "Phải có flag requireChangePassword=true");
        assertEquals("firstlogemp@test.com", data.get("email"), "Phải trả về email");
    }

    @Test
    @DisplayName("TC_USER_013 - Login EMPLOYEE không có employee profile - edge case")
    void TC_USER_013_login_employee_khongCoProfile() {
        // Mục đích nghiệp vụ: Trường hợp user có role EMPLOYEE nhưng không có
        // bản ghi Employee liên kết - hệ thống vẫn đăng nhập bình thường (không crash).
        User user = User.builder()
                .email("empnoprofile@test.com")
                .password(passwordEncoder.encode("TestPass123"))
                .role(Role.EMPLOYEE)
                .status(Status.ACTIVE)
                .build();
        // Không set employee - employee = null
        userRepository.save(user);

        LoginRequest req = new LoginRequest();
        req.setEmail("empnoprofile@test.com");
        req.setPassword("TestPass123");

        // Không nên throw exception - phải trả về response hợp lệ
        ApiResponse result = userService.login(req);

        assertTrue(result.isSuccess(), "Vẫn phải đăng nhập được dù không có employee profile");
        LoginResponse lr = (LoginResponse) result.getData();
        assertNotNull(lr.getToken());
        assertEquals("EMPLOYEE", lr.getRole());
        assertNull(lr.getFullName(), "fullName null vì không có employee");
    }

    
    // changePassword
    

    @Test
    @DisplayName("TC_USER_014 - Đổi mật khẩu thành công")
    void TC_USER_014_changePassword_success() {
        // Mục đích nghiệp vụ: Người dùng cung cấp đúng mật khẩu cũ và nhập lại mật khẩu mới
        // khớp nhau → đổi mật khẩu thành công, mật khẩu mới được lưu vào DB.
        taoCustomer("changepw@test.com", "0901000014", "Change PW User");
        long countTruoc = userRepository.count();

        ChangePasswordRequest req = new ChangePasswordRequest();
        req.setOldPassword("TestPass123");
        req.setNewPassword("NewPass789!");
        req.setConfirmPassword("NewPass789!");

        ApiResponse result = userService.changePassword("changepw@test.com", req);

        assertTrue(result.isSuccess());
        assertEquals("Đổi mật khẩu thành công!", result.getMessage());
        assertNull(result.getData());

        // Lấy từ DB kiểm tra mật khẩu mới
        userRepository.flush();
        User u = userRepository.findByEmail("changepw@test.com").orElseThrow();
        assertFalse(passwordEncoder.matches("TestPass123", u.getPassword()), "Mật khẩu cũ không còn hợp lệ");
        assertTrue(passwordEncoder.matches("NewPass789!", u.getPassword()), "Mật khẩu mới phải hợp lệ");

        // Không tạo thêm record
        assertEquals(countTruoc, userRepository.count(), "Không được tạo thêm user");
    }

    @Test
    @DisplayName("TC_USER_015 - Đổi mật khẩu thất bại khi mật khẩu cũ sai")
    void TC_USER_015_changePassword_fail_oldPasswordSai() {
        // Mục đích nghiệp vụ: Cần xác thực mật khẩu cũ trước khi cho phép đổi,
        // ngăn chặn trường hợp kẻ tấn công đổi mật khẩu khi có access vào tài khoản.
        taoCustomer("oldpwwrong@test.com", "0901000015", "Wrong Old PW");

        ChangePasswordRequest req = new ChangePasswordRequest();
        req.setOldPassword("SaiMatKhauCu!");
        req.setNewPassword("NewPass789!");
        req.setConfirmPassword("NewPass789!");

        ApiResponse result = userService.changePassword("oldpwwrong@test.com", req);

        assertFalse(result.isSuccess());
        assertEquals("Mật khẩu cũ không đúng!", result.getMessage());

        // DB không thay đổi - mật khẩu cũ vẫn hợp lệ
        userRepository.flush();
        User u = userRepository.findByEmail("oldpwwrong@test.com").orElseThrow();
        assertTrue(passwordEncoder.matches("TestPass123", u.getPassword()), "Mật khẩu cũ phải vẫn đúng");
    }

    @Test
    @DisplayName("TC_USER_016 - Đổi mật khẩu thất bại khi confirm không khớp")
    void TC_USER_016_changePassword_fail_confirmKhongKhop() {
        // Mục đích nghiệp vụ: Mật khẩu xác nhận phải khớp với mật khẩu mới
        // để tránh người dùng nhập nhầm mật khẩu mới.
        taoCustomer("confirmmismatch@test.com", "0901000016", "Confirm Mismatch");

        ChangePasswordRequest req = new ChangePasswordRequest();
        req.setOldPassword("TestPass123");
        req.setNewPassword("NewPass789!");
        req.setConfirmPassword("KhacNhau456!"); // Không khớp

        ApiResponse result = userService.changePassword("confirmmismatch@test.com", req);

        assertFalse(result.isSuccess());
        assertEquals("Xác nhận mật khẩu mới không khớp!", result.getMessage());

        // DB không thay đổi
        userRepository.flush();
        User u = userRepository.findByEmail("confirmmismatch@test.com").orElseThrow();
        assertTrue(passwordEncoder.matches("TestPass123", u.getPassword()), "Mật khẩu không được thay đổi");
    }

    @Test
    @DisplayName("TC_USER_017 - Đổi mật khẩu thất bại khi user không tồn tại - ném exception")
    void TC_USER_017_changePassword_fail_userKhongTonTai() {
        // Mục đích nghiệp vụ: Email không tồn tại phải ném RuntimeException,
        // không được trả về response giả tạo.
        ChangePasswordRequest req = new ChangePasswordRequest();
        req.setOldPassword("any");
        req.setNewPassword("any");
        req.setConfirmPassword("any");

        assertThrows(RuntimeException.class,
                () -> userService.changePassword("khongtontai@test.com", req),
                "Phải ném RuntimeException khi user không tồn tại");
    }

    
    // firstChangePassword
    

    @Test
    @DisplayName("TC_USER_018 - Đổi mật khẩu lần đầu thành công - firstLogin đặt thành false")
    void TC_USER_018_firstChangePassword_success() {
        // Mục đích nghiệp vụ: Nhân viên đổi mật khẩu lần đầu thành công,
        // hệ thống phải đánh dấu firstLogin=false để không yêu cầu đổi nữa.
        taoEmployee("firstchg@test.com", "0901000018", "First Chg Emp", Position.WAREHOUSE, true);

        FirstChangePasswordRequest req = new FirstChangePasswordRequest();
        req.setEmail("firstchg@test.com");
        req.setCurrentPassword("TestPass123");
        req.setNewPassword("NewSecure789!");
        req.setConfirmPassword("NewSecure789!");

        ApiResponse result = userService.firstChangePassword(req);

        assertTrue(result.isSuccess());
        assertEquals("Đổi mật khẩu thành công!", result.getMessage());

        // Kiểm tra DB: password mới và firstLogin = false
        userRepository.flush();
        User u = userRepository.findByEmail("firstchg@test.com").orElseThrow();
        assertTrue(passwordEncoder.matches("NewSecure789!", u.getPassword()), "Mật khẩu mới phải hợp lệ");
        assertNotNull(u.getEmployee(), "Employee record phải tồn tại");
        assertFalse(u.getEmployee().isFirstLogin(), "firstLogin phải được đặt thành false");
    }

    @Test
    @DisplayName("TC_USER_019 - Đổi MK lần đầu thất bại vì user là CUSTOMER, không phải EMPLOYEE")
    void TC_USER_019_firstChangePassword_fail_laCustomerKhongPhaiEmployee() {
        // Mục đích nghiệp vụ: firstChangePassword chỉ dành cho nhân viên,
        // khách hàng không được phép dùng chức năng này.
        taoCustomer("custfirst@test.com", "0901000019", "Customer First");

        FirstChangePasswordRequest req = new FirstChangePasswordRequest();
        req.setEmail("custfirst@test.com");
        req.setCurrentPassword("TestPass123");
        req.setNewPassword("New789!");
        req.setConfirmPassword("New789!");

        ApiResponse result = userService.firstChangePassword(req);

        assertFalse(result.isSuccess());
        assertEquals("Chỉ nhân viên mới được đổi mật khẩu lần đầu!", result.getMessage());
    }

    @Test
    @DisplayName("TC_USER_020 - Đổi MK lần đầu thất bại khi user là EMPLOYEE nhưng employee=null")
    void TC_USER_020_firstChangePassword_fail_employeeNull() {
        // Mục đích nghiệp vụ: User có role EMPLOYEE nhưng không có profile employee liên kết
        // → phải bị từ chối, không crash.
        User user = User.builder()
                .email("empnull@test.com")
                .password(passwordEncoder.encode("TestPass123"))
                .role(Role.EMPLOYEE)
                .status(Status.ACTIVE)
                .build();
        userRepository.save(user);

        FirstChangePasswordRequest req = new FirstChangePasswordRequest();
        req.setEmail("empnull@test.com");
        req.setCurrentPassword("TestPass123");
        req.setNewPassword("New789!");
        req.setConfirmPassword("New789!");

        ApiResponse result = userService.firstChangePassword(req);

        assertFalse(result.isSuccess());
        assertEquals("Chỉ nhân viên mới được đổi mật khẩu lần đầu!", result.getMessage());
    }

    @Test
    @DisplayName("TC_USER_021 - Đổi MK lần đầu thất bại khi mật khẩu hiện tại sai")
    void TC_USER_021_firstChangePassword_fail_currentPasswordSai() {
        // Mục đích nghiệp vụ: Phải xác thực mật khẩu hiện tại trước khi cho đổi,
        // đảm bảo chỉ chính chủ tài khoản mới được phép đổi.
        taoEmployee("wrongcurr@test.com", "0901000021", "Wrong Curr", Position.ACCOUNTANT, true);

        FirstChangePasswordRequest req = new FirstChangePasswordRequest();
        req.setEmail("wrongcurr@test.com");
        req.setCurrentPassword("SaiMatKhauHienTai!");
        req.setNewPassword("New789!");
        req.setConfirmPassword("New789!");

        ApiResponse result = userService.firstChangePassword(req);

        assertFalse(result.isSuccess());
        assertEquals("Mật khẩu hiện tại không đúng!", result.getMessage());

        // DB không thay đổi
        userRepository.flush();
        User u = userRepository.findByEmail("wrongcurr@test.com").orElseThrow();
        assertTrue(passwordEncoder.matches("TestPass123", u.getPassword()), "Mật khẩu vẫn như cũ");
        assertTrue(u.getEmployee().isFirstLogin(), "firstLogin vẫn phải là true");
    }

    @Test
    @DisplayName("TC_USER_022 - Đổi MK lần đầu thất bại khi confirm mật khẩu mới không khớp")
    void TC_USER_022_firstChangePassword_fail_confirmKhongKhop() {
        // Mục đích nghiệp vụ: Confirm mật khẩu mới phải khớp nhau để tránh nhập nhầm.
        taoEmployee("firstmis@test.com", "0901000022", "First Mismatch", Position.SHIPPER, true);

        FirstChangePasswordRequest req = new FirstChangePasswordRequest();
        req.setEmail("firstmis@test.com");
        req.setCurrentPassword("TestPass123");
        req.setNewPassword("New789!");
        req.setConfirmPassword("KhacNhau999!"); // Không khớp

        ApiResponse result = userService.firstChangePassword(req);

        assertFalse(result.isSuccess());
        assertEquals("Xác nhận mật khẩu mới không khớp!", result.getMessage());

        // firstLogin vẫn true
        userRepository.flush();
        User u = userRepository.findByEmail("firstmis@test.com").orElseThrow();
        assertTrue(u.getEmployee().isFirstLogin(), "firstLogin vẫn phải là true");
    }

    @Test
    @DisplayName("TC_USER_023 - Đổi MK lần đầu thất bại khi user không tồn tại - ném exception")
    void TC_USER_023_firstChangePassword_fail_userKhongTonTai() {
        // Mục đích nghiệp vụ: Email không tồn tại phải ném RuntimeException.
        FirstChangePasswordRequest req = new FirstChangePasswordRequest();
        req.setEmail("khongtontai@test.com");
        req.setCurrentPassword("any");
        req.setNewPassword("any");
        req.setConfirmPassword("any");

        assertThrows(RuntimeException.class,
                () -> userService.firstChangePassword(req),
                "Phải ném RuntimeException khi email không tồn tại");
    }

    
    // getCurrentUser
    

    @Test
    @DisplayName("TC_USER_024 - Lấy thông tin CUSTOMER - đầy đủ tất cả thuộc tính")
    void TC_USER_024_getCurrentUser_customer_dayDuThuocTinh() {
        // Mục đích nghiệp vụ: API "get me" của khách hàng phải trả về đầy đủ thông tin
        // profile để hiển thị trên frontend.
        taoCustomer("getme@test.com", "0901000024", "Get Me User");

        ApiResponse result = userService.getCurrentUser("getme@test.com");

        assertTrue(result.isSuccess());
        assertEquals("Lấy thông tin người dùng thành công", result.getMessage());
        assertNotNull(result.getData());

        // Kiểm tra từng thuộc tính trong data map
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) result.getData();
        assertNotNull(data.get("id"), "id phải có giá trị");
        assertEquals("getme@test.com", data.get("email"));
        assertEquals("Get Me User", data.get("fullName"));
        assertEquals("CUSTOMER", data.get("role"));
        assertEquals("ACTIVE", data.get("status"));
        assertNull(data.get("position"), "CUSTOMER không có position");
        assertNull(data.get("employeeId"), "CUSTOMER không có employeeId");
    }

    @Test
    @DisplayName("TC_USER_025 - Lấy thông tin EMPLOYEE - có position và employeeId")
    void TC_USER_025_getCurrentUser_employee_coPositionVaEmployeeId() {
        // Mục đích nghiệp vụ: API "get me" của nhân viên phải trả về position và employeeId
        // để frontend hiển thị đúng quyền hạn.
        taoEmployee("getemp@test.com", "0901000025", "Get Emp", Position.PRODUCT_MANAGER, false);

        ApiResponse result = userService.getCurrentUser("getemp@test.com");

        assertTrue(result.isSuccess());

        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) result.getData();
        assertEquals("getemp@test.com", data.get("email"));
        assertEquals("Get Emp", data.get("fullName"));
        assertEquals("EMPLOYEE", data.get("role"));
        assertEquals("PRODUCT_MANAGER", data.get("position"));
        assertNotNull(data.get("employeeId"), "Employee phải có employeeId");
        assertEquals("ACTIVE", data.get("status"));
    }

    @Test
    @DisplayName("TC_USER_026 - Lấy thông tin EMPLOYEE không có position - position phải là null")
    void TC_USER_026_getCurrentUser_employee_khongCoPosition() {
        // Mục đích nghiệp vụ: Employee không có position → position trả về null, không crash.
        User user = User.builder()
                .email("empnopos@test.com")
                .password(passwordEncoder.encode("TestPass123"))
                .role(Role.EMPLOYEE)
                .status(Status.ACTIVE)
                .build();
        Employee emp = Employee.builder()
                .user(user).fullName("No Position Emp").phone("0901000026")
                .position(null) // Không có position
                .firstLogin(false).build();
        user.setEmployee(emp);
        userRepository.save(user);

        ApiResponse result = userService.getCurrentUser("empnopos@test.com");

        assertTrue(result.isSuccess());
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) result.getData();
        assertNull(data.get("position"), "position phải là null khi employee không có position");
        assertNotNull(data.get("employeeId"));
    }

    @Test
    @DisplayName("TC_USER_027 - Lấy thông tin thất bại khi email không tồn tại - ném exception")
    void TC_USER_027_getCurrentUser_fail_emailKhongTonTai() {
        // Mục đích nghiệp vụ: Email không tồn tại phải ném RuntimeException,
        // không được trả về null hay response giả.
        assertThrows(RuntimeException.class,
                () -> userService.getCurrentUser("khongtontai@test.com"),
                "Phải ném RuntimeException khi email không tồn tại");
    }

    @Test
    @DisplayName("TC_USER_028 - Từ chối đăng ký khi email rỗng và không được lưu DB")
    void TC_USER_028_registerCustomer_InvalidEmptyEmail_ShouldReject() {
        // Mục đích nghiệp vụ: email rỗng là invalid data, service phải trả lỗi rõ ràng
        // thay vì tạo bản ghi user/customer với dữ liệu không hợp lệ.
        long userTruoc = userRepository.count();
        long custTruoc = customerRepository.count();

        ApiResponse result = userService.registerCustomer(
                "", "Pass123!", "Empty Email", "0901999001", "HN");

        assertFalse(result.isSuccess(), "Email rỗng phải bị từ chối");
        assertNull(result.getData(), "Khi reject không được trả data object");

        userRepository.flush();
        customerRepository.flush();
        assertEquals(userTruoc, userRepository.count(), "Không được tạo thêm user với email rỗng");
        assertEquals(custTruoc, customerRepository.count(), "Không được tạo thêm customer với email rỗng");
    }

    @Test
    @DisplayName("TC_USER_029 - Null password phải trả lỗi nghiệp vụ, không ném exception hệ thống")
    void TC_USER_029_registerCustomer_NullPassword_ShouldReturnError() {
        // Mục đích nghiệp vụ: null password là invalid data ở biên, service phải xử lý
        // graceful bằng response lỗi nghiệp vụ và không làm thay đổi DB.
        long userTruoc = userRepository.count();
        long custTruoc = customerRepository.count();

        assertDoesNotThrow(() -> {
            ApiResponse result = userService.registerCustomer(
                    "nullpw@test.com", null, "Null Password", "0901999002", "HCM");
            assertFalse(result.isSuccess(), "Null password phải bị từ chối bằng response lỗi");
            assertNull(result.getData());
        }, "Service không được ném exception kỹ thuật với null password");

        userRepository.flush();
        customerRepository.flush();
        assertEquals(userTruoc, userRepository.count(), "Không được tạo user khi password null");
        assertEquals(custTruoc, customerRepository.count(), "Không được tạo customer khi password null");
    }

    @Test
    @DisplayName("TC_USER_030 - Login EMPLOYEE có profile nhưng position null vẫn phải ổn định")
    void TC_USER_030_login_EmployeeNullPosition_ShouldReturnSuccessWithNullPosition() {
        // Mục đích nghiệp vụ: Nhân viên chưa gán position vẫn có thể login,
        // response phải nhất quán và không crash ở nhánh claims/position.
        User user = User.builder()
                .email("emplognullpos@test.com")
                .password(passwordEncoder.encode("TestPass123"))
                .role(Role.EMPLOYEE)
                .status(Status.ACTIVE)
                .build();
        Employee emp = Employee.builder()
                .user(user)
                .fullName("Emp Null Position")
                .phone("0901999003")
                .position(null)
                .firstLogin(false)
                .build();
        user.setEmployee(emp);
        userRepository.save(user);

        LoginRequest req = new LoginRequest();
        req.setEmail("emplognullpos@test.com");
        req.setPassword("TestPass123");

        ApiResponse result = userService.login(req);

        assertTrue(result.isSuccess(), "Login phải thành công khi position null");
        LoginResponse lr = (LoginResponse) result.getData();
        assertNotNull(lr.getToken());
        assertEquals("EMPLOYEE", lr.getRole());
        assertNull(lr.getPosition(), "Position phải null khi hồ sơ employee chưa có position");
        assertNotNull(lr.getEmployeeId(), "EmployeeId vẫn phải trả về");
    }

    @Test
    @DisplayName("TC_USER_031 - getCurrentUser với user không có profile vẫn phải trả response ổn định")
    void TC_USER_031_getCurrentUser_UserWithoutCustomerAndEmployeeProfile_ShouldReturnNullProfileFields() {
        // Mục đích nghiệp vụ: dữ liệu lệch (user không có customer/employee) là edge case.
        // Service không được crash và phải trả về payload nhất quán.
        User user = User.builder()
                .email("noprofile-getme@test.com")
                .password(passwordEncoder.encode("TestPass123"))
                .role(Role.CUSTOMER)
                .status(Status.ACTIVE)
                .build();
        userRepository.save(user);

        ApiResponse result = userService.getCurrentUser("noprofile-getme@test.com");

        assertTrue(result.isSuccess());
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) result.getData();
        assertEquals("noprofile-getme@test.com", data.get("email"));
        assertEquals("CUSTOMER", data.get("role"));
        assertEquals("ACTIVE", data.get("status"));
        assertNull(data.get("fullName"), "Không có profile thì fullName phải null");
        assertNull(data.get("position"), "Không có employee thì position phải null");
        assertNull(data.get("employeeId"), "Không có employee thì employeeId phải null");
    }
    @Test
    @DisplayName("TC_USER_032 - Đăng ký thất bại khi số điện thoại quá ngắn (thiếu số)")
    void TC_USER_032_registerCustomer_fail_phoneQuaNgan() {
        // Mục đích nghiệp vụ: Số điện thoại phải đủ độ dài (ví dụ: 10 số). Dưới 10 số phải từ chối.
        long userTruoc = userRepository.count();
        long custTruoc = customerRepository.count();

        // Truyền vào SĐT chỉ có 9 số: "090123456"
        ApiResponse result = userService.registerCustomer(
                "shortphone@test.com", "Pass123", "Nguyễn F", "090123456", "123 Test");

        assertFalse(result.isSuccess(), "Phải từ chối vì số điện thoại quá ngắn");
        // Lưu ý: Đổi chuỗi thông báo lỗi ("Số điện thoại không hợp lệ!") cho khớp với code thực tế trong Service của bạn
        assertEquals("Số điện thoại không hợp lệ!", result.getMessage()); 
        assertNull(result.getData());

        // Đảm bảo DB không bị rác (không thay đổi)
        assertEquals(userTruoc, userRepository.count(), "Không được tạo thêm user");
        assertEquals(custTruoc, customerRepository.count(), "Không được tạo thêm customer");
    }

    @Test
    @DisplayName("TC_USER_033 - Đăng ký thất bại khi số điện thoại quá dài (thừa số)")
    void TC_USER_033_registerCustomer_fail_phoneQuaDai() {
        // Mục đích nghiệp vụ: Số điện thoại không được vượt quá độ dài quy định
        long userTruoc = userRepository.count();
        long custTruoc = customerRepository.count();

        // Truyền vào SĐT có 11 số: "09012345678"
        ApiResponse result = userService.registerCustomer(
                "longphone@test.com", "Pass123", "Nguyễn G", "09012345678", "456 Test");

        assertFalse(result.isSuccess(), "Phải từ chối vì số điện thoại quá dài");
        assertEquals("Số điện thoại không hợp lệ!", result.getMessage());
        assertNull(result.getData());

        // Đảm bảo DB không thay đổi
        assertEquals(userTruoc, userRepository.count(), "Không được tạo thêm user");
        assertEquals(custTruoc, customerRepository.count(), "Không được tạo thêm customer");
    }

    @Test
    @DisplayName("TC_USER_034 - Đăng ký thất bại khi số điện thoại chứa ký tự chữ cái")
    void TC_USER_034_registerCustomer_fail_phoneChuaKyTuChu() {
        // Mục đích nghiệp vụ: Số điện thoại chỉ được chứa các chữ số (0-9).
        long userTruoc = userRepository.count();
        long custTruoc = customerRepository.count();

        // Truyền vào SĐT chứa chữ: "090123456a"
        ApiResponse result = userService.registerCustomer(
                "invalidphone@test.com", "Pass123", "Nguyễn H", "090123456a", "789 Test");

        assertFalse(result.isSuccess(), "Phải từ chối vì số điện thoại chứa ký tự chữ");
        assertNull(result.getData());

        // Đảm bảo DB không thay đổi
        assertEquals(userTruoc, userRepository.count(), "Không được tạo thêm user");
        assertEquals(custTruoc, customerRepository.count(), "Không được tạo thêm customer");
    }
    @Test
    @DisplayName("TC_USER_035 - Đăng ký thất bại khi số điện thoại chứa khoảng trắng ở giữa")
    void TC_USER_035_registerCustomer_fail_phoneChuaKhoangTrang() {
        // Mục đích nghiệp vụ: Người dùng hay có thói quen gõ cách ra cho dễ nhìn (vd: 090 123 4567).
        // Hệ thống phải từ chối hoặc tự động xóa khoảng trắng trước khi xử lý.
        long userTruoc = userRepository.count();
        long custTruoc = customerRepository.count();

        ApiResponse result = userService.registerCustomer(
                "spacephone@test.com", "Pass123", "Nguyễn I", "090 123 4567", "123 Test");

        assertFalse(result.isSuccess(), "Phải từ chối vì số điện thoại chứa khoảng trắng không hợp lệ");
        assertNull(result.getData());

        // Đảm bảo DB không thay đổi
        assertEquals(userTruoc, userRepository.count(), "Không được tạo thêm user");
        assertEquals(custTruoc, customerRepository.count(), "Không được tạo thêm customer");
    }

    @Test
    @DisplayName("TC_USER_036 - Đăng ký thất bại khi số điện thoại chứa ký tự đặc biệt")
    void TC_USER_036_registerCustomer_fail_phoneChuaKyTuDacBiet() {
        // Mục đích nghiệp vụ: Dữ liệu chứa dấu gạch ngang (-), chấm (.) hoặc các ký tự như @, #, !
        long userTruoc = userRepository.count();

        ApiResponse result = userService.registerCustomer(
                "specphone@test.com", "Pass123", "Nguyễn K", "090-123-4567", "123 Test");

        assertFalse(result.isSuccess(), "Phải từ chối vì SĐT chứa dấu gạch ngang");
        
        ApiResponse result2 = userService.registerCustomer(
                "specphone2@test.com", "Pass123", "Nguyễn K2", "090!234567", "123 Test");
        assertFalse(result2.isSuccess(), "Phải từ chối vì SĐT chứa ký tự !");

        assertEquals(userTruoc, userRepository.count(), "Không được tạo thêm user");
    }

    @Test
    @DisplayName("TC_USER_037 - Đăng ký thất bại khi số điện thoại ở VN không bắt đầu bằng số 0 (hoặc +84)")
    void TC_USER_037_registerCustomer_fail_phoneKhongBatDauBangSoKhong() {
        // Mục đích nghiệp vụ: SĐT Việt Nam chuẩn phải bắt đầu bằng số 0 (hoặc +84).
        // Nếu nhập kiểu "9012345678" là sai format.
        long userTruoc = userRepository.count();

        ApiResponse result = userService.registerCustomer(
                "nozero@test.com", "Pass123", "Nguyễn L", "9012345678", "123 Test");

        assertFalse(result.isSuccess(), "Phải từ chối vì không bắt đầu bằng số 0");
        assertEquals(userTruoc, userRepository.count(), "Không được tạo thêm user");
    }

    @Test
    @DisplayName("TC_USER_038 - Đăng ký thất bại khi để trống số điện thoại (Empty/Blank)")
    void TC_USER_038_registerCustomer_fail_phoneRongHoacToanKhoangTrang() {
        // Mục đích nghiệp vụ: Bắt buộc phải có SĐT. Truyền chuỗi rỗng "" hoặc chỉ có khoảng trắng "   ".
        long userTruoc = userRepository.count();

        ApiResponse result1 = userService.registerCustomer(
                "emptyphone@test.com", "Pass123", "Nguyễn M1", "", "123 Test");
        assertFalse(result1.isSuccess(), "Phải từ chối chuỗi rỗng");

        ApiResponse result2 = userService.registerCustomer(
                "blankphone@test.com", "Pass123", "Nguyễn M2", "   ", "123 Test");
        assertFalse(result2.isSuccess(), "Phải từ chối chuỗi chỉ có khoảng trắng");

        assertEquals(userTruoc, userRepository.count(), "Không được tạo thêm user");
    }

    @Test
    @DisplayName("TC_USER_039 - Đăng ký thất bại khi sai định dạng Email")
    void TC_USER_039_registerCustomer_fail_emailSaiDinhDang() {
        // Mục đích nghiệp vụ: Mở rộng bắt lỗi sang Email. Cần kiểm tra xem Dev có check regex Email không.
        long userTruoc = userRepository.count();

        // Email thiếu domain
        ApiResponse result1 = userService.registerCustomer(
                "test@", "Pass123", "Nguyễn N", "0901000039", "123 Test");
        assertFalse(result1.isSuccess(), "Phải từ chối email thiếu domain");

        // Email thiếu @
        ApiResponse result2 = userService.registerCustomer(
                "test.com", "Pass123", "Nguyễn N", "0901000040", "123 Test");
        assertFalse(result2.isSuccess(), "Phải từ chối email thiếu @");

        assertEquals(userTruoc, userRepository.count(), "Không được tạo thêm user với email rác");
    }
}
