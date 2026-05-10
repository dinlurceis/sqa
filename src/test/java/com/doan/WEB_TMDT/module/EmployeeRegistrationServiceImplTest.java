package com.doan.WEB_TMDT.module.auth;

import com.doan.WEB_TMDT.common.dto.ApiResponse;
import com.doan.WEB_TMDT.module.auth.entity.*;
import com.doan.WEB_TMDT.module.auth.repository.*;
import com.doan.WEB_TMDT.module.auth.service.EmployeeRegistrationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;

/**
 * Test suite cho EmployeeRegistrationServiceImpl.
 * Bao gồm: registerEmployee, approveEmployee, getAllRegistrations,
 *           getPendingRegistrations, getRegistrationCount.
 * - Mock mailSender để không gửi email thật.
 * - Kiểm tra số lượng record trước/sau mỗi test.
 * - Kiểm tra rollback khi exception.
 */
@DisplayName("AUTH SERVICE TEST")
class EmployeeRegistrationServiceImplTest extends BaseIntegrationTest {

    @Autowired
    private EmployeeRegistrationService empRegService;

    @Autowired
    private EmployeeRegistrationRepository regRepo;

    @Autowired
    private EmployeeRepository employeeRepo;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

   
    // HELPER METHODS
   

    /** Tạo và lưu EmployeeRegistration trực tiếp vào DB để dùng làm test data */
    private EmployeeRegistration taoRegistration(String email, String phone,
                                                  String fullName, boolean approved) {
        EmployeeRegistration reg = EmployeeRegistration.builder()
                .fullName(fullName)
                .email(email)
                .phone(phone)
                .address("123 Test Street")
                .position(Position.SALE)
                .note("Test note")
                .approved(approved)
                .createdAt(LocalDateTime.now())
                .build();
        return regRepo.save(reg);
    }

