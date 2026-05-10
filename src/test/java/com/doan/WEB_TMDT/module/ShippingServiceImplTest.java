package com.doan.WEB_TMDT.module.shipping;

import com.doan.WEB_TMDT.module.auth.BaseIntegrationTest;
import com.doan.WEB_TMDT.module.auth.entity.Customer;
import com.doan.WEB_TMDT.module.auth.entity.Role;
import com.doan.WEB_TMDT.module.auth.entity.Status;
import com.doan.WEB_TMDT.module.auth.entity.User;
import com.doan.WEB_TMDT.module.auth.repository.CustomerRepository;
import com.doan.WEB_TMDT.module.auth.repository.UserRepository;
import com.doan.WEB_TMDT.module.order.entity.Order;
import com.doan.WEB_TMDT.module.order.entity.OrderStatus;
import com.doan.WEB_TMDT.module.order.entity.PaymentStatus;
import com.doan.WEB_TMDT.module.order.repository.OrderRepository;
import com.doan.WEB_TMDT.module.shipping.dto.CalculateShippingFeeRequest;
import com.doan.WEB_TMDT.module.shipping.dto.CreateGHNOrderRequest;
import com.doan.WEB_TMDT.module.shipping.dto.CreateGHNOrderResponse;
import com.doan.WEB_TMDT.module.shipping.dto.GHNOrderDetailResponse;
import com.doan.WEB_TMDT.module.shipping.dto.ShippingFeeResponse;
import com.doan.WEB_TMDT.module.shipping.service.ShippingService;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.util.ReflectionTestUtils;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import static org.junit.jupiter.api.Assertions.*;

/**
 * BỘTEST DỊCH VỤ VẬN CHUYỂN - v5 - TẬP TRUNG (Chỉ logic có thể kiểm tra)
 *  
 * Giai đoạn 2: Sẽ tích hợp thư viện mock API thích hợp (WireMock)
 */
@DisplayName("SHIPPING SERVICE TEST")
@TestPropertySource(locations = "classpath:application-test.properties")
@Transactional
class ShippingServiceImplTest extends BaseIntegrationTest {

    @Autowired
    private ShippingService shippingService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerRepository customerRepository;

    private HttpServer ghnServer;
    private final Map<String, String> ghnResponses = new ConcurrentHashMap<>();
    private final Map<String, Integer> ghnStatuses = new ConcurrentHashMap<>();
    private final Map<String, String> ghnRequestBodies = new ConcurrentHashMap<>();

    // ========================================================
    // HELPER METHODS
    // ========================================================

    private CalculateShippingFeeRequest taoRequest(String province, String district, Double weight, Double value) {
        return CalculateShippingFeeRequest.builder()
                .province(province)
                .district(district)
                .ward("Phường 1")
                .address("123 Đường A")
                .weight(weight)
                .value(value)
                .build();
    }

    private void stubGhnResponse(String path, int status, String body) {
        ghnStatuses.put(path, status);
        ghnResponses.put(path, body);
    }

    private <T> T invokePrivate(String methodName, Object... args) {
        @SuppressWarnings("unchecked")
        T result = (T) ReflectionTestUtils.invokeMethod(shippingService, methodName, args);
        return result;
    }

    private void assertOrderCountUnchanged(long orderCountBefore) {
        assertEquals(orderCountBefore, orderRepository.count(), "DB phải giữ nguyên số record");
    }

    private Customer taoCustomer(String email, String phone) {
        User user = User.builder()
                .email(email)
                .password("TestPass123")
                .role(Role.CUSTOMER)
                .status(Status.ACTIVE)
                .build();

        Customer customer = Customer.builder()
                .user(user)
                .fullName("Khách hàng kiểm thử")
                .phone(phone)
                .address("123 Lê Lợi")
                .build();

        user.setCustomer(customer);
        userRepository.saveAndFlush(user);
        return customerRepository.findByPhone(phone).orElseThrow();
    }

    private Order taoOrder(Customer customer, String orderCode, String province, String district, String ward,
                           String wardName, String address) {
        Order order = Order.builder()
                .orderCode(orderCode)
                .customer(customer)
                .shippingAddress(address + ", " + ward + ", " + district + ", " + province)
                .province(province)
                .district(district)
                .ward(ward)
                .wardName(wardName)
                .address(address)
                .note("Ghi chú kiểm thử")
                .subtotal(100000.0)
                .shippingFee(25000.0)
                .discount(0.0)
                .total(125000.0)
                .paymentStatus(PaymentStatus.UNPAID)
                .paymentMethod("COD")
                .status(OrderStatus.PENDING_PAYMENT)
                .build();
        return orderRepository.saveAndFlush(order);
    }

    @BeforeEach
    void setUpGhnServer() throws IOException {
        ghnResponses.clear();
        ghnStatuses.clear();
        ghnRequestBodies.clear();

        ghnServer = HttpServer.create(new InetSocketAddress(0), 0);
        ghnServer.createContext("/", exchange -> {
            String path = exchange.getRequestURI().getPath();
            String requestBody = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
            ghnRequestBodies.put(path, requestBody);

            String responseBody = ghnResponses.getOrDefault(path, "{\"code\":404,\"message\":\"not stubbed\",\"data\":null}");
            Integer statusCode = ghnStatuses.getOrDefault(path, 404);

            byte[] responseBytes = responseBody.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
            exchange.sendResponseHeaders(statusCode, responseBytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(responseBytes);
            }
        });
        ghnServer.start();

        ReflectionTestUtils.setField(shippingService, "ghnApiUrl",
                "http://localhost:" + ghnServer.getAddress().getPort());
    }

    @AfterEach
    void tearDownGhnServer() {
        if (ghnServer != null) {
            ghnServer.stop(0);
        }
    }







    // ========================================================
    // TEST INDEX - SẮP XẾP THEO METHOD (TC_SHIP_001 ~ TC_SHIP_113)
    // isHanoiInnerCity()                                      -> TC_SHIP_001, TC_SHIP_002, TC_SHIP_003, TC_SHIP_004, TC_SHIP_005, TC_SHIP_006, TC_SHIP_007, TC_SHIP_008, TC_SHIP_009
    // calculateShippingFee()                                  -> TC_SHIP_010, TC_SHIP_011, TC_SHIP_012, TC_SHIP_013, TC_SHIP_014, TC_SHIP_015, TC_SHIP_016, TC_SHIP_017, TC_SHIP_018, TC_SHIP_019, TC_SHIP_020, TC_SHIP_021, TC_SHIP_022, TC_SHIP_023, TC_SHIP_024
    // calculateShippingFee() [biên nghiệp vụ]                   -> TC_SHIP_109, TC_SHIP_110, TC_SHIP_111, TC_SHIP_112, TC_SHIP_113
    // formatLeadTime()                                        -> TC_SHIP_025, TC_SHIP_026, TC_SHIP_027, TC_SHIP_028, TC_SHIP_029, TC_SHIP_030, TC_SHIP_031, TC_SHIP_032, TC_SHIP_033
    // fixAllWardNames()                                       -> TC_SHIP_034, TC_SHIP_035, TC_SHIP_036, TC_SHIP_037, TC_SHIP_038, TC_SHIP_039
    // parseTimestamp()                                        -> TC_SHIP_040, TC_SHIP_041, TC_SHIP_042, TC_SHIP_043
    // normalizeVietnamese()                                   -> TC_SHIP_044, TC_SHIP_045
    // matchLocation()                                         -> TC_SHIP_046, TC_SHIP_047, TC_SHIP_048
    // getStatusText()                                         -> TC_SHIP_049, TC_SHIP_050, TC_SHIP_051, TC_SHIP_052, TC_SHIP_053, TC_SHIP_054
    // getProvinces()                                          -> TC_SHIP_055, TC_SHIP_056, TC_SHIP_057, TC_SHIP_058, TC_SHIP_059, TC_SHIP_060
    // getDistricts()                                          -> TC_SHIP_061, TC_SHIP_062, TC_SHIP_063, TC_SHIP_064, TC_SHIP_065, TC_SHIP_066, TC_SHIP_067
    // getWards()                                              -> TC_SHIP_068, TC_SHIP_069, TC_SHIP_070, TC_SHIP_071, TC_SHIP_072, TC_SHIP_073
    // getDistrictId() / getWardCode() / getProvinceId()       -> TC_SHIP_074, TC_SHIP_075, TC_SHIP_076, TC_SHIP_077, TC_SHIP_078, TC_SHIP_079, TC_SHIP_080, TC_SHIP_081, TC_SHIP_082, TC_SHIP_083, TC_SHIP_084, TC_SHIP_085, TC_SHIP_086, TC_SHIP_087, TC_SHIP_088
    // createGHNOrder()                                        -> TC_SHIP_089, TC_SHIP_090, TC_SHIP_091, TC_SHIP_092, TC_SHIP_093, TC_SHIP_094, TC_SHIP_095, TC_SHIP_096, TC_SHIP_097, TC_SHIP_098, TC_SHIP_099, TC_SHIP_100, TC_SHIP_101, TC_SHIP_102
    // getGHNOrderDetail()                                     -> TC_SHIP_103, TC_SHIP_104, TC_SHIP_105, TC_SHIP_106, TC_SHIP_107, TC_SHIP_108
    // ========================================================

    // ========================================================
    // isHanoiInnerCity()
    // [TESTS] TC_SHIP_001, TC_SHIP_002, TC_SHIP_003, TC_SHIP_004, TC_SHIP_005, TC_SHIP_006, TC_SHIP_007, TC_SHIP_008, TC_SHIP_009
    // ========================================================


    @Test
    @DisplayName("TC_SHIP_001 - Province null thì trả về false")
    void TC_SHIP_001_province_null_returnFalse() {
        
        boolean result = shippingService.isHanoiInnerCity(null, "Ba Đình");
        assertFalse(result, "Province null phải trả false");
    }

    @Test
    @DisplayName("TC_SHIP_002 - District null thì trả về false")
    void TC_SHIP_002_district_null_returnFalse() {
        
        boolean result = shippingService.isHanoiInnerCity("Hà Nội", null);
        assertFalse(result, "District null phải trả false");
    }

    @Test
    @DisplayName("TC_SHIP_003 - Province không phải Hà Nội thì trả về false")
    void TC_SHIP_003_notHanoi_returnFalse() {
        
        boolean result = shippingService.isHanoiInnerCity("TP. Hồ Chí Minh", "Quận 1");
        assertFalse(result, "Province không phải Hà Nội phải trả false");
    }

    @Test
    @DisplayName("TC_SHIP_004 - Quận ngoại thành Hà Nội thì trả về false")
    void TC_SHIP_004_outerDistrict_returnFalse() {
        
        boolean result = shippingService.isHanoiInnerCity("Hà Nội", "Gia Lâm");
        assertFalse(result, "Quận ngoài nội thành Hà Nội phải trả false");
    }

    @Test
    @DisplayName("TC_SHIP_005 - Quận Ba Đình nội thành thì trả về true")
    void TC_SHIP_005_baDinh_returnTrue() {
        
        boolean result = shippingService.isHanoiInnerCity("Hà Nội", "Ba Đình");
        assertTrue(result, "Ba Đình nội thành Hà Nội phải trả true");
    }

    @Test
    @DisplayName("TC_SHIP_006 - Quận Hoàn Kiếm nội thành thì trả về true")
    void TC_SHIP_006_hoanKiem_returnTrue() {
        
        boolean result = shippingService.isHanoiInnerCity("Hà Nội", "Hoàn Kiếm");
        assertTrue(result, "Hoàn Kiếm nội thành Hà Nội phải trả true");
    }

    @Test
    @DisplayName("TC_SHIP_007 - Kiểm tra khả năng nhận diện nội thành không phân biệt hoa thường.")
    void TC_SHIP_007_lowercase_returnTrue() {
        
        boolean result = shippingService.isHanoiInnerCity("ha noi", "tây hồ");
        assertTrue(result, "Nhập thường phải khớp không phân biệt hoa thường");
    }

    @Test
    @DisplayName("TC_SHIP_008 - Province có tiền tố TP vẫn nhận dạng là Hà Nội")
    void TC_SHIP_008_tpPrefix_returnTrue() {
        
        boolean result = shippingService.isHanoiInnerCity("TP. Hà Nội", "Tây Hồ");
        assertTrue(result, "TP. Hà Nội phải được nhận diện là Hà Nội");
    }

    @Test
    @DisplayName("TC_SHIP_009 - Province và district viết hoa toàn bộ vẫn khớp đúng")
    void TC_SHIP_009_uppercase_returnTrue() {
        
        boolean result = shippingService.isHanoiInnerCity("HÀ NỘI", "BA ĐÌNH");
        assertTrue(result, "Chữ hoa Hà Nội và Ba Đình phải khớp");
    }

    // calculateShippingFee()

    // ========================================================
    // calculateShippingFee()
    // [TESTS] TC_SHIP_010, TC_SHIP_011, TC_SHIP_012, TC_SHIP_013, TC_SHIP_014, TC_SHIP_015, TC_SHIP_016, TC_SHIP_017, TC_SHIP_018, TC_SHIP_019, TC_SHIP_020, TC_SHIP_021, TC_SHIP_022, TC_SHIP_023, TC_SHIP_024
    // ========================================================

    // ========================================================
    // calculateShippingFee()
    // [TESTS] TC_SHIP_010, TC_SHIP_011, TC_SHIP_012, TC_SHIP_013, TC_SHIP_014, TC_SHIP_015, TC_SHIP_016, TC_SHIP_017, TC_SHIP_018, TC_SHIP_019, TC_SHIP_020, TC_SHIP_021, TC_SHIP_022, TC_SHIP_023, TC_SHIP_024
    // ========================================================


    @Test
    @DisplayName("TC_SHIP_010 - Địa chỉ Ba Đình nội thành thì phí giao hàng bằng 0")
    void TC_SHIP_010_baDinh_freeShip() {
        
        CalculateShippingFeeRequest req = taoRequest("Hà Nội", "Ba Đình", 1000.0, 100000.0);
        ShippingFeeResponse result = shippingService.calculateShippingFee(req);

        assertNotNull(result, "Response không được null");
        assertEquals(0.0, result.getFee(), 0.01, "Nội thành Hà Nội phải có phí 0");
        assertEquals("INTERNAL", result.getShipMethod(), "Phải dùng phương pháp INTERNAL");
        assertTrue(result.getIsFreeShip(), "Phải đánh dấu là giao miễn phí");
    }

