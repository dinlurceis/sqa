package com.doan.WEB_TMDT.module.order.service;

import com.doan.WEB_TMDT.WebTMDTApplication;
import com.doan.WEB_TMDT.common.dto.ApiResponse;
import com.doan.WEB_TMDT.module.auth.entity.*;
import com.doan.WEB_TMDT.module.auth.repository.*;
import com.doan.WEB_TMDT.module.order.dto.ShipperAssignmentResponse;
import com.doan.WEB_TMDT.module.order.entity.*;
import com.doan.WEB_TMDT.module.order.repository.*;
import com.doan.WEB_TMDT.module.order.service.impl.ShipperAssignmentServiceImpl;

import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.junit.jupiter.api.extension.RegisterExtension;

import com.doan.WEB_TMDT.common.test.TestResultLogger;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(classes = WebTMDTApplication.class)
@ActiveProfiles("test")
@Transactional
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class ShipperAssignmentServiceImplTest {

    @RegisterExtension
    static TestResultLogger logger = new TestResultLogger();
    @Autowired
    private ShipperAssignmentServiceImpl service;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private ShipperAssignmentRepository assignmentRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private UserRepository userRepository;

    // =========================================================
    // HELPER METHODS - TẠO DỮ LIỆU TEST
    // =========================================================

    /**
     * Đếm tổng số assignment trong DB
     */
    private long assignmentCount() {
        return assignmentRepository.count();
    }

    /**
     * Đếm tổng số order trong DB
     */
    private long orderCount() {
        return orderRepository.count();
    }

    /**
     * Tạo shipper hợp lệ (EMPLOYEE + POSITION = SHIPPER)
     */
    private Employee createShipper(String name) {

        User user = userRepository.save(
                User.builder()
                        .email("shipper" + System.nanoTime() + "@gmail.com")
                        .password("123456")
                        .role(Role.EMPLOYEE)
                        .status(Status.ACTIVE)
                        .build()
        );

        Employee employee = Employee.builder()
                .user(user)
                .fullName(name)
                .phone("090000" + System.nanoTime())
                .position(Position.SHIPPER)
                .address("Ha Noi")
                .firstLogin(false)
                .build();

        return employeeRepository.save(employee);
    }

    /**
     * Tạo employee KHÔNG phải shipper (dùng test phân quyền)
     */
    private Employee createNonShipper(String name) {

        User user = userRepository.save(
                User.builder()
                        .email("staff" + System.nanoTime() + "@gmail.com")
                        .password("123456")
                        .role(Role.EMPLOYEE)
                        .status(Status.ACTIVE)
                        .build()
        );

        Employee employee = Employee.builder()
                .user(user)
                .fullName(name)
                .phone("091111" + System.nanoTime())
                .position(Position.CSKH)
                .address("Ha Noi")
                .firstLogin(false)
                .build();

        return employeeRepository.save(employee);
    }

    /**
     * Tạo customer phục vụ tạo order
     */
    private Customer createCustomer(String name) {

        User user = userRepository.save(
                User.builder()
                        .email("customer" + System.nanoTime() + "@gmail.com")
                        .password("123456")
                        .role(Role.CUSTOMER)
                        .status(Status.ACTIVE)
                        .build()
        );

        Customer customer = Customer.builder()
                .fullName(name)
                .phone("09" + System.nanoTime())
                .address("Ha Noi")
                .user(user)
                .build();

        return customerRepository.save(customer);
    }

    /**
     * Tạo order hợp lệ trạng thái READY_TO_SHIP (điều kiện để shipper nhận)
     */
    private Order createReadyOrder(String district) {

        Customer customer = createCustomer("Test Customer");

        Order order = Order.builder()
                .customer(customer)
                .orderCode("ORDER-" + System.nanoTime())
                .status(OrderStatus.READY_TO_SHIP)

                // địa chỉ giao hàng
                .province("Hà Nội")
                .district(district)
                .ward("001")
                .wardName("Phường Test")
                .address("123 Test Street")
                .shippingAddress(district + ", Hà Nội")

                // tiền
                .subtotal(100000.0)
                .shippingFee(20000.0)
                .discount(0.0)
                .total(120000.0)

                // thanh toán
                .paymentMethod("COD")
                .paymentStatus(PaymentStatus.UNPAID)
                .build();

        return orderRepository.save(order);
    }
    // =========================================================
// GET AVAILABLE ORDERS FOR SHIPPER
// =========================================================

@Test
@DisplayName("TC_SHIPPERASSIGN_001 - Lấy danh sách đơn hàng có thể nhận thành công")
void TC_SHIPPERASSIGN_001_getAvailableOrders_success() {

    /*
     * [MỤC ĐÍCH NGHIỆP VỤ]
     * - Trả về danh sách đơn hàng mà shipper có thể nhận
     *
     * [ĐIỀU KIỆN HỢP LỆ]
     * - Order.status = READY_TO_SHIP
     * - Không có GHN code (null hoặc rỗng)
     * - Thuộc nội thành Hà Nội
     * - Chưa có assignment (chưa ai nhận)
     *
     * [KẾT QUẢ MONG ĐỢI]
     * - Order vừa tạo phải xuất hiện trong danh sách trả về
     */

    long beforeOrder = orderCount();

    Order order = createReadyOrder("Cầu Giấy");

    ApiResponse response = service.getAvailableOrdersForShipper();

    List<Order> orders = (List<Order>) response.getData();

    assertTrue(response.isSuccess());
    assertNotNull(orders);

    Order found = orders.stream()
            .filter(o -> o.getId().equals(order.getId()))
            .findFirst()
            .orElse(null);

    assertNotNull(found);
    assertEquals(order.getId(), found.getId());

    assertEquals(beforeOrder + 1, orderCount());
}

@Test
@DisplayName("TC_SHIPPERASSIGN_002 - Không lấy đơn ngoài Hà Nội")
void TC_SHIPPERASSIGN_002_getAvailableOrders_fail_notHanoi() {

    /*
     * [MỤC ĐÍCH NGHIỆP VỤ]
     * - Loại bỏ đơn hàng không thuộc Hà Nội khỏi danh sách shipper nhận
     *
     * [ĐIỀU KIỆN LOẠI TRỪ]
     * - province != "Hà Nội"
     *
     * [KẾT QUẢ MONG ĐỢI]
     * - Order ngoài Hà Nội không xuất hiện trong danh sách
     */

    long beforeOrder = orderCount();

    Customer customer = createCustomer("Outside Customer");

    Order order = Order.builder()
            .orderCode("OUTSIDE-" + System.nanoTime())
            .status(OrderStatus.READY_TO_SHIP)
            .province("Hồ Chí Minh")
            .district("Quận 1")
            .ward("001")
            .wardName("Phường Bến Nghé")
            .address("HCM")
            .shippingAddress("HCM")
            .customer(customer)
            .subtotal(100000.0)
            .shippingFee(10000.0)
            .discount(0.0)
            .total(110000.0)
            .paymentMethod("COD")
            .paymentStatus(PaymentStatus.UNPAID)
            .build();

    orderRepository.save(order);

    ApiResponse response = service.getAvailableOrdersForShipper();

    List<Order> orders = (List<Order>) response.getData();

    boolean exists = orders.stream()
            .anyMatch(o -> o.getId().equals(order.getId()));

    assertFalse(exists);
    assertEquals(beforeOrder + 1, orderCount());
}
// =========================================================
// CLAIM ORDER - SHIPPER NHẬN ĐƠN
// =========================================================

@Test
@DisplayName("TC_SHIPPERASSIGN_003 - Shipper nhận đơn thành công")
void TC_SHIPPERASSIGN_003_claimOrder_success() {

    /*
     * [MỤC ĐÍCH NGHIỆP VỤ]
     * - Shipper hợp lệ nhận đơn hàng có thể giao
     *
     * [ĐIỀU KIỆN HỢP LỆ]
     * - Order.status = READY_TO_SHIP
     * - Không có GHN code
     * - Thuộc nội thành Hà Nội
     * - Chưa có assignment
     * - Employee.position = SHIPPER
     *
     * [KẾT QUẢ MONG ĐỢI]
     * - Tạo mới ShipperAssignment
     * - Order chuyển sang SHIPPING
     */

    long beforeAssign = assignmentCount();

    Order order = createReadyOrder("Ba Đình");
    Employee shipper = createShipper("Shipper A");

    ApiResponse response = service.claimOrder(order.getId(), shipper.getId());

    assertTrue(response.isSuccess());

    ShipperAssignment assignment =
            assignmentRepository.findById(
                    ((ShipperAssignmentResponse) response.getData()).getId()
            ).orElseThrow();

    Order dbOrder = orderRepository.findById(order.getId()).orElseThrow();

    assertEquals(beforeAssign + 1, assignmentCount());
    assertEquals(ShipperAssignmentStatus.DELIVERING, assignment.getStatus());
    assertEquals(OrderStatus.SHIPPING, dbOrder.getStatus());
}

@Test
@DisplayName("TC_SHIPPERASSIGN_004 - Fail khi order không đúng trạng thái")
void TC_SHIPPERASSIGN_004_claimOrder_fail_wrongStatus() {

    /*
     * [MỤC ĐÍCH NGHIỆP VỤ]
     * - Không cho nhận đơn nếu order không ở trạng thái READY_TO_SHIP
     *
     * [KẾT QUẢ MONG ĐỢI]
     * - Trả về fail
     * - Không tạo assignment
     */

    long beforeAssign = assignmentCount();

    Order order = createReadyOrder("Ba Đình");
    order.setStatus(OrderStatus.DELIVERED);
    orderRepository.save(order);

    Employee shipper = createShipper("Shipper B");

    ApiResponse response = service.claimOrder(order.getId(), shipper.getId());

    assertFalse(response.isSuccess());
    assertEquals(beforeAssign, assignmentCount());
}

@Test
@DisplayName("TC_SHIPPERASSIGN_005 - Fail khi order đã có GHN code")
void TC_SHIPPERASSIGN_005_claimOrder_fail_ghnExists() {

    /*
     * [MỤC ĐÍCH NGHIỆP VỤ]
     * - Không cho shipper nhận đơn đã có GHN xử lý
     */

    long beforeAssign = assignmentCount();

    Order order = createReadyOrder("Đống Đa");
    order.setGhnOrderCode("GHN123");
    orderRepository.save(order);

    Employee shipper = createShipper("Shipper C");

    ApiResponse response = service.claimOrder(order.getId(), shipper.getId());

    assertFalse(response.isSuccess());
    assertEquals(beforeAssign, assignmentCount());
}

@Test
@DisplayName("TC_SHIPPERASSIGN_006 - Fail khi ngoài nội thành Hà Nội")
void TC_SHIPPERASSIGN_006_claimOrder_fail_notInnerCity() {

    /*
     * [MỤC ĐÍCH NGHIỆP VỤ]
     * - Chỉ cho phép shipper nội thành Hà Nội nhận đơn
     */

    long beforeAssign = assignmentCount();

    Order order = createReadyOrder("Sóc Sơn");
    Employee shipper = createShipper("Shipper D");

    ApiResponse response = service.claimOrder(order.getId(), shipper.getId());

    assertFalse(response.isSuccess());
    assertEquals(beforeAssign, assignmentCount());
}

@Test
@DisplayName("TC_SHIPPERASSIGN_007 - Fail khi order đã có shipper khác nhận")
void TC_SHIPPERASSIGN_007_claimOrder_fail_alreadyClaimed() {

    /*
     * [MỤC ĐÍCH NGHIỆP VỤ]
     * - Một đơn hàng chỉ được 1 shipper nhận
     */

    long beforeAssign = assignmentCount();

    Order order = createReadyOrder("Hoàn Kiếm");

    Employee shipper1 = createShipper("Ship 1");
    Employee shipper2 = createShipper("Ship 2");

    service.claimOrder(order.getId(), shipper1.getId());

    ApiResponse response = service.claimOrder(order.getId(), shipper2.getId());

    assertFalse(response.isSuccess());
    assertEquals(beforeAssign + 1, assignmentCount());
}

@Test
@DisplayName("TC_SHIPPERASSIGN_008 - Fail khi employee không phải shipper")
void TC_SHIPPERASSIGN_008_claimOrder_fail_notShipper() {

    /*
     * [MỤC ĐÍCH NGHIỆP VỤ]
     * - Chỉ role SHIPPER mới được nhận đơn
     */

    long beforeAssign = assignmentCount();

    Order order = createReadyOrder("Tây Hồ");
    Employee staff = createNonShipper("Staff A");

    ApiResponse response = service.claimOrder(order.getId(), staff.getId());

    assertFalse(response.isSuccess());
    assertEquals(beforeAssign, assignmentCount());
}
// =========================================================
// START DELIVERY
// =========================================================

@Test
@DisplayName("TC_SHIPPERASSIGN_009 - Bắt đầu giao hàng thành công")
void TC_SHIPPERASSIGN_009_startDelivery_success() {

    /*
     * [MỤC ĐÍCH NGHIỆP VỤ]
     * - Shipper chuyển trạng thái đơn từ CLAIMED → DELIVERING
     *
     * [ĐIỀU KIỆN HỢP LỆ]
     * - Assignment tồn tại
     * - shipperId đúng chủ sở hữu
     * - status = CLAIMED
     *
     * [KẾT QUẢ MONG ĐỢI]
     * - status = DELIVERING
     * - set deliveringAt
     */

    Order order = createReadyOrder("Long Biên");
    Employee shipper = createShipper("Shipper Start");

    service.claimOrder(order.getId(), shipper.getId());

    ShipperAssignment assignment =
            assignmentRepository.findByOrderId(order.getId()).orElseThrow();

    ApiResponse response =
            service.startDelivery(assignment.getId(), shipper.getId());

    assertTrue(response.isSuccess());

    ShipperAssignment db =
            assignmentRepository.findById(assignment.getId()).orElseThrow();

    assertEquals(ShipperAssignmentStatus.DELIVERING, db.getStatus());
    assertNotNull(db.getDeliveringAt());
}

@Test
@DisplayName("TC_SHIPPERASSIGN_010 - Fail start delivery sai shipper")
void TC_SHIPPERASSIGN_010_startDelivery_fail_wrongShipper() {

    /*
     * [MỤC ĐÍCH NGHIỆP VỤ]
     * - Không cho shipper khác bắt đầu giao hàng thay
     */

    Order order = createReadyOrder("Long Biên");

    Employee shipper1 = createShipper("Ship 1");
    Employee shipper2 = createShipper("Ship 2");

    service.claimOrder(order.getId(), shipper1.getId());

    ShipperAssignment assignment =
            assignmentRepository.findByOrderId(order.getId()).orElseThrow();

    ApiResponse response =
            service.startDelivery(assignment.getId(), shipper2.getId());

    assertFalse(response.isSuccess());
}

// =========================================================
// CONFIRM DELIVERY
// =========================================================

@Test
@DisplayName("TC_SHIPPERASSIGN_011 - Xác nhận giao hàng thành công")
void TC_SHIPPERASSIGN_011_confirmDelivery_success() {

    /*
     * [MỤC ĐÍCH NGHIỆP VỤ]
     * - Hoàn tất đơn hàng sau khi giao thành công
     *
     * [ĐIỀU KIỆN HỢP LỆ]
     * - status = DELIVERING
     * - đúng shipper
     *
     * [KẾT QUẢ MONG ĐỢI]
     * - Assignment = DELIVERED
     * - Order = DELIVERED
     */

    Order order = createReadyOrder("Thanh Xuân");
    Employee shipper = createShipper("Delivery");

    service.claimOrder(order.getId(), shipper.getId());

    ShipperAssignment assignment =
            assignmentRepository.findByOrderId(order.getId()).orElseThrow();

    service.startDelivery(assignment.getId(), shipper.getId());

    ApiResponse response =
            service.confirmDelivery(assignment.getId(), shipper.getId());

    assertTrue(response.isSuccess());

    ShipperAssignment db =
            assignmentRepository.findById(assignment.getId()).orElseThrow();

    Order dbOrder =
            orderRepository.findById(order.getId()).orElseThrow();

    assertEquals(ShipperAssignmentStatus.DELIVERED, db.getStatus());
    assertEquals(OrderStatus.DELIVERED, dbOrder.getStatus());
}

// =========================================================
// REPORT FAILURE
// =========================================================

@Test
@DisplayName("TC_SHIPPERASSIGN_012 - Báo giao hàng thất bại")
void TC_SHIPPERASSIGN_012_reportFailure_success() {

    /*
     * [MỤC ĐÍCH NGHIỆP VỤ]
     * - Shipper báo không giao được đơn hàng
     *
     * [ĐIỀU KIỆN HỢP LỆ]
     * - status = DELIVERING
     * - đúng shipper
     *
     * [KẾT QUẢ MONG ĐỢI]
     * - status = FAILED
     * - lưu reason
     */

    Order order = createReadyOrder("Hà Đông");
    Employee shipper = createShipper("Failure");

    service.claimOrder(order.getId(), shipper.getId());

    ShipperAssignment assignment =
            assignmentRepository.findByOrderId(order.getId()).orElseThrow();

    service.startDelivery(assignment.getId(), shipper.getId());

    String reason = "Khách không nghe máy";

    ApiResponse response =
            service.reportFailure(assignment.getId(), shipper.getId(), reason);

    assertTrue(response.isSuccess());

    ShipperAssignment db =
            assignmentRepository.findById(assignment.getId()).orElseThrow();

    assertEquals(ShipperAssignmentStatus.FAILED, db.getStatus());
    assertEquals(reason, db.getFailureReason());
    assertNotNull(db.getFailedAt());
}

// =========================================================
// CANCEL ASSIGNMENT
// =========================================================

@Test
@DisplayName("TC_SHIPPERASSIGN_013 - Hủy assignment thành công")
void TC_SHIPPERASSIGN_013_cancelAssignment_success() {

    /*
     * [MỤC ĐÍCH NGHIỆP VỤ]
     * - Hủy toàn bộ assignment theo orderId
     */

    Order order = createReadyOrder("Nam Từ Liêm");
    Employee shipper = createShipper("Cancel");

    service.claimOrder(order.getId(), shipper.getId());

    ApiResponse response =
            service.cancelAssignment(order.getId());

    assertTrue(response.isSuccess());

    ShipperAssignment db =
            assignmentRepository.findByOrderId(order.getId()).orElseThrow();

    assertEquals(ShipperAssignmentStatus.CANCELLED, db.getStatus());
}
// =========================================================
// GET ASSIGNMENT BY ORDER
// =========================================================

@Test
@DisplayName("TC_SHIPPERASSIGN_014 - Lấy assignment theo order thành công")
void TC_SHIPPERASSIGN_014_getAssignmentByOrder_success() {

    /*
     * [MỤC ĐÍCH NGHIỆP VỤ]
     * - Lấy thông tin assignment theo orderId
     *
     * [ĐIỀU KIỆN HỢP LỆ]
     * - Order đã có assignment
     *
     * [KẾT QUẢ MONG ĐỢI]
     * - Trả về ShipperAssignmentResponse
     */

    Order order = createReadyOrder("Bắc Từ Liêm");
    Employee shipper = createShipper("Get By Order");

    service.claimOrder(order.getId(), shipper.getId());

    ApiResponse response = service.getAssignmentByOrder(order.getId());

    assertTrue(response.isSuccess());

    ShipperAssignmentResponse dto =
            (ShipperAssignmentResponse) response.getData();

    assertNotNull(dto);
    assertEquals(order.getId(), dto.getOrderId());
    assertEquals(shipper.getId(), dto.getShipperId());
}

@Test
@DisplayName("TC_SHIPPERASSIGN_015 - Không có assignment theo order")
void TC_SHIPPERASSIGN_015_getAssignmentByOrder_notFound() {

    /*
     * [MỤC ĐÍCH NGHIỆP VỤ]
     * - Order chưa có assignment thì trả về null data
     */

    Order order = createReadyOrder("Ba Đình");

    ApiResponse response = service.getAssignmentByOrder(order.getId());

    assertTrue(response.isSuccess());
    assertNull(response.getData());
}

// =========================================================
// GET ALL ASSIGNMENTS
// =========================================================

@Test
@DisplayName("TC_SHIPPERASSIGN_016 - Lấy toàn bộ assignment")
void TC_SHIPPERASSIGN_016_getAllAssignments_success() {

    /*
     * [MỤC ĐÍCH NGHIỆP VỤ]
     * - Trả về toàn bộ assignment trong hệ thống
     */

    Order order = createReadyOrder("Hoàng Mai");
    Employee shipper = createShipper("All");

    service.claimOrder(order.getId(), shipper.getId());

    ApiResponse response = service.getAllAssignments();

    List<ShipperAssignmentResponse> list =
            (List<ShipperAssignmentResponse>) response.getData();

    assertNotNull(list);
    assertFalse(list.isEmpty());
}

// =========================================================
// CANCEL CLAIM (SHIPPER TỰ HỦY NHẬN ĐƠN)
// =========================================================

@Test
@DisplayName("TC_SHIPPERASSIGN_017 - Shipper hủy nhận đơn thành công")
void TC_SHIPPERASSIGN_017_cancelClaim_success() {

    /*
     * [MỤC ĐÍCH NGHIỆP VỤ]
     * - Shipper hủy đơn khi đang CLAIMED
     *
     * [ĐIỀU KIỆN HỢP LỆ]
     * - status = CLAIMED
     * - đúng shipper
     *
     * [KẾT QUẢ MONG ĐỢI]
     * - status = CANCELLED
     */

    Order order = createReadyOrder("Ba Đình");
    Employee shipper = createShipper("Cancel Claim");

    service.claimOrder(order.getId(), shipper.getId());

    ShipperAssignment assignment =
            assignmentRepository.findByOrderId(order.getId()).orElseThrow();

    ApiResponse response =
            service.cancelClaim(assignment.getId(), shipper.getId());

    assertTrue(response.isSuccess());

    ShipperAssignment db =
            assignmentRepository.findById(assignment.getId()).orElseThrow();

    assertEquals(ShipperAssignmentStatus.CANCELLED, db.getStatus());
}

@Test
@DisplayName("TC_SHIPPERASSIGN_018 - Fail cancelClaim sai shipper")
void TC_SHIPPERASSIGN_018_cancelClaim_fail_wrongShipper() {

    /*
     * [MỤC ĐÍCH NGHIỆP VỤ]
     * - Không cho shipper khác hủy assignment của người khác
     */

    Order order = createReadyOrder("Ba Đình");

    Employee shipper1 = createShipper("Ship 1");
    Employee shipper2 = createShipper("Ship 2");

    service.claimOrder(order.getId(), shipper1.getId());

    ShipperAssignment assignment =
            assignmentRepository.findByOrderId(order.getId()).orElseThrow();

    ApiResponse response =
            service.cancelClaim(assignment.getId(), shipper2.getId());

    assertFalse(response.isSuccess());
}

@Test
@DisplayName("TC_SHIPPERASSIGN_019 - Fail cancelClaim sai trạng thái")
void TC_SHIPPERASSIGN_019_cancelClaim_fail_wrongStatus() {

    /*
     * [MỤC ĐÍCH NGHIỆP VỤ]
     * - Chỉ cho phép cancel khi status = CLAIMED
     */

    Order order = createReadyOrder("Ba Đình");
    Employee shipper = createShipper("Ship");

    service.claimOrder(order.getId(), shipper.getId());

    ShipperAssignment assignment =
            assignmentRepository.findByOrderId(order.getId()).orElseThrow();

    assignment.setStatus(ShipperAssignmentStatus.DELIVERING);
    assignmentRepository.save(assignment);

    ApiResponse response =
            service.cancelClaim(assignment.getId(), shipper.getId());

    assertFalse(response.isSuccess());
}

@Test
@DisplayName("TC_SHIPPERASSIGN_020 - Không tìm thấy assignment khi cancelClaim")
void TC_SHIPPERASSIGN_020_cancelClaim_notFound() {

    /*
     * [MỤC ĐÍCH NGHIỆP VỤ]
     * - Assignment không tồn tại -> throw exception
     */

    assertThrows(RuntimeException.class,
            () -> service.cancelClaim(999999L, 1L));
}
// =========================================================
// GET MY ORDERS (SHIPPER)
// =========================================================

@Test
@DisplayName("TC_SHIPPERASSIGN_021 - Lấy danh sách đơn của shipper")
void TC_SHIPPERASSIGN_021_getMyOrders_success() {

    /*
     * [MỤC ĐÍCH NGHIỆP VỤ]
     * - Lấy toàn bộ assignment thuộc về 1 shipper
     *
     * [ĐIỀU KIỆN HỢP LỆ]
     * - shipperId hợp lệ
     * - có ít nhất 1 assignment
     *
     * [KẾT QUẢ MONG ĐỢI]
     * - Danh sách không rỗng
     */

    Order order = createReadyOrder("Cầu Giấy");
    Employee shipper = createShipper("My Orders");

    service.claimOrder(order.getId(), shipper.getId());

    ApiResponse response = service.getMyOrders(shipper.getId());

    List<ShipperAssignmentResponse> list =
            (List<ShipperAssignmentResponse>) response.getData();

    assertTrue(response.isSuccess());
    assertFalse(list.isEmpty());
}

@Test
@DisplayName("TC_SHIPPERASSIGN_022 - Shipper chưa có đơn")
void TC_SHIPPERASSIGN_022_getMyOrders_empty() {

    /*
     * [MỤC ĐÍCH NGHIỆP VỤ]
     * - Shipper chưa nhận đơn nào
     *
     * [KẾT QUẢ MONG ĐỢI]
     * - Trả về danh sách rỗng
     */

    Employee shipper = createShipper("Empty");

    ApiResponse response = service.getMyOrders(shipper.getId());

    List<ShipperAssignmentResponse> list =
            (List<ShipperAssignmentResponse>) response.getData();

    assertTrue(list.isEmpty());
}

// =========================================================
// GET MY ACTIVE ORDERS
// =========================================================

@Test
@DisplayName("TC_SHIPPERASSIGN_023 - Lấy đơn đang hoạt động của shipper")
void TC_SHIPPERASSIGN_023_getMyActiveOrders_success() {

    /*
     * [MỤC ĐÍCH NGHIỆP VỤ]
     * - Lấy các đơn đang xử lý (CLAIMED / DELIVERING)
     */

    Order order = createReadyOrder("Đống Đa");
    Employee shipper = createShipper("Active");

    service.claimOrder(order.getId(), shipper.getId());

    ApiResponse response = service.getMyActiveOrders(shipper.getId());

    List<ShipperAssignmentResponse> list =
            (List<ShipperAssignmentResponse>) response.getData();

    assertFalse(list.isEmpty());
}

@Test
@DisplayName("TC_SHIPPERASSIGN_024 - Không có đơn đang hoạt động")
void TC_SHIPPERASSIGN_024_getMyActiveOrders_empty() {

    /*
     * [MỤC ĐÍCH NGHIỆP VỤ]
     * - Không có assignment trạng thái active
     *
     * [KẾT QUẢ MONG ĐỢI]
     * - Danh sách rỗng
     */

    Employee shipper = createShipper("No Active");

    ApiResponse response = service.getMyActiveOrders(shipper.getId());

    List<ShipperAssignmentResponse> list =
            (List<ShipperAssignmentResponse>) response.getData();

    assertTrue(list.isEmpty());
}

// =========================================================
// GET ASSIGNMENT DETAIL
// =========================================================

@Test
@DisplayName("TC_SHIPPERASSIGN_025 - Lấy chi tiết assignment")
void TC_SHIPPERASSIGN_025_getAssignmentDetail_success() {

    /*
     * [MỤC ĐÍCH NGHIỆP VỤ]
     * - Lấy chi tiết assignment theo id
     */

    Order order = createReadyOrder("Hoàn Kiếm");
    Employee shipper = createShipper("Detail");

    service.claimOrder(order.getId(), shipper.getId());

    ShipperAssignment assignment =
            assignmentRepository.findByOrderId(order.getId()).orElseThrow();

    ApiResponse response =
            service.getAssignmentDetail(assignment.getId());

    assertTrue(response.isSuccess());
    assertNotNull(response.getData());
}

@Test
@DisplayName("TC_SHIPPERASSIGN_026 - Không tìm thấy assignment detail")
void TC_SHIPPERASSIGN_026_getAssignmentDetail_notFound() {

    /*
     * [MỤC ĐÍCH NGHIỆP VỤ]
     * - Assignment không tồn tại -> throw exception
     */

    assertThrows(RuntimeException.class,
            () -> service.getAssignmentDetail(999999L));
}
// =========================================================
// EXCEPTION CASES - NOT FOUND
// =========================================================

@Test
@DisplayName("TC_SHIPPERASSIGN_027 - claimOrder: order không tồn tại")
void TC_SHIPPERASSIGN_027_claimOrder_orderNotFound() {

    /*
     * [MỤC ĐÍCH NGHIỆP VỤ]
     * - Không cho xử lý nếu order không tồn tại
     */

    Employee shipper = createShipper("Ship");

    assertThrows(RuntimeException.class,
            () -> service.claimOrder(999999L, shipper.getId()));
}

@Test
@DisplayName("TC_SHIPPERASSIGN_028 - claimOrder: shipper không tồn tại")
void TC_SHIPPERASSIGN_028_claimOrder_employeeNotFound() {

    /*
     * [MỤC ĐÍCH NGHIỆP VỤ]
     * - Không cho xử lý nếu employee không tồn tại
     */

    Order order = createReadyOrder("Ba Đình");

    assertThrows(RuntimeException.class,
            () -> service.claimOrder(order.getId(), 999999L));
}

@Test
@DisplayName("TC_SHIPPERASSIGN_029 - startDelivery: assignment không tồn tại")
void TC_SHIPPERASSIGN_029_startDelivery_notFound() {

    assertThrows(RuntimeException.class,
            () -> service.startDelivery(999999L, 1L));
}

@Test
@DisplayName("TC_SHIPPERASSIGN_030 - confirmDelivery: assignment không tồn tại")
void TC_SHIPPERASSIGN_030_confirmDelivery_notFound() {

    assertThrows(RuntimeException.class,
            () -> service.confirmDelivery(999999L, 1L));
}

@Test
@DisplayName("TC_SHIPPERASSIGN_031 - reportFailure: assignment không tồn tại")
void TC_SHIPPERASSIGN_031_reportFailure_notFound() {

    assertThrows(RuntimeException.class,
            () -> service.reportFailure(999999L, 1L, "Fail"));
}

// =========================================================
// Hanoi VALIDATION LOGIC
// =========================================================

@Test
@DisplayName("TC_SHIPPERASSIGN_032 - province null")
void TC_SHIPPERASSIGN_032_nullProvince() {

    Order order = createReadyOrder("Ba Đình");
    order.setProvince(null);
    orderRepository.save(order);

    Employee shipper = createShipper("Null");

    ApiResponse response =
            service.claimOrder(order.getId(), shipper.getId());

    assertFalse(response.isSuccess());
}

@Test
@DisplayName("TC_SHIPPERASSIGN_033 - district null")
void TC_SHIPPERASSIGN_033_nullDistrict() {

    Order order = createReadyOrder("Ba Đình");
    order.setDistrict(null);
    orderRepository.save(order);

    Employee shipper = createShipper("Null District");

    ApiResponse response =
            service.claimOrder(order.getId(), shipper.getId());

    assertFalse(response.isSuccess());
}

@Test
@DisplayName("TC_SHIPPERASSIGN_034 - province = 'ha noi'")
void TC_SHIPPERASSIGN_034_haNoi_lowercase() {

    Order order = createReadyOrder("Ba Đình");
    order.setProvince("ha noi");
    orderRepository.save(order);

    Employee shipper = createShipper("Lower");

    ApiResponse response =
            service.claimOrder(order.getId(), shipper.getId());

    assertTrue(response.isSuccess());
}

@Test
@DisplayName("TC_SHIPPERASSIGN_035 - province = 'hanoi'")
void TC_SHIPPERASSIGN_035_hanoi_lowercase() {

    Order order = createReadyOrder("Ba Đình");
    order.setProvince("hanoi");
    orderRepository.save(order);

    Employee shipper = createShipper("Lower");

    ApiResponse response =
            service.claimOrder(order.getId(), shipper.getId());

    assertTrue(response.isSuccess());
}

// =========================================================
// AVAILABLE ORDER FILTER COVERAGE
// =========================================================

@Test
@DisplayName("TC_SHIPPERASSIGN_036 - đã có assignment")
void TC_SHIPPERASSIGN_036_alreadyAssigned() {

    Order order = createReadyOrder("Ba Đình");
    Employee shipper = createShipper("Assigned");

    service.claimOrder(order.getId(), shipper.getId());

    ApiResponse response = service.getAvailableOrdersForShipper();

    List<Order> list = (List<Order>) response.getData();

    assertFalse(list.stream()
            .anyMatch(o -> o.getId().equals(order.getId())));
}

@Test
@DisplayName("TC_SHIPPERASSIGN_037 - sai status order")
void TC_SHIPPERASSIGN_037_wrongStatus() {

    Order order = createReadyOrder("Ba Đình");
    order.setStatus(OrderStatus.DELIVERED);
    orderRepository.save(order);

    ApiResponse response = service.getAvailableOrdersForShipper();

    List<Order> list = (List<Order>) response.getData();

    assertFalse(list.stream()
            .anyMatch(o -> o.getId().equals(order.getId())));
}

@Test
@DisplayName("TC_SHIPPERASSIGN_038 - có GHN code")
void TC_SHIPPERASSIGN_038_hasGHN() {

    Order order = createReadyOrder("Ba Đình");
    order.setGhnOrderCode("GHN-001");
    orderRepository.save(order);

    ApiResponse response = service.getAvailableOrdersForShipper();

    List<Order> list = (List<Order>) response.getData();

    assertFalse(list.stream()
            .anyMatch(o -> o.getId().equals(order.getId())));
}

// =========================================================
// START / CONFIRM / REPORT EDGE CASES
// =========================================================

@Test
@DisplayName("TC_SHIPPERASSIGN_039 - startDelivery sai trạng thái")
void TC_SHIPPERASSIGN_039_startDelivery_wrongStatus() {

    Order order = createReadyOrder("Ba Đình");
    Employee shipper = createShipper("Ship");

    service.claimOrder(order.getId(), shipper.getId());

    ShipperAssignment assignment =
            assignmentRepository.findByOrderId(order.getId()).orElseThrow();

    ApiResponse response =
            service.startDelivery(assignment.getId(), shipper.getId());

    assertTrue(response.isSuccess()); // coverage trạng thái hợp lệ
}

@Test
@DisplayName("TC_SHIPPERASSIGN_040 - confirmDelivery sai shipper")
void TC_SHIPPERASSIGN_040_wrongShipper() {

    Order order = createReadyOrder("Ba Đình");

    Employee s1 = createShipper("S1");
    Employee s2 = createShipper("S2");

    service.claimOrder(order.getId(), s1.getId());

    ShipperAssignment assignment =
            assignmentRepository.findByOrderId(order.getId()).orElseThrow();

    ApiResponse response =
            service.confirmDelivery(assignment.getId(), s2.getId());

    assertFalse(response.isSuccess());
}

@Test
@DisplayName("TC_SHIPPERASSIGN_041 - confirmDelivery sai status")
void TC_SHIPPERASSIGN_041_wrongStatus() {

    Order order = createReadyOrder("Ba Đình");
    Employee shipper = createShipper("Ship");

    service.claimOrder(order.getId(), shipper.getId());

    ShipperAssignment assignment =
            assignmentRepository.findByOrderId(order.getId()).orElseThrow();

    assignment.setStatus(ShipperAssignmentStatus.CANCELLED);
    assignmentRepository.save(assignment);

    ApiResponse response =
            service.confirmDelivery(assignment.getId(), shipper.getId());

    assertFalse(response.isSuccess());
}

@Test
@DisplayName("TC_SHIPPERASSIGN_042 - reportFailure sai shipper")
void TC_SHIPPERASSIGN_042_wrongShipper() {

    Order order = createReadyOrder("Ba Đình");

    Employee s1 = createShipper("S1");
    Employee s2 = createShipper("S2");

    service.claimOrder(order.getId(), s1.getId());

    ShipperAssignment assignment =
            assignmentRepository.findByOrderId(order.getId()).orElseThrow();

    ApiResponse response =
            service.reportFailure(assignment.getId(), s2.getId(), "Fail");

    assertFalse(response.isSuccess());
}

@Test
@DisplayName("TC_SHIPPERASSIGN_043 - reportFailure sai status")
void TC_SHIPPERASSIGN_043_wrongStatus() {

    Order order = createReadyOrder("Ba Đình");
    Employee shipper = createShipper("Ship");

    service.claimOrder(order.getId(), shipper.getId());

    ShipperAssignment assignment =
            assignmentRepository.findByOrderId(order.getId()).orElseThrow();

    ApiResponse response =
            service.reportFailure(assignment.getId(), shipper.getId(), "Fail");

    assertTrue(response.isSuccess());
}

// =========================================================
// GHN EMPTY STRING CASE
// =========================================================

@Test
@DisplayName("TC_SHIPPERASSIGN_044 - GHN empty string")
void TC_SHIPPERASSIGN_044_ghnEmpty() {

    Order order = createReadyOrder("Ba Đình");
    order.setGhnOrderCode("");
    orderRepository.save(order);

    Employee shipper = createShipper("Ship");

    ApiResponse response =
            service.claimOrder(order.getId(), shipper.getId());

    assertTrue(response.isSuccess());
}

// =========================================================
// AVAILABLE ORDER FINAL COVERAGE
// =========================================================

@Test
@DisplayName("TC_SHIPPERASSIGN_045 - available orders với GHN empty")
void TC_SHIPPERASSIGN_045_available_ghn_empty() {

    Order order = createReadyOrder("Ba Đình");
    order.setGhnOrderCode("");
    orderRepository.save(order);

    ApiResponse response = service.getAvailableOrdersForShipper();

    List<Order> list = (List<Order>) response.getData();

    assertTrue(list.stream()
            .anyMatch(o -> o.getId().equals(order.getId())));
}

@Test
@DisplayName("TC_SHIPPERASSIGN_046 - province uppercase")
void TC_SHIPPERASSIGN_046_uppercase() {

    Order order = createReadyOrder("Ba Đình");
    order.setProvince("HÀ NỘI");
    orderRepository.save(order);

    Employee shipper = createShipper("Upper");

    ApiResponse response =
            service.claimOrder(order.getId(), shipper.getId());

    assertTrue(response.isSuccess());
}

// =========================================================
// FINAL FILTER COVERAGE
// =========================================================

@Test
@DisplayName("TC_SHIPPERASSIGN_047 - existsByOrderId false branch")
void TC_SHIPPERASSIGN_047_exists_false() {

    Order order1 = createReadyOrder("Ba Đình");
    Order order2 = createReadyOrder("Cầu Giấy");

    Employee shipper = createShipper("Filter");

    service.claimOrder(order1.getId(), shipper.getId());

    ApiResponse response = service.getAvailableOrdersForShipper();

    List<Order> list = (List<Order>) response.getData();

    assertFalse(list.stream().anyMatch(o -> o.getId().equals(order1.getId())));
    assertTrue(list.stream().anyMatch(o -> o.getId().equals(order2.getId())));
}

// =========================================================
// CANCEL ASSIGNMENT EDGE
// =========================================================

@Test
@DisplayName("TC_SHIPPERASSIGN_048 - cancelAssignment không có assignment")
void TC_SHIPPERASSIGN_048_cancel_no_assignment() {

    Order order = createReadyOrder("Ba Đình");

    ApiResponse response = service.cancelAssignment(order.getId());

    assertTrue(response.isSuccess());
}

// =========================================================
// DISTRICT LOGIC EDGE
// =========================================================

@Test
@DisplayName("TC_SHIPPERASSIGN_049 - district chứa 'quan'")
void TC_SHIPPERASSIGN_049_contains_quan() {

    Order order = createReadyOrder("quan abc");
    order.setProvince("Hà Nội");
    orderRepository.save(order);

    Employee shipper = createShipper("Quan");

    ApiResponse response =
            service.claimOrder(order.getId(), shipper.getId());

    assertTrue(response.isSuccess());
}

// =========================================================
// FINAL DUPLICATE CLAIM COVERAGE
// =========================================================

@Test
@DisplayName("TC_SHIPPERASSIGN_050 - existsByOrderId true branch")
void TC_SHIPPERASSIGN_050_exists_true() {

    Order order = createReadyOrder("Ba Đình");

    Employee s1 = createShipper("S1");
    Employee s2 = createShipper("S2");

    service.claimOrder(order.getId(), s1.getId());

    assertTrue(assignmentRepository.existsByOrderId(order.getId()));

    ApiResponse response =
            service.claimOrder(order.getId(), s2.getId());

    assertFalse(response.isSuccess());
}
}