    /** Tạo user EMPLOYEE đang hoạt động để test duplicate phone */
    private User taoEmployeeUser(String email, String phone) {
        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode("TestPass123"))
                .role(Role.EMPLOYEE)
                .status(Status.ACTIVE)
                .build();
        Employee emp = Employee.builder()
                .user(user).fullName("Existing Emp")
                .phone(phone).position(Position.SALE).firstLogin(false).build();
        user.setEmployee(emp);
        return userRepository.save(user);
    }

   
    // registerEmployee
   

    @Test
    @DisplayName("TC_EMPLOYEE_001 - Đăng ký nhân viên thành công - lưu đủ thuộc tính vào DB")
    void TC_EMPLOYEE_001_registerEmployee_success() {
        // Mục đích nghiệp vụ: Admin/HR gửi yêu cầu đăng ký nhân viên mới,
        // hệ thống lưu vào bảng employee_registration chờ duyệt (approved=false).
        long regTruoc = regRepo.count();
        long empTruoc = employeeRepo.count();
        long userTruoc = userRepository.count();

        ApiResponse result = empRegService.registerEmployee(
                "Nguyen Van B", "nhanvien@test.com", "0903000001",
                "456 Nguyen Hue", Position.SALE, "Note test");

        assertTrue(result.isSuccess());
        assertEquals("Gửi yêu cầu đăng ký nhân viên thành công, chờ admin duyệt!", result.getMessage());
        assertNotNull(result.getData());

        // Kiểm tra từng thuộc tính được lưu vào DB
        regRepo.flush();
        assertEquals(regTruoc + 1, regRepo.count(), "Phải tạo đúng 1 registration");
        assertEquals(empTruoc, employeeRepo.count(), "Chưa duyệt - không tạo employee");
        assertEquals(userTruoc, userRepository.count(), "Chưa duyệt - không tạo user");

        EmployeeRegistration saved = (EmployeeRegistration) result.getData();
        assertNotNull(saved.getId(), "Registration phải có id");
        assertEquals("Nguyen Van B", saved.getFullName());
        assertEquals("nhanvien@test.com", saved.getEmail());
        assertEquals("0903000001", saved.getPhone());
        assertEquals("456 Nguyen Hue", saved.getAddress());
        assertEquals(Position.SALE, saved.getPosition());
        assertEquals("Note test", saved.getNote());
        assertFalse(saved.isApproved(), "Mới đăng ký phải có approved=false");
        assertNotNull(saved.getCreatedAt(), "CreatedAt phải được set");
    }

    @Test
    @DisplayName("TC_EMPLOYEE_002 - Đăng ký thất bại khi email đã tồn tại trong bảng registration")
    void TC_EMPLOYEE_002_registerEmployee_fail_emailTrongRegistration() {
        // Mục đích nghiệp vụ: Email đang chờ duyệt → từ chối đăng ký trùng,
        // tránh duplicate record.
        taoRegistration("dupemailreg@test.com", "0903000002", "Nguyen C", false);
        long regTruoc = regRepo.count();

        ApiResponse result = empRegService.registerEmployee(
                "Nguyen D", "dupemailreg@test.com", "0903000099",
                "Test", Position.CSKH, null);

        assertFalse(result.isSuccess());
        assertEquals("Email đã được đăng ký và đang chờ duyệt!", result.getMessage());
        assertEquals(regTruoc, regRepo.count(), "Không được thêm registration mới");
    }

    @Test
    @DisplayName("TC_EMPLOYEE_003 - Đăng ký thất bại khi email đã tồn tại trong bảng users")
    void TC_EMPLOYEE_003_registerEmployee_fail_emailTrongUsers() {
        // Mục đích nghiệp vụ: Email đã được dùng cho tài khoản trong hệ thống → từ chối.
        taoEmployeeUser("existuserreg@test.com", "0903000003");
        long regTruoc = regRepo.count();

        ApiResponse result = empRegService.registerEmployee(
                "Nguyen E", "existuserreg@test.com", "0903000098",
                "Test", Position.WAREHOUSE, null);

        assertFalse(result.isSuccess());
        assertEquals("Email đã tồn tại trong hệ thống!", result.getMessage());
        assertEquals(regTruoc, regRepo.count(), "Không được thêm registration mới");
    }

    @Test
    @DisplayName("TC_EMPLOYEE_004 - Đăng ký thất bại khi SĐT đã tồn tại trong bảng registration")
    void TC_EMPLOYEE_004_registerEmployee_fail_phoneTrongRegistration() {
        // Mục đích nghiệp vụ: SĐT đang chờ duyệt → từ chối đăng ký trùng SĐT.
        taoRegistration("otherreg@test.com", "0903000004", "Nguyen F", false);
        long regTruoc = regRepo.count();

        ApiResponse result = empRegService.registerEmployee(
                "Nguyen G", "brandnew@test.com", "0903000004",
                "Test", Position.ACCOUNTANT, null);

        assertFalse(result.isSuccess());
        assertEquals("Số điện thoại đã được đăng ký và đang chờ duyệt!", result.getMessage());
        assertEquals(regTruoc, regRepo.count(), "Không được thêm registration mới");
    }

    @Test
    @DisplayName("TC_EMPLOYEE_005 - Đăng ký thất bại khi SĐT đã tồn tại trong bảng employees")
    void TC_EMPLOYEE_005_registerEmployee_fail_phoneTrongEmployees() {
        // Mục đích nghiệp vụ: SĐT đã được nhân viên hiện tại dùng → từ chối.
        taoEmployeeUser("emp2@test.com", "0903000005");
        long regTruoc = regRepo.count();

        ApiResponse result = empRegService.registerEmployee(
                "Nguyen H", "new@test.com", "0903000005",
                "Test", Position.SHIPPER, null);

        assertFalse(result.isSuccess());
        assertEquals("Số điện thoại đã tồn tại trong hệ thống!", result.getMessage());
        assertEquals(regTruoc, regRepo.count(), "Không được thêm registration mới");
    }

    @Test
    @DisplayName("TC_EMPLOYEE_006 - Đăng ký với note = null - note là trường tùy chọn")
    void TC_EMPLOYEE_006_registerEmployee_noteNull() {
        // Mục đích nghiệp vụ: Ghi chú là tùy chọn, không bắt buộc phải có.
        ApiResponse result = empRegService.registerEmployee(
                "No Note Emp", "nonote@test.com", "0903000006",
                "Test Addr", Position.PRODUCT_MANAGER, null);

        assertTrue(result.isSuccess());
        regRepo.flush();
        EmployeeRegistration saved = (EmployeeRegistration) result.getData();
        assertNull(saved.getNote(), "Note có thể null");
        assertNotNull(saved.getId());
    }  
    // approveEmployee
    @Test
    @DisplayName("TC_EMPLOYEE_007 - Duyệt nhân viên thành công - tạo user + employee, xóa registration")
    void TC_EMPLOYEE_007_approveEmployee_success() {
        // Mục đích nghiệp vụ: Admin duyệt đơn đăng ký → tạo tài khoản user và employee,
        // gửi email thông báo mật khẩu, xóa registration đã xử lý.
        EmployeeRegistration reg = taoRegistration(
                "toapprove@test.com", "0903000010", "To Approve Emp", false);
        Long regId = reg.getId();

        long userTruoc = userRepository.count();
        long empTruoc = employeeRepo.count();
        long regTruoc = regRepo.count();

        ApiResponse result = empRegService.approveEmployee(regId);

        assertTrue(result.isSuccess());
        assertEquals("Đã duyệt và gửi thông tin tài khoản qua email!", result.getMessage());
        assertNotNull(result.getData());

        // Kiểm tra user được tạo trong DB
        userRepository.flush();
        assertEquals(userTruoc + 1, userRepository.count(), "Phải tạo đúng 1 user mới");
        assertEquals(empTruoc + 1, employeeRepo.count(), "Phải tạo đúng 1 employee mới");

        // Kiểm tra registration đã bị xóa
        regRepo.flush();
        assertEquals(regTruoc - 1, regRepo.count(), "Registration phải bị xóa sau khi duyệt");
        assertFalse(regRepo.existsById(regId), "Registration đã duyệt phải không còn trong DB");

        // Kiểm tra thông tin employee được tạo đúng
        Employee emp = (Employee) result.getData();
        assertNotNull(emp.getId());
        assertEquals("To Approve Emp", emp.getFullName());
        assertEquals("0903000010", emp.getPhone());
        assertEquals("123 Test Street", emp.getAddress());
        assertEquals(Position.SALE, emp.getPosition());
        assertTrue(emp.isFirstLogin(), "Employee mới tạo phải có firstLogin=true");

        // Kiểm tra user đồng hành
        assertNotNull(emp.getUser(), "Employee phải liên kết với user");
        assertEquals("toapprove@test.com", emp.getUser().getEmail());
        assertEquals(Role.EMPLOYEE, emp.getUser().getRole());
        assertEquals(Status.ACTIVE, emp.getUser().getStatus());
        assertNotNull(emp.getUser().getPassword(), "Password phải được tạo ngẫu nhiên");
    }

    @Test
    @DisplayName("TC_EMPLOYEE_008 - Duyệt nhân viên thất bại khi registration không tồn tại - ném exception")
    void TC_EMPLOYEE_008_approveEmployee_fail_registrationKhongTonTai() {
        // Mục đích nghiệp vụ: ID registration không tồn tại phải ném RuntimeException,
        // bảo vệ hệ thống khỏi dữ liệu giả.
        long idKhongTonTai = 99999L;
        long userTruoc = userRepository.count();
        long empTruoc = employeeRepo.count();

        assertThrows(RuntimeException.class,
                () -> empRegService.approveEmployee(idKhongTonTai),
                "Phải ném RuntimeException khi registration không tồn tại");

        // DB không thay đổi
        assertEquals(userTruoc, userRepository.count(), "Không tạo thêm user");
        assertEquals(empTruoc, employeeRepo.count(), "Không tạo thêm employee");
    }

    @Test
    @DisplayName("TC_EMPLOYEE_009 - Duyệt nhân viên thất bại khi registration đã approved=true")
    void TC_EMPLOYEE_009_approveEmployee_fail_daApproved() {
        // Mục đích nghiệp vụ: Phiếu đã được duyệt trước đó không được duyệt lại
        // (thực tế trong code, approved=true là defensive check vì record sẽ bị xóa sau khi duyệt).
        EmployeeRegistration reg = taoRegistration(
                "alreadyapproved@test.com", "0903000011", "Already Approved", true);

        long userTruoc = userRepository.count();
        long empTruoc = employeeRepo.count();

        ApiResponse result = empRegService.approveEmployee(reg.getId());

        assertFalse(result.isSuccess());
        assertEquals("Phiếu đăng ký này đã được duyệt!", result.getMessage());

        // DB không thay đổi
        assertEquals(userTruoc, userRepository.count(), "Không tạo thêm user");
        assertEquals(empTruoc, employeeRepo.count(), "Không tạo thêm employee");
    }

    @Test
    @DisplayName("TC_EMPLOYEE_010 - Duyệt nhân viên thất bại khi gửi email lỗi - transaction bị rollback-only")
    void TC_EMPLOYEE_010_approveEmployee_fail_guiEmailLoi_rollback() {
        // Mục đích nghiệp vụ: Nếu gửi email tài khoản thất bại, service phải ném exception
        // để Spring đánh dấu transaction là rollback-only → không commit dữ liệu nửa vời.
        // Lưu ý kỹ thuật: Trong môi trường test @Transactional, service share cùng outer
        // transaction (REQUIRED propagation). Sau khi exception, transaction bị rollback-only
        // nhưng count() vẫn thấy dữ liệu session chưa committed. Rollback thực sự xảy ra
        // sau khi test method kết thúc. Vì vậy chỉ verify exception được ném đúng.
        doThrow(new RuntimeException("SMTP error"))
                .when(mailSender).send(any(SimpleMailMessage.class));

        EmployeeRegistration reg = taoRegistration(
                "emailfailapp@test.com", "0903000012", "Email Fail Approve", false);
        Long regId = reg.getId();

        // Service phải ném RuntimeException khi mail lỗi
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> empRegService.approveEmployee(regId),
                "Phải ném exception khi không gửi được email");

        // Kiểm tra exception có message đề cập đến email hoặc lỗi gửi mail
        assertNotNull(ex.getMessage(), "Exception phải có message mô tả lỗi");

        // Registration vẫn tồn tại trong session (sẽ rollback sau khi test method kết thúc)
        assertTrue(regRepo.existsById(regId),
                "Registration phải vẫn tồn tại (transaction sẽ rollback khi test kết thúc)");
    }

   
    // getAllRegistrations
   

    @Test
    @DisplayName("TC_EMPLOYEE_011 - Lấy tất cả registrations khi danh sách rỗng")
    void TC_EMPLOYEE_011_getAllRegistrations_danhSachRong() {
        // Mục đích nghiệp vụ: Khi chưa có đăng ký nào, hệ thống trả về danh sách rỗng
        // (không phải null) để frontend render đúng.
        // Xóa tất cả registration hiện tại từ setup
        regRepo.deleteAll();
        regRepo.flush();

        ApiResponse result = empRegService.getAllRegistrations();

        assertTrue(result.isSuccess());
        assertEquals("Danh sách đăng ký nhân viên", result.getMessage());
        assertNotNull(result.getData());

        List<?> list = (List<?>) result.getData();
        assertTrue(list.isEmpty(), "Danh sách phải rỗng");
    }

    @Test
    @DisplayName("TC_EMPLOYEE_012 - Lấy tất cả registrations - kiểm tra từng thuộc tính từng phần tử")
    void TC_EMPLOYEE_012_getAllRegistrations_coData_kiemTraTungThuocTinh() {
        // Mục đích nghiệp vụ: API liệt kê tất cả đơn đăng ký (cả đã duyệt và chưa duyệt)
        // để admin quản lý. Mỗi record phải đầy đủ thông tin.
        regRepo.deleteAll();
        regRepo.flush();

        EmployeeRegistration r1 = taoRegistration("list1@test.com", "0903000020", "List User 1", false);
        EmployeeRegistration r2 = taoRegistration("list2@test.com", "0903000021", "List User 2", true);

        ApiResponse result = empRegService.getAllRegistrations();

        assertTrue(result.isSuccess());

        @SuppressWarnings("unchecked")
        List<EmployeeRegistration> list = (List<EmployeeRegistration>) result.getData();
        assertEquals(2, list.size(), "Phải trả về đúng 2 record");

        // Kiểm tra từng thuộc tính của từng phần tử
        EmployeeRegistration item1 = list.stream()
                .filter(r -> "list1@test.com".equals(r.getEmail())).findFirst().orElseThrow();
        assertNotNull(item1.getId());
        assertEquals("List User 1", item1.getFullName());
        assertEquals("list1@test.com", item1.getEmail());
        assertEquals("0903000020", item1.getPhone());
        assertEquals("123 Test Street", item1.getAddress());
        assertEquals(Position.SALE, item1.getPosition());
        assertEquals("Test note", item1.getNote());
        assertFalse(item1.isApproved());
        assertNotNull(item1.getCreatedAt());

        EmployeeRegistration item2 = list.stream()
                .filter(r -> "list2@test.com".equals(r.getEmail())).findFirst().orElseThrow();
        assertNotNull(item2.getId());
        assertEquals("List User 2", item2.getFullName());
        assertEquals("0903000021", item2.getPhone());
        assertTrue(item2.isApproved());
    }

   
    // getPendingRegistrations
   

    @Test
    @DisplayName("TC_EMPLOYEE_013 - Lấy danh sách chờ duyệt - chỉ trả về approved=false")
    void TC_EMPLOYEE_013_getPendingRegistrations_chiLayChuaDuyet() {
        // Mục đích nghiệp vụ: Admin cần xem danh sách đơn chờ duyệt.
        // Phải lọc đúng chỉ lấy approved=false, loại bỏ approved=true.
        regRepo.deleteAll();
        regRepo.flush();

        EmployeeRegistration pending1 = taoRegistration("pend1@test.com", "0903000030", "Pending 1", false);
        EmployeeRegistration pending2 = taoRegistration("pend2@test.com", "0903000031", "Pending 2", false);
        taoRegistration("done@test.com", "0903000032", "Done", true); // Đã duyệt - không được xuất hiện

        ApiResponse result = empRegService.getPendingRegistrations();

        assertTrue(result.isSuccess());
        assertEquals("Danh sách đăng ký chờ duyệt", result.getMessage());
        assertNotNull(result.getData());

        @SuppressWarnings("unchecked")
        List<EmployeeRegistration> list = (List<EmployeeRegistration>) result.getData();
        assertEquals(2, list.size(), "Chỉ 2 record pending được trả về");

        // Tất cả phần tử phải có approved=false
        list.forEach(r -> assertFalse(r.isApproved(),
                "Tất cả phần tử phải có approved=false, vi phạm: " + r.getEmail()));

        // Không được có record của "done@test.com" (approved=true)
        boolean hasDone = list.stream().anyMatch(r -> "done@test.com".equals(r.getEmail()));
        assertFalse(hasDone, "Record đã duyệt không được xuất hiện trong danh sách pending");

        // Kiểm tra từng thuộc tính phần tử pending
        EmployeeRegistration p1 = list.stream()
                .filter(r -> "pend1@test.com".equals(r.getEmail())).findFirst().orElseThrow();
        assertEquals("Pending 1", p1.getFullName());
        assertEquals("0903000030", p1.getPhone());
    }

    @Test
    @DisplayName("TC_EMPLOYEE_014 - Lấy danh sách chờ duyệt khi tất cả đã duyệt - trả về rỗng")
    void TC_EMPLOYEE_014_getPendingRegistrations_tatCaDaDuyet_traVeRong() {
        // Mục đích nghiệp vụ: Khi không còn đơn chờ duyệt nào, trả về danh sách rỗng.
        regRepo.deleteAll();
        regRepo.flush();
        taoRegistration("alldone1@test.com", "0903000040", "All Done 1", true);
        taoRegistration("alldone2@test.com", "0903000041", "All Done 2", true);

        ApiResponse result = empRegService.getPendingRegistrations();

        assertTrue(result.isSuccess());
        @SuppressWarnings("unchecked")
        List<EmployeeRegistration> list = (List<EmployeeRegistration>) result.getData();
        assertTrue(list.isEmpty(), "Danh sách phải rỗng khi tất cả đã duyệt");
    }

   
    // getRegistrationCount
   

    @Test
    @DisplayName("TC_EMPLOYEE_015 - Đếm số registration khi DB rỗng - trả về 0")
    void TC_EMPLOYEE_015_getRegistrationCount_rong() {
        // Mục đích nghiệp vụ: Số lượng đơn đăng ký khi chưa có gì phải là 0.
        regRepo.deleteAll();
        regRepo.flush();

        long count = empRegService.getRegistrationCount();

        assertEquals(0L, count, "Số lượng registration phải là 0 khi DB rỗng");
    }

    @Test
    @DisplayName("TC_EMPLOYEE_016 - Đếm số registration khi có N bản ghi - trả về N")
    void TC_EMPLOYEE_016_getRegistrationCount_coNRecord() {
        // Mục đích nghiệp vụ: Đếm chính xác số lượng đơn đăng ký trong hệ thống
        // (cả đã duyệt và chưa duyệt).
        regRepo.deleteAll();
        regRepo.flush();

        taoRegistration("cnt1@test.com", "0903000050", "Count 1", false);
        taoRegistration("cnt2@test.com", "0903000051", "Count 2", false);
        taoRegistration("cnt3@test.com", "0903000052", "Count 3", true);

        long count = empRegService.getRegistrationCount();

        assertEquals(3L, count, "Số lượng registration phải là 3");
    }

    

        @Test
        @DisplayName("TC_EMPLOYEE_017 - Email rỗng phải bị từ chối và không tạo registration")
        void TC_EMPLOYEE_017_registerEmployee_EmptyEmail_ShouldReject() {
                // Mục đích nghiệp vụ: Email rỗng là invalid data, service phải reject
                // thay vì lưu phiếu đăng ký không hợp lệ.
                long regTruoc = regRepo.count();
                long userTruoc = userRepository.count();
                long empTruoc = employeeRepo.count();

                ApiResponse result = empRegService.registerEmployee(
                                "Emp Empty Email", "", "0903999001", "Addr", Position.SALE, "note");

                assertFalse(result.isSuccess(), "Email rỗng phải bị từ chối");
                assertNull(result.getData(), "Reject case không được trả registration object");

                regRepo.flush();
                userRepository.flush();
                employeeRepo.flush();
                assertEquals(regTruoc, regRepo.count(), "Không được tạo registration với email rỗng");
                assertEquals(userTruoc, userRepository.count(), "Không được tạo user ngoài ý muốn");
                assertEquals(empTruoc, employeeRepo.count(), "Không được tạo employee ngoài ý muốn");
        }

        @Test
        @DisplayName("TC_EMPLOYEE_018 - Position null phải trả lỗi nghiệp vụ, không ném exception hệ thống")
        void TC_EMPLOYEE_018_registerEmployee_NullPosition_ShouldReturnError() {
                // Mục đích nghiệp vụ: position là thuộc tính bắt buộc của đăng ký nhân viên;
                // null phải được xử lý graceful bằng response lỗi.
                long regTruoc = regRepo.count();

                assertDoesNotThrow(() -> {
                        ApiResponse result = empRegService.registerEmployee(
                                        "Emp Null Position", "nullpos-emp@test.com", "0903999002",
                                        "Addr", null, "note");
                        assertFalse(result.isSuccess(), "Position null phải bị từ chối");
                        assertNull(result.getData());
                }, "Không được ném exception kỹ thuật khi position null");

                regRepo.flush();
                assertEquals(regTruoc, regRepo.count(), "Không được tạo registration khi position null");
        }
        @Test
    @DisplayName("TC_EMPLOYEE_019 - Đăng ký thất bại khi Họ tên (fullName) bị rỗng hoặc chỉ chứa khoảng trắng")
    void TC_EMPLOYEE_019_registerEmployee_fail_fullNameRong() {
        // Mục đích nghiệp vụ: Tên nhân viên là bắt buộc. Hệ thống không được phép tạo 
        // một phiếu đăng ký nhân viên vô danh.
        long regTruoc = regRepo.count();

        ApiResponse result = empRegService.registerEmployee(
                "   ", "nameless@test.com", "0903999003", "Test Addr", Position.SALE, null);

        assertFalse(result.isSuccess(), "Phải từ chối khi họ tên bị rỗng hoặc toàn khoảng trắng");
        assertNull(result.getData(), "Không được trả về object khi đăng ký lỗi");

        // DB không thay đổi
        regRepo.flush();
        assertEquals(regTruoc, regRepo.count(), "Không được lưu phiếu đăng ký vô danh");
    }
    @Test
    @DisplayName("TC_EMPLOYEE_020 - Đăng ký thất bại khi SĐT chứa ký tự chữ cái")
    void TC_EMPLOYEE_020_registerEmployee_fail_phoneChuaChuCai() {
        // Lấy số lượng record trước khi test
        long regTruoc = regRepo.count();
        long empTruoc = employeeRepo.count();
        long userTruoc = userRepository.count();

        ApiResponse result = empRegService.registerEmployee(
                "Nguyen Z1", "phone1@test.com", "09030000aa", "Addr", Position.SALE, null);

        // Verify API response
        assertFalse(result.isSuccess(), "Phải từ chối SĐT chứa chữ cái");
        assertNull(result.getData(), "Không trả về object khi đăng ký lỗi");

        // Verify Database KHÔNG tạo dữ liệu rác
        regRepo.flush();
        assertEquals(regTruoc, regRepo.count(), "Không được sinh thêm bản ghi Registration");
        assertEquals(empTruoc, employeeRepo.count(), "Không được sinh thêm bản ghi Employee");
        assertEquals(userTruoc, userRepository.count(), "Không được sinh thêm bản ghi User");
    }

    @Test
    @DisplayName("TC_EMPLOYEE_021 - Đăng ký thất bại khi SĐT quá ngắn (thiếu số)")
    void TC_EMPLOYEE_021_registerEmployee_fail_phoneQuaNgan() {
        long regTruoc = regRepo.count();
        long empTruoc = employeeRepo.count();
        long userTruoc = userRepository.count();

        // Truyền SĐT chỉ có 7 số
        ApiResponse result = empRegService.registerEmployee(
                "Nguyen Z2", "phone2@test.com", "0903000", "Addr", Position.SALE, null);

        // Verify API response
        assertFalse(result.isSuccess(), "Phải từ chối SĐT quá ngắn");
        assertNull(result.getData());

        // Verify Database
        regRepo.flush();
        assertEquals(regTruoc, regRepo.count(), "Không được sinh thêm bản ghi Registration");
        assertEquals(empTruoc, employeeRepo.count(), "Không được sinh thêm bản ghi Employee");
        assertEquals(userTruoc, userRepository.count(), "Không được sinh thêm bản ghi User");
    }

    @Test
    @DisplayName("TC_EMPLOYEE_022 - Đăng ký thất bại khi SĐT quá dài (thừa số)")
    void TC_EMPLOYEE_022_registerEmployee_fail_phoneQuaDai() {
        long regTruoc = regRepo.count();
        long empTruoc = employeeRepo.count();
        long userTruoc = userRepository.count();

        // Truyền SĐT có 13 số
        ApiResponse result = empRegService.registerEmployee(
                "Nguyen Z3", "phone3@test.com", "0903000000000", "Addr", Position.SALE, null);

        // Verify API response
        assertFalse(result.isSuccess(), "Phải từ chối SĐT quá dài");
        assertNull(result.getData());

        // Verify Database
        regRepo.flush();
        assertEquals(regTruoc, regRepo.count(), "Không được sinh thêm bản ghi Registration");
        assertEquals(empTruoc, employeeRepo.count(), "Không được sinh thêm bản ghi Employee");
        assertEquals(userTruoc, userRepository.count(), "Không được sinh thêm bản ghi User");
    }

    @Test
    @DisplayName("TC_EMPLOYEE_023 - Đăng ký thất bại khi SĐT chứa ký tự đặc biệt (!@#)")
    void TC_EMPLOYEE_023_registerEmployee_fail_phoneChuaKyTuDacBiet() {
        long regTruoc = regRepo.count();
        
        // Truyền SĐT chứa dấu ! và @
        ApiResponse result = empRegService.registerEmployee(
                "Nguyen Z4", "phone4@test.com", "0903!@#000", "Addr", Position.SALE, null);

        assertFalse(result.isSuccess(), "Phải từ chối SĐT chứa ký tự đặc biệt");
        assertNull(result.getData());

        regRepo.flush();
        assertEquals(regTruoc, regRepo.count(), "Không được sinh thêm bản ghi Registration");
    }

    @Test
    @DisplayName("TC_EMPLOYEE_024 - Đăng ký thất bại khi SĐT chứa khoảng trắng ở giữa")
    void TC_EMPLOYEE_024_registerEmployee_fail_phoneChuaKhoangTrang() {
        long regTruoc = regRepo.count();
        
        // Truyền SĐT có dấu cách
        ApiResponse result = empRegService.registerEmployee(
                "Nguyen Z5", "phone5@test.com", "0903 000 000", "Addr", Position.SALE, null);

        assertFalse(result.isSuccess(), "Phải từ chối SĐT có khoảng trắng hoặc phải tự format lại");
        
        regRepo.flush();
        assertEquals(regTruoc, regRepo.count(), "Không được sinh thêm bản ghi Registration");
    }
    @Test
    @DisplayName("TC_EMPLOYEE_025 - Đăng ký thất bại khi Email thiếu ký tự @")
    void TC_EMPLOYEE_025_registerEmployee_fail_emailThieuAcong() {
        long regTruoc = regRepo.count();

        ApiResponse result = empRegService.registerEmployee(
                "Nguyen X1", "invalidemail.com", "0903999011", "Addr", Position.CSKH, null);
                
        assertFalse(result.isSuccess(), "Phải từ chối email thiếu ký tự @");
        
        regRepo.flush();
        assertEquals(regTruoc, regRepo.count(), "DB không thay đổi");
    }

    @Test
    @DisplayName("TC_EMPLOYEE_026 - Đăng ký thất bại khi Email thiếu đuôi domain")
    void TC_EMPLOYEE_026_registerEmployee_fail_emailThieuDomain() {
        long regTruoc = regRepo.count();

        ApiResponse result = empRegService.registerEmployee(
                "Nguyen X2", "invalidemail@", "0903999012", "Addr", Position.CSKH, null);
                
        assertFalse(result.isSuccess(), "Phải từ chối email thiếu domain");
        
        regRepo.flush();
        assertEquals(regTruoc, regRepo.count(), "DB không thay đổi");
    }

}