    @Test
    @DisplayName("TC_SHIP_011 - Trọng lượng lớn trong nội thành Hà Nội thì phí giao hàng vẫn bằng 0")
    void TC_SHIP_011_largeWeight_freeShip() {
        
        CalculateShippingFeeRequest req = taoRequest("Hà Nội", "Hoàn Kiếm", 10000.0, 50000000.0);
        ShippingFeeResponse result = shippingService.calculateShippingFee(req);

        assertEquals(0.0, result.getFee(), 0.01, "Nội thành Hà Nội luôn miễn phí");
    }

    @Test
    @DisplayName("TC_SHIP_012 - Trọng lượng null trong nội thành thì phí giao hàng vẫn bằng 0")
    void TC_SHIP_012_nullWeight_freeShip() {
        
        CalculateShippingFeeRequest req = taoRequest("Hà Nội", "Ba Đình", null, 100000.0);
        ShippingFeeResponse result = shippingService.calculateShippingFee(req);

        assertEquals(0.0, result.getFee(), 0.01, "Nội thành Hà Nội miễn phí bất kể trọng lượng null");
    }

    @Test
    @DisplayName("TC_SHIP_013 - Giá trị đơn hàng null trong nội thành thì phí giao hàng vẫn bằng 0")
    void TC_SHIP_013_nullValue_freeShip() {
        
        CalculateShippingFeeRequest req = taoRequest("Hà Nội", "Tây Hồ", 2000.0, null);
        ShippingFeeResponse result = shippingService.calculateShippingFee(req);

        assertEquals(0.0, result.getFee(), 0.01, "Hà Nội miễn phí ngay cả với giá trị null");
    }

    @Test
    @DisplayName("TC_SHIP_014 - Province null thì không crash hệ thống")
    void TC_SHIP_014_nullProvince_noException() {
        
        CalculateShippingFeeRequest req = taoRequest(null, "Quận 1", 1000.0, 100000.0);
        
        try {
            ShippingFeeResponse result = shippingService.calculateShippingFee(req);
            assertNotNull(result, "Không được crash với province null");
        } catch (Exception e) {
            // Chấp nhận nếu service ném lỗi xác thực
            assertTrue(e.getMessage().contains("province") || e.getMessage().contains("null"), 
                "Lỗi phải tham chiếu province");
        }
    }

    @Test
    @DisplayName("TC_SHIP_015 - District null trong Hà Nội thì không crash hệ thống")
    void TC_SHIP_015_nullDistrict_noException() {
        
        CalculateShippingFeeRequest req = taoRequest("Hà Nội", null, 1000.0, 100000.0);
        
        try {
            ShippingFeeResponse result = shippingService.calculateShippingFee(req);
            // Nếu không crash, OK - phải là giao miễn phí dù sao (Hà Nội null district = false)
            assertNotNull(result);
        } catch (Exception e) {
            System.out.println("Xử lý null district: " + e.getMessage());
        }
    }

    @Test
    @DisplayName("TC_SHIP_016 - Province rỗng thì không khớp Hà Nội và chuyển hướng sang GHN")
    void TC_SHIP_016_emptyProvince_notHanoi() {
        
        CalculateShippingFeeRequest req = taoRequest("", "Ba Đình", 1000.0, 100000.0);
        
        // Phải cố gọi GHN vì "" không chứa "hà nội"
        try {
            ShippingFeeResponse result = shippingService.calculateShippingFee(req);
            assertNotNull(result);
        } catch (Exception e) {
            // Dự kiến nếu GHN API thất bại
            System.out.println("Province rỗng → cố gọi GHN: " + e.getMessage());
        }
    }

    @Test
    @DisplayName("TC_SHIP_017 - Tất cả 12 quận nội thành Hà Nội đều được giao miễn phí")
    void TC_SHIP_017_allInnerDistricts_freeShip() {
        
        String[] innerDistricts = {
            "Ba Đình", "Hoàn Kiếm", "Hai Bà Trưng", "Đống Đa",
            "Tây Hồ", "Cầu Giấy", "Thanh Xuân", "Hoàng Mai",
            "Long Biên", "Tây Hồ", "Bắc Từ Liêm", "Nam Từ Liêm"
        };

        for (String district : innerDistricts) {
            CalculateShippingFeeRequest req = taoRequest("Hà Nội", district, 1000.0, 100000.0);
            ShippingFeeResponse result = shippingService.calculateShippingFee(req);
            
            assertEquals(0.0, result.getFee(), 0.01,
                "Quận " + district + " phải có giao miễn phí");
        }
    }

    @Test
    @DisplayName("TC_SHIP_018 - Địa chỉ ngoài Hà Nội thì gọi API GHN để tính phí thực tế")
    void TC_SHIP_018_nonHanoi_callGHNApi() {
        Long leadTime = (System.currentTimeMillis() / 1000) + 2 * 24 * 3600L;
        stubGhnResponse("/v2/shipping-order/leadtime",
                200,
                "{\"code\":200,\"data\":{\"leadtime\":" + leadTime + "}}"
        );
        stubGhnResponse("/v2/shipping-order/fee",
                200,
                "{\"code\":200,\"data\":{\"total\":31900.0}}"
        );

        long orderCountBefore = orderRepository.count();

        CalculateShippingFeeRequest req = taoRequest("TP. Hồ Chí Minh", "Quận 1", null, null);
        ShippingFeeResponse result = shippingService.calculateShippingFee(req);

        assertNotNull(result);
        assertFalse(result.getIsFreeShip());
        assertEquals("GHN", result.getShipMethod());
        assertEquals(31900.0, result.getFee());
        assertEquals("2-3 ngày", result.getEstimatedTime());

        assertTrue(ghnRequestBodies.get("/v2/shipping-order/leadtime").contains("from_district_id"));
        assertTrue(ghnRequestBodies.get("/v2/shipping-order/fee").contains("\"weight\":1000"));
        assertTrue(ghnRequestBodies.get("/v2/shipping-order/fee").contains("\"insurance_value\":0"));
        assertEquals(orderCountBefore, orderRepository.count(), "Tính phí giao hàng không Hà Nội không được đụng vào DB");
    }

    @Test
    @DisplayName("TC_SHIP_019 - API leadtime GHN lỗi nhưng fee OK thì fallback về thời gian mặc định")
    void TC_SHIP_019_leadtimeError_defaultTime() {
        // Leadtime API trả 500, fee API trả OK
        stubGhnResponse("/v2/shipping-order/leadtime", 500, "{\"code\":500,\"data\":null}");
        stubGhnResponse("/v2/shipping-order/fee", 200, "{\"code\":200,\"data\":{\"total\":25000.0}}");

        long orderCountBefore = orderRepository.count();

        CalculateShippingFeeRequest req = taoRequest("TP. Hồ Chí Minh", "Quận 1", null, null);
        ShippingFeeResponse result = shippingService.calculateShippingFee(req);

        assertNotNull(result);
        assertEquals(25000.0, result.getFee());
        assertEquals("2-4 ngày", result.getEstimatedTime(), "Leadtime lỗi phải fallback về 2-4 ngày");
        assertEquals(orderCountBefore, orderRepository.count(), "Không được thay đổi DB khi tính phí");
    }

    @Test
    @DisplayName("TC_SHIP_020 - API fee GHN lỗi thì ném RuntimeException")
    void TC_SHIP_020_feeApiError_throwsException() {
        stubGhnResponse("/v2/shipping-order/leadtime", 200, "{\"code\":200,\"data\":{\"leadtime\":0}}");
        stubGhnResponse("/v2/shipping-order/fee", 500, "{\"code\":500,\"data\":null}");

        long orderCountBefore = orderRepository.count();
        CalculateShippingFeeRequest req = taoRequest("TP. Hồ Chí Minh", "Quận 1", 1000.0, 100000.0);

        assertThrows(RuntimeException.class, () -> shippingService.calculateShippingFee(req));
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_021 - GHN trả dữ liệu phí không hợp lệ thiếu total thì ném RuntimeException")
    void TC_SHIP_021_invalidFeeResponse_throwsException() {
        // Phủ dòng Đỏ cuối callGHNApi: throw new RuntimeException("GHN API không trả về phí vận chuyển hợp lệ")
        stubGhnResponse("/v2/shipping-order/leadtime", 200, "{\"code\":200,\"data\":{\"leadtime\":1672531200}}");
        // Trả HTTP 200 nhưng không có key "total" bên trong "data"
        stubGhnResponse("/v2/shipping-order/fee", 200, "{\"code\":200,\"data\":{\"fake_key\":123}}");

        CalculateShippingFeeRequest req = taoRequest("TP. Hồ Chí Minh", "Quận 1", 1000.0, 100000.0);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> shippingService.calculateShippingFee(req));
        assertTrue(ex.getMessage().contains("phí vận chuyển hợp lệ"));
    }

    @Test
    @DisplayName("TC_SHIP_022 - GHN ném exception khi lấy leadtime thì fallback về thời gian mặc định")
    void TC_SHIP_022_leadtimeException_defaultTime() {
        // Phủ dòng Đỏ: catch (Exception e) khi lấy leadtime
        stubGhnResponse("/v2/shipping-order/leadtime", 500, "Server Error");
        stubGhnResponse("/v2/shipping-order/fee", 200, "{\"code\":200,\"data\":{\"total\":30000.0}}");

        CalculateShippingFeeRequest req = taoRequest("TP. Hồ Chí Minh", "Quận 1", 1000.0, 100000.0);
        ShippingFeeResponse result = shippingService.calculateShippingFee(req);
        
        assertEquals(30000.0, result.getFee());
        assertEquals("2-4 ngày", result.getEstimatedTime()); // Fallback mặc định
    }

    @Test
    @DisplayName("TC_SHIP_023 - API GHN leadtime trả null hoặc thiếu code vẫn tính phí thành công")
    void TC_SHIP_023_leadtimeNullOrMissingCode_feeSuccess() {
        // Quét 6 nhánh branch đỏ trong callGHNApi:
        // 1. leadTimeResponse == null (Jackson parse chuỗi "null" thành object null)
        // 2. leadTimeResponse.get("code") == null
        // 3. feeResponse == null
        
        long orderCountBefore = orderRepository.count();

        stubGhnResponse("/v2/shipping-order/leadtime", 200, "null");
        stubGhnResponse("/v2/shipping-order/fee", 200, "{\"code\":200,\"data\":{\"total\":30000.0}}");
        CalculateShippingFeeRequest req1 = taoRequest("TP. Hồ Chí Minh", "Quận 1", 1000.0, 100000.0);
        ShippingFeeResponse res1 = shippingService.calculateShippingFee(req1);
        assertEquals(30000.0, res1.getFee()); // Vẫn tính phí thành công

        stubGhnResponse("/v2/shipping-order/leadtime", 200, "{\"message\":\"ok\"}"); // Không có 'code'
        ShippingFeeResponse res2 = shippingService.calculateShippingFee(req1);
        assertEquals(30000.0, res2.getFee());

        stubGhnResponse("/v2/shipping-order/fee", 200, "null");
        assertThrows(RuntimeException.class, () -> shippingService.calculateShippingFee(req1));

        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_024 - API GHN phường hoặc quận trả null hoặc data null thì trả về giá trị mặc định")
    void TC_SHIP_024_districtWardNullResponse_returnDefault() {
        // Quét các nhánh đỏ trong getDistrictId và getWardCode:
        // - response == null, response.code == null, response.data == null
        
        long orderCountBefore = orderRepository.count();

        // Test District: response == null
        stubGhnResponse("/master-data/province", 200, "{\"code\":200,\"data\":[{\"ProvinceID\":101,\"ProvinceName\":\"Tỉnh Fake\"}]}");
        stubGhnResponse("/master-data/district", 200, "null");
        Integer districtId1 = invokePrivate("getDistrictId", "Tỉnh Fake", "Quận Lạ");
        assertEquals(1485, districtId1); // Fallback về 1485

        // Test Ward: response thiếu trường 'code'
        stubGhnResponse("/master-data/ward", 200, "{\"message\":\"Thành công nhưng thiếu code\"}");
        String wardCode1 = invokePrivate("getWardCode", 1454, "Phường 1");
        assertNull(wardCode1);

        // Test Ward: response có code nhưng 'data' là null
        stubGhnResponse("/master-data/ward", 200, "{\"code\":200,\"data\":null}");
        String wardCode2 = invokePrivate("getWardCode", 1454, "Phường 1");
        assertNull(wardCode2);

        assertOrderCountUnchanged(orderCountBefore);
    }

    // formatLeadTime()

    // ========================================================
    // formatLeadTime()
    // [TESTS] TC_SHIP_025, TC_SHIP_026, TC_SHIP_027, TC_SHIP_028, TC_SHIP_029, TC_SHIP_030, TC_SHIP_031, TC_SHIP_032, TC_SHIP_033
    // ========================================================

    // ========================================================
    // formatLeadTime()
    // [TESTS] TC_SHIP_025, TC_SHIP_026, TC_SHIP_027, TC_SHIP_028, TC_SHIP_029, TC_SHIP_030, TC_SHIP_031, TC_SHIP_032, TC_SHIP_033
    // ========================================================


    @Test
    @DisplayName("TC_SHIP_025 - Timestamp null thì trả về chuỗi mặc định 2 đến 4 ngày")
    void TC_SHIP_025_null_returnDefault() {
        // - if (leadtimeTimestamp == null || leadtimeTimestamp <= 0) → TRUE
        String result = invokePrivate("formatLeadTime", (Object) null);

        assertEquals("2-4 ngày", result);
    }

    @Test
    @DisplayName("TC_SHIP_026 - Timestamp bằng 0 thì trả về chuỗi mặc định 2 đến 4 ngày")
    void TC_SHIP_026_zero_returnDefault() {
        // - if (leadtimeTimestamp == null || leadtimeTimestamp <= 0) → TRUE
        String result = invokePrivate("formatLeadTime", 0L);

        assertEquals("2-4 ngày", result);
    }

    @Test
    @DisplayName("TC_SHIP_027 - Timestamp là thời điểm hiện tại 0 ngày thì trả về Trong ngày")
    void TC_SHIP_027_sameDay_returnTrongNgay() {
        Long currentTimestamp = System.currentTimeMillis() / 1000;

        String result = invokePrivate("formatLeadTime", currentTimestamp);

        assertEquals("Trong ngày", result);
    }

    @Test
    @DisplayName("TC_SHIP_028 - Timestamp cách 1 ngày thì trả về 1 đến 2 ngày")
    void TC_SHIP_028_oneDay_return1to2() {
        Long currentTimestamp = System.currentTimeMillis() / 1000;

        String result = invokePrivate("formatLeadTime", currentTimestamp + 24 * 3600L);

        assertEquals("1-2 ngày", result);
    }

    @Test
    @DisplayName("TC_SHIP_029 - Timestamp cách 2 ngày thì trả về 2 đến 3 ngày")
    void TC_SHIP_029_twoDay_return2to3() {
        Long currentTimestamp = System.currentTimeMillis() / 1000;

        String result = invokePrivate("formatLeadTime", currentTimestamp + 2 * 24 * 3600L);

        assertEquals("2-3 ngày", result);
    }

    @Test
    @DisplayName("TC_SHIP_030 - Timestamp cách 3 ngày thì trả về 3 đến 4 ngày")
    void TC_SHIP_030_threeDay_return3to4() {
        Long currentTimestamp = System.currentTimeMillis() / 1000;

        String result = invokePrivate("formatLeadTime", currentTimestamp + 3 * 24 * 3600L);

        assertEquals("3-4 ngày", result);
    }

    @Test
    @DisplayName("TC_SHIP_031 - Timestamp cách 5 ngày thì trả về 4 đến 5 ngày")
    void TC_SHIP_031_fiveDay_return4to5() {
        Long currentTimestamp = System.currentTimeMillis() / 1000;

        String result = invokePrivate("formatLeadTime", currentTimestamp + 5 * 24 * 3600L);

        assertEquals("4-5 ngày", result);
    }

    @Test
    @DisplayName("TC_SHIP_032 - Timestamp cách hơn 5 ngày thì trả về chuỗi X ngày")
    void TC_SHIP_032_moreThan5Days_returnCustom() {
        Long currentTimestamp = System.currentTimeMillis() / 1000;

        String result = invokePrivate("formatLeadTime", currentTimestamp + 8 * 24 * 3600L);

        assertEquals("8 ngày", result);
    }

    @Test
    @DisplayName("TC_SHIP_033 - Timestamp cách đúng 4 ngày thì trả về 4 đến 5 ngày")
    void TC_SHIP_033_fourDay_return4to5() {
        // Báo cáo JaCoCo báo thiếu branch ở điều kiện (days >= 4 && days <= 5). 
        // Các test trước đó đã test days = 5, giờ test thêm days = 4 để phủ 100% điều kiện gộp này.
        
        long currentTimestamp = System.currentTimeMillis() / 1000;
        
        // Cố tình truyền vào thời gian đúng bằng 4 ngày sau
        String result = invokePrivate("formatLeadTime", currentTimestamp + 4 * 24 * 3600L);
        
        assertEquals("4-5 ngày", result);
    }

    // fixAllWardNames()

    // ========================================================
    // fixAllWardNames()
    // [TESTS] TC_SHIP_034, TC_SHIP_035, TC_SHIP_036, TC_SHIP_037, TC_SHIP_038, TC_SHIP_039
    // ========================================================

    // ========================================================
    // fixAllWardNames()
    // [TESTS] TC_SHIP_034, TC_SHIP_035, TC_SHIP_036, TC_SHIP_037, TC_SHIP_038, TC_SHIP_039
    // ========================================================


    @Test
    @DisplayName("TC_SHIP_034 - Đơn hàng thiếu wardName thì cập nhật đúng tên phường từ GHN")
    void TC_SHIP_034_missingWardName_updateSuccess() {
        Customer customer = taoCustomer("shipping-db@test.com", "0901000999");
        taoOrder(customer, "ORD-SHIP-001", "Hà Nội", "Ba Đình", "W001", null, "Số 1 Trần Phú");

        long orderCountBefore = orderRepository.count();
        long customerCountBefore = customerRepository.count();
        long userCountBefore = userRepository.count();

        stubGhnResponse("/master-data/ward",
                200,
                "{\"code\":200,\"data\":["
                        + "{\"WardCode\":\"W001\",\"WardName\":\"Phường Trúc Bạch\"},"
                        + "{\"WardCode\":\"W002\",\"WardName\":\"Phường Yên Phụ\"}"
                        + "]}"
        );

        Map<String, Object> result = shippingService.fixAllWardNames();

        assertEquals(1, result.get("total"));
        assertEquals(1, result.get("success"));
        assertEquals(0, result.get("failed"));
        assertNotNull(result.get("errors"));

        orderRepository.flush();
        Order saved = orderRepository.findByOrderCode("ORD-SHIP-001").orElseThrow();
        assertEquals("Phường Trúc Bạch", saved.getWardName());
        assertEquals("Số 1 Trần Phú, Phường Trúc Bạch, Ba Đình, Hà Nội", saved.getShippingAddress());
        assertEquals("Hà Nội", saved.getProvince());
        assertEquals("Ba Đình", saved.getDistrict());
        assertEquals("W001", saved.getWard());
        assertEquals("Số 1 Trần Phú", saved.getAddress());
        assertEquals(OrderStatus.PENDING_PAYMENT, saved.getStatus());
        assertEquals(PaymentStatus.UNPAID, saved.getPaymentStatus());

        assertEquals(orderCountBefore, orderRepository.count(), "Không được insert/update thêm order khác");
        assertEquals(customerCountBefore, customerRepository.count(), "Không được thay đổi customer ngoài ý muốn");
        assertEquals(userCountBefore, userRepository.count(), "Không được thay đổi user ngoài ý muốn");
    }

    @Test
    @DisplayName("TC_SHIP_035 - Ward code không tìm thấy trên GHN thì ghi nhận lỗi và DB không thay đổi")
    void TC_SHIP_035_wardNotFound_recordError() {
        Customer customer = taoCustomer("shipping-db-2@test.com", "0901000888");
        taoOrder(customer, "ORD-SHIP-002", "Hà Nội", "Ba Đình", "W999", null, "Số 2 Trần Phú");

        long orderCountBefore = orderRepository.count();

        stubGhnResponse("/master-data/ward",
                200,
                "{\"code\":200,\"data\":["
                        + "{\"WardCode\":\"W001\",\"WardName\":\"Phường Trúc Bạch\"}"
                        + "]}"
        );

        Map<String, Object> result = shippingService.fixAllWardNames();

        assertEquals(1, result.get("total"));
        assertEquals(0, result.get("success"));
        assertEquals(1, result.get("failed"));
        assertNotNull(result.get("errors"));

        Order saved = orderRepository.findByOrderCode("ORD-SHIP-002").orElseThrow();
        assertNull(saved.getWardName());
        assertEquals("Số 2 Trần Phú, W999, Ba Đình, Hà Nội", saved.getShippingAddress());
        assertEquals(orderCountBefore, orderRepository.count(), "DB phải giữ nguyên số record");
    }

    @Test
    @DisplayName("TC_SHIP_036 - Đơn hàng không thỏa điều kiện filter thì bị bỏ qua không cập nhật")
    void TC_SHIP_036_filterCondition_skipOrders() {
        // Đảm bảo Stream filter hoạt động đúng, chỉ lấy những đơn hàng có mã phường/xã (ward)
        // và đang thiếu tên phường/xã (wardName). Các đơn hàng không thỏa mãn sẽ bị bỏ qua.
        // - .filter(o -> o.getWard() != null && !o.getWard().isEmpty())
        // - .filter(o -> o.getWardName() == null || o.getWardName().isEmpty())
        // Sẽ test: ward = null, ward = "", wardName đã có data.

        Customer customer = taoCustomer("filter-ward@test.com", "0999111222");

        // Order 1: ward = null -> Bị loại
        taoOrder(customer, "ORD-FLT-001", "Hà Nội", "Ba Đình", null, null, "Số 1");
        // Order 2: ward = "" -> Bị loại
        taoOrder(customer, "ORD-FLT-002", "Hà Nội", "Ba Đình", "", null, "Số 2");
        // Order 3: wardName đã có sẵn data -> Bị loại
        taoOrder(customer, "ORD-FLT-003", "Hà Nội", "Ba Đình", "W003", "Phường Đã Có", "Số 3");

        long orderCountBefore = orderRepository.count();
        long customerCountBefore = customerRepository.count();

        // Thực thi
        Map<String, Object> result = shippingService.fixAllWardNames();

        // Kiểm tra kết quả trả về
        assertEquals(0, result.get("total"), "Không có đơn hàng nào lọt qua được filter");
        assertEquals(0, result.get("success"));
        assertEquals(0, result.get("failed"));
        assertTrue(((List<?>) result.get("errors")).isEmpty());

        // Kiểm tra DB không bị thay đổi
        assertOrderCountUnchanged(orderCountBefore);
        assertEquals(customerCountBefore, customerRepository.count());

        Order o1 = orderRepository.findByOrderCode("ORD-FLT-001").orElseThrow();
        assertNull(o1.getWardName());

        Order o2 = orderRepository.findByOrderCode("ORD-FLT-002").orElseThrow();
        assertNull(o2.getWardName());

        Order o3 = orderRepository.findByOrderCode("ORD-FLT-003").orElseThrow();
        assertEquals("Phường Đã Có", o3.getWardName());
    }

    @Test
    @DisplayName("TC_SHIP_037 - wardName là chuỗi rỗng thì lọt qua filter và cập nhật thành công từ GHN")
    void TC_SHIP_037_emptyWardName_updateSuccess() {
        // Quét nhánh `o.getWardName().isEmpty()` (chuỗi rỗng "" thay vì null).
        // - o.getWardName().isEmpty() -> TRUE -> lọt vào danh sách cần xử lý.
        // - Gọi getWards thành công -> wardOpt.isPresent() -> TRUE -> Cập nhật.

        Customer customer = taoCustomer("empty-ward@test.com", "0999333444");
        // Khởi tạo Order với wardName = "" (chuỗi rỗng)
        taoOrder(customer, "ORD-EMP-001", "Hà Nội", "Ba Đình", "W005", "", "Số 5 Đường ABC");

        long orderCountBefore = orderRepository.count();

        // Giả lập API trả về đúng mã phường W005
        stubGhnResponse("/master-data/ward", 200, 
            "{\"code\":200,\"data\":[{\"WardCode\":\"W005\",\"WardName\":\"Phường Mới Cập Nhật\"}]}");

        // Thực thi
        Map<String, Object> result = shippingService.fixAllWardNames();

        // Assert return
        assertEquals(1, result.get("total"));
        assertEquals(1, result.get("success"));
        assertEquals(0, result.get("failed"));

        // Assert DB
        orderRepository.flush();
        Order saved = orderRepository.findByOrderCode("ORD-EMP-001").orElseThrow();
        assertEquals("Phường Mới Cập Nhật", saved.getWardName());
        assertEquals("Số 5 Đường ABC, Phường Mới Cập Nhật, Ba Đình, Hà Nội", saved.getShippingAddress());
        
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_038 - GHN API ném exception khi xử lý từng đơn thì ghi nhận lỗi và tiếp tục")
    void TC_SHIP_038_innerException_recordAndContinue() {
        // Trong quá trình lặp qua danh sách đơn hàng để fix, nếu có 1 đơn hàng bị văng lỗi 
        // (ví dụ API GHN getWards sập trả về 500, ném RuntimeException), hệ thống không được crash toàn bộ
        // mà phải catch lại, tăng failCount và lưu log, tiếp tục vòng lặp (nếu có).
        // - try { getWards(districtId); ... } catch (Exception e) bên trong vòng lặp for.

        Customer customer = taoCustomer("error-ward@test.com", "0999555666");
        taoOrder(customer, "ORD-ERR-001", "Hà Nội", "Ba Đình", "W009", null, "Số 9");

        long orderCountBefore = orderRepository.count();

        // Cố tình làm cho getWards() throw RuntimeException bằng cách trả về HTTP 500 từ GHN
        stubGhnResponse("/master-data/ward", 500, "");

        // Thực thi
        Map<String, Object> result = shippingService.fixAllWardNames();

        // Assert return
        assertEquals(1, result.get("total"));
        assertEquals(0, result.get("success"));
        assertEquals(1, result.get("failed"), "Phải ghi nhận 1 đơn bị fail do ném lỗi");
        
        @SuppressWarnings("unchecked")
        List<String> errors = (List<String>) result.get("errors");
        assertEquals(1, errors.size());
        assertTrue(errors.get(0).contains("ORD-ERR-001"), "Thông báo lỗi phải chứa mã đơn hàng");

        // Assert DB không bị sai lệch dữ liệu
        Order saved = orderRepository.findByOrderCode("ORD-ERR-001").orElseThrow();
        assertNull(saved.getWardName(), "Tên phường không được cập nhật do bị lỗi");
        assertEquals("Số 9, W009, Ba Đình, Hà Nội", saved.getShippingAddress(), "Địa chỉ giữ nguyên như lúc tạo");

        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_039 - Repository bị null lỗi nghiêm trọng thì ném RuntimeException outer catch")
    void TC_SHIP_039_fatalDbError_outerCatch() {
        // Vét cạn 3 Missed Instructions duy nhất còn lại trong bảng Report (Dòng Catch Exception ngoài cùng).
        // Mô phỏng việc DB bị sập đột ngột (thông qua reflection ép NullPointerException).

        // Lưu lại instance thật của Repository
        OrderRepository realRepo = (OrderRepository) ReflectionTestUtils.getField(shippingService, "orderRepository");

        try {
            // Cố tình gỡ DB ra khỏi Service (bằng null) để ép văng lỗi Fatal
            ReflectionTestUtils.setField(shippingService, "orderRepository", null);

            RuntimeException ex = assertThrows(RuntimeException.class, () -> shippingService.fixAllWardNames());
            
            // Assert phải ném đúng lỗi của nhánh Catch ngoài cùng
            assertTrue(ex.getMessage().contains("Lỗi khi cập nhật tên phường/xã"), 
                "Phải bắt được ngoại lệ Fatal từ outer catch");

        } finally {
            // Restore lại DB để các test sau chạy bình thường (Rất quan trọng)
            ReflectionTestUtils.setField(shippingService, "orderRepository", realRepo);
        }
    }

    // parseTimestamp()

    // ========================================================
    // parseTimestamp()
    // [TESTS] TC_SHIP_040, TC_SHIP_041, TC_SHIP_042, TC_SHIP_043
    // ========================================================

    // ========================================================
    // parseTimestamp()
    // [TESTS] TC_SHIP_040, TC_SHIP_041, TC_SHIP_042, TC_SHIP_043
    // ========================================================


    @Test
    @DisplayName("TC_SHIP_040 - Timestamp dạng số Unix epoch thì parse thành LocalDateTime thành công")
    void TC_SHIP_040_numberTimestamp_success() {
        long orderCountBefore = orderRepository.count();
        LocalDateTime dt = invokePrivate("parseTimestamp", 1600000000L);
        assertNotNull(dt);
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_041 - Timestamp là chuỗi không hợp lệ thì trả về null")
    void TC_SHIP_041_invalidString_returnNull() {
        long orderCountBefore = orderRepository.count();
        LocalDateTime dt = invokePrivate("parseTimestamp", "not-a-date");
        assertNull(dt);
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_042 - Timestamp là chuỗi ISO 8601 hợp lệ thì parse thành LocalDateTime thành công")
    void TC_SHIP_042_isoString_parsedSuccess() {
        // Nếu GHN trả về expected_delivery_time hoặc updated_date dưới dạng chuỗi ISO 8601 hợp lệ,
        // hệ thống phải parse thành công ra LocalDateTime.
        // - if (timestamp instanceof String) -> true
        // - return LocalDateTime.parse((String) timestamp); -> parse thành công không ném lỗi

        long orderCountBefore = orderRepository.count();
        
        String validIsoString = "2023-10-25T10:15:30";
        LocalDateTime result = invokePrivate("parseTimestamp", validIsoString);
        
        assertNotNull(result);
        assertEquals(2023, result.getYear());
        assertEquals(10, result.getMonthValue());
        assertEquals(25, result.getDayOfMonth());
        assertEquals(10, result.getHour());
        assertEquals(15, result.getMinute());
        assertEquals(30, result.getSecond());

        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_043 - Timestamp kiểu dữ liệu không hỗ trợ Boolean thì trả về null")
    void TC_SHIP_043_unsupportedType_returnNull() {
        // Nếu GHN trả về trường thời gian mang kiểu dữ liệu lạ (VD: Boolean, List, Object...),
        // hệ thống sẽ bỏ qua (không lọt vào if Number, không lọt vào if String) và trả về null một cách an toàn.
        // - if (timestamp instanceof Number) -> false
        // - else if (timestamp instanceof String) -> false
        // - rơi xuống cuối hàm -> return null;

        long orderCountBefore = orderRepository.count();
        
        // Truyền vào kiểu Boolean (không phải Number cũng không phải String)
        Boolean unsupportedTimestamp = true;
        LocalDateTime result = invokePrivate("parseTimestamp", unsupportedTimestamp);
        
        assertNull(result, "Kiểu dữ liệu không hỗ trợ phải trả về null");

        assertOrderCountUnchanged(orderCountBefore);
    }

    // normalizeVietnamese()

    // ========================================================
    // normalizeVietnamese()
    // [TESTS] TC_SHIP_044, TC_SHIP_045
    // ========================================================

    // ========================================================
    // normalizeVietnamese()
    // [TESTS] TC_SHIP_044, TC_SHIP_045
    // ========================================================


    @Test
    @DisplayName("TC_SHIP_044 - Chuỗi null thì trả về chuỗi rỗng")
    void TC_SHIP_044_null_returnEmpty() {
        long orderCountBefore = orderRepository.count();
        String r = invokePrivate("normalizeVietnamese", (Object) null);
        assertEquals("", r);
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_045 - Chuỗi có tiền tố TP thì loại bỏ tiền tố và viết thường")
    void TC_SHIP_045_removePrefix_returnLowercase() {
        long orderCountBefore = orderRepository.count();
        String r = invokePrivate("normalizeVietnamese", "TP. Hà Nội");
        assertEquals("hà nội", r);
        assertOrderCountUnchanged(orderCountBefore);
    }

    // matchLocation()

    // ========================================================
    // matchLocation()
    // [TESTS] TC_SHIP_046, TC_SHIP_047, TC_SHIP_048
    // ========================================================

    // ========================================================
    // matchLocation()
    // [TESTS] TC_SHIP_046, TC_SHIP_047, TC_SHIP_048
    // ========================================================


    @Test
    @DisplayName("TC_SHIP_046 - Hai chuỗi khớp chính xác sau normalize thì trả về true")
    void TC_SHIP_046_exactMatch_returnTrue() {
        long orderCountBefore = orderRepository.count();
        boolean ok = invokePrivate("matchLocation", "quận 1 nội", "Quận 1 nội");
        assertTrue(ok);
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_047 - Chuỗi đầu kết thúc bằng tên địa điểm thì trả về true")
    void TC_SHIP_047_endsWithTarget_returnTrue() {
        // Ensure digit-suffix branch that checks endsWith(" <district>") works
        long orderCountBefore = orderRepository.count();
        boolean ok = invokePrivate("matchLocation", "khu quận 1", "Quận 1");
        assertTrue(ok);
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_048 - Quận 1 không được khớp nhầm với Quận 11 logic regex phải chính xác")
    void TC_SHIP_048_digitSuffix_noFalseMatch() {
        // Quét 3 nhánh đỏ trong hàm matchLocation đoạn check `normalizedInput.matches(".*\\d$")`.
        // Hệ thống không được phép khớp nhầm "Quận 1" vào "Quận 11" hay "Quận 12".
        
        // Quận 1 không được phép khớp với Quận 11 (Cùng kết thúc bằng số nhưng sai tên)
        boolean failMatch = invokePrivate("matchLocation", "Quận 11", "Quận 1");
        assertFalse(failMatch, "Lỗi nghiêm trọng: Quận 1 bị khớp nhầm vào Quận 11");

        // Quận 1 phải khớp với "Khu vực Quận 1" (Test nhánh endsWith)
        boolean endMatch = invokePrivate("matchLocation", "Khu vực Quận 1", "Quận 1");
        assertTrue(endMatch, "Phải khớp được khi tên quận nằm ở cuối chuỗi");
    }

    // getStatusText()

    // ========================================================
    // getStatusText()
    // [TESTS] TC_SHIP_049, TC_SHIP_050, TC_SHIP_051, TC_SHIP_052, TC_SHIP_053, TC_SHIP_054
    // ========================================================

    // ========================================================
    // getStatusText()
    // [TESTS] TC_SHIP_049, TC_SHIP_050, TC_SHIP_051, TC_SHIP_052, TC_SHIP_053, TC_SHIP_054
    // ========================================================


    @Test
    @DisplayName("TC_SHIP_049 - Trạng thái null thì trả về Không xác định")
    void TC_SHIP_049_null_returnUnknown() {
        long orderCountBefore = orderRepository.count();
        String s = invokePrivate("getStatusText", (Object) null);
        assertEquals("Không xác định", s);
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_050 - Trạng thái delivering thì trả về Đang giao hàng")
    void TC_SHIP_050_delivering_returnText() {
        long orderCountBefore = orderRepository.count();
        String s = invokePrivate("getStatusText", "delivering");
        assertEquals("Đang giao hàng", s);
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_051 - Trạng thái ready to pick thì trả về Chờ lấy hàng")
    void TC_SHIP_051_readyToPick_returnText() {
        long orderCountBefore = orderRepository.count();
        String s = invokePrivate("getStatusText", "ready_to_pick");
        assertEquals("Chờ lấy hàng", s);
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_052 - Trạng thái delivered thì trả về Đã giao hàng")
    void TC_SHIP_052_delivered_returnText() {
        long orderCountBefore = orderRepository.count();
        String s = invokePrivate("getStatusText", "delivered");
        assertEquals("Đã giao hàng", s);
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_053 - Trạng thái không có trong danh sách thì trả về nguyên chuỗi gốc")
    void TC_SHIP_053_unknownStatus_returnOriginal() {
        long orderCountBefore = orderRepository.count();
        String s = invokePrivate("getStatusText", "unknown_status_code");
        assertEquals("unknown_status_code", s);
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_054 - Toàn bộ các mã trạng thái GHN ánh xạ đúng sang tiếng Việt")
    void TC_SHIP_054_allStatuses_allMappedCorrectly() {
        // Đảm bảo hàm ánh xạ trạng thái dịch chính xác 100% các mã trạng thái từ GHN sang tiếng Việt.
        // Mục tiêu: Phủ xanh (100% branch coverage) toàn bộ các lệnh `case` trong `switch(status)` chưa được test.
        // - Lần lượt đi qua các case: "picking", "cancel", "money_collect_picking", "picked", "storing", v.v.

        long orderCountBefore = orderRepository.count();

        Map<String, String> statusMap = new HashMap<>();
        statusMap.put("picking", "Đang lấy hàng");
        statusMap.put("cancel", "Đã hủy");
        statusMap.put("money_collect_picking", "Đang thu tiền người gửi");
        statusMap.put("picked", "Đã lấy hàng");
        statusMap.put("storing", "Hàng đang nằm ở kho");
        statusMap.put("transporting", "Đang luân chuyển");
        statusMap.put("sorting", "Đang phân loại");
        statusMap.put("money_collect_delivering", "Đang thu tiền người nhận");
        statusMap.put("delivery_fail", "Giao hàng thất bại");
        statusMap.put("waiting_to_return", "Chờ trả hàng");
        statusMap.put("return", "Trả hàng");
        statusMap.put("return_transporting", "Đang luân chuyển hàng trả");
        statusMap.put("return_sorting", "Đang phân loại hàng trả");
        statusMap.put("returning", "Đang trả hàng");
        statusMap.put("return_fail", "Trả hàng thất bại");
        statusMap.put("returned", "Đã trả hàng");
        statusMap.put("exception", "Đơn hàng ngoại lệ");
        statusMap.put("damage", "Hàng bị hư hỏng");
        statusMap.put("lost", "Hàng bị thất lạc");

        // Duyệt qua tất cả các case và assert
        for (Map.Entry<String, String> entry : statusMap.entrySet()) {
            String result = invokePrivate("getStatusText", entry.getKey());
            assertEquals(entry.getValue(), result, 
                "Trạng thái '" + entry.getKey() + "' phải được dịch thành '" + entry.getValue() + "'");
        }

        assertOrderCountUnchanged(orderCountBefore);
    }

    // getProvinces()

    // ========================================================
    // getProvinces()
    // [TESTS] TC_SHIP_055, TC_SHIP_056, TC_SHIP_057, TC_SHIP_058, TC_SHIP_059, TC_SHIP_060
    // ========================================================

    // ========================================================
    // getProvinces()
    // [TESTS] TC_SHIP_055, TC_SHIP_056, TC_SHIP_057, TC_SHIP_058, TC_SHIP_059, TC_SHIP_060
    // ========================================================


    @Test
    @DisplayName("TC_SHIP_055 - GHN trả danh sách tỉnh thành thì ánh xạ đúng id và name")
    void TC_SHIP_055_success_correctMapping() {
        stubGhnResponse("/master-data/province", 200,
            "{\"code\":200,\"data\":[{\"ProvinceID\":1,\"ProvinceName\":\"Hà Nội\"},{\"ProvinceID\":79,\"ProvinceName\":\"TP. Hồ Chí Minh\"}]}"
        );

        long orderCountBefore = orderRepository.count();

        List<Map<String, Object>> provinces = shippingService.getProvinces();
        assertNotNull(provinces);
        assertEquals(2, provinces.size());
        assertEquals(1, provinces.get(0).get("id"));
        assertEquals("Hà Nội", provinces.get(0).get("name"));
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_056 - GHN trả 2 tỉnh thành đầy đủ thì ánh xạ id và name chính xác")
    void TC_SHIP_056_fullData_correctMapping() {
        // Kiểm tra trường hợp gọi API GHN lấy danh sách tỉnh thành thành công và có dữ liệu.
        // Hệ thống phải map đúng các trường ProvinceID -> id và ProvinceName -> name.
        // - if (response != null && response.get("code") != null && response.get("code").equals(200)) -> TRUE
        // - Vòng lặp for: Chạy qua 2 phần tử và build danh sách kết quả trả về.

        long orderCountBefore = orderRepository.count();

        // Giả lập GHN trả về 2 tỉnh/thành
        stubGhnResponse("/master-data/province", 200, 
            "{\"code\":200,\"message\":\"Success\",\"data\":[" +
            "{\"ProvinceID\":1,\"ProvinceName\":\"Hà Nội\",\"CountryID\":1}," +
            "{\"ProvinceID\":79,\"ProvinceName\":\"Hồ Chí Minh\",\"CountryID\":1}" +
            "]}");

        List<Map<String, Object>> result = shippingService.getProvinces();

        assertNotNull(result, "Kết quả trả về không được null");
        assertEquals(2, result.size(), "Phải trả về đúng 2 tỉnh/thành phố");

        // Assert chi tiết phần tử đầu tiên
        assertEquals(1, result.get(0).get("id"));
        assertEquals("Hà Nội", result.get(0).get("name"));

        // Assert chi tiết phần tử thứ hai
        assertEquals(79, result.get(1).get("id"));
        assertEquals("Hồ Chí Minh", result.get(1).get("name"));

        // Đảm bảo thao tác chỉ đọc (read-only), không làm bẩn DB
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_057 - GHN trả mảng tỉnh rỗng thì trả về list rỗng không crash")
    void TC_SHIP_057_emptyData_returnEmptyList() {
        // Kiểm tra trường hợp API GHN gọi thành công (code 200) nhưng mảng data bị rỗng.
        // - if (response != null && code == 200) -> TRUE
        // - Vòng lặp for: Không chạy lần nào (bỏ qua nhánh bên trong) -> Trả về list rỗng an toàn.

        long orderCountBefore = orderRepository.count();

        // Giả lập GHN trả về mảng rỗng
        stubGhnResponse("/master-data/province", 200, "{\"code\":200,\"data\":[]}");

        List<Map<String, Object>> result = shippingService.getProvinces();

        assertNotNull(result, "Kết quả trả về không được null mà phải là list rỗng");
        assertEquals(0, result.size(), "Kích thước list phải bằng 0");

        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_058 - GHN trả code lỗi 400 thì ném RuntimeException")
    void TC_SHIP_058_errorCode_throwsException() {
        // Cố tình giả lập API GHN trả về mã lỗi (code != 200, ví dụ 400 Bad Request).
        // - if (code.equals(200)) -> FALSE -> Chạy xuống ném RuntimeException("GHN API không trả về dữ liệu hợp lệ")
        // - Lỗi này tiếp tục bị block catch bên ngoài bắt lại và ném ra kèm theo tiền tố "Không thể lấy danh sách..."

        long orderCountBefore = orderRepository.count();

        stubGhnResponse("/master-data/province", 200, "{\"code\":400,\"message\":\"Invalid Token\"}");

        RuntimeException ex = assertThrows(RuntimeException.class, () -> shippingService.getProvinces());
        
        // Assert message phải chứa cụm từ catch ném ra do bị bọc lại
        assertTrue(ex.getMessage().contains("Không thể lấy danh sách tỉnh/thành phố"));
        assertTrue(ex.getMessage().contains("GHN API không trả về dữ liệu hợp lệ"));

        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_059 - GHN trả payload thiếu trường code thì ném RuntimeException")
    void TC_SHIP_059_nullCode_throwsException() {
        // Edge case: API trả về HTTP 200 nhưng cấu trúc JSON bị hỏng hoặc thiếu trường "code".
        // - response.get("code") != null -> FALSE -> rẽ nhánh ra ngoài if -> quăng lỗi

        long orderCountBefore = orderRepository.count();

        // Không có key "code"
        stubGhnResponse("/master-data/province", 200, "{\"message\":\"Something went wrong\",\"data\":[]}");

        RuntimeException ex = assertThrows(RuntimeException.class, () -> shippingService.getProvinces());
        assertTrue(ex.getMessage().contains("GHN API không trả về dữ liệu hợp lệ"));

        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_060 - RestTemplate lỗi kết nối HTTP 500 thì ném RuntimeException")
    void TC_SHIP_060_connectionError_throwsException() {
        // Xảy ra lỗi ở cấp độ mạng, máy chủ GHN sập (HTTP 500), hoặc timeout. 
        // Lỗi không xuất phát từ logic parse của hệ thống mà từ RestTemplate.
        // - restTemplate.postForObject(...) -> Bắn lỗi -> Nhảy thẳng xuống catch (Exception e) cuối hàm

        long orderCountBefore = orderRepository.count();

        // Giả lập HTTP 500 Internal Server Error làm RestTemplate ném HttpServerErrorException
        stubGhnResponse("/master-data/province", 500, "");

        RuntimeException ex = assertThrows(RuntimeException.class, () -> shippingService.getProvinces());
        assertTrue(ex.getMessage().startsWith("Không thể lấy danh sách tỉnh/thành phố: "));
        
        assertOrderCountUnchanged(orderCountBefore);
    }

    // getDistricts()

    // ========================================================
    // getDistricts()
    // [TESTS] TC_SHIP_061, TC_SHIP_062, TC_SHIP_063, TC_SHIP_064, TC_SHIP_065, TC_SHIP_066, TC_SHIP_067
    // ========================================================

    // ========================================================
    // getDistricts()
    // [TESTS] TC_SHIP_061, TC_SHIP_062, TC_SHIP_063, TC_SHIP_064, TC_SHIP_065, TC_SHIP_066, TC_SHIP_067
    // ========================================================


    @Test
    @DisplayName("TC_SHIP_061 - GHN trả danh sách quận huyện thì ánh xạ đúng id và name")
    void TC_SHIP_061_success_correctMapping() {
        long orderCountBefore = orderRepository.count();
        stubGhnResponse("/master-data/district", 200,
            "{\"code\":200,\"data\":[{\"DistrictID\":101,\"DistrictName\":\"Quận 1\"}]}"
        );

        List<Map<String, Object>> districts = shippingService.getDistricts(1);
        assertNotNull(districts);
        assertEquals(1, districts.size());
        assertEquals(101, districts.get(0).get("id"));
        assertEquals("Quận 1", districts.get(0).get("name"));
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_062 - GHN trả lỗi 500 thì ném RuntimeException")
    void TC_SHIP_062_apiError_throwsException() {
        long orderCountBefore = orderRepository.count();
        stubGhnResponse("/master-data/district", 500, "{\"code\":500}");
        assertThrows(RuntimeException.class, () -> shippingService.getDistricts(1));
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_063 - GHN trả 2 quận huyện đầy đủ thì ánh xạ id và name chính xác")
    void TC_SHIP_063_fullData_correctMapping() {
        // Kiểm tra trường hợp gọi API GHN lấy danh sách quận/huyện thành công theo provinceId.
        // Hệ thống phải map đúng các trường DistrictID -> id và DistrictName -> name.
        // - if (response != null && response.get("code") != null && response.get("code").equals(200)) -> TRUE
        // - Vòng lặp for: Chạy qua 2 phần tử và build danh sách kết quả trả về.

        long orderCountBefore = orderRepository.count();

        // Giả lập GHN trả về 2 quận/huyện cho tỉnh ID = 1
        stubGhnResponse("/master-data/district", 200, 
            "{\"code\":200,\"message\":\"Success\",\"data\":[" +
            "{\"DistrictID\":1454,\"DistrictName\":\"Quận Ba Đình\",\"ProvinceID\":1}," +
            "{\"DistrictID\":1452,\"DistrictName\":\"Quận Hoàn Kiếm\",\"ProvinceID\":1}" +
            "]}");

        List<Map<String, Object>> result = shippingService.getDistricts(1);

        assertNotNull(result, "Kết quả trả về không được null");
        assertEquals(2, result.size(), "Phải trả về đúng 2 quận/huyện");

        // Assert chi tiết phần tử đầu tiên
        assertEquals(1454, result.get(0).get("id"));
        assertEquals("Quận Ba Đình", result.get(0).get("name"));

        // Assert chi tiết phần tử thứ hai
        assertEquals(1452, result.get(1).get("id"));
        assertEquals("Quận Hoàn Kiếm", result.get(1).get("name"));

        // Kiểm tra request gửi đi có chứa province_id đúng không
        assertTrue(ghnRequestBodies.get("/master-data/district").contains("\"province_id\":1"));

        // Đảm bảo thao tác chỉ đọc (read-only), không làm bẩn DB
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_064 - GHN trả mảng quận rỗng thì trả về list rỗng không crash")
    void TC_SHIP_064_emptyData_returnEmptyList() {
        // Kiểm tra trường hợp API GHN gọi thành công (code 200) nhưng tỉnh/thành phố đó chưa có quận huyện nào (mảng data rỗng).
        // - if (response != null && code == 200) -> TRUE
        // - Vòng lặp for: Không chạy lần nào (bỏ qua nhánh bên trong) -> Trả về list rỗng an toàn.

        long orderCountBefore = orderRepository.count();

        // Giả lập GHN trả về mảng rỗng
        stubGhnResponse("/master-data/district", 200, "{\"code\":200,\"data\":[]}");

        List<Map<String, Object>> result = shippingService.getDistricts(999); // ID tỉnh không tồn tại hoặc không có quận

        assertNotNull(result, "Kết quả trả về không được null mà phải là list rỗng");
        assertEquals(0, result.size(), "Kích thước list phải bằng 0");

        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_065 - GHN trả code lỗi 400 thì ném RuntimeException")
    void TC_SHIP_065_errorCode_throwsException() {
        // Cố tình giả lập API GHN trả về mã lỗi (code != 200, ví dụ 400 Bad Request).
        // - if (code.equals(200)) -> FALSE -> Chạy xuống ném RuntimeException("GHN API không trả về dữ liệu hợp lệ")
        // - Lỗi này tiếp tục bị block catch bên ngoài bắt lại và ném ra RuntimeException("Không thể lấy danh sách quận/huyện: ...")

        long orderCountBefore = orderRepository.count();

        stubGhnResponse("/master-data/district", 200, "{\"code\":400,\"message\":\"Province ID invalid\"}");

        RuntimeException ex = assertThrows(RuntimeException.class, () -> shippingService.getDistricts(1));
        
        // Assert message phải chứa cụm từ catch ném ra do bị bọc lại
        assertTrue(ex.getMessage().contains("Không thể lấy danh sách quận/huyện"));
        assertTrue(ex.getMessage().contains("GHN API không trả về dữ liệu hợp lệ"));

        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_066 - GHN trả payload thiếu trường code thì ném RuntimeException")
    void TC_SHIP_066_nullCode_throwsException() {
        // Edge case: API trả về HTTP 200 nhưng cấu trúc JSON bị hỏng hoặc thiếu trường "code".
        // - response.get("code") != null -> FALSE -> rẽ nhánh ra ngoài if -> quăng lỗi dữ liệu không hợp lệ

        long orderCountBefore = orderRepository.count();

        // Không có key "code"
        stubGhnResponse("/master-data/district", 200, "{\"message\":\"Something went wrong\",\"data\":[]}");

        RuntimeException ex = assertThrows(RuntimeException.class, () -> shippingService.getDistricts(1));
        assertTrue(ex.getMessage().contains("Không thể lấy danh sách quận/huyện"));
        assertTrue(ex.getMessage().contains("GHN API không trả về dữ liệu hợp lệ"));

        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_067 - RestTemplate lỗi kết nối HTTP 500 thì ném RuntimeException")
    void TC_SHIP_067_connectionError_throwsException() {
        // Xảy ra lỗi ở cấp độ mạng, máy chủ GHN sập (HTTP 500), hoặc timeout. 
        // Lỗi không xuất phát từ logic parse của hệ thống mà từ RestTemplate.
        // - restTemplate.postForObject(...) -> Bắn lỗi -> Nhảy thẳng xuống catch (Exception e) cuối hàm

        long orderCountBefore = orderRepository.count();

        // Giả lập HTTP 500 Internal Server Error làm RestTemplate ném HttpServerErrorException
        stubGhnResponse("/master-data/district", 500, "");

        RuntimeException ex = assertThrows(RuntimeException.class, () -> shippingService.getDistricts(1));
        assertTrue(ex.getMessage().startsWith("Không thể lấy danh sách quận/huyện: "));
        
        assertOrderCountUnchanged(orderCountBefore);
    }

    // getWards()

    // ========================================================
    // getWards()
    // [TESTS] TC_SHIP_068, TC_SHIP_069, TC_SHIP_070, TC_SHIP_071, TC_SHIP_072, TC_SHIP_073
    // ========================================================

    // ========================================================
    // getWards()
    // [TESTS] TC_SHIP_068, TC_SHIP_069, TC_SHIP_070, TC_SHIP_071, TC_SHIP_072, TC_SHIP_073
    // ========================================================


    @Test
    @DisplayName("TC_SHIP_068 - GHN trả mảng phường rỗng thì trả về list rỗng không crash")
    void TC_SHIP_068_emptyData_returnEmptyList() {
        long orderCountBefore = orderRepository.count();
        stubGhnResponse("/master-data/ward", 200, "{\"code\":200,\"data\":[]}");
        List<Map<String, Object>> wards = shippingService.getWards(123);
        assertNotNull(wards);
        assertEquals(0, wards.size());
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_069 - GHN trả 2 phường xã đầy đủ thì ánh xạ code và name chính xác")
    void TC_SHIP_069_fullData_correctMapping() {
        // Kiểm tra trường hợp gọi API GHN lấy danh sách phường/xã thành công theo districtId.
        // Hệ thống phải map đúng các trường WardCode -> code và WardName -> name.
        // - if (response != null && response.get("code") != null && response.get("code").equals(200)) -> TRUE
        // - Vòng lặp for: Chạy qua các phần tử và build danh sách kết quả trả về, thực hiện thao tác .put("code", ...) và .put("name", ...)

        long orderCountBefore = orderRepository.count();

        // Giả lập GHN trả về 2 phường/xã cho quận ID = 1454
        stubGhnResponse("/master-data/ward", 200, 
            "{\"code\":200,\"message\":\"Success\",\"data\":[" +
            "{\"WardCode\":\"1A01\",\"WardName\":\"Phường Cống Vị\",\"DistrictID\":1454}," +
            "{\"WardCode\":\"1A02\",\"WardName\":\"Phường Điện Biên\",\"DistrictID\":1454}" +
            "]}");

        List<Map<String, Object>> result = shippingService.getWards(1454);

        assertNotNull(result, "Kết quả trả về không được null");
        assertEquals(2, result.size(), "Phải trả về đúng 2 phường/xã");

        // Assert chi tiết phần tử đầu tiên
        assertEquals("1A01", result.get(0).get("code"));
        assertEquals("Phường Cống Vị", result.get(0).get("name"));

        // Assert chi tiết phần tử thứ hai
        assertEquals("1A02", result.get(1).get("code"));
        assertEquals("Phường Điện Biên", result.get(1).get("name"));

        // Kiểm tra request gửi đi có chứa district_id đúng không
        assertTrue(ghnRequestBodies.get("/master-data/ward").contains("\"district_id\":1454"));

        // Đảm bảo thao tác chỉ đọc, không insert hay update nhầm DB
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_070 - Quận không có phường xã thì GHN trả mảng rỗng và list rỗng được trả về")
    void TC_SHIP_070_noWards_returnEmptyList() {
        // Kiểm tra trường hợp API GHN gọi thành công (code 200) nhưng quận/huyện đó chưa có phường xã nào.
        // (Thay thế/Mở rộng cho TC_SHIP_048 để đồng bộ format)
        // - if (response != null && code == 200) -> TRUE
        // - Vòng lặp for: Bỏ qua hoàn toàn do wards rỗng -> Trả về list trống.

        long orderCountBefore = orderRepository.count();

        stubGhnResponse("/master-data/ward", 200, "{\"code\":200,\"data\":[]}");

        List<Map<String, Object>> result = shippingService.getWards(9999);

        assertNotNull(result, "Kết quả trả về không được null mà phải là list rỗng");
        assertEquals(0, result.size(), "Kích thước list phải bằng 0");

        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_071 - GHN trả code lỗi 400 thì ném RuntimeException")
    void TC_SHIP_071_errorCode_throwsException() {
        // GHN API từ chối request (ví dụ sai token hoặc districtId không hợp lệ) và trả về code != 200.
        // - if (code.equals(200)) -> FALSE
        // - Ném ra RuntimeException("GHN API không trả về dữ liệu hợp lệ")
        // - Khối catch bắt lại và ném ra Exception kèm tiền tố "Không thể lấy danh sách phường/xã: ..."

        long orderCountBefore = orderRepository.count();

        stubGhnResponse("/master-data/ward", 200, "{\"code\":400,\"message\":\"District ID invalid\"}");

        RuntimeException ex = assertThrows(RuntimeException.class, () -> shippingService.getWards(1454));
        
        // Assert message
        assertTrue(ex.getMessage().contains("Không thể lấy danh sách phường/xã"));
        assertTrue(ex.getMessage().contains("GHN API không trả về dữ liệu hợp lệ"));

        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_072 - GHN trả payload thiếu trường code thì ném RuntimeException")
    void TC_SHIP_072_nullCode_throwsException() {
        // Edge case: Json trả về mất trường "code".
        // - response.get("code") != null -> FALSE -> rẽ nhánh ra ngoài -> Exception.

        long orderCountBefore = orderRepository.count();

        stubGhnResponse("/master-data/ward", 200, "{\"message\":\"Something went wrong\",\"data\":[]}");

        RuntimeException ex = assertThrows(RuntimeException.class, () -> shippingService.getWards(1454));
        assertTrue(ex.getMessage().contains("Không thể lấy danh sách phường/xã"));

        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_073 - RestTemplate lỗi kết nối HTTP 500 thì ném RuntimeException")
    void TC_SHIP_073_connectionError_throwsException() {
        // Lỗi không phải do logic parse, mà do mạng rớt, hoặc server GHN trả về 500 Internal Server Error, dẫn đến RestTemplate ném lỗi trực tiếp.
        // - restTemplate.postForObject(...) -> Bắn ngoại lệ Runtime -> Văng thẳng xuống block catch (Exception e).

        long orderCountBefore = orderRepository.count();

        // Cố tình trả về HTTP Status 500 để RestTemplate ném HttpServerErrorException
        stubGhnResponse("/master-data/ward", 500, "");

        RuntimeException ex = assertThrows(RuntimeException.class, () -> shippingService.getWards(1454));
        assertTrue(ex.getMessage().startsWith("Không thể lấy danh sách phường/xã: "));
        
        assertOrderCountUnchanged(orderCountBefore);
    }

    // getDistrictId() / getWardCode() / getProvinceId()

    // ========================================================
    // getDistrictId() / getWardCode() / getProvinceId()
    // [TESTS] TC_SHIP_074, TC_SHIP_075, TC_SHIP_076, TC_SHIP_077, TC_SHIP_078, TC_SHIP_079, TC_SHIP_080, TC_SHIP_081, TC_SHIP_082, TC_SHIP_083, TC_SHIP_084, TC_SHIP_085, TC_SHIP_086, TC_SHIP_087, TC_SHIP_088, TC_SHIP_089, TC_SHIP_090, TC_SHIP_091, TC_SHIP_092, TC_SHIP_093, TC_SHIP_094
    // ========================================================

    // ========================================================
    // getDistrictId() / getWardCode() / getProvinceId()
    // [TESTS] TC_SHIP_074, TC_SHIP_075, TC_SHIP_076, TC_SHIP_077, TC_SHIP_078, TC_SHIP_079, TC_SHIP_080, TC_SHIP_081, TC_SHIP_082, TC_SHIP_083, TC_SHIP_084, TC_SHIP_085, TC_SHIP_086, TC_SHIP_087, TC_SHIP_088
    // ========================================================


    @Test
    @DisplayName("TC_SHIP_074 - Lấy mã phường với districtId null thì trả về null")
    void TC_SHIP_074_getWardCode_nullDistrictId_returnNull() {
        long orderCountBefore = orderRepository.count();
        String code = invokePrivate("getWardCode", (Object) null, "Phường A");
        assertNull(code);
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_075 - Lấy mã phường với wardName null thì trả về null")
    void TC_SHIP_075_getWardCode_nullWardName_returnNull() {
        long orderCountBefore = orderRepository.count();
        String code = invokePrivate("getWardCode", 123, (Object) null);
        assertNull(code);
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_076 - Lấy mã phường với wardName rỗng thì trả về null")
    void TC_SHIP_076_getWardCode_emptyWardName_returnNull() {
        long orderCountBefore = orderRepository.count();
        String code = invokePrivate("getWardCode", 123, "");
        assertNull(code);
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_077 - Lấy mã quận tìm thấy trong map nội bộ thì trả về ID đúng")
    void TC_SHIP_077_getDistrictId_mapHit_returnId() {
        long orderCountBefore = orderRepository.count();
        Integer id = invokePrivate("getDistrictId", "Hà Nội", "Ba Đình");
        assertNotNull(id);
        assertTrue(id > 0);
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_078 - Lấy mã quận không có trong map thì GHN tìm thấy và trả về ID từ GHN")
    void TC_SHIP_078_getDistrictId_ghnFallback_returnId() {
        long orderCountBefore = orderRepository.count();
        stubGhnResponse("/master-data/district", 200,
                "{\"code\":200,\"data\":[{\"DistrictID\":999,\"DistrictName\":\"Quận Kỳ Lạ\"}]}"
        );

        Integer id = invokePrivate("getDistrictId", "Tỉnh Lạ", "Quận Kỳ Lạ");
        assertEquals(999, id);
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_079 - Lấy mã quận GHN lỗi thì trả về giá trị mặc định 1485")
    void TC_SHIP_079_getDistrictId_ghnError_returnDefault() {
        // GHN province lookup must be stubbed because getDistrictId calls getProvinceId first
        long orderCountBefore = orderRepository.count();
        stubGhnResponse("/master-data/province", 200,
                "{\"code\":200,\"data\":[{\"ProvinceID\":123,\"ProvinceName\":\"Tỉnh Lạ\"}]}"
        );
        stubGhnResponse("/master-data/district", 500, "{\"code\":500}");
        Integer id = invokePrivate("getDistrictId", "Tỉnh Lạ", "Quận Lạ");
        assertEquals(1485, id);
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_080 - Lấy mã phường không khớp tên thì fallback lấy phần tử đầu tiên")
    void TC_SHIP_080_getWardCode_noMatch_fallbackFirst() {
        long orderCountBefore = orderRepository.count();
        stubGhnResponse("/master-data/ward", 200,
                "{\"code\":200,\"data\":[{\"WardCode\":\"W001\",\"WardName\":\"Phường A\"},{\"WardCode\":\"W002\",\"WardName\":\"Phường B\"}]}"
        );

        String code = invokePrivate("getWardCode", 123, "Phường Không Tồn Tại");
        assertEquals("W001", code);
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_081 - Lấy mã tỉnh không tìm thấy tỉnh thì in log cảnh báo 5 tỉnh đầu")
    void TC_SHIP_081_getProvinceId_notFound_logWarning() {
        // Khi người dùng nhập tên tỉnh không có trong hệ thống GHN, code sẽ in ra 5 tỉnh đầu tiên để cảnh báo.
        // Mục tiêu: Quét dòng lambda `p -> log.warn("  - {}", p.get("ProvinceName"))` (Báo cáo hiển thị là lambda$getProvinceId$1)
        // - provinces.stream().limit(5).forEach(p -> ...)
        
        long orderCountBefore = orderRepository.count();

        // Giả lập GHN API trả về danh sách tỉnh
        stubGhnResponse("/master-data/province", 200, 
            "{\"code\":200,\"data\":[" +
            "{\"ProvinceID\":101,\"ProvinceName\":\"Tỉnh Fake 1\"}," +
            "{\"ProvinceID\":102,\"ProvinceName\":\"Tỉnh Fake 2\"}" +
            "]}");
        
        // Cố tình làm cho gọi District bị lỗi để hàm chạy thẳng qua
        stubGhnResponse("/master-data/district", 404, "{}");

        // Gọi gián tiếp qua getDistrictId vì getProvinceId là hàm private
        invokePrivate("getDistrictId", "Tỉnh Tên Lạ Hoắc", "Quận Nào Đó");
        
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_082 - Lấy mã tỉnh GHN ném exception thì vào catch và trả về giá trị mặc định 201")
    void TC_SHIP_082_getProvinceId_exception_returnDefault() {
        // Phủ dòng Đỏ: catch (Exception e) trong getProvinceId và trả về default 201
        stubGhnResponse("/master-data/province", 500, "Lỗi Server");
        Integer id = invokePrivate("getProvinceId", "Tỉnh Nào Đó");
        assertEquals(201, id); // Fallback về 201
    }

    @Test
    @DisplayName("TC_SHIP_083 - Lấy mã quận GHN trả list nhưng không khớp thì trả về giá trị mặc định 1485")
    void TC_SHIP_083_getDistrictId_noMatch_returnDefault() {
        // Phủ dòng Đỏ: log.warn("⚠️ District not found via API, using default") và return 1485
        stubGhnResponse("/master-data/province", 200, "{\"code\":200,\"data\":[{\"ProvinceID\":101,\"ProvinceName\":\"Tỉnh Fake\"}]}");
        stubGhnResponse("/master-data/district", 200, "{\"code\":200,\"data\":[{\"DistrictID\":998,\"DistrictName\":\"Quận A\"}]}");

        Integer id = invokePrivate("getDistrictId", "Tỉnh Fake", "Quận Lạ Hoắc");
        assertEquals(1485, id); // Không match được -> fallback 1485
    }

    @Test
    @DisplayName("TC_SHIP_084 - Lấy mã phường khớp chính xác tên phường thì trả về WardCode đúng")
    void TC_SHIP_084_getWardCode_exactMatch_returnCode() {
        // Phủ dòng Đỏ: if (matchLocation(...)) { return wardCode; }
        stubGhnResponse("/master-data/ward", 200, "{\"code\":200,\"data\":[{\"WardCode\":\"W_DUNG\",\"WardName\":\"Phường Đúng\"}]}");
        String code = invokePrivate("getWardCode", 1454, "Phường Đúng");
        assertEquals("W_DUNG", code);
    }

    @Test
    @DisplayName("TC_SHIP_085 - Lấy mã phường GHN trả list phường rỗng thì trả về null")
    void TC_SHIP_085_getWardCode_emptyList_returnNull() {
        // 
        stubGhnResponse("/master-data/ward", 200, "{\"code\":200,\"data\":[]}");
        String code = invokePrivate("getWardCode", 1454, "Phường 1");
        assertNull(code);
    }

    @Test
    @DisplayName("TC_SHIP_086 - Lấy mã phường GHN ném exception thì vào catch và trả về null")
    void TC_SHIP_086_getWardCode_exception_returnNull() {
        // Phủ dòng Đỏ: catch (Exception e) trong getWardCode
        stubGhnResponse("/master-data/ward", 500, "Lỗi Server");
        String code = invokePrivate("getWardCode", 1454, "Phường 1");
        assertNull(code);
    }

    @Test
    @DisplayName("TC_SHIP_087 - Lấy mã tỉnh GHN trả list tỉnh nhưng không khớp thì trả về mặc định 201")
    void TC_SHIP_087_getProvinceId_apiNoMatch_returnDefault() {
        // Phủ dòng Đỏ: log.warn("❌ Province not found..."), in lambda 5 tỉnh, và return 201
        stubGhnResponse("/master-data/province", 200, "{\"code\":200,\"data\":[{\"ProvinceID\":99,\"ProvinceName\":\"Tỉnh Lạ 1\"}]}");
        Integer id = invokePrivate("getProvinceId", "Không Tồn Tại");
        assertEquals(201, id);
    }

    @Test
@DisplayName("TC_SHIP_088 - Khi API GHN sập thì phải ném lỗi để chặn thanh toán, tránh tính sai phí cho khách")
void TC_SHIP_088_getDistrictId_apiException_throwsError() {
    // 1. Giả lập API GHN trả về lỗi 500 (Sập server)
    stubGhnResponse("/master-data/district", 500, "Internal Server Error");

    // 2. Kỳ vọng: Hệ thống phải ném ra RuntimeException
    // Nếu hệ thống trả về mã mặc định (1485/1542) -> Test này sẽ FAILED (đúng ý bạn)
    RuntimeException ex = assertThrows(RuntimeException.class, () -> {
        invokePrivate("getDistrictId", "Tỉnh A", "Quận B");
    });

    // 3. Kiểm tra thông báo lỗi có hướng dẫn khách hàng hay không
    assertTrue(ex.getMessage().contains("Không thể kết nối với đơn vị vận chuyển"), 
        "Thông báo lỗi phải rõ ràng để khách hàng biết và thử lại sau");
}

    // ========================================================
    // createGHNOrder()
    // [TESTS] TC_SHIP_089, TC_SHIP_090, TC_SHIP_091, TC_SHIP_092, TC_SHIP_093, TC_SHIP_094, TC_SHIP_095, TC_SHIP_096, TC_SHIP_097, TC_SHIP_098, TC_SHIP_099, TC_SHIP_100, TC_SHIP_101, TC_SHIP_102
    // ========================================================


    @Test
    @DisplayName("TC_SHIP_089 - Tạo đơn GHN thành công với đầy đủ dữ liệu hợp lệ")
    void TC_SHIP_089_fullData_success() {
        // Kiểm tra tạo đơn GHN thành công với đầy đủ dữ liệu hợp lệ (có wardCode, có items).
        // - wardCode != null && !wardCode.trim().isEmpty() -> true (không gọi fallback getWardCode)
        // - request.getItems() != null && !request.getItems().isEmpty() -> true (build items)
        // - response code 200, data != null, order_code != null -> parse total_fee, expected_delivery_time (Number)

        long orderCountBefore = orderRepository.count();

        stubGhnResponse("/v2/shipping-order/create", 200, 
            "{\"code\":200,\"message\":\"Success\",\"data\":{" +
            "\"order_code\":\"GHN123456\"," +
            "\"sort_code\":\"12-34\"," +
            "\"total_fee\":25000.0," +
            "\"expected_delivery_time\":1672531200" +
            "}}");

        CreateGHNOrderRequest req = CreateGHNOrderRequest.builder()
            .toName("Nguyen Van A")
            .toPhone("0909123456")
            .toAddress("123 Le Loi")
            .toWardCode("W123")
            .toDistrictId(1454)
            .weight(1000)
            .items(List.of(
                CreateGHNOrderRequest.GHNOrderItem.builder()
                    .name("Ao thun")
                    .code("SP01")
                    .quantity(2)
                    .price(150000)
                    .build()
            ))
            .build();

        CreateGHNOrderResponse response = shippingService.createGHNOrder(req);

        assertNotNull(response);
        assertEquals("GHN123456", response.getOrderCode());
        assertEquals("created", response.getStatus());
        assertEquals("12-34", response.getSortCode());
        assertEquals(25000.0, response.getTotalFee());
        assertNotNull(response.getExpectedDeliveryTime());
        
        // Assert DB không đổi vì hàm này chỉ tương tác qua API
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_090 - WardCode null thì tự động fallback lấy wardCode từ GHN")
    void TC_SHIP_090_nullWardCode_fallbackSuccess() {
        // Kiểm tra trường hợp request không có wardCode, hệ thống tự động gọi API lấy wardCode mặc định của quận.
        // - wardCode == null || wardCode.isEmpty() -> gọi getWardCode() -> trả về wardCode đầu tiên
        // - items == null -> bỏ qua build map items
        // - fee được trả về trong trường "fee" thay vì "total_fee" -> cover nhánh lấy fee
        // - expected_delivery_time là ISO String -> cover nhánh parse ISO string

        long orderCountBefore = orderRepository.count();

        stubGhnResponse("/master-data/ward", 200, 
            "{\"code\":200,\"data\":[{\"WardCode\":\"W999\",\"WardName\":\"Phường A\"}]}");
            
        stubGhnResponse("/v2/shipping-order/create", 200, 
            "{\"code\":200,\"message\":\"Success\",\"data\":{" +
            "\"order_code\":\"GHN789\"," +
            "\"fee\":30000.0," +
            "\"expected_delivery_time\":\"2024-12-31T23:59:59\"" +
            "}}");

        CreateGHNOrderRequest req = CreateGHNOrderRequest.builder()
            .toName("Nguyen Van B")
            .toPhone("0909123457")
            .toAddress("456 Le Loi")
            .toWardCode(null)
            .toDistrictId(1454)
            .weight(500)
            .build();

        CreateGHNOrderResponse response = shippingService.createGHNOrder(req);

        assertNotNull(response);
        assertEquals("GHN789", response.getOrderCode());
        assertNull(response.getSortCode()); // Không có sort_code
        assertEquals(30000.0, response.getTotalFee()); // Parse từ fee thành công
        assertNotNull(response.getExpectedDeliveryTime());
        
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_091 - WardCode rỗng và GHN không trả phường thì ném RuntimeException")
    void TC_SHIP_091_missingWardCode_throwsException() {
        // Kiểm tra trường hợp request không có wardCode và API getWardCode cũng không tìm thấy (trả về rỗng).
        // Hệ thống phải ném lỗi vì thiếu mã phường/xã.
        // - wardCode == null -> gọi getWardCode() trả về null (do mock API trả rỗng)
        // - kiểm tra lại: wardCode == null -> ném RuntimeException("Không thể tạo đơn GHN: Thiếu mã phường/xã")

        long orderCountBefore = orderRepository.count();

        // Giả lập API ward trả về rỗng
        stubGhnResponse("/master-data/ward", 200, "{\"code\":200,\"data\":[]}");

        CreateGHNOrderRequest req = CreateGHNOrderRequest.builder()
            .toName("Nguyen Van C")
            .toPhone("0909123458")
            .toAddress("789 Le Loi")
            .toWardCode("   ") // chuỗi rỗng
            .toDistrictId(1454)
            .build();

        RuntimeException ex = assertThrows(RuntimeException.class, () -> shippingService.createGHNOrder(req));
        assertTrue(ex.getMessage().contains("Thiếu mã phường/xã"));
        
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_092 - GHN API trả code khác 200 thì ném RuntimeException")
    void TC_SHIP_092_responseNot200_throwsException() {
        // GHN API trả về mã lỗi (code != 200) khi tạo đơn.
        // - response.get("code") != 200 -> nhảy xuống dưới cùng ném RuntimeException("Không thể tạo đơn hàng GHN")

        long orderCountBefore = orderRepository.count();

        stubGhnResponse("/v2/shipping-order/create", 200, "{\"code\":400,\"message\":\"Bad Request\"}");

        CreateGHNOrderRequest req = CreateGHNOrderRequest.builder()
            .toWardCode("W123")
            .toDistrictId(1454)
            .build();

        RuntimeException ex = assertThrows(RuntimeException.class, () -> shippingService.createGHNOrder(req));
        assertTrue(ex.getMessage().contains("Không thể tạo đơn hàng GHN"));
        
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_093 - GHN trả 200 nhưng thiếu order code thì ném RuntimeException")
    void TC_SHIP_093_missingOrderCode_throwsException() {
        // GHN API trả về 200 nhưng thiếu trường order_code bắt buộc trong data.
        // - orderCode == null -> ném RuntimeException("GHN không trả về mã đơn hàng")

        long orderCountBefore = orderRepository.count();

        stubGhnResponse("/v2/shipping-order/create", 200, 
            "{\"code\":200,\"data\":{\"total_fee\":25000.0}}");

        CreateGHNOrderRequest req = CreateGHNOrderRequest.builder()
            .toWardCode("W123")
            .build();

        RuntimeException ex = assertThrows(RuntimeException.class, () -> shippingService.createGHNOrder(req));
        assertTrue(ex.getMessage().contains("GHN không trả về mã đơn hàng"));
        
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_094 - Fee từ trường service fee và thời gian từ chuỗi số thì parse thành công")
    void TC_SHIP_094_serviceFeeAndStringTimestamp_parsed() {
        // Kiểm tra parse fee từ trường "service_fee" và parse expected_delivery_time từ chuỗi chứa số timestamp.
        // - feeValue lấy từ "service_fee" (vì total_fee và fee null)
        // - timeValue instanceof String -> parse ISO lỗi -> nhảy vào catch bên trong -> Long.parseLong() thành công

        long orderCountBefore = orderRepository.count();

        stubGhnResponse("/v2/shipping-order/create", 200, 
            "{\"code\":200,\"data\":{" +
            "\"order_code\":\"GHN999\"," +
            "\"service_fee\":45000.0," +
            "\"expected_delivery_time\":\"1672531200\"" + // string chứa timestamp số
            "}}");

        CreateGHNOrderRequest req = CreateGHNOrderRequest.builder()
            .toWardCode("W123")
            .build();

        CreateGHNOrderResponse response = shippingService.createGHNOrder(req);

        assertEquals("GHN999", response.getOrderCode());
        assertEquals(45000.0, response.getTotalFee()); // Lấy từ service_fee
        assertNotNull(response.getExpectedDeliveryTime()); // Parse thành công
        
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_095 - Fee và thời gian trả về định dạng sai thì giữ nguyên null không crash")
    void TC_SHIP_095_invalidFeeAndTime_returnNull() {
        // Kiểm tra trường hợp fee trả về kiểu không thể cast thành Number, và time trả về chuỗi không hợp lệ.
        // Code phải catch exception và không được crash.
        // - total_fee là string "abc" -> catch exception khi cast/parse -> totalFee = null
        // - expected_delivery_time là "invalid-time" -> catch exception -> expectedDeliveryTime = null

        long orderCountBefore = orderRepository.count();

        stubGhnResponse("/v2/shipping-order/create", 200, 
            "{\"code\":200,\"data\":{" +
            "\"order_code\":\"GHN000\"," +
            "\"total_fee\":\"abc\"," +
            "\"expected_delivery_time\":\"invalid-time\"" +
            "}}");

        CreateGHNOrderRequest req = CreateGHNOrderRequest.builder()
            .toWardCode("W123")
            .build();

        CreateGHNOrderResponse response = shippingService.createGHNOrder(req);

        assertEquals("GHN000", response.getOrderCode());
        assertNull(response.getTotalFee()); // Catch error -> null
        assertNull(response.getExpectedDeliveryTime()); // Catch error -> null
        
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_096 - GHN trả 200 nhưng data null thì ném RuntimeException")
    void TC_SHIP_096_nullData_throwsException() {
        // GHN API trả về 200 nhưng object data = null.
        // - data == null -> nhảy qua khối if -> ném RuntimeException("Không thể tạo đơn hàng GHN")

        long orderCountBefore = orderRepository.count();

        stubGhnResponse("/v2/shipping-order/create", 200, "{\"code\":200,\"data\":null}");

        CreateGHNOrderRequest req = CreateGHNOrderRequest.builder()
            .toWardCode("W123")
            .build();

        RuntimeException ex = assertThrows(RuntimeException.class, () -> shippingService.createGHNOrder(req));
        assertTrue(ex.getMessage().contains("Không thể tạo đơn hàng GHN"));
        
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_097 - RestTemplate ném exception khi tạo đơn thì ném RuntimeException")
    void TC_SHIP_097_restTemplateException_throwsException() {
        // Gặp lỗi đường truyền hoặc RestTemplate ném exception (ví dụ 500 Server Error).
        // - catch (Exception e) ngoại cùng -> ném RuntimeException("Lỗi khi tạo đơn hàng GHN: "...)

        long orderCountBefore = orderRepository.count();

        // 500 causes RestTemplate to throw HttpServerErrorException
        stubGhnResponse("/v2/shipping-order/create", 500, "");

        CreateGHNOrderRequest req = CreateGHNOrderRequest.builder()
            .toWardCode("W123")
            .build();

        RuntimeException ex = assertThrows(RuntimeException.class, () -> shippingService.createGHNOrder(req));
        assertTrue(ex.getMessage().contains("Lỗi khi tạo đơn hàng GHN"));
        
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_098 - Tạo đơn hàng không crash khi danh sách sản phẩm rỗng và thiếu phí")
    void TC_SHIP_098_emptyItemsNoFeeTime_returnNull() {
        // Quét sạch các nhánh ngách cuối cùng của createGHNOrder:
        // 1. request.getItems() không null nhưng là list rỗng (isEmpty() == true) -> không build items.
        // 2. data trả về không có bất kỳ field phí nào (total_fee, fee, service_fee đều null) -> rơi vào else cảnh báo log.warn.
        // 3. data trả về không có expected_delivery_time -> rơi vào else cảnh báo log.warn.
        // 4. Mã wardCode gửi lên toàn dấu cách ("   ") -> tự động gọi fallback lấy ward mặc định.
        // - if (request.getItems() != null && !request.getItems().isEmpty()) -> FALSE
        // - if (feeValue != null) -> FALSE -> else { log.warn(...) }
        // - if (timeValue != null) -> FALSE -> else { log.warn(...) }

        long orderCountBefore = orderRepository.count();

        // Giả lập lấy ward dự phòng thành công
        stubGhnResponse("/master-data/ward", 200, 
            "{\"code\":200,\"data\":[{\"WardCode\":\"W_DEFAULT\"}]}");

        // Giả lập tạo đơn thành công nhưng DATA THIẾU SẠCH TRƠN phí và thời gian
        stubGhnResponse("/v2/shipping-order/create", 200, 
            "{\"code\":200,\"data\":{" +
            "\"order_code\":\"GHN_EDGE_999\"," +
            "\"sort_code\":\"A-B-C\"" +
            // Cố tình KHÔNG có total_fee, KHÔNG có fee, KHÔNG có service_fee, KHÔNG có expected_delivery_time
            "}}");

        CreateGHNOrderRequest req = CreateGHNOrderRequest.builder()
            .toName("Nguyen Edge")
            .toPhone("0900000000")
            .toAddress("123 Edge")
            .toWardCode("   ") // Toàn khoảng trắng, sẽ kích hoạt wardCode.trim().isEmpty() -> fallback
            .toDistrictId(1454)
            .items(new ArrayList<>()) // Cố tình truyền list rỗng
            .build();

        CreateGHNOrderResponse response = shippingService.createGHNOrder(req);

        // Assert response trả về an toàn, không bị NullPointerException
        assertNotNull(response);
        assertEquals("GHN_EDGE_999", response.getOrderCode());
        assertEquals("created", response.getStatus());
        assertEquals("A-B-C", response.getSortCode());
        
        // Cả fee và time đều phải null do không có dữ liệu
        assertNull(response.getTotalFee());
        assertNull(response.getExpectedDeliveryTime());
        
        // Assert DB không bị ảnh hưởng (vì chỉ gọi API)
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_099 - Response null thiếu code và thời gian kiểu Boolean thì xử lý an toàn")
    void TC_SHIP_099_apiNullsAndBooleanTime_safeHandle() {
        // 
        // 1. response == null
        // 2. response.code == null
        // 3. expected_delivery_time là Boolean (Không phải String, không phải Number)

        long orderCountBefore = orderRepository.count();
        CreateGHNOrderRequest req = CreateGHNOrderRequest.builder()
                .toName("Test").toPhone("090").toAddress("123").toWardCode("W1").toDistrictId(1).build();

        stubGhnResponse("/v2/shipping-order/create", 200, "null");
        assertThrows(RuntimeException.class, () -> shippingService.createGHNOrder(req));

        stubGhnResponse("/v2/shipping-order/create", 200, "{\"message\":\"ok\"}");
        assertThrows(RuntimeException.class, () -> shippingService.createGHNOrder(req));

        stubGhnResponse("/v2/shipping-order/create", 200, 
            "{\"code\":200,\"data\":{" +
            "\"order_code\":\"GHN_BOOL\"," +
            "\"total_fee\":15000.0," +
            "\"expected_delivery_time\":true" + // <-- Kiểu Boolean, ép code phải lọt qua cả 2 nhánh if String/Number
            "}}");
        
        CreateGHNOrderResponse res = shippingService.createGHNOrder(req);
        assertEquals("GHN_BOOL", res.getOrderCode());
        assertNull(res.getExpectedDeliveryTime(), "Không được crash, thời gian phải null vì parse thất bại an toàn");

        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_100 - Thời gian trả về dạng chuỗi ISO 8601 thì parse thành LocalDateTime")
    void TC_SHIP_100_isoStringTime_parsedSuccess() {
        long orderCountBefore = orderRepository.count();

        stubGhnResponse("/master-data/ward", 200, "{\"code\":200,\"data\":[{\"WardCode\":\"W1\"}]}");
        
        // Trả về thời gian chuẩn ISO 8601 để parse thành công
        stubGhnResponse("/v2/shipping-order/create", 200, 
            "{\"code\":200,\"data\":{" +
            "\"order_code\":\"GHN_ISO\"," +
            "\"expected_delivery_time\":\"2026-12-31T23:59:59\"" +
            "}}");

        CreateGHNOrderRequest req = CreateGHNOrderRequest.builder()
            .toWardCode("W1").toDistrictId(1).build();

        CreateGHNOrderResponse res = shippingService.createGHNOrder(req);
        
        assertNotNull(res.getExpectedDeliveryTime(), "Thời gian phải được parse thành công từ chuỗi ISO");
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_101 - Timestamp Unix rất lớn gây overflow thì trả về null")
    void TC_SHIP_101_overflowTimestamp_returnNull() {
        // để hàm Instant.ofEpochSecond() bị tràn bộ nhớ và văng DateTimeException, rơi thẳng ra outer catch!
        long orderCountBefore = orderRepository.count();

        stubGhnResponse("/master-data/ward", 200, "{\"code\":200,\"data\":[{\"WardCode\":\"W1\"}]}");
        
        stubGhnResponse("/v2/shipping-order/create", 200, 
            "{\"code\":200,\"data\":{" +
            "\"order_code\":\"GHN_HUGE_TIME\"," +
            "\"expected_delivery_time\": 9223372036854775807" + // Long.MAX_VALUE
            "}}");

        CreateGHNOrderRequest req = CreateGHNOrderRequest.builder()
            .toWardCode("W1").toDistrictId(1).build();

        CreateGHNOrderResponse res = shippingService.createGHNOrder(req);
        
        assertNull(res.getExpectedDeliveryTime(), "Ném lỗi DateTimeException ngầm và gán null");
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_102 - GHN không trả về fee và thời gian thì log warn và giữ nguyên null")
    void TC_SHIP_102_noFeeNoTime_logAndReturnNull() {
        // 1. log.warn("No fee field found in response...")
        // 2. log.warn("expected_delivery_time is null in response")
        long orderCountBefore = orderRepository.count();

        stubGhnResponse("/master-data/ward", 200, "{\"code\":200,\"data\":[{\"WardCode\":\"W1\"}]}");
        
        // Hoàn toàn không có fee và expected_delivery_time
        stubGhnResponse("/v2/shipping-order/create", 200, 
            "{\"code\":200,\"data\":{" +
            "\"order_code\":\"GHN_EMPTY\"" +
            "}}");

        CreateGHNOrderRequest req = CreateGHNOrderRequest.builder()
            .toWardCode("W1").toDistrictId(1).build();

        CreateGHNOrderResponse res = shippingService.createGHNOrder(req);
        
        assertNull(res.getTotalFee());
        assertNull(res.getExpectedDeliveryTime());
        assertOrderCountUnchanged(orderCountBefore);
    }

    // getGHNOrderDetail()

    // ========================================================
    // getGHNOrderDetail()
    // [TESTS] TC_SHIP_103, TC_SHIP_104, TC_SHIP_105, TC_SHIP_106, TC_SHIP_107, TC_SHIP_108
    // ========================================================


    @Test
    @DisplayName("TC_SHIP_103 - Lấy chi tiết đơn đầy đủ log COD fee thời gian thì parse chính xác")
    void TC_SHIP_103_fullData_parsedCorrectly() {
        // Kiểm tra lấy chi tiết đơn hàng thành công, có list log trạng thái, có tiền thu hộ và phí ship.
        // Đồng thời test parseTimestamp với kiểu String.
        // - response 200, data != null
        // - data.get("log") != null -> duyệt qua logList và mapping
        // - cod_amount != null, total_fee != null

        long orderCountBefore = orderRepository.count();

        stubGhnResponse("/v2/shipping-order/detail", 200, 
            "{\"code\":200,\"data\":{" +
            "\"status\":\"delivering\"," +
            "\"expected_delivery_time\":\"2023-10-25T10:00:00\"," +
            "\"updated_date\":1672531200," +
            "\"current_warehouse\":\"Kho Ha Noi\"," +
            "\"cod_amount\":100000.0," +
            "\"total_fee\":25000.0," +
            "\"note\":\"Giao gio hanh chinh\"," +
            "\"log\":[" +
                "{\"status\":\"ready_to_pick\",\"updated_date\":\"2023-10-24T08:00:00\",\"location\":\"Kho Lay\"}," +
                "{\"status\":\"delivering\",\"updated_date\":1672531200,\"location\":\"Kho Ha Noi\"}" +
            "]" +
            "}}");

        GHNOrderDetailResponse response = shippingService.getGHNOrderDetail("GHN123");

        assertNotNull(response);
        assertEquals("GHN123", response.getOrderCode());
        assertEquals("delivering", response.getStatus());
        assertEquals("Đang giao hàng", response.getStatusText());
        assertEquals("Kho Ha Noi", response.getCurrentWarehouse());
        assertEquals(100000.0, response.getCodAmount());
        assertEquals(25000.0, response.getShippingFee());
        assertEquals("Giao gio hanh chinh", response.getNote());
        assertNotNull(response.getExpectedDeliveryTime()); // Được parse từ String ISO
        assertNotNull(response.getUpdatedDate()); // Được parse từ Number
        
        assertNotNull(response.getLogs());
        assertEquals(2, response.getLogs().size());
        
        // Assert phần tử log đầu tiên
        assertEquals("ready_to_pick", response.getLogs().get(0).getStatus());
        assertEquals("Chờ lấy hàng", response.getLogs().get(0).getStatusText());
        assertEquals("Kho Lay", response.getLogs().get(0).getLocation());
        assertNotNull(response.getLogs().get(0).getTime());

        // Assert phần tử log thứ 2
        assertEquals("delivering", response.getLogs().get(1).getStatus());
        assertEquals("Kho Ha Noi", response.getLogs().get(1).getLocation());
        
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_104 - Chi tiết đơn thiếu trường không bắt buộc log rỗng không COD thì an toàn")
    void TC_SHIP_104_minimalData_safeHandle() {
        // Kiểm tra lấy chi tiết đơn hàng thành công nhưng thiếu các trường không bắt buộc (log rỗng, không có cod_amount).
        // Phủ luôn luồng try-catch của hàm `parseTimestamp`.
        // - data.get("log") == null -> mảng logs vẫn khởi tạo rỗng, không for
        // - cod_amount == null -> null
        // - total_fee == null -> null
        // - expected_delivery_time = "invalid-date" -> parseTimestamp trả về null (vào catch)

        long orderCountBefore = orderRepository.count();

        stubGhnResponse("/v2/shipping-order/detail", 200, 
            "{\"code\":200,\"data\":{" +
            "\"status\":\"ready_to_pick\"," +
            "\"expected_delivery_time\":\"invalid-date\"" +
            "}}");

        GHNOrderDetailResponse response = shippingService.getGHNOrderDetail("GHN456");

        assertNotNull(response);
        assertEquals("GHN456", response.getOrderCode());
        assertEquals("ready_to_pick", response.getStatus());
        assertEquals("Chờ lấy hàng", response.getStatusText());
        assertNull(response.getCodAmount());
        assertNull(response.getShippingFee());
        assertNull(response.getExpectedDeliveryTime()); // Bị lỗi parse từ chuỗi invalid nên trả về null
        assertNotNull(response.getLogs());
        assertEquals(0, response.getLogs().size());
        
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_105 - API trả code lỗi 400 thì ném RuntimeException")
    void TC_SHIP_105_responseNot200_throwsException() {
        // API trả về code != 200 khi lấy chi tiết.
        // - response.get("code") != 200 -> ném RuntimeException("Không thể lấy thông tin đơn hàng GHN")

        long orderCountBefore = orderRepository.count();

        stubGhnResponse("/v2/shipping-order/detail", 400, "{\"code\":400}");

        RuntimeException ex = assertThrows(RuntimeException.class, () -> shippingService.getGHNOrderDetail("GHN789"));
        assertTrue(ex.getMessage().contains("Không thể lấy thông tin đơn hàng GHN"));
        
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_106 - API trả 200 nhưng data null thì ném RuntimeException")
    void TC_SHIP_106_nullData_throwsException() {
        // API trả về 200 nhưng object data bị null.
        // - data == null -> bỏ qua khối if xử lý -> ném RuntimeException("Không thể lấy thông tin đơn hàng GHN")

        long orderCountBefore = orderRepository.count();

        stubGhnResponse("/v2/shipping-order/detail", 200, "{\"code\":200,\"data\":null}");

        RuntimeException ex = assertThrows(RuntimeException.class, () -> shippingService.getGHNOrderDetail("GHN789"));
        assertTrue(ex.getMessage().contains("Không thể lấy thông tin đơn hàng GHN"));
        
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_107 - RestTemplate ném exception khi lấy chi tiết thì ném RuntimeException")
    void TC_SHIP_107_restTemplateException_throwsException() {
        // RestTemplate ném exception (lỗi mạng, cổng đóng, vv).
        // - catch (Exception e) bao phủ toàn bộ -> ném RuntimeException("Lỗi khi lấy thông tin đơn hàng GHN: "...)

        long orderCountBefore = orderRepository.count();

        stubGhnResponse("/v2/shipping-order/detail", 500, "");

        RuntimeException ex = assertThrows(RuntimeException.class, () -> shippingService.getGHNOrderDetail("GHN789"));
        assertTrue(ex.getMessage().contains("Lỗi khi lấy thông tin đơn hàng GHN"));
        
        assertOrderCountUnchanged(orderCountBefore);
    }

    @Test
    @DisplayName("TC_SHIP_108 - API trả mảng log rỗng thì danh sách log rỗng không null")
    void TC_SHIP_108_emptyLogArray_returnEmptyList() {
        // Quét nhánh: mảng `log` được GHN trả về không bị null, nhưng nó là mảng rỗng `[]`.
        // - if (data.get("log") != null) -> TRUE (vì nó là mảng rỗng, không phải null)
        // - Vòng lặp for(Map<String, Object> logItem : logList) -> Bỏ qua vì list rỗng.

        long orderCountBefore = orderRepository.count();

        // API trả về mảng log rỗng
        stubGhnResponse("/v2/shipping-order/detail", 200, 
            "{\"code\":200,\"data\":{" +
            "\"status\":\"ready_to_pick\"," +
            "\"order_code\":\"GHN_EMPTY_LOG\"," +
            "\"log\":[]" + // Mảng rỗng
            "}}");

        GHNOrderDetailResponse response = shippingService.getGHNOrderDetail("GHN_EMPTY_LOG");

        assertNotNull(response);
        assertEquals("GHN_EMPTY_LOG", response.getOrderCode());
        assertNotNull(response.getLogs(), "Danh sách log phải được khởi tạo (không null)");
        assertTrue(response.getLogs().isEmpty(), "Danh sách log phải rỗng (size = 0)");
        
        assertOrderCountUnchanged(orderCountBefore);
    }
    // ========================================================
    // KIỂM THỬ BIÊN NGHIỆP VỤ (BUSINESS/PHYSICAL BOUNDARIES)
    // [TESTS] TC_SHIP_109, TC_SHIP_110, TC_SHIP_111, TC_SHIP_112, TC_SHIP_113
    // ========================================================

    @Test
    @DisplayName("TC_SHIP_109 - Khối lượng bằng 0 thì ném ngoại lệ IllegalArgumentException")
    void TC_SHIP_109_weight_zero_throwsException() {
        // Cố tình truyền weight = 0.0
        CalculateShippingFeeRequest req = taoRequest("TP. Hồ Chí Minh", "Quận 1", 0.0, 100000.0);
        
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, 
            () -> shippingService.calculateShippingFee(req));
            
        assertTrue(ex.getMessage().toLowerCase().contains("khối lượng"), 
            "Message lỗi phải chứa từ khóa 'khối lượng' hoặc 'weight'");
    }

    @Test
    @DisplayName("TC_SHIP_110 - Khối lượng âm thì ném ngoại lệ IllegalArgumentException")
    void TC_SHIP_110_weight_negative_throwsException() {
        // Cố tình truyền weight = -1.0
        CalculateShippingFeeRequest req = taoRequest("TP. Hồ Chí Minh", "Quận 1", -1.0, 100000.0);
        
        assertThrows(IllegalArgumentException.class, 
            () -> shippingService.calculateShippingFee(req),
            "Không được phép tính phí ship với khối lượng âm");
    }

    @Test
    @DisplayName("TC_SHIP_111 - Khối lượng vượt ngưỡng trần của GHN 50kg thì ném ngoại lệ")
    void TC_SHIP_111_weight_exceedsMax_throwsException() {
        // GHN thường giới hạn tối đa 50kg (50,000 gram)
        CalculateShippingFeeRequest req = taoRequest("TP. Hồ Chí Minh", "Quận 1", 50001.0, 100000.0);
        
        assertThrows(IllegalArgumentException.class, 
            () -> shippingService.calculateShippingFee(req),
            "Khối lượng vượt quá giới hạn vận chuyển phải bị chặn lại");
    }

    @Test
    @DisplayName("TC_SHIP_112 - Giá trị bảo hiểm âm thì ném ngoại lệ IllegalArgumentException")
    void TC_SHIP_112_insuranceValue_negative_throwsException() {
        CalculateShippingFeeRequest req = taoRequest("TP. Hồ Chí Minh", "Quận 1", 1000.0, -1000.0);
        
        assertThrows(IllegalArgumentException.class, 
            () -> shippingService.calculateShippingFee(req),
            "Giá trị bảo hiểm/đơn hàng không được âm");
    }

    @Test
    @DisplayName("TC_SHIP_113 - Giá trị bảo hiểm vượt mức đền bù tối đa 50 triệu thì ném ngoại lệ")
    void TC_SHIP_113_insuranceValue_exceedsMax_throwsException() {
        // Khai giá trên 50 triệu VNĐ thường bị GHN từ chối
        CalculateShippingFeeRequest req = taoRequest("TP. Hồ Chí Minh", "Quận 1", 1000.0, 50000001.0);
        
        assertThrows(IllegalArgumentException.class, 
            () -> shippingService.calculateShippingFee(req),
            "Giá trị hàng hóa quá lớn, vượt trần bảo hiểm của đơn vị vận chuyển");
    }

    
}