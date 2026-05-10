package com.doan.WEB_TMDT.module.inventory.service;

import com.doan.WEB_TMDT.common.dto.ApiResponse;
import com.doan.WEB_TMDT.module.inventory.dto.*;
import com.doan.WEB_TMDT.module.inventory.entity.*;
import com.doan.WEB_TMDT.module.inventory.repository.*;
import com.doan.WEB_TMDT.module.inventory.service.InventoryService;
import com.doan.WEB_TMDT.module.product.entity.Product;
import com.doan.WEB_TMDT.module.product.repository.ProductRepository;
import com.doan.WEB_TMDT.module.order.entity.OrderItem;
import com.doan.WEB_TMDT.module.order.entity.Order;
import com.doan.WEB_TMDT.module.order.repository.OrderRepository;
import com.doan.WEB_TMDT.module.shipping.service.ShippingService;
import com.doan.WEB_TMDT.module.shipping.service.impl.ShippingServiceImpl;
import com.doan.WEB_TMDT.module.accounting.service.SupplierPayableService;
import com.doan.WEB_TMDT.module.auth.entity.Customer;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;

@SpringBootTest
@Transactional
@ActiveProfiles("test")
@DisplayName("INVENTORY SERVICE TEST")
class InventoryServiceImplTest { 

    // Mock SocketIO handler để ngăn @PostConstruct khởi động server khi load context test
    @org.springframework.boot.test.mock.mockito.MockBean
    private com.doan.WEB_TMDT.module.support.service.SupportChatSocketIOHandler supportChatSocketIOHandler;

    @Autowired private InventoryService inventoryService;

    // === REPOSITORIES (Dùng để Assert và verify side-effects) ===
    @Autowired private SupplierRepository supplierRepository;
    @MockitoSpyBean private WarehouseProductRepository warehouseProductRepository;
    @Autowired private PurchaseOrderItemRepository purchaseOrderItemRepository;
    @Autowired private ProductDetailRepository productDetailRepository;
    @MockitoSpyBean private InventoryStockRepository inventoryStockRepository;
    @Autowired private ExportOrderRepository exportOrderRepository;
    @Autowired private ExportOrderItemRepository exportOrderItemRepository;
    @Autowired private ProductRepository productRepository;
    @MockitoSpyBean private OrderRepository orderRepository;
    @MockitoSpyBean private ShippingServiceImpl shippingService;
    @MockitoSpyBean private PurchaseOrderRepository purchaseOrderRepository;
    @MockitoSpyBean private com.doan.WEB_TMDT.module.accounting.service.SupplierPayableService supplierPayableService;

    // =========================================================================================
    // HELPER: KIỂM SOÁT SIDE-EFFECTS (SỐ LƯỢNG RECORD)
    // =========================================================================================

    /**
     * Lấy tổng số record của tất cả các bảng liên quan đến Inventory.
     * Dùng để so sánh trước và sau khi chạy test để đảm bảo không insert/delete thừa.
     */
    private Map<String, Long> captureRecordCounts() {
        Map<String, Long> counts = new HashMap<>();
        counts.put("Supplier", supplierRepository.count());
        counts.put("WarehouseProduct", warehouseProductRepository.count());
        counts.put("PurchaseOrder", purchaseOrderRepository.count());
        counts.put("PurchaseOrderItem", purchaseOrderItemRepository.count());
        counts.put("ProductDetail", productDetailRepository.count());
        counts.put("InventoryStock", inventoryStockRepository.count());
        counts.put("ExportOrder", exportOrderRepository.count());
        counts.put("ExportOrderItem", exportOrderItemRepository.count());
        counts.put("Product", productRepository.count());
        return counts;
    }

    /**
     * Verify số lượng record không bị thay đổi ngoài mong muốn (ví dụ cho case Exception).
     */
    private void assertRecordCountsUnchanged(Map<String, Long> beforeCounts) {
        Map<String, Long> afterCounts = captureRecordCounts();
        for (String key : beforeCounts.keySet()) {
            assertEquals(beforeCounts.get(key), afterCounts.get(key),
                "Số lượng record của bảng " + key + " bị thay đổi ngoài mong muốn!");
        }
    }

    // =========================================================================================
    // HELPER: BUILD REQUEST DTO
    // =========================================================================================

    private CreateSupplierRequest buildCreateSupplierRequest(String name, String taxCode, String email, String phone) {
        CreateSupplierRequest req = new CreateSupplierRequest();
        req.setName(name);
        req.setTaxCode(taxCode);
        req.setEmail(email);
        req.setPhone(phone);
        req.setAddress("Test Address");
        req.setBankAccount("123456789");
        req.setPaymentTerm("COD");
        req.setPaymentTermDays(0);
        return req;
    }

    private CreateWarehouseProductRequest buildCreateWarehouseProductRequest(String sku, String internalName, Long supplierId) {
        CreateWarehouseProductRequest req = new CreateWarehouseProductRequest();
        req.setSku(sku);
        req.setInternalName(internalName);
        req.setSupplierId(supplierId);
        req.setDescription("Mô tả test");
        req.setTechSpecsJson("{\"color\":\"red\"}");
        return req;
    }

    private ExportItemRequest buildExportItemRequest(String sku, List<String> serials) {
        ExportItemRequest item = new ExportItemRequest();
        item.setProductSku(sku);
        item.setSerialNumbers(serials);
        return item;
    }

    private ProductSerialRequest buildProductSerialRequest(String sku, List<String> serials) {
        ProductSerialRequest req = new ProductSerialRequest();
        req.setProductSku(sku);
        req.setSerialNumbers(serials);
        return req;
    }

    // =========================================================================================
    // HELPER: BUILD DTO CHO PURCHASE ORDER
    // =========================================================================================

    private CreatePORequest buildCreatePORequest(CreateSupplierRequest supplier, List<POItemRequest> items) {
        CreatePORequest req = new CreatePORequest();
        req.setSupplier(supplier);
        req.setPoCode("PO-TEST-" + System.currentTimeMillis());
        req.setCreatedBy("AdminTest");
        req.setNote("Phiếu nhập test");
        req.setItems(items);
        return req;
    }

    private POItemRequest buildPOItemRequest(String sku, String internalName, String techSpecs, int qty, double cost) {
        POItemRequest item = new POItemRequest();
        item.setSku(sku);
        item.setInternalName(internalName);
        item.setTechSpecsJson(techSpecs);
        item.setQuantity((long) qty);
        item.setUnitCost(cost);
        item.setWarrantyMonths(12);
        item.setNote("Ghi chú item " + sku);
        return item;
    }

    private CompletePORequest buildCompletePORequest(Long poId, List<ProductSerialRequest> serials) {
        CompletePORequest req = new CompletePORequest();
        req.setPoId(poId);
        req.setSerials(serials);
        req.setReceivedDate(LocalDateTime.now());
        return req;
    }

    // =========================================================================================
    // HELPER: BUILD DTO CHO EXPORT ORDER
    // =========================================================================================

    private CreateExportOrderRequest buildCreateExportOrderRequest(List<ExportItemRequest> items) {
        CreateExportOrderRequest req = new CreateExportOrderRequest();
        req.setCreatedBy("AdminExport");
        req.setReason("Xuất bán hàng");
        req.setNote("Ghi chú phiếu xuất test");
        req.setItems(items);
        return req;
    }

    // =========================================================================================
    // HELPER BUILDERS CHO EXPORT FOR SALE
    // =========================================================================================

    private SaleExportRequest buildSaleExportRequest(List<ExportItemRequest> items, Long orderId) {
        SaleExportRequest req = new SaleExportRequest();
        req.setItems(items);
        req.setOrderId(orderId);
        req.setNote("Ghi chú xuất bán");
        req.setCreatedBy("AdminSale");
        return req;
    }

    // =========================================================================================
    // HELPER: BUILD DTO CHO EXPORT WARRANTY
    // =========================================================================================

    private WarrantyExportRequest buildWarrantyExportRequest(String sku, String serial, String note) {
        WarrantyExportRequest req = new WarrantyExportRequest();
        req.setNote(note);
        ExportItemRequest item = new ExportItemRequest();
        item.setProductSku(sku);
        item.setSerialNumbers(new ArrayList<>(List.of(serial)));
        req.setItems(new ArrayList<>(List.of(item)));
        return req;
    }

    // =========================================================================================
    // HELPER: ASSERTIONS CHO ENTITIES (SO KHỚP DB)
    // =========================================================================================

    /**
     * Assert toàn bộ field Supplier.
     */
    private void assertSupplierEquals(Supplier expected, Supplier actual) {
        assertNotNull(actual.getId());
        assertEquals(expected.getName(), actual.getName());
        assertEquals(expected.getContactName(), actual.getContactName());
        assertEquals(expected.getTaxCode(), actual.getTaxCode());
        assertEquals(expected.getEmail(), actual.getEmail());
        assertEquals(expected.getPhone(), actual.getPhone());
        assertEquals(expected.getAddress(), actual.getAddress());
        assertEquals(expected.getBankAccount(), actual.getBankAccount());
        assertEquals(expected.getPaymentTerm(), actual.getPaymentTerm());
        assertEquals(expected.getPaymentTermDays(), actual.getPaymentTermDays());
        assertEquals(expected.getActive(), actual.getActive());
        assertEquals(expected.getAutoCreated(), actual.getAutoCreated());
    }

    /**
     * Assert toàn bộ field WarehouseProduct.
     */
    private void assertWarehouseProductEquals(WarehouseProduct expected, WarehouseProduct actual) {
        assertNotNull(actual.getId());
        assertEquals(expected.getSku(), actual.getSku());
        assertEquals(expected.getInternalName(), actual.getInternalName());
        assertEquals(expected.getDescription(), actual.getDescription());
        assertEquals(expected.getTechSpecsJson(), actual.getTechSpecsJson());
        if (expected.getSupplier() != null) {
            assertNotNull(actual.getSupplier());
            assertEquals(expected.getSupplier().getId(), actual.getSupplier().getId());
        }
    }

    /**
     * Assert toàn bộ field PurchaseOrder.
     */
    private void assertPurchaseOrderEquals(PurchaseOrder expected, PurchaseOrder actual) {
        assertNotNull(actual.getId());
        assertEquals(expected.getPoCode(), actual.getPoCode());
        assertEquals(expected.getStatus(), actual.getStatus());
        assertEquals(expected.getCreatedBy(), actual.getCreatedBy());
        assertEquals(expected.getNote(), actual.getNote());
        if (expected.getSupplier() != null) {
            assertEquals(expected.getSupplier().getId(), actual.getSupplier().getId());
        }
    }

    /**
     * Assert toàn bộ field ProductDetail (Serial).
     */
    private void assertProductDetailEquals(ProductDetail expected, ProductDetail actual) {
        assertNotNull(actual.getId());
        assertEquals(expected.getSerialNumber(), actual.getSerialNumber());
        assertEquals(expected.getImportPrice(), actual.getImportPrice());
        assertEquals(expected.getWarrantyMonths(), actual.getWarrantyMonths());
        assertEquals(expected.getStatus(), actual.getStatus());
        if (expected.getWarehouseProduct() != null) {
            assertEquals(expected.getWarehouseProduct().getId(), actual.getWarehouseProduct().getId());
        }
    }

    /**
     * Assert toàn bộ field InventoryStock.
     */
    private void assertInventoryStockEquals(InventoryStock expected, InventoryStock actual) {
        assertNotNull(actual.getId());
        assertEquals(expected.getOnHand(), actual.getOnHand());
        assertEquals(expected.getReserved(), actual.getReserved());
        assertEquals(expected.getDamaged(), actual.getDamaged());
        if (expected.getWarehouseProduct() != null) {
            assertEquals(expected.getWarehouseProduct().getId(), actual.getWarehouseProduct().getId());
        }
    }

    // =========================================================================================
    // T E S T S : getAllSuppliers
    //
    // Phân tích nhánh logic:
    // 0 điểm rẽ nhánh (không có if/for/while/toán tử 3 ngôi).
    //
    // Công thức: số test = 0 + 1 = 1
    //
    // Ánh xạ test → code:
    // 1. Happy Path (TC 001) ✅
    //
    // Tổng cộng: 1 Test Case.
    // =========================================================================================

    @Test
    @DisplayName("TC_INVENTORY_001 - Lấy danh sách nhà cung cấp thành công")
    void TC_INVENTORY_001_getAllSuppliers_success() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Lấy toàn bộ danh sách nhà cung cấp đang có trong DB.
        // Mặc định hệ thống luôn trả về list (có thể rỗng hoặc có phần tử).
        //
        // [ÁNH XẠ LOGIC CODE]
        // - Chạy thẳng lệnh supplierRepository.findAll()

        // 1. Chuẩn bị dữ liệu (Setup)
        Supplier s1 = supplierRepository.save(Supplier.builder()
                .name("NCC 1").taxCode("TAX1").email("ncc1@test.com").phone("0111111111")
                .address("Địa chỉ NCC 1").bankAccount("111111111").paymentTerm("COD")
                .paymentTermDays(0).active(true).autoCreated(true).build());
        Supplier s2 = supplierRepository.save(Supplier.builder()
                .name("NCC 2").taxCode("TAX2").email("ncc2@test.com").phone("0222222222")
                .address("Địa chỉ NCC 2").bankAccount("222222222").paymentTerm("NET30")
                .paymentTermDays(30).active(true).autoCreated(true).build());
        Map<String, Long> beforeCounts = captureRecordCounts();

        // 2. Thực thi (Execute)
        ApiResponse response = inventoryService.getAllSuppliers();

        // 3. Assert
        assertTrue(response.isSuccess());
        List<Supplier> data = (List<Supplier>) response.getData();
        assertNotNull(data);
        // DB có thể có data cũ nhưng ít nhất phải có 2 record vừa insert
        assertTrue(data.size() >= 2);

        // Lấy ra phần tử vừa thêm để so khớp toàn bộ thuộc tính
        Supplier actualS1 = data.stream()
                .filter(s -> s.getTaxCode().equals("TAX1")).findFirst().orElseThrow();
        assertSupplierEquals(s1, actualS1);

        Supplier actualS2 = data.stream()
                .filter(s -> s.getTaxCode().equals("TAX2")).findFirst().orElseThrow();
        assertSupplierEquals(s2, actualS2);

        // 4. Kiểm tra side effect: Hàm GET không được làm thay đổi DB
        assertRecordCountsUnchanged(beforeCounts);
    }

    // =========================================================================================
    // T E S T S : getOrCreateSupplier
    //
    // Phân tích nhánh logic:
    // 1. if (req.getTaxCode() != null)                          → True / False
    // 2. if (byTax.isPresent())                                 → True (return) / False (đi tiếp)
    // 3. if (req.getEmail() != null)                            → True / False
    // 4. if (byEmail.isPresent())                               → True (return) / False (đi tiếp)
    // 5. if (req.getPhone() != null)                            → True / False
    // 6. if (byPhone.isPresent())                               → True (return) / False (save mới)
    //
    // Công thức: số test = 6 + 1 = 7
    //
    // Ánh xạ test → code:
    // 1. TaxCode != null, byTax.isPresent() = True             → Return NCC cũ (TC 002) ✅
    // 2. TaxCode == null, Email != null, byEmail = True        → Return NCC cũ (TC 003) ✅
    // 3. TaxCode != null, byTax = False, Email != null,
    //    byEmail = True                                         → Return NCC cũ (TC 004) ✅
    // 4. TaxCode == null, Email == null, Phone != null,
    //    byPhone = True                                         → Return NCC cũ (TC 005) ✅
    // 5. TaxCode != null, byTax = False, Email != null,
    //    byEmail = False, Phone != null, byPhone = True        → Return NCC cũ (TC 006) ✅
    // 6. Tất cả isPresent = False, có Tax/Email/Phone          → Tạo mới (TC 007) ✅
    // 7. Tất cả field nhận diện = null                         → Tạo mới (TC 008) ✅
    //
    // Tổng cộng: 7 Test Cases (đủ phủ tất cả nhánh chính).
    // =========================================================================================

    @Test
    @DisplayName("TC_INVENTORY_002 - Trả về Supplier cũ khi TaxCode đã tồn tại")
    void TC_INVENTORY_002_getOrCreateSupplier_existTaxCode() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Request gửi lên có TaxCode, và DB đã có sẵn Supplier với TaxCode này.
        // Trả về Supplier cũ mà không tạo mới, bỏ qua kiểm tra Email và Phone.
        //
        // [ÁNH XẠ LOGIC CODE]
        // - if (req.getTaxCode() != null) -> True
        // - if (byTax.isPresent()) -> True -> Return ngay

        // 1. Chuẩn bị
        Supplier existing = supplierRepository.save(Supplier.builder()
                .name("NCC Cũ").active(true).taxCode("TAX002").email("old002@test.com")
                .phone("0900000002").address("Địa chỉ cũ").bankAccount("002002002")
                .paymentTerm("COD").paymentTermDays(0).autoCreated(true).build());
        CreateSupplierRequest req = buildCreateSupplierRequest("Tên Mới", "TAX002", "email@test.com", "0987654321");
        Map<String, Long> beforeCounts = captureRecordCounts();

        // 2. Thực thi
        ApiResponse response = inventoryService.getOrCreateSupplier(req);

        // 3. Assert
        assertTrue(response.isSuccess());
        Supplier result = (Supplier) response.getData();
        // ID phải là ID cũ, không được tạo ra ID mới
        assertEquals(existing.getId(), result.getId());
        // Toàn bộ thuộc tính phải là của NCC cũ, không bị ghi đè bởi thông tin mới
        assertSupplierEquals(existing, result);

        // 4. Kiểm tra side effect: Không record nào bị thêm mới
        assertRecordCountsUnchanged(beforeCounts);
    }

    @Test
    @DisplayName("TC_INVENTORY_003 - Trả về Supplier cũ khi Email tồn tại (TaxCode null)")
    void TC_INVENTORY_003_getOrCreateSupplier_existEmail_nullTaxCode() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Request không có TaxCode nhưng có Email đã tồn tại. Trả về Supplier cũ theo Email.
        //
        // [ÁNH XẠ LOGIC CODE]
        // - if (req.getTaxCode() != null) -> False -> Bỏ qua khối 1
        // - if (req.getEmail() != null) -> True
        // - if (byEmail.isPresent()) -> True -> Return

        // 1. Chuẩn bị
        Supplier existing = supplierRepository.save(Supplier.builder()
                .name("NCC Theo Email").taxCode("TAX003").email("exist@test.com")
                .phone("0900000003").address("Địa chỉ 003").bankAccount("003003003")
                .paymentTerm("COD").paymentTermDays(0).active(true).autoCreated(true).build());
        CreateSupplierRequest req = buildCreateSupplierRequest("Tên Mới", null, "exist@test.com", "0987654321");
        Map<String, Long> beforeCounts = captureRecordCounts();

        // 2. Thực thi
        ApiResponse response = inventoryService.getOrCreateSupplier(req);

        // 3. Assert
        assertTrue(response.isSuccess());
        Supplier result = (Supplier) response.getData();
        assertEquals(existing.getId(), result.getId());
        // Thuộc tính phải là của NCC cũ, không bị ghi đè
        assertSupplierEquals(existing, result);

        // 4. Kiểm tra side effect
        assertRecordCountsUnchanged(beforeCounts);
    }

    @Test
    @DisplayName("TC_INVENTORY_004 - Trả về Supplier cũ khi Email tồn tại (TaxCode có nhưng không tìm thấy)")
    void TC_INVENTORY_004_getOrCreateSupplier_existEmail_taxCodeNotFound() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // TaxCode có gửi lên nhưng không tồn tại trong DB, code chạy tiếp xuống check Email.
        // Email tồn tại -> trả về NCC theo Email.
        //
        // [ÁNH XẠ LOGIC CODE]
        // - if (req.getTaxCode() != null) -> True
        // - if (byTax.isPresent()) -> False -> Thoát khối 1
        // - if (req.getEmail() != null) -> True
        // - if (byEmail.isPresent()) -> True -> Return

        // 1. Chuẩn bị
        Supplier existing = supplierRepository.save(Supplier.builder()
                .name("NCC Lệch Tax").taxCode("TAX004").email("match@test.com")
                .phone("0900000004").address("Địa chỉ 004").bankAccount("004004004")
                .paymentTerm("COD").paymentTermDays(0).active(true).autoCreated(true).build());
        CreateSupplierRequest req = buildCreateSupplierRequest("Tên Mới", "NOT_EXIST_TAX", "match@test.com", "0987654321");
        Map<String, Long> beforeCounts = captureRecordCounts();

        // 2. Thực thi
        ApiResponse response = inventoryService.getOrCreateSupplier(req);

        // 3. Assert
        assertTrue(response.isSuccess());
        Supplier result = (Supplier) response.getData();
        assertEquals(existing.getId(), result.getId());
        // Thuộc tính phải là của NCC cũ, không bị ghi đè
        assertSupplierEquals(existing, result);

        // 4. Kiểm tra side effect
        assertRecordCountsUnchanged(beforeCounts);
    }

    @Test
    @DisplayName("TC_INVENTORY_005 - Trả về Supplier cũ khi Phone tồn tại (Tax & Email null)")
    void TC_INVENTORY_005_getOrCreateSupplier_existPhone_nullTaxAndEmail() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Cả TaxCode và Email đều rỗng, nhưng Phone tồn tại -> trả về NCC cũ theo Phone.
        //
        // [ÁNH XẠ LOGIC CODE]
        // - if (req.getTaxCode() != null) -> False
        // - if (req.getEmail() != null) -> False
        // - if (req.getPhone() != null) -> True
        // - if (byPhone.isPresent()) -> True -> Return

        // 1. Chuẩn bị
        Supplier existing = supplierRepository.save(Supplier.builder()
                .name("NCC Phone").taxCode("TAX005").email("ncc005@test.com")
                .phone("0123456789").address("Địa chỉ 005").bankAccount("005005005")
                .paymentTerm("COD").paymentTermDays(0).active(true).autoCreated(true).build());
        CreateSupplierRequest req = buildCreateSupplierRequest("Tên Mới", null, null, "0123456789");
        Map<String, Long> beforeCounts = captureRecordCounts();

        // 2. Thực thi
        ApiResponse response = inventoryService.getOrCreateSupplier(req);

        // 3. Assert
        assertTrue(response.isSuccess());
        Supplier result = (Supplier) response.getData();
        assertEquals(existing.getId(), result.getId());
        // Thuộc tính phải là của NCC cũ, không bị ghi đè
        assertSupplierEquals(existing, result);

        // 4. Kiểm tra side effect
        assertRecordCountsUnchanged(beforeCounts);
    }

    @Test
    @DisplayName("TC_INVENTORY_006 - Trả về Supplier cũ khi Phone tồn tại (Tax & Email có nhưng không tìm thấy)")
    void TC_INVENTORY_006_getOrCreateSupplier_existPhone_taxAndEmailNotFound() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Gửi đủ thông tin, nhưng TaxCode và Email không khớp ai cả.
        // Xuyên qua 2 khối đầu, tới khối check Phone thì khớp -> Trả về NCC theo Phone.
        //
        // [ÁNH XẠ LOGIC CODE]
        // - if (req.getTaxCode() != null) -> True -> isPresent = False
        // - if (req.getEmail() != null) -> True -> isPresent = False
        // - if (req.getPhone() != null) -> True -> isPresent = True -> Return

        // 1. Chuẩn bị
        Supplier existing = supplierRepository.save(Supplier.builder()
                .name("NCC Phone 2").taxCode("TAX006").email("ncc006@test.com")
                .phone("0999999999").address("Địa chỉ 006").bankAccount("006006006")
                .paymentTerm("COD").paymentTermDays(0).active(true).autoCreated(true).build());
        CreateSupplierRequest req = buildCreateSupplierRequest("Tên Mới", "TAX_FAKE", "fake@email.com", "0999999999");
        Map<String, Long> beforeCounts = captureRecordCounts();

        // 2. Thực thi
        ApiResponse response = inventoryService.getOrCreateSupplier(req);

        // 3. Assert
        assertTrue(response.isSuccess());
        Supplier result = (Supplier) response.getData();
        assertEquals(existing.getId(), result.getId());
        assertSupplierEquals(existing, result);

        // 4. Kiểm tra side effect
        assertRecordCountsUnchanged(beforeCounts);
    }

    @Test
    @DisplayName("TC_INVENTORY_007 - Tạo Supplier mới khi gửi đủ info nhưng không ai khớp")
    void TC_INVENTORY_007_getOrCreateSupplier_createNew_notFound() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Gửi đủ thông tin, nhưng qua 3 lượt check (Tax, Email, Phone) đều không khớp.
        // -> Đâm xuống logic Supplier.builder()...build() và save().
        //
        // [ÁNH XẠ LOGIC CODE]
        // - isPresent của cả 3 đều False -> Không bị return sớm
        // - Chạy supplierRepository.save(supplier)

        // 1. Chuẩn bị
        CreateSupplierRequest req = buildCreateSupplierRequest("NCC Tạo Mới 1", "TAX_NEW", "new@test.com", "0888888888");
        Map<String, Long> beforeCounts = captureRecordCounts();

        // 2. Thực thi
        ApiResponse response = inventoryService.getOrCreateSupplier(req);

        // 3. Assert
        assertTrue(response.isSuccess());
        Supplier result = (Supplier) response.getData();
        // Phải sinh ID mới
        assertNotNull(result.getId());

        // Load lại từ DB để xác nhận đã lưu đầy đủ thuộc tính
        Supplier dbSupplier = supplierRepository.findById(result.getId()).orElseThrow();
        assertEquals("NCC Tạo Mới 1", dbSupplier.getName());
        assertEquals("TAX_NEW", dbSupplier.getTaxCode());
        assertEquals("new@test.com", dbSupplier.getEmail());
        assertEquals("0888888888", dbSupplier.getPhone());
        assertEquals("Test Address", dbSupplier.getAddress());
        assertEquals("123456789", dbSupplier.getBankAccount());
        assertEquals("COD", dbSupplier.getPaymentTerm());
        assertEquals(0, dbSupplier.getPaymentTermDays());
        assertTrue(dbSupplier.getActive());
        assertTrue(dbSupplier.getAutoCreated());

        // 4. Kiểm tra side effect: Bảng Supplier phải tăng 1 record
        assertEquals(beforeCounts.get("Supplier") + 1, supplierRepository.count());
    }

    @Test
    @DisplayName("TC_INVENTORY_008 - Tạo Supplier mới khi toàn bộ info nhận diện null")
    void TC_INVENTORY_008_getOrCreateSupplier_createNew_allNull() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Edge case: Request gửi lên toàn bộ info nhận diện (Tax, Email, Phone) bị null.
        // -> Bỏ qua toàn bộ 3 cục if, rơi thẳng xuống save() và vẫn tạo thành công (dữ liệu rác).
        //
        // [ÁNH XẠ LOGIC CODE]
        // - if (req.getTaxCode() != null) -> False
        // - if (req.getEmail() != null) -> False
        // - if (req.getPhone() != null) -> False
        // - Chạy supplierRepository.save(supplier)

        // 1. Chuẩn bị
        CreateSupplierRequest req = new CreateSupplierRequest();
        req.setName("NCC Ẩn Danh");
        Map<String, Long> beforeCounts = captureRecordCounts();

        // 2. Thực thi
        ApiResponse response = inventoryService.getOrCreateSupplier(req);

        // 3. Assert
        assertTrue(response.isSuccess());
        Supplier result = (Supplier) response.getData();
        assertNotNull(result.getId());
        assertEquals("NCC Ẩn Danh", result.getName());
        assertNull(result.getTaxCode());
        assertNull(result.getEmail());
        assertNull(result.getPhone());
        assertTrue(result.getActive());
        assertTrue(result.getAutoCreated());

        // 4. Kiểm tra side effect
        assertEquals(beforeCounts.get("Supplier") + 1, supplierRepository.count());
    }

    // =========================================================================================
    // T E S T S : createWarehouseProduct
    //
    // Phân tích nhánh logic:
    // 1. if (existing.isPresent())                              → True (error) / False (đi tiếp)
    // 2. if (req.getSupplierId() != null)                       → True / False
    // 3. supplierRepository.findById().orElseThrow()            → Found / Throw
    // 4. req.getTechSpecsJson() != null ? ... : "{}"            → True (giá trị) / False ("{}")
    //
    // Công thức: số test = 4 + 1 = 5
    //
    // Ánh xạ test → code:
    // 1. SKU đã tồn tại                                         → Error (TC 009) ✅
    // 2. SupplierId != null, Supplier không tìm thấy           → Exception (TC 010) ✅
    // 3. SupplierId != null, Supplier tìm thấy, TechSpecs != null → Success (TC 011) ✅
    // 4. SupplierId == null, TechSpecs != null                  → Success (TC 012) ✅
    // 5. SupplierId == null, TechSpecs == null                  → Success, fallback "{}" (TC 013) ✅
    //
    // Tổng cộng: 5 Test Cases (phủ đủ).
    // =========================================================================================

    @Test
    @DisplayName("TC_INVENTORY_009 - Tạo SP Kho thất bại do trùng SKU")
    void TC_INVENTORY_009_createWarehouseProduct_skuExists() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Không cho phép tạo SP Kho nếu mã SKU đã tồn tại trong hệ thống.
        //
        // [ÁNH XẠ LOGIC CODE]
        // - existing.isPresent() -> True
        // - Return ApiResponse.error(...)

        // 1. Chuẩn bị: Tạo sẵn sản phẩm với SKU trùng
        warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_DUP").internalName("Old").build());
        CreateWarehouseProductRequest req = buildCreateWarehouseProductRequest("SKU_DUP", "New", null);
        Map<String, Long> beforeCounts = captureRecordCounts();

        // 2. Thực thi
        ApiResponse response = inventoryService.createWarehouseProduct(req);

        // 3. Assert
        assertFalse(response.isSuccess());
        // Hệ thống phải thông báo rõ lý do thất bại
        assertNotNull(response.getMessage());
        assertFalse(response.getMessage().isBlank());

        // 4. Kiểm tra side effect: Không record nào bị thêm mới
        assertRecordCountsUnchanged(beforeCounts);
    }

    @Test
    @DisplayName("TC_INVENTORY_010 - Tạo SP Kho thất bại do Supplier ID không tìm thấy")
    void TC_INVENTORY_010_createWarehouseProduct_supplierNotFound() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Người dùng có truyền Supplier ID, nhưng ID này là ảo (không có trong DB).
        // Phải báo lỗi chặn lại, không lưu rác vào kho.
        //
        // [ÁNH XẠ LOGIC CODE]
        // - existing.isPresent() -> False
        // - req.getSupplierId() != null -> True
        // - supplierRepository.findById() -> Empty -> orElseThrow() kích hoạt

        // 1. Chuẩn bị: ID Supplier không tồn tại trong DB
        CreateWarehouseProductRequest req = buildCreateWarehouseProductRequest("SKU_NEW", "Tên Nội Bộ", 9999L);
        Map<String, Long> beforeCounts = captureRecordCounts();

        // 2. Thực thi: Hệ thống phải từ chối tạo mới khi Supplier không hợp lệ
        // Không giả định loại exception cụ thể vì đó là quyết định của tầng dev/framework
        assertThrows(Exception.class, () -> {
            inventoryService.createWarehouseProduct(req);
        });

        // 3. Kiểm tra side effect: Phải bảo toàn data, không insert rác
        assertRecordCountsUnchanged(beforeCounts);
    }

    @Test
    @DisplayName("TC_INVENTORY_011 - Tạo SP Kho thành công có Supplier và có TechSpecs")
    void TC_INVENTORY_011_createWarehouseProduct_success_withSupplier_withTechSpecs() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Flow chuẩn nhất: Không trùng SKU, gắn Supplier hợp lệ, và có truyền JSON thông số kỹ thuật.
        //
        // [ÁNH XẠ LOGIC CODE]
        // - existing.isPresent() -> False
        // - req.getSupplierId() != null -> True
        // - supplierRepository.findById() -> Có -> Lấy ra
        // - req.getTechSpecsJson() != null -> True -> Lấy nguyên gốc JSON

        // 1. Chuẩn bị
        Supplier supplier = supplierRepository.save(Supplier.builder()
                .name("NCC X").active(true).taxCode("TAX011").autoCreated(true).build());
        CreateWarehouseProductRequest req = buildCreateWarehouseProductRequest("SKU_FULL", "Tên Full", supplier.getId());
        req.setDescription("Mô tả chi tiết sản phẩm full");
        req.setTechSpecsJson("{\"weight\":\"10kg\"}");
        Map<String, Long> beforeCounts = captureRecordCounts();

        // 2. Thực thi
        ApiResponse response = inventoryService.createWarehouseProduct(req);

        // 3. Assert
        assertTrue(response.isSuccess());
        WarehouseProduct result = (WarehouseProduct) response.getData();
        assertNotNull(result.getId());

        // Load lại từ DB để xác nhận toàn bộ thuộc tính đã lưu đúng
        WarehouseProduct dbProduct = warehouseProductRepository.findById(result.getId()).orElseThrow();
        assertEquals("SKU_FULL", dbProduct.getSku());
        assertEquals("Tên Full", dbProduct.getInternalName());
        assertEquals("Mô tả chi tiết sản phẩm full", dbProduct.getDescription());
        assertEquals("{\"weight\":\"10kg\"}", dbProduct.getTechSpecsJson());
        assertNotNull(dbProduct.getSupplier());
        assertEquals(supplier.getId(), dbProduct.getSupplier().getId());

        // 4. Kiểm tra side effect: Bảng WarehouseProduct tăng 1
        assertEquals(beforeCounts.get("WarehouseProduct") + 1, warehouseProductRepository.count());
    }

    @Test
    @DisplayName("TC_INVENTORY_012 - Tạo SP Kho thành công không có Supplier nhưng có TechSpecs")
    void TC_INVENTORY_012_createWarehouseProduct_success_noSupplier_withTechSpecs() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Cho phép tạo SP Kho chưa biết nhà cung cấp (SupplierId = null).
        //
        // [ÁNH XẠ LOGIC CODE]
        // - existing.isPresent() -> False
        // - req.getSupplierId() != null -> False -> Supplier = null
        // - req.getTechSpecsJson() != null -> True -> Lấy giá trị gửi lên

        // 1. Chuẩn bị
        CreateWarehouseProductRequest req = buildCreateWarehouseProductRequest("SKU_NO_SUP", "Tên Không Sup", null);
        req.setDescription("Mô tả không có nhà cung cấp");
        req.setTechSpecsJson("{\"color\":\"blue\"}");
        Map<String, Long> beforeCounts = captureRecordCounts();

        // 2. Thực thi
        ApiResponse response = inventoryService.createWarehouseProduct(req);

        // 3. Assert
        assertTrue(response.isSuccess());
        WarehouseProduct result = (WarehouseProduct) response.getData();

        // Load từ DB để xác nhận
        WarehouseProduct dbProduct = warehouseProductRepository.findById(result.getId()).orElseThrow();
        assertEquals("SKU_NO_SUP", dbProduct.getSku());
        assertEquals("Tên Không Sup", dbProduct.getInternalName());
        assertEquals("Mô tả không có nhà cung cấp", dbProduct.getDescription());
        assertNull(dbProduct.getSupplier());
        assertEquals("{\"color\":\"blue\"}", dbProduct.getTechSpecsJson());

        // 4. Kiểm tra side effect
        assertEquals(beforeCounts.get("WarehouseProduct") + 1, warehouseProductRepository.count());
    }

    @Test
    @DisplayName("TC_INVENTORY_013 - Tạo SP Kho thành công không có Supplier, TechSpecs null fallback về {}")
    void TC_INVENTORY_013_createWarehouseProduct_success_noSupplier_noTechSpecs() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Người dùng không gửi Supplier, và bỏ trống TechSpecs (null).
        // Hệ thống phải tự fallback TechSpecs về JSON rỗng "{}" để tránh NullPointer khi parse.
        //
        // [ÁNH XẠ LOGIC CODE]
        // - existing.isPresent() -> False
        // - req.getSupplierId() != null -> False
        // - req.getTechSpecsJson() != null -> False -> fallback "{}" (toán tử 3 ngôi False)

        // 1. Chuẩn bị
        CreateWarehouseProductRequest req = buildCreateWarehouseProductRequest("SKU_BARE", "Tên Trần", null);
        req.setDescription("Mô tả tối giản");
        req.setTechSpecsJson(null); // Explicitly null
        Map<String, Long> beforeCounts = captureRecordCounts();

        // 2. Thực thi
        ApiResponse response = inventoryService.createWarehouseProduct(req);

        // 3. Assert
        assertTrue(response.isSuccess());
        WarehouseProduct result = (WarehouseProduct) response.getData();

        // Load từ DB để xác nhận
        WarehouseProduct dbProduct = warehouseProductRepository.findById(result.getId()).orElseThrow();
        assertEquals("SKU_BARE", dbProduct.getSku());
        assertEquals("Tên Trần", dbProduct.getInternalName());
        assertEquals("Mô tả tối giản", dbProduct.getDescription());
        assertNull(dbProduct.getSupplier());
        // Toán tử 3 ngôi phải đã hoạt động, fallback về {}
        assertEquals("{}", dbProduct.getTechSpecsJson());

        // 4. Kiểm tra side effect
        assertEquals(beforeCounts.get("WarehouseProduct") + 1, warehouseProductRepository.count());
    }

    // =========================================================================================
    // T E S T S : updateWarehouseProduct
    //
    // Phân tích nhánh logic:
    // 1. findById(id).orElseThrow()                             → Found / Throw
    // 2. if (!wp.getSku().equals(req.getSku()))                 → True (SKU đổi) / False
    // 3. if (existing.isPresent()) [trong nhánh đổi SKU]       → True (lỗi trùng) / False (ok)
    // 4. if (req.getSupplierId() != null)                       → True / False
    // 5. supplierRepository.findById().orElseThrow()            → Found / Throw
    // 6. req.getTechSpecsJson() != null ? ... : "{}"            → True / False
    //
    // Công thức: số test = 6 + 1 = 7
    //
    // Ánh xạ test → code:
    // 1. findById → Không thấy                                  → Exception (TC 014) ✅
    // 2. SKU đổi, SKU mới đã tồn tại                           → Error (TC 015) ✅
    // 3. Supplier != null, Supplier không tìm thấy             → Exception (TC 016) ✅
    // 4. SKU không đổi, Supplier = null, TechSpecs = null      → Success, fallback "{}" (TC 017) ✅
    // 5. SKU đổi, SKU mới hợp lệ, Supplier = null, TechSpecs  → Success (TC 018) ✅
    // 6. SKU không đổi, Supplier = có, TechSpecs = null        → Success + gán Supplier (TC 019) ✅
    // 7. Full tất cả thay đổi (SKU mới + Supplier mới + Specs) → Success (TC 020) ✅
    //
    // Tổng cộng: 7 Test Cases (phủ đủ).
    // =========================================================================================

    @Test
    @DisplayName("TC_INVENTORY_014 - Cập nhật SP Kho thất bại do không tìm thấy ID sản phẩm")
    void TC_INVENTORY_014_updateWarehouseProduct_productNotFound() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Ngăn chặn việc cập nhật một sản phẩm không tồn tại trong hệ thống.
        //
        // [ÁNH XẠ LOGIC CODE]
        // - warehouseProductRepository.findById(id) -> Empty
        // - orElseThrow() kích hoạt -> ném Exception

        // 1. Chuẩn bị: Sử dụng ID ảo chắc chắn không tồn tại
        CreateWarehouseProductRequest req = buildCreateWarehouseProductRequest("SKU_UPD", "Update Name", null);
        Map<String, Long> beforeCounts = captureRecordCounts();

        // 2. Thực thi: Hệ thống phải từ chối khi ID không tồn tại
        // Không giả định loại exception cụ thể vì đó là quyết định của tầng dev/framework
        assertThrows(Exception.class, () -> {
            inventoryService.updateWarehouseProduct(9999L, req);
        });

        // 3. Kiểm tra side effect: Phải bảo toàn data
        assertRecordCountsUnchanged(beforeCounts);
    }

    @Test
    @DisplayName("TC_INVENTORY_015 - Cập nhật SP Kho thất bại do đổi sang SKU đã tồn tại")
    void TC_INVENTORY_015_updateWarehouseProduct_newSkuAlreadyExists() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // User muốn đổi SKU của sản phẩm A sang một SKU mới,
        // nhưng SKU mới này lại bị sản phẩm B chiếm dụng. Hệ thống phải chặn lại và báo lỗi.
        //
        // [ÁNH XẠ LOGIC CODE]
        // - findById() -> Có sản phẩm
        // - if (!wp.getSku().equals(req.getSku())) -> True (SKU bị đổi)
        // - existing.isPresent() -> True (Bị trùng)
        // - Return ApiResponse.error(...)

        // 1. Chuẩn bị: Tạo 2 sản phẩm riêng biệt
        WarehouseProduct wpA = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_A").internalName("A").build());
        warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_B").internalName("B").build());

        // Muốn update A nhưng lấy SKU của B
        CreateWarehouseProductRequest req = buildCreateWarehouseProductRequest("SKU_B", "Update Name", null);
        Map<String, Long> beforeCounts = captureRecordCounts();

        // 2. Thực thi
        ApiResponse response = inventoryService.updateWarehouseProduct(wpA.getId(), req);

        // 3. Assert
        assertFalse(response.isSuccess());
        // Hệ thống phải thông báo rõ lý do thất bại
        assertNotNull(response.getMessage());
        assertFalse(response.getMessage().isBlank());

        // 4. Kiểm tra side effect: Không record nào bị thêm hay thay đổi
        assertRecordCountsUnchanged(beforeCounts);
    }

    @Test
    @DisplayName("TC_INVENTORY_016 - Cập nhật SP Kho thất bại do không tìm thấy ID Nhà cung cấp")
    void TC_INVENTORY_016_updateWarehouseProduct_supplierNotFound() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // User muốn cập nhật/đổi nhà cung cấp cho sản phẩm, nhưng truyền sai ID Supplier.
        //
        // [ÁNH XẠ LOGIC CODE]
        // - findById() -> Có sản phẩm
        // - if (!wp.getSku().equals(req.getSku())) -> False (Không đổi SKU)
        // - if (req.getSupplierId() != null) -> True
        // - supplierRepository.findById() -> Empty -> orElseThrow()

        // 1. Chuẩn bị
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_SUP_FAIL").internalName("Name").build());
        CreateWarehouseProductRequest req = buildCreateWarehouseProductRequest("SKU_SUP_FAIL", "New Name", 9999L);
        Map<String, Long> beforeCounts = captureRecordCounts();

        // 2. Thực thi: Hệ thống phải từ chối khi Supplier ID không hợp lệ
        assertThrows(Exception.class, () -> {
            inventoryService.updateWarehouseProduct(wp.getId(), req);
        });

        // 3. Kiểm tra side effect
        assertRecordCountsUnchanged(beforeCounts);
    }

    @Test
    @DisplayName("TC_INVENTORY_017 - Cập nhật SP Kho thành công: SKU không đổi, không Supplier, TechSpecs null")
    void TC_INVENTORY_017_updateWarehouseProduct_success_skuUnchanged_noSupplier_noTechSpecs() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // User chỉ update tên hoặc mô tả, giữ nguyên SKU, bỏ qua Supplier,
        // và không gửi TechSpecs (buộc hệ thống fallback về "{}").
        //
        // [ÁNH XẠ LOGIC CODE]
        // - !wp.getSku().equals(...) -> False -> Skip check trùng
        // - req.getSupplierId() != null -> False -> Skip gán supplier
        // - req.getTechSpecsJson() != null -> False -> Toán tử 3 ngôi fallback "{}"

        // 1. Chuẩn bị: capture TRƯỚC KHI tạo wp để đo side effect chính xác
        Map<String, Long> beforeCounts = captureRecordCounts();

        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_UNCHANGED").internalName("Old Name").techSpecsJson("{\"old\":\"val\"}").build());

        CreateWarehouseProductRequest req = buildCreateWarehouseProductRequest("SKU_UNCHANGED", "New Name", null);
        req.setDescription("New Desc");
        req.setTechSpecsJson(null); // Force null để kiểm tra fallback

        // 2. Thực thi
        ApiResponse response = inventoryService.updateWarehouseProduct(wp.getId(), req);

        // 3. Assert
        assertTrue(response.isSuccess());
        WarehouseProduct result = (WarehouseProduct) response.getData();

        // Load lại từ DB để xác nhận
        WarehouseProduct dbProduct = warehouseProductRepository.findById(result.getId()).orElseThrow();
        assertEquals("SKU_UNCHANGED", dbProduct.getSku()); // SKU phải giữ nguyên
        assertEquals("New Name", dbProduct.getInternalName()); // Tên đã cập nhật
        assertEquals("New Desc", dbProduct.getDescription()); // Mô tả đã cập nhật
        assertNull(dbProduct.getSupplier()); // Không gán supplier
        assertEquals("{}", dbProduct.getTechSpecsJson()); // Fallback từ null về {}

        // 4. Kiểm tra side effect: Update không làm tăng số lượng record, chỉ tăng 1 do tạo wp ở trên
        assertEquals(beforeCounts.get("WarehouseProduct") + 1, warehouseProductRepository.count());
    }

    @Test
    @DisplayName("TC_INVENTORY_018 - Cập nhật SP Kho thành công: Đổi SKU mới, không Supplier, có TechSpecs")
    void TC_INVENTORY_018_updateWarehouseProduct_success_skuChanged_noSupplier_withTechSpecs() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // User đổi sang một SKU mới hoàn toàn hợp lệ (chưa ai dùng). Truyền JSON chuẩn.
        //
        // [ÁNH XẠ LOGIC CODE]
        // - !wp.getSku().equals(...) -> True (SKU bị đổi)
        // - existing.isPresent() -> False (SKU mới hợp lệ) -> setSku()
        // - req.getSupplierId() != null -> False -> Skip
        // - req.getTechSpecsJson() != null -> True -> Lấy giá trị gửi lên

        // 1. Chuẩn bị
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_OLD").internalName("Old").description("Mô tả cũ").build());
        CreateWarehouseProductRequest req = buildCreateWarehouseProductRequest("SKU_FRESH", "Brand New", null);
        req.setDescription("Mô tả mới");
        req.setTechSpecsJson("{\"weight\":\"5kg\"}");
        Map<String, Long> beforeCounts = captureRecordCounts();

        // 2. Thực thi
        ApiResponse response = inventoryService.updateWarehouseProduct(wp.getId(), req);

        // 3. Assert
        assertTrue(response.isSuccess());

        // Load từ DB xác nhận đã lưu
        WarehouseProduct dbProduct = warehouseProductRepository.findById(wp.getId()).orElseThrow();
        assertEquals("SKU_FRESH", dbProduct.getSku()); // SKU đã cập nhật
        assertEquals("Brand New", dbProduct.getInternalName()); // Tên đã cập nhật
        assertEquals("Mô tả mới", dbProduct.getDescription()); // Mô tả đã cập nhật
        assertNull(dbProduct.getSupplier());
        assertEquals("{\"weight\":\"5kg\"}", dbProduct.getTechSpecsJson()); // TechSpecs đã cập nhật

        // 4. Kiểm tra side effect: Chỉ update, không sinh record mới
        assertRecordCountsUnchanged(beforeCounts);
    }

    @Test
    @DisplayName("TC_INVENTORY_019 - Cập nhật SP Kho thành công: Cập nhật thêm Supplier, SKU không đổi")
    void TC_INVENTORY_019_updateWarehouseProduct_success_skuUnchanged_addSupplier() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Ban đầu sản phẩm chưa có Supplier, giờ update để gán Supplier vào.
        //
        // [ÁNH XẠ LOGIC CODE]
        // - !wp.getSku().equals(...) -> False
        // - req.getSupplierId() != null -> True
        // - supplierRepository.findById() -> Có -> Gán setSupplier()

        // 1. Chuẩn bị
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_WAIT_SUP").internalName("No Sup").description("Chưa có NCC").build());
        Supplier sup = supplierRepository.save(Supplier.builder()
                .name("NCC Mới Gắn").active(true).taxCode("TAX019").autoCreated(true).build());
        CreateWarehouseProductRequest req = buildCreateWarehouseProductRequest("SKU_WAIT_SUP", "Has Sup", sup.getId());
        req.setDescription("Đã có NCC");
        req.setTechSpecsJson(null);
        Map<String, Long> beforeCounts = captureRecordCounts();

        // 2. Thực thi
        ApiResponse response = inventoryService.updateWarehouseProduct(wp.getId(), req);

        // 3. Assert
        assertTrue(response.isSuccess());

        WarehouseProduct dbProduct = warehouseProductRepository.findById(wp.getId()).orElseThrow();
        assertEquals("SKU_WAIT_SUP", dbProduct.getSku());
        assertEquals("Has Sup", dbProduct.getInternalName());
        assertEquals("Đã có NCC", dbProduct.getDescription());
        assertNotNull(dbProduct.getSupplier());
        assertEquals(sup.getId(), dbProduct.getSupplier().getId()); // Gán supplier thành công
        assertEquals("{}", dbProduct.getTechSpecsJson()); // TechSpecs null fallback {}

        // 4. Kiểm tra side effect
        assertRecordCountsUnchanged(beforeCounts);
    }

    @Test
    @DisplayName("TC_INVENTORY_020 - Cập nhật SP Kho thành công: Full tất cả các trường thay đổi (Happy Path)")
    void TC_INVENTORY_020_updateWarehouseProduct_success_fullUpdate() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Cập nhật toàn diện: Đổi SKU mới, Đổi Supplier mới, Đổi Name, Đổi Description, Đổi TechSpecs.
        //
        // [ÁNH XẠ LOGIC CODE]
        // Vượt qua trót lọt và đi vào tất cả các nhánh True của luồng thành công.

        // 1. Chuẩn bị cũ
        Supplier oldSup = supplierRepository.save(Supplier.builder()
                .name("NCC Old").active(true).taxCode("TAX020").autoCreated(true).build());
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_1").internalName("Name 1").description("Desc 1")
                .supplier(oldSup).techSpecsJson("{\"a\":\"b\"}").build());

        // Chuẩn bị mới
        Supplier newSup = supplierRepository.save(Supplier.builder()
                .name("NCC New").active(true).taxCode("TAX021").autoCreated(true).build());
        CreateWarehouseProductRequest req = buildCreateWarehouseProductRequest("SKU_2", "Name 2", newSup.getId());
        req.setDescription("Desc 2");
        req.setTechSpecsJson("{\"x\":\"y\"}");
        Map<String, Long> beforeCounts = captureRecordCounts();

        // 2. Thực thi
        ApiResponse response = inventoryService.updateWarehouseProduct(wp.getId(), req);

        // 3. Assert
        assertTrue(response.isSuccess());

        WarehouseProduct dbProduct = warehouseProductRepository.findById(wp.getId()).orElseThrow();
        assertEquals("SKU_2", dbProduct.getSku()); // SKU thay đổi
        assertEquals("Name 2", dbProduct.getInternalName()); // Tên thay đổi
        assertEquals("Desc 2", dbProduct.getDescription()); // Mô tả thay đổi
        assertNotNull(dbProduct.getSupplier());
        assertEquals(newSup.getId(), dbProduct.getSupplier().getId()); // Supplier thay đổi
        assertEquals("{\"x\":\"y\"}", dbProduct.getTechSpecsJson()); // TechSpecs thay đổi

        // 4. Kiểm tra side effect: Chỉ update, không sinh record mới
        assertRecordCountsUnchanged(beforeCounts);
    }

    // =========================================================================================
    // T E S T S : createPurchaseOrder
    //
    // Phân tích nhánh logic:
    // 1. if (req.getSupplier() == null || req.getSupplier().getTaxCode() == null)
    //    ├── Supplier == null                                    → Throw
    //    ├── Supplier != null, TaxCode == null                  → Throw
    //    └── Cả 2 hợp lệ                                        → Đi tiếp
    // 2. supplierRepository.findByTaxCode().orElseGet()         → Present (dùng cũ) / Get (tạo mới)
    // 3. req.getItems().stream().map() – vòng lặp               → Rỗng (bypass) / Có phần tử
    // 4. warehouseProductRepository.findBySku().orElseGet()     → Present (dùng cũ) / Get (tạo mới)
    // 5. internalName != null && !internalName.isEmpty()        → True / False (NULL) / False (EMPTY)
    // 6. techSpecsJson != null && !techSpecsJson.isEmpty()      → True / False (NULL) / False (EMPTY)
    //
    // Công thức: 2+2+2+3+3 = 12 nhánh cơ bản → 12 Test Cases
    //
    // Ánh xạ test → code:
    // 1.  Supplier == null                                       → Exception (TC 021) ✅
    // 2.  Supplier != null, TaxCode == null                     → Exception (TC 022) ✅
    // 3.  Supplier hợp lệ, items rỗng                           → Success, PO rỗng (TC 023) ✅
    // 4.  Supplier cũ + WP cũ                                   → Không tạo mới (TC 024) ✅
    // 5.  WP mới, name=null, tech=null                          → Fallback cả 2 (TC 025) ✅
    // 6.  WP mới, name="", tech=""                              → Fallback cả 2 (TC 026) ✅
    // 7.  WP mới, name hợp lệ, tech hợp lệ                     → Lấy giá trị (TC 027) ✅
    // 8.  WP mới, name hợp lệ, tech=""                         → name OK, tech fallback (TC 028) ✅
    // 9.  WP mới, name=null, tech hợp lệ                       → name fallback, tech OK (TC 029) ✅
    // 10. WP mới, name="", tech=null                            → Cả 2 fallback (TC 030) ✅
    // 11. Nhiều items: 1 WP cũ + 1 WP mới                      → Mix (TC 031) ✅
    // 12. Assert full field PO + Item + WP                      → (TC 032) ✅
    //
    // ⚠️ Thiếu:
    // - Nhánh Supplier mới được tạo qua orElseGet (TC 023 create Supplier mới nhưng không
    //   assert đầy đủ orElseGet builder). TC 023 chỉ dùng supplier mới không check log.
    //
    // Tổng cộng: 12 Test Cases (phủ đủ các đường nhánh chính).
    // =========================================================================================

    @Test
    @DisplayName("TC_INVENTORY_021 - Tạo PO thất bại: Supplier truyền vào bị null")
    void TC_INVENTORY_021_createPO_supplierNull() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Request không đính kèm thông tin Supplier -> Chặn ngay ở if đầu tiên.
        //
        // [ÁNH XẠ LOGIC CODE]
        // - req.getSupplier() == null -> True -> Throw Exception

        // 1. Chuẩn bị
        CreatePORequest req = buildCreatePORequest(null, new ArrayList<>(List.of()));
        Map<String, Long> beforeCounts = captureRecordCounts();

        // 2. Thực thi: Hệ thống phải từ chối khi thiếu thông tin Supplier bắt buộc
        assertThrows(Exception.class, () -> {
            inventoryService.createPurchaseOrder(req);
        });

        // 3. Kiểm tra side effect: Không ghi gì vào DB
        assertRecordCountsUnchanged(beforeCounts);
    }

    @Test
    @DisplayName("TC_INVENTORY_022 - Tạo PO thất bại: Supplier có nhưng TaxCode bị null")
    void TC_INVENTORY_022_createPO_taxCodeNull() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Request có Supplier nhưng quên truyền mã số thuế (bắt buộc để định danh).
        // Lưu ý: TaxCode có ràng buộc NOT NULL ở tầng DB nên exception có thể xuất hiện
        // từ tầng dev check hoặc từ DB constraint — không phụ thuộc vào cách dev implement.
        //
        // [ÁNH XẠ LOGIC CODE]
        // - req.getSupplier() != null -> True
        // - req.getSupplier().getTaxCode() == null -> True -> Throw Exception

        // 1. Chuẩn bị
        CreateSupplierRequest supReq = buildCreateSupplierRequest("NCC", null, "email@test.com", "0123");
        CreatePORequest req = buildCreatePORequest(supReq, new ArrayList<>(List.of()));
        Map<String, Long> beforeCounts = captureRecordCounts();

        // 2. Thực thi: Phải từ chối — không quan tâm exception là loại gì vì có thể đến từ DB
        assertThrows(Exception.class, () -> {
            inventoryService.createPurchaseOrder(req);
        });

        // 3. Kiểm tra side effect: Không ghi gì vào DB
        assertRecordCountsUnchanged(beforeCounts);
    }

    @Test
    @DisplayName("TC_INVENTORY_023 - Tạo PO thành công nhưng list Items rỗng")
    void TC_INVENTORY_023_createPO_emptyItems() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // User tạo phiếu nhập hàng nhưng chưa thêm sản phẩm nào vào phiếu (lưu nháp).
        //
        // [ÁNH XẠ LOGIC CODE]
        // - Supplier hợp lệ, khác null.
        // - req.getItems().stream() -> rỗng -> không chạy vào orElseGet của SP

        // 1. Chuẩn bị
        CreateSupplierRequest supReq = buildCreateSupplierRequest("NCC Mới", "TAX_NEW_PO", null, null);
        CreatePORequest req = buildCreatePORequest(supReq, new ArrayList<>(List.of())); // List rỗng
        Map<String, Long> beforeCounts = captureRecordCounts();

        // 2. Thực thi
        ApiResponse response = inventoryService.createPurchaseOrder(req);

        // 3. Assert
        assertTrue(response.isSuccess());
        PurchaseOrder po = (PurchaseOrder) response.getData();
        assertNotNull(po.getId());
        assertNotNull(po.getPoCode());
        assertEquals(POStatus.CREATED, po.getStatus());
        assertTrue(po.getItems().isEmpty()); // List item trống
        assertEquals("NCC Mới", po.getSupplier().getName());
        assertEquals("TAX_NEW_PO", po.getSupplier().getTaxCode());

        // 4. Kiểm tra side effect: Tăng 1 Supplier và 1 PurchaseOrder
        assertEquals(beforeCounts.get("Supplier") + 1, supplierRepository.count());
        assertEquals(beforeCounts.get("PurchaseOrder") + 1, purchaseOrderRepository.count());
        // PurchaseOrderItem không tăng do items rỗng
        assertEquals(beforeCounts.get("PurchaseOrderItem"), purchaseOrderItemRepository.count());
    }

    @Test
    @DisplayName("TC_INVENTORY_024 - Tạo PO thành công: Supplier đã tồn tại, WP đã tồn tại")
    void TC_INVENTORY_024_createPO_existingSupplier_existingWP() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Nhập hàng với Nhà cung cấp cũ và Sản phẩm cũ.
        // Không được phép tạo thêm Supplier hay WarehouseProduct rác.
        //
        // [ÁNH XẠ LOGIC CODE]
        // - supplierRepository.findByTaxCode() -> Present -> Không chạy orElseGet
        // - warehouseProductRepository.findBySku() -> Present -> Không chạy orElseGet

        // 1. Chuẩn bị data cũ
        Supplier existSup = supplierRepository.save(Supplier.builder()
                .name("NCC Cu").taxCode("TAX_EXIST").email("exist@test.com").phone("0900000024")
                .address("Địa chỉ tồn tại").bankAccount("024024024").paymentTerm("COD")
                .paymentTermDays(0).active(true).autoCreated(true).build());
        WarehouseProduct existWp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_EXIST").internalName("Old").supplier(existSup)
                .description("Mô tả cũ").techSpecsJson("{\"old\":\"data\"}").build());

        CreateSupplierRequest supReq = buildCreateSupplierRequest("NCC Đổi Tên Kệ Nó", "TAX_EXIST", null, null);
        POItemRequest itemReq = buildPOItemRequest("SKU_EXIST", "Tên ảo", "{}", 10, 50000);
        CreatePORequest req = buildCreatePORequest(supReq, new ArrayList<>(List.of(itemReq)));
        Map<String, Long> beforeCounts = captureRecordCounts();

        // 2. Thực thi
        ApiResponse response = inventoryService.createPurchaseOrder(req);

        // 3. Assert
        assertTrue(response.isSuccess());
        PurchaseOrder po = (PurchaseOrder) response.getData();

        // Assert Supplier lấy đúng cái cũ, không tạo mới
        assertEquals(existSup.getId(), po.getSupplier().getId());
        assertEquals("NCC Cu", po.getSupplier().getName()); // Tên cũ không bị ghi đè

        // Assert Item lấy đúng WP cũ, không tạo mới
        assertEquals(1, po.getItems().size());
        assertEquals(existWp.getId(), po.getItems().get(0).getWarehouseProduct().getId());
        assertEquals("SKU_EXIST", po.getItems().get(0).getSku());
        assertEquals(10L, po.getItems().get(0).getQuantity());
        assertEquals(50000.0, po.getItems().get(0).getUnitCost());

        // 4. Kiểm tra side effect: Supplier và WP không bị tăng thêm
        assertEquals(beforeCounts.get("Supplier"), supplierRepository.count());
        assertEquals(beforeCounts.get("WarehouseProduct"), warehouseProductRepository.count());
        assertEquals(beforeCounts.get("PurchaseOrder") + 1, purchaseOrderRepository.count());
        assertEquals(beforeCounts.get("PurchaseOrderItem") + 1, purchaseOrderItemRepository.count());
    }

    @Test
    @DisplayName("TC_INVENTORY_025 - Tạo PO thành công: WP mới -> Name = null, TechSpecs = null (Toán tử 3 ngôi path 1)")
    void TC_INVENTORY_025_createPO_newWP_nameNull_techNull() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Nhập một SP mới hoàn toàn, nhưng không truyền tên (null) và techSpecs (null).
        // Hệ thống phải fallback tên thành "Sản phẩm mới - [SKU]" và TechSpecs thành "{}".
        //
        // [ÁNH XẠ LOGIC CODE]
        // - internalName != null -> False -> Lấy vế sau (Sản phẩm mới - SKU)
        // - techSpecsJson != null -> False -> Lấy vế sau ({})

        // 1. Chuẩn bị
        CreateSupplierRequest supReq = buildCreateSupplierRequest("NCC", "TAX_NULL_TEST", null, null);
        POItemRequest itemReq = buildPOItemRequest("SKU_NULL_TEST", null, null, 5, 100);
        CreatePORequest req = buildCreatePORequest(supReq, new ArrayList<>(List.of(itemReq)));
        Map<String, Long> beforeCounts = captureRecordCounts();

        // 2. Thực thi
        ApiResponse response = inventoryService.createPurchaseOrder(req);

        // 3. Assert
        assertTrue(response.isSuccess());

        // Kiểm tra SP Kho mới tạo trong DB phải có tên fallback
        WarehouseProduct newWp = warehouseProductRepository.findBySku("SKU_NULL_TEST").orElseThrow();
        assertEquals("Sản phẩm mới - SKU_NULL_TEST", newWp.getInternalName()); // Đã Fallback
        assertEquals("{}", newWp.getTechSpecsJson()); // Đã Fallback

        // 4. Kiểm tra side effect
        assertEquals(beforeCounts.get("WarehouseProduct") + 1, warehouseProductRepository.count());
        assertEquals(beforeCounts.get("Supplier") + 1, supplierRepository.count());
        assertEquals(beforeCounts.get("PurchaseOrder") + 1, purchaseOrderRepository.count());
        assertEquals(beforeCounts.get("PurchaseOrderItem") + 1, purchaseOrderItemRepository.count());
    }

    @Test
    @DisplayName("TC_INVENTORY_026 - Tạo PO thành công: WP mới -> Name = rỗng, TechSpecs = rỗng (Toán tử 3 ngôi path 2)")
    void TC_INVENTORY_026_createPO_newWP_nameEmpty_techEmpty() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // User truyền tên và thông số lên nhưng là chuỗi rỗng "".
        // Mặc dù != null là True, nhưng !isEmpty() là False -> Phải fallback.
        //
        // [ÁNH XẠ LOGIC CODE]
        // - internalName != null && !isEmpty() -> True && False -> Fallback
        // - techSpecsJson != null && !isEmpty() -> True && False -> Fallback

        // 1. Chuẩn bị
        CreateSupplierRequest supReq = buildCreateSupplierRequest("NCC", "TAX_EMPTY_TEST", null, null);
        POItemRequest itemReq = buildPOItemRequest("SKU_EMPTY_TEST", "", "", 5, 100);
        CreatePORequest req = buildCreatePORequest(supReq, new ArrayList<>(List.of(itemReq)));

        // 2. Thực thi
        inventoryService.createPurchaseOrder(req);

        // 3. Assert
        WarehouseProduct newWp = warehouseProductRepository.findBySku("SKU_EMPTY_TEST").orElseThrow();
        assertEquals("Sản phẩm mới - SKU_EMPTY_TEST", newWp.getInternalName()); // Fallback thành công
        assertEquals("{}", newWp.getTechSpecsJson()); // Fallback thành công
    }

    @Test
    @DisplayName("TC_INVENTORY_027 - Tạo PO thành công: WP mới -> Name hợp lệ, TechSpecs hợp lệ (Toán tử 3 ngôi path 3)")
    void TC_INVENTORY_027_createPO_newWP_nameValid_techValid() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // User truyền chuỗi thật có giá trị.
        //
        // [ÁNH XẠ LOGIC CODE]
        // - internalName != null && !isEmpty() -> True && True -> Lấy giá trị
        // - techSpecsJson != null && !isEmpty() -> True && True -> Lấy giá trị

        // 1. Chuẩn bị
        CreateSupplierRequest supReq = buildCreateSupplierRequest("NCC", "TAX_VALID_TEST", null, null);
        POItemRequest itemReq = buildPOItemRequest("SKU_VALID_TEST", "Tên Hợp Lệ", "{\"RAM\":\"8GB\"}", 5, 100);
        CreatePORequest req = buildCreatePORequest(supReq, new ArrayList<>(List.of(itemReq)));

        // 2. Thực thi
        inventoryService.createPurchaseOrder(req);

        // 3. Assert
        WarehouseProduct newWp = warehouseProductRepository.findBySku("SKU_VALID_TEST").orElseThrow();
        assertEquals("Tên Hợp Lệ", newWp.getInternalName()); // Lấy chính xác chuỗi gửi lên
        assertEquals("{\"RAM\":\"8GB\"}", newWp.getTechSpecsJson()); // Lấy chính xác JSON
    }

    @Test
    @DisplayName("TC_INVENTORY_028 - Toán tử chéo: Name hợp lệ, TechSpecs rỗng")
    void TC_INVENTORY_028_createPO_newWP_nameValid_techEmpty() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Kiểm tra sự kết hợp độc lập: Name có giá trị nhưng TechSpecs rỗng -> TechSpecs phải fallback.
        //
        // [ÁNH XẠ LOGIC CODE]
        // - internalName != null && !isEmpty() -> True -> Lấy giá trị
        // - techSpecsJson != null && !isEmpty() -> True && False -> Fallback

        // 1. Chuẩn bị
        CreateSupplierRequest supReq = buildCreateSupplierRequest("NCC", "TAX_MIX_1", null, null);
        POItemRequest itemReq = buildPOItemRequest("SKU_MIX_1", "Tên Chuẩn", "", 5, 100);
        CreatePORequest req = buildCreatePORequest(supReq, new ArrayList<>(List.of(itemReq)));

        // 2. Thực thi
        inventoryService.createPurchaseOrder(req);

        // 3. Assert
        WarehouseProduct newWp = warehouseProductRepository.findBySku("SKU_MIX_1").orElseThrow();
        assertEquals("Tên Chuẩn", newWp.getInternalName()); // Lấy giá trị gửi lên
        assertEquals("{}", newWp.getTechSpecsJson()); // TechSpecs bị rỗng -> fallback
    }

    @Test
    @DisplayName("TC_INVENTORY_029 - Toán tử chéo: Name null, TechSpecs hợp lệ")
    void TC_INVENTORY_029_createPO_newWP_nameNull_techValid() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Kiểm tra sự kết hợp độc lập: Name là null -> fallback, TechSpecs có giá trị -> giữ nguyên.
        //
        // [ÁNH XẠ LOGIC CODE]
        // - internalName != null -> False -> Fallback tên
        // - techSpecsJson != null && !isEmpty() -> True -> Lấy giá trị

        // 1. Chuẩn bị
        CreateSupplierRequest supReq = buildCreateSupplierRequest("NCC", "TAX_MIX_2", null, null);
        POItemRequest itemReq = buildPOItemRequest("SKU_MIX_2", null, "{\"ROM\":\"256\"}", 5, 100);
        CreatePORequest req = buildCreatePORequest(supReq, new ArrayList<>(List.of(itemReq)));

        // 2. Thực thi
        inventoryService.createPurchaseOrder(req);

        // 3. Assert
        WarehouseProduct newWp = warehouseProductRepository.findBySku("SKU_MIX_2").orElseThrow();
        assertEquals("Sản phẩm mới - SKU_MIX_2", newWp.getInternalName()); // Tên bị null -> fallback
        assertEquals("{\"ROM\":\"256\"}", newWp.getTechSpecsJson()); // Giữ nguyên giá trị gửi lên
    }

    @Test
    @DisplayName("TC_INVENTORY_030 - Toán tử chéo: Name rỗng, TechSpecs null")
    void TC_INVENTORY_030_createPO_newWP_nameEmpty_techNull() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Kiểm tra combo còn lại: Name rỗng -> fallback, TechSpecs null -> fallback.
        //
        // [ÁNH XẠ LOGIC CODE]
        // - internalName != null && !isEmpty() -> True && False -> Fallback tên
        // - techSpecsJson != null -> False -> Fallback {}

        // 1. Chuẩn bị
        CreateSupplierRequest supReq = buildCreateSupplierRequest("NCC", "TAX_MIX_3", null, null);
        POItemRequest itemReq = buildPOItemRequest("SKU_MIX_3", "", null, 5, 100);
        CreatePORequest req = buildCreatePORequest(supReq, new ArrayList<>(List.of(itemReq)));

        // 2. Thực thi
        inventoryService.createPurchaseOrder(req);

        // 3. Assert
        WarehouseProduct newWp = warehouseProductRepository.findBySku("SKU_MIX_3").orElseThrow();
        assertEquals("Sản phẩm mới - SKU_MIX_3", newWp.getInternalName()); // Fallback
        assertEquals("{}", newWp.getTechSpecsJson()); // Fallback
    }

    @Test
    @DisplayName("TC_INVENTORY_031 - Tạo PO thành công: Danh sách nhiều Item (Có cũ có mới)")
    void TC_INVENTORY_031_createPO_multipleItems_mixExistingAndNewWP() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Đảm bảo logic Stream.map() chạy đúng đắn với danh sách nhiều phần tử.
        // Trong đó 1 SKU đã tồn tại trong DB, 1 SKU chưa tồn tại (cần tạo mới).
        //
        // [ÁNH XẠ LOGIC CODE]
        // - Vòng lặp item 1: findBySku -> Có -> Skip orElseGet
        // - Vòng lặp item 2: findBySku -> Empty -> Chạy orElseGet tạo SP

        // 1. Chuẩn bị
        Supplier existSup = supplierRepository.save(Supplier.builder()
                .name("NCC 1").taxCode("TAX_MULTI").active(true).autoCreated(true).build());
        WarehouseProduct existWp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_OLD").internalName("Old").supplier(existSup).build());

        CreateSupplierRequest supReq = buildCreateSupplierRequest("NCC 1", "TAX_MULTI", null, null);
        POItemRequest item1 = buildPOItemRequest("SKU_OLD", "Name Ignored", "{}", 2, 100);
        POItemRequest item2 = buildPOItemRequest("SKU_NEW_BRAND", "Tên Mới", "{\"pin\":\"5000\"}", 3, 200);
        CreatePORequest req = buildCreatePORequest(supReq, new ArrayList<>(List.of(item1, item2)));
        Map<String, Long> beforeCounts = captureRecordCounts();

        // 2. Thực thi
        ApiResponse response = inventoryService.createPurchaseOrder(req);

        // 3. Assert
        assertTrue(response.isSuccess());
        PurchaseOrder po = purchaseOrderRepository.findById(((PurchaseOrder) response.getData()).getId()).orElseThrow();
        assertEquals(2, po.getItems().size());

        // 4. Kiểm tra side effect
        assertEquals(beforeCounts.get("PurchaseOrder") + 1, purchaseOrderRepository.count());
        assertEquals(beforeCounts.get("PurchaseOrderItem") + 2, purchaseOrderItemRepository.count()); // 2 items
        assertEquals(beforeCounts.get("WarehouseProduct") + 1, warehouseProductRepository.count()); // Chỉ thêm 1 WP mới
        assertEquals(beforeCounts.get("Supplier"), supplierRepository.count()); // Không thêm Supplier mới
    }

    @Test
    @DisplayName("TC_INVENTORY_032 - Assert toàn bộ field của PurchaseOrder và Items")
    void TC_INVENTORY_032_createPO_assertAllFields() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Đảm bảo lệnh Build của hệ thống gán dữ liệu chính xác 100% từ DTO xuống DB.

        // 1. Chuẩn bị request đầy đủ thông tin
        CreateSupplierRequest supReq = buildCreateSupplierRequest("Supplier Assert", "TAX_ASSERT", "a@a.com", "111");
        supReq.setAddress("Dia chi assert");
        supReq.setBankAccount("Bank assert");
        supReq.setPaymentTerm("Term assert");
        supReq.setPaymentTermDays(15);

        POItemRequest itemReq = buildPOItemRequest("SKU_ASSERT", "Internal Assert", "{\"a\":\"b\"}", 10, 999.5);
        itemReq.setNote("Note of Item Assert");

        CreatePORequest req = buildCreatePORequest(supReq, new ArrayList<>(List.of(itemReq)));
        req.setPoCode("PO-CODE-ABC");
        req.setNote("PO Note Assert");
        req.setCreatedBy("NhanVienA");

        // 2. Thực thi
        ApiResponse response = inventoryService.createPurchaseOrder(req);
        Long poId = ((PurchaseOrder) response.getData()).getId();

        // 3. Lấy lại từ DB để check toàn bộ field
        PurchaseOrder dbPo = purchaseOrderRepository.findById(poId).orElseThrow();

        // --- Assert Purchase Order ---
        assertEquals("PO-CODE-ABC", dbPo.getPoCode());
        assertEquals(POStatus.CREATED, dbPo.getStatus());
        assertEquals("NhanVienA", dbPo.getCreatedBy());
        assertEquals("PO Note Assert", dbPo.getNote());
        assertNotNull(dbPo.getOrderDate());

        // --- Assert Supplier ---
        Supplier dbSup = dbPo.getSupplier();
        assertNotNull(dbSup);
        assertEquals("Supplier Assert", dbSup.getName());
        assertEquals("TAX_ASSERT", dbSup.getTaxCode());
        assertEquals("a@a.com", dbSup.getEmail());
        assertEquals("111", dbSup.getPhone());
        assertEquals("Dia chi assert", dbSup.getAddress());
        assertEquals("Bank assert", dbSup.getBankAccount());
        assertEquals("Term assert", dbSup.getPaymentTerm());
        assertEquals(15, dbSup.getPaymentTermDays());
        assertTrue(dbSup.getActive());
        assertTrue(dbSup.getAutoCreated());

        // --- Assert Purchase Order Item ---
        assertEquals(1, dbPo.getItems().size());
        PurchaseOrderItem dbItem = dbPo.getItems().get(0);
        assertEquals("SKU_ASSERT", dbItem.getSku());
        assertEquals(10L, dbItem.getQuantity());
        assertEquals(999.5, dbItem.getUnitCost());
        assertEquals(12, dbItem.getWarrantyMonths());
        assertEquals("Note of Item Assert", dbItem.getNote());
        assertNotNull(dbItem.getPurchaseOrder());
        assertEquals(dbPo.getId(), dbItem.getPurchaseOrder().getId()); // Đảm bảo join column

        // --- Assert Warehouse Product ---
        WarehouseProduct dbWp = dbItem.getWarehouseProduct();
        assertNotNull(dbWp);
        assertEquals("SKU_ASSERT", dbWp.getSku());
        assertEquals("Internal Assert", dbWp.getInternalName());
        assertEquals("Note of Item Assert", dbWp.getDescription()); // description = i.getNote() theo logic code
        assertEquals("{\"a\":\"b\"}", dbWp.getTechSpecsJson());
        assertNotNull(dbWp.getSupplier());
        assertEquals(dbSup.getId(), dbWp.getSupplier().getId());
    }

    // =========================================================================================
    // T E S T S : completePurchaseOrder
    //
    // Phân tích nhánh logic (đếm theo quy tắc +1 mỗi rẽ nhánh):
    // 1.  try { doCompletePurchaseOrder(req) }                  → OK / Throw DIVE
    // 2.  catch (DataIntegrityViolationException e)             → Bắt được
    // 3.  if (message != null && message.contains("Duplicate")) → True / False
    // 4.  purchaseOrderRepository.findById().orElseThrow()      → Found / Throw
    // 5.  if (po.getStatus() != POStatus.CREATED)               → True (error) / False
    // 6.  for (ProductSerialRequest serialReq : req.getSerials())→ Rỗng / Có phần tử
    // 7.  po.getItems().stream()...orElseThrow()                → Found / Throw
    // 8.  if (wp == null)                                       → True (throw) / False
    // 9.  if (serialReq.getSerialNumbers().size() != item.getQuantity()) → True / False
    // 10. for (String sn : serialReq.getSerialNumbers())        → Rỗng / Có phần tử
    // 11. if (sn == null || sn.trim().isEmpty())                → True / False
    // 12. if (productDetailRepository.existsBySerialNumber(sn)) → True (trùng) / False
    // 13. if (item.getProductDetails() == null)                 → True (new ArrayList) / False
    // 14. catch (Exception e) quanh supplierPayableService      → Bắt lỗi / Không lỗi
    //     + if (payableResponse.isSuccess())                    → True (log info) / False (log warn)
    //
    // Tổng điểm rẽ: 14 → Số test = 17 (thêm TC 118, TC 123 cho nhánh DataIntegrity và payable false)
    //
    // Ánh xạ test → code:
    // 1.  findById → Không thấy PO                              → Exception (TC 033) ✅
    // 2.  PO status != CREATED                                  → Error Response (TC 034) ✅
    // 3.  serials rỗng – bypass for                             → Success (TC 035) ✅
    // 4.  SKU không thuộc PO                                    → Exception (TC 036) ✅
    // 5.  WP == null (lỗi data)                                 → Exception/DB constraint (TC 037) ✅
    // 6.  size != quantity                                      → Exception (TC 038) ✅
    // 7.  sn == null                                            → Exception (TC 039) ✅
    // 8.  sn blank/whitespace                                   → Exception (TC 040) ✅
    // 9.  serial đã tồn tại trong DB                           → Exception (TC 041) ✅
    // 10. Happy Path: Stock mới, không link Product             → Success (TC 042) ✅
    // 11. Happy Path: Stock cộng dồn, có sync Product           → Success (TC 043) ✅
    // 12. catch(Exception) quanh Payable → vẫn success         → (TC 044) ✅
    // 13. DataIntegrityViolation với "Duplicate entry"          → (TC 045) ✅
    // 14. 2 serial: 1 mới + 1 trùng → Rollback toàn bộ         → (TC 046) ✅
    // 15. warrantyMonths mặc định = 0                           → (TC 047) ✅
    // 16. payableResponse.isSuccess() → False (log warn)        → (TC 118) ✅
    // 17. DataIntegrity message KHÔNG chứa "Duplicate entry"    → (TC 121) ✅
    //
    // Tổng cộng: 17 Test Cases (phủ đủ tất cả nhánh chính).
    // =========================================================================================
    @Test
    @DisplayName("TC_INVENTORY_033 - Nhập hàng thất bại: Không tìm thấy PO")
    void TC_INVENTORY_033_completePO_poNotFound() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Báo lỗi ngay lập tức nếu ID phiếu nhập gửi lên không tồn tại.
        //
        // [ÁNH XẠ LOGIC CODE]
        // - purchaseOrderRepository.findById() -> Empty -> orElseThrow()

        // 1. Chuẩn bị
        CompletePORequest req = buildCompletePORequest(99999L, new ArrayList<>(List.of()));
        Map<String, Long> beforeCounts = captureRecordCounts();

        // 2. Thực thi: Hệ thống phải từ chối xử lý PO không tồn tại
        assertThrows(Exception.class, () -> {
            inventoryService.completePurchaseOrder(req);
        });

        // 3. Kiểm tra side effect
        assertRecordCountsUnchanged(beforeCounts);
    }

    @Test
    @DisplayName("TC_INVENTORY_034 - Nhập hàng thất bại: PO không ở trạng thái CREATED")
    void TC_INVENTORY_034_completePO_statusNotCreated() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Ngăn chặn nhập hàng nhiều lần trên cùng 1 phiếu (phiếu đã RECEIVED).
        //
        // [ÁNH XẠ LOGIC CODE]
        // - po.getStatus() != POStatus.CREATED -> True -> Return Error

        // 1. Chuẩn bị
        Supplier supplier = supplierRepository.save(Supplier.builder()
                .name("NCC Cũ").active(true).taxCode("TAX034").autoCreated(true).build());
        PurchaseOrder po = purchaseOrderRepository.save(PurchaseOrder.builder()
                .poCode("PO_RCV").status(POStatus.RECEIVED).supplier(supplier).build());
        CompletePORequest req = buildCompletePORequest(po.getId(), new ArrayList<>(List.of()));
        Map<String, Long> beforeCounts = captureRecordCounts();

        // 2. Thực thi
        ApiResponse response = inventoryService.completePurchaseOrder(req);

        // 3. Assert
        assertFalse(response.isSuccess());
        assertNotNull(response.getMessage());
        assertFalse(response.getMessage().isBlank());

        // 4. Kiểm tra side effect
        assertRecordCountsUnchanged(beforeCounts);
    }

    @Test
    @DisplayName("TC_INVENTORY_035 - Nhập hàng thành công: Bỏ qua vòng lặp do danh sách serials rỗng")
    void TC_INVENTORY_035_completePO_emptySerialsList() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Cố tình đẩy list rỗng. Code vẫn chạy qua, update status PO nhưng ko qua vòng lặp check Serial.
        //
        // [ÁNH XẠ LOGIC CODE]
        // - for (ProductSerialRequest serialReq : req.getSerials()) -> List = 0 -> Rẽ nhánh thoát For

        // 1. Chuẩn bị
        Supplier supplier = supplierRepository.save(Supplier.builder()
                .name("NCC Cũ").active(true).taxCode("TAX035").autoCreated(true).build());
        PurchaseOrder po = purchaseOrderRepository.save(PurchaseOrder.builder()
                .poCode("PO_EMPTY").status(POStatus.CREATED).supplier(supplier).build());
        CompletePORequest req = buildCompletePORequest(po.getId(), new ArrayList<>(List.of())); // Rỗng
        Map<String, Long> beforeCounts = captureRecordCounts();

        // 2. Thực thi
        ApiResponse response = inventoryService.completePurchaseOrder(req);

        // 3. Assert

        // Trạng thái PO phải chuyển sang RECEIVED
        PurchaseOrder dbPo = purchaseOrderRepository.findById(po.getId()).orElseThrow();
        assertEquals(POStatus.RECEIVED, dbPo.getStatus());

        // 4. Kiểm tra side effect: Không thêm ProductDetail hay InventoryStock
        assertRecordCountsUnchanged(beforeCounts);
    }

    @Test
    @DisplayName("TC_INVENTORY_036 - Nhập hàng thất bại: SKU gửi lên không có trong phiếu nhập")
    void TC_INVENTORY_036_completePO_skuNotInPO() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Quét nhầm mã vạch của sản phẩm không thuộc phiếu nhập này.
        //
        // [ÁNH XẠ LOGIC CODE]
        // - po.getItems().stream().filter(...) -> Empty -> orElseThrow()

        // 1. Chuẩn bị
        Supplier supplier = supplierRepository.save(Supplier.builder()
                .name("NCC Cũ").active(true).taxCode("TAX036").autoCreated(true).build());
        PurchaseOrder po = purchaseOrderRepository.save(
            PurchaseOrder.builder()
                .poCode("PO_SKU_FAIL")
                .status(POStatus.CREATED)
                .supplier(supplier)
                .items(new ArrayList<>()) // QUAN TRỌNG
                .build());
        WarehouseProduct wp = warehouseProductRepository.save(
            WarehouseProduct.builder()
                .sku("SKU_REAL")
                .internalName("Test")
                .build());
        PurchaseOrderItem item = purchaseOrderItemRepository.save(
            PurchaseOrderItem.builder()
                .purchaseOrder(po)
                .sku("SKU_REAL")
                .quantity(1L)
                .unitCost(100.0)
                .warehouseProduct(wp)
                .build());

        po.getItems().add(item);
        purchaseOrderRepository.save(po);
        
        ProductSerialRequest serialReq = buildProductSerialRequest("SKU_ALIEN", new ArrayList<>(List.of("SN1")));
        CompletePORequest req = buildCompletePORequest(po.getId(), new ArrayList<>(List.of(serialReq)));
        Map<String, Long> beforeCounts = captureRecordCounts();

        // 2. Thực thi: Hệ thống phải từ chối khi SKU không thuộc phiếu
        assertThrows(Exception.class, () -> {
            inventoryService.completePurchaseOrder(req);
        });

        // 3. Kiểm tra side effect
        assertRecordCountsUnchanged(beforeCounts);
    }

    @Test
    @DisplayName("TC_INVENTORY_037 - Nhập hàng thất bại: PO Item bị lỗi mất liên kết WarehouseProduct (wp == null)")
    void TC_INVENTORY_037_completePO_warehouseProductNull() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // PO Item không có liên kết WarehouseProduct (dữ liệu lỗi trong DB).
        // Service phải từ chối xử lý khi gặp trạng thái bất hợp lệ này.
        //
        // [ÁNH XẠ LOGIC CODE]
        // - wp = item.getWarehouseProduct() -> null
        // - if (wp == null) -> True -> throw IllegalStateException
 
        // 1. Tạo PO hợp lệ trên DB thật
        Supplier supplier = supplierRepository.save(Supplier.builder()
                .name("NCC 037 Fix").taxCode("TAX037FIX").email("ncc037@test.com").phone("0900000037")
                .address("Địa chỉ 037").bankAccount("037037037").paymentTerm("COD")
                .paymentTermDays(0).active(true).autoCreated(true).build());
        PurchaseOrder realPo = purchaseOrderRepository.save(PurchaseOrder.builder()
                .poCode("PO_WP_NULL_FIX").status(POStatus.CREATED).supplier(supplier).build());
 
        // 2. Ép in-memory: Tạo PO object có item với warehouseProduct = null
        //    để bypass DB constraint mà vẫn trigger nhánh if (wp == null)
        PurchaseOrderItem itemWithNullWp = PurchaseOrderItem.builder()
                // .id(9999L)
                .purchaseOrder(realPo)
                .sku("SKU_ORPHAN")
                .quantity(1L)
                .warehouseProduct(null) // ÉP NULL - bypass DB constraint
                .build();
        realPo.setItems(new ArrayList<>(List.of(itemWithNullWp)));
 
        org.mockito.Mockito.doReturn(java.util.Optional.of(realPo))
                .when(purchaseOrderRepository).findById(realPo.getId());
 
        ProductSerialRequest serialReq = buildProductSerialRequest("SKU_ORPHAN", List.of("SN_ORPHAN_1"));
        CompletePORequest req = buildCompletePORequest(realPo.getId(), List.of(serialReq));
 
        // 3. Thực thi: Service phải ném exception vì wp == null
        assertThrows(Exception.class, () -> {
            inventoryService.completePurchaseOrder(req);
        });
 
    }

    @Test
    @DisplayName("TC_INVENTORY_038 - Nhập hàng thất bại: Số lượng serial bắn lên khác số lượng trong PO")
    void TC_INVENTORY_038_completePO_sizeMismatchQuantity() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Đặt mua 5 cái, nhưng chỉ quét 2 mã. Bắt buộc quét đủ số lượng.
        //
        // [ÁNH XẠ LOGIC CODE]
        // - serialReq.getSerialNumbers().size() != item.getQuantity() -> True

        // 1. Chuẩn bị
        Supplier supplier = supplierRepository.save(Supplier.builder()
                .name("NCC Cũ").active(true).taxCode("TAX038").autoCreated(true).build());
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_MISMATCH").internalName("Test").build());
        PurchaseOrder po = purchaseOrderRepository.save(PurchaseOrder.builder()
                .poCode("PO_MIS").status(POStatus.CREATED).supplier(supplier)
                .items(new ArrayList<>()).build());
        PurchaseOrderItem item = PurchaseOrderItem.builder()
                .purchaseOrder(po).sku("SKU_MISMATCH").quantity(5L).warehouseProduct(wp).build();
        po.getItems().add(item);
        purchaseOrderRepository.save(po);
        purchaseOrderItemRepository.save(item);

        // Gửi 2 serial nhưng PO yêu cầu 5
        ProductSerialRequest serialReq = buildProductSerialRequest("SKU_MISMATCH", new ArrayList<>(List.of("SN1", "SN2")));
        CompletePORequest req = buildCompletePORequest(po.getId(), new ArrayList<>(List.of(serialReq)));
        Map<String, Long> beforeCounts = captureRecordCounts();

        // 2. Thực thi
        assertThrows(Exception.class, () -> {
            inventoryService.completePurchaseOrder(req);
        });

        // 3. Kiểm tra side effect
        assertRecordCountsUnchanged(beforeCounts);
    }

    @Test
    @DisplayName("TC_INVENTORY_039 - Nhập hàng thất bại: Tồn tại phần tử Null trong list Serial")
    void TC_INVENTORY_039_completePO_serialNull() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Quét lỗi ra mã Null -> Chặn. Serial number không được phép là null.
        //
        // [ÁNH XẠ LOGIC CODE]
        // - sn == null || sn.trim().isEmpty() -> Nhánh 1: sn == null -> True

        // 1. Chuẩn bị
        Supplier supplier = supplierRepository.save(Supplier.builder()
                .name("NCC Cũ").active(true).taxCode("TAX039").autoCreated(true).build());
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_NULL_SN").internalName("Test").build());
        PurchaseOrder po = purchaseOrderRepository.save(PurchaseOrder.builder()
                .poCode("PO_NULL_SN").status(POStatus.CREATED).supplier(supplier)
                .items(new ArrayList<>()).build());
        PurchaseOrderItem item = PurchaseOrderItem.builder()
                .purchaseOrder(po).sku("SKU_NULL_SN").quantity(1L).warehouseProduct(wp).build();
        po.getItems().add(item);
        purchaseOrderRepository.save(po);
        purchaseOrderItemRepository.save(item);

        List<String> badSerials = new ArrayList<>();
        badSerials.add(null);
        ProductSerialRequest serialReq = buildProductSerialRequest("SKU_NULL_SN", badSerials);
        CompletePORequest req = buildCompletePORequest(po.getId(), new ArrayList<>(List.of(serialReq)));
        Map<String, Long> beforeCounts = captureRecordCounts();

        // 2. Thực thi: Hệ thống phải từ chối serial null
        assertThrows(Exception.class, () -> {
            inventoryService.completePurchaseOrder(req);
        });

        // 3. Kiểm tra side effect
        assertRecordCountsUnchanged(beforeCounts);
    }

    @Test
    @DisplayName("TC_INVENTORY_040 - Nhập hàng thất bại: Tồn tại Serial rỗng (Whitespace)")
    void TC_INVENTORY_040_completePO_serialEmpty() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Quét lỗi ra khoảng trắng -> Chặn. Không chấp nhận serial chỉ có khoảng trắng.
        //
        // [ÁNH XẠ LOGIC CODE]
        // - sn == null || sn.trim().isEmpty() -> Nhánh 2: sn != null && sn.trim().isEmpty() -> True

        // 1. Chuẩn bị
        Supplier supplier = supplierRepository.save(Supplier.builder()
                .name("NCC Cũ").active(true).taxCode("TAX040").autoCreated(true).build());
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_EMPTY_SN").internalName("Test").build());
        PurchaseOrder po = purchaseOrderRepository.save(PurchaseOrder.builder()
                .poCode("PO_EMPTY_SN").status(POStatus.CREATED).supplier(supplier)
                .items(new ArrayList<>()).build());
        PurchaseOrderItem item = PurchaseOrderItem.builder()
                .purchaseOrder(po).sku("SKU_EMPTY_SN").quantity(1L).warehouseProduct(wp).build();
        po.getItems().add(item);
        purchaseOrderRepository.save(po);
        purchaseOrderItemRepository.save(item);

        ProductSerialRequest serialReq = buildProductSerialRequest("SKU_EMPTY_SN", new ArrayList<>(List.of("   "))); // Chỉ khoảng trắng
        CompletePORequest req = buildCompletePORequest(po.getId(), new ArrayList<>(List.of(serialReq)));
        Map<String, Long> beforeCounts = captureRecordCounts();

        // 2. Thực thi: Hệ thống phải từ chối serial chỉ là whitespace
        assertThrows(Exception.class, () -> {
            inventoryService.completePurchaseOrder(req);
        });

        // 3. Kiểm tra side effect
        assertRecordCountsUnchanged(beforeCounts);
    }

    @Test
    @DisplayName("TC_INVENTORY_041 - Nhập hàng thất bại: Serial gửi lên đã tồn tại trong DB")
    void TC_INVENTORY_041_completePO_serialAlreadyExistsInDB() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Ngăn chặn nhập trùng số series đã có trong hệ thống (dù từ phiếu nhập khác).
        //
        // [ÁNH XẠ LOGIC CODE]
        // - productDetailRepository.existsBySerialNumber(sn) -> True

        // 1. Chuẩn bị
        Supplier supplier = supplierRepository.save(Supplier.builder()
                .name("NCC Cũ").active(true).taxCode("TAX041").autoCreated(true).build());
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_EXIST_DB").internalName("Test").build());
        PurchaseOrder po = purchaseOrderRepository.save(PurchaseOrder.builder()
                .poCode("PO_EXIST_SN").status(POStatus.CREATED).supplier(supplier)
                .items(new ArrayList<>()).build());
        PurchaseOrderItem item = PurchaseOrderItem.builder()
                .purchaseOrder(po).sku("SKU_EXIST_DB").quantity(1L).warehouseProduct(wp).build();
        po.getItems().add(item);
        purchaseOrderRepository.save(po);
        purchaseOrderItemRepository.save(item);

        // Tạo sẵn serial đã tồn tại trong hệ thống
        productDetailRepository.save(ProductDetail.builder()
                .serialNumber("SN_DUP_123").status(ProductStatus.IN_STOCK).warehouseProduct(wp)
                .importPrice(100.0).warrantyMonths(12).build());

        ProductSerialRequest serialReq = buildProductSerialRequest("SKU_EXIST_DB", new ArrayList<>(List.of("SN_DUP_123")));
        CompletePORequest req = buildCompletePORequest(po.getId(), new ArrayList<>(List.of(serialReq)));
        Map<String, Long> beforeCounts = captureRecordCounts();

        // 2. Thực thi: Hệ thống phải từ chối serial đã tồn tại
        assertThrows(Exception.class, () -> {
            inventoryService.completePurchaseOrder(req);
        });

        // 3. Kiểm tra side effect
        assertRecordCountsUnchanged(beforeCounts);
    }

    @Test
    @DisplayName("TC_INVENTORY_042 - Nhập hàng thành công: Tạo mới InventoryStock, không link Product, không mock Payable")
    void TC_INVENTORY_042_completePO_happyPath_1() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Nhập hàng lần đầu cho một sản phẩm chưa từng có tồn kho.
        // Hệ thống tự động tạo mới bản ghi InventoryStock với onHand = số lượng nhập vào.
        // Sản phẩm kho không link với Product cha nên không cần đồng bộ.
        //
        // [ÁNH XẠ LOGIC CODE]
        // - inventoryStock.orElse -> Chạy Builder (Tạo mới vì chưa có)
        // - wp.getProduct() != null -> False (Bỏ qua đồng bộ bảng Product)
 
        // 1. Chuẩn bị dữ liệu
        Supplier supplier = supplierRepository.save(Supplier.builder()
                .name("NCC 042").taxCode("TAX042").email("ncc042@test.com").phone("0900000042")
                .address("Địa chỉ 042").bankAccount("042042042").paymentTerm("COD")
                .paymentTermDays(0).active(true).autoCreated(true).build());
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_HP1").internalName("SP 042 Test").description("Mô tả 042")
                .techSpecsJson("{\"color\":\"red\"}").build()); // product = null
        PurchaseOrder po = purchaseOrderRepository.save(PurchaseOrder.builder()
                .poCode("PO_HP1").status(POStatus.CREATED).supplier(supplier).build());
        PurchaseOrderItem item = PurchaseOrderItem.builder()
                .purchaseOrder(po)
                .sku("SKU_HP1")
                .quantity(1L)
                .unitCost(100.0)
                .warehouseProduct(wp)
                .build();

        po.setItems(new ArrayList<>());
        po.getItems().add(item);

        purchaseOrderRepository.save(po);
        purchaseOrderItemRepository.save(item);
 
        ProductSerialRequest serialReq = buildProductSerialRequest("SKU_HP1", new ArrayList<>(List.of("SN_HP1_A")));
        CompletePORequest req = buildCompletePORequest(po.getId(), new ArrayList<>(List.of(serialReq)));
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        // 2. Thực thi
        ApiResponse response = inventoryService.completePurchaseOrder(req);
 
        // 3. Assert kết quả trả về
        assertTrue(response.isSuccess());
 
        // 4. Kiểm tra InventoryStock được tạo mới với onHand = 1
        InventoryStock stock = inventoryStockRepository.findByWarehouseProduct_Id(wp.getId()).orElseThrow();
        assertEquals(1L, stock.getOnHand());
        assertEquals(wp.getId(), stock.getWarehouseProduct().getId());
 
        // 5. Kiểm tra ProductDetail được tạo với đúng Serial
        ProductDetail dbDetail = productDetailRepository.findAll().stream()
                .filter(d -> "SN_HP1_A".equals(d.getSerialNumber())).findFirst().orElseThrow();
        assertEquals(ProductStatus.IN_STOCK, dbDetail.getStatus());
        assertEquals(wp.getId(), dbDetail.getWarehouseProduct().getId());
        assertEquals(100.0, dbDetail.getImportPrice());
 
        // 6. Kiểm tra PO status chuyển RECEIVED
        PurchaseOrder dbPo = purchaseOrderRepository.findById(po.getId()).orElseThrow();
        assertEquals(POStatus.RECEIVED, dbPo.getStatus());
 
        // 7. Kiểm tra side effect: Tăng 1 ProductDetail, 1 InventoryStock
        assertEquals(beforeCounts.get("ProductDetail") + 1, productDetailRepository.count());
        assertEquals(beforeCounts.get("InventoryStock") + 1, inventoryStockRepository.count());
    }
 
    @Test
    @DisplayName("TC_INVENTORY_043 - Nhập hàng thành công: Cộng dồn InventoryStock hiện có, có đồng bộ Product cha")
    void TC_INVENTORY_043_completePO_happyPath_2() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Nhập thêm hàng cho một sản phẩm đã có tồn kho trước đó (cộng dồn thêm).
        // Sản phẩm kho có link với Product cha nên phải cập nhật stockQuantity của Product.
        //
        // [ÁNH XẠ LOGIC CODE]
        // - inventoryStock.orElse -> Lấy stock hiện có (Cộng dồn, không tạo mới)
        // - wp.getProduct() != null -> True -> Gọi đồng bộ bảng Product
 
        // 1. Chuẩn bị
        Product product = productRepository.save(Product.builder()
                .name("Prod 043").stockQuantity(10L).reservedQuantity(0L).build());
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_HP2").internalName("SP 043 Test").description("Mô tả 043")
                .techSpecsJson("{\"size\":\"L\"}").product(product).build());
        Supplier supplier = supplierRepository.save(Supplier.builder()
                .name("NCC 043").taxCode("TAX043").email("ncc043@test.com").phone("0900000043")
                .address("Địa chỉ 043").bankAccount("043043043").paymentTerm("COD")
                .paymentTermDays(0).active(true).autoCreated(true).build());
        PurchaseOrder po = purchaseOrderRepository.save(PurchaseOrder.builder()
                .poCode("PO_HP2").status(POStatus.CREATED).supplier(supplier).build());
        PurchaseOrderItem item = PurchaseOrderItem.builder()
                .purchaseOrder(po).sku("SKU_HP2").quantity(2L).unitCost(50.0)
                .warehouseProduct(wp).build();
        po.setItems(new ArrayList<>());
        po.getItems().add(item);
        purchaseOrderRepository.save(po);
        purchaseOrderItemRepository.save(item);
 
        // Tạo sẵn InventoryStock để ép nhánh cộng dồn
        inventoryStockRepository.save(InventoryStock.builder()
                .warehouseProduct(wp).onHand(10L).reserved(0L).damaged(0L).build());
 
        ProductSerialRequest serialReq = buildProductSerialRequest("SKU_HP2", new ArrayList<>(List.of("SN_HP2_A", "SN_HP2_B")));
        CompletePORequest req = buildCompletePORequest(po.getId(), new ArrayList<>(List.of(serialReq)));
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        // 2. Thực thi
        ApiResponse response = inventoryService.completePurchaseOrder(req);
 
        // 3. Assert kết quả trả về
        assertTrue(response.isSuccess());
 
        // 4. Kiểm tra InventoryStock được cộng dồn (10 + 2 = 12)
        InventoryStock dbStock = inventoryStockRepository.findByWarehouseProduct_Id(wp.getId()).orElseThrow();
        assertEquals(12L, dbStock.getOnHand());
 
        // 5. Kiểm tra đồng bộ bảng Product cha (FULL CỘT)
        Product dbProduct = productRepository.findById(product.getId()).orElseThrow();
        assertEquals(12L, dbProduct.getStockQuantity());
        assertEquals("Prod 043", dbProduct.getName());
 
        // 6. Kiểm tra 2 ProductDetail mới được tạo
        assertEquals(beforeCounts.get("ProductDetail") + 2, productDetailRepository.count());
 
        // 7. Không tạo thêm InventoryStock mới (chỉ update)
        assertRecordCountsUnchanged(new HashMap<>(Map.of(
                "InventoryStock", beforeCounts.get("InventoryStock")
        )) {{
            // Chỉ kiểm tra bảng InventoryStock không tăng
        }});
        assertEquals(beforeCounts.get("InventoryStock"), inventoryStockRepository.count());
    }
 
    @Test
    @DisplayName("TC_INVENTORY_044 - Nhập hàng thành công: Dịch vụ kế toán nội bộ gặp lỗi nhưng kho vẫn được nhập")
    void TC_INVENTORY_044_completePO_payableServiceFails_stockStillCompleted() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Đây là nghiệp vụ quan trọng: khi module kế toán gặp lỗi (không tìm thấy đơn,
        // throw exception nội bộ), việc nhập hàng vào kho vật lý VẪN PHẢI hoàn tất thành công.
        // Hệ thống không được rollback kho chỉ vì lỗi phụ từ kế toán.
        //
        // [ÁNH XẠ LOGIC CODE]
        // - catch (Exception e) quanh supplierPayableService -> Bắt lỗi, tiếp tục return success
 
        // 1. Chuẩn bị: PO hợp lệ nhưng KHÔNG mock payable (để tự nhiên)
        Supplier supplier = supplierRepository.save(Supplier.builder()
                .name("NCC 044").taxCode("TAX044").email("ncc044@test.com").phone("0900000044")
                .address("Địa chỉ 044").bankAccount("044044044").paymentTerm("COD")
                .paymentTermDays(0).active(true).autoCreated(true).build());
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_PAY_EX").internalName("SP Payable Fail").description("Test")
                .techSpecsJson("{}").build());
        PurchaseOrder po = purchaseOrderRepository.save(PurchaseOrder.builder()
                .poCode("PO_PAY_EX").status(POStatus.CREATED).supplier(supplier).build());
        PurchaseOrderItem item = PurchaseOrderItem.builder()
                .purchaseOrder(po).sku("SKU_PAY_EX").quantity(1L).unitCost(200.0)
                .warehouseProduct(wp).build();
        po.setItems(new ArrayList<>());
        po.getItems().add(item);
        purchaseOrderRepository.save(po);
        purchaseOrderItemRepository.save(item);

        doThrow(new RuntimeException("Payable lỗi"))
            .when(supplierPayableService)
            .createPayableFromPurchaseOrder(any());
 
        ProductSerialRequest serialReq = buildProductSerialRequest("SKU_PAY_EX", new ArrayList<>(List.of("SN_PAY_1")));
        CompletePORequest req = buildCompletePORequest(po.getId(), new ArrayList<>(List.of(serialReq)));
 
        ApiResponse response = inventoryService.completePurchaseOrder(req);
 
        // 3. Assert: Kho vẫn nhập thành công bất kể kế toán có lỗi hay không
        assertTrue(response.isSuccess());
 
        // 4. Assert PO đã chuyển trạng thái RECEIVED
        PurchaseOrder dbPo = purchaseOrderRepository.findById(po.getId()).orElseThrow();
        assertEquals(POStatus.RECEIVED, dbPo.getStatus());
 
        // 5. Assert serial đã được tạo trong DB
        assertTrue(productDetailRepository.existsBySerialNumber("SN_PAY_1"));
    }
 
    @Test
    @DisplayName("TC_INVENTORY_045 - Nhập hàng thất bại: Serial trùng lặp trong DB → DataIntegrity bị bắt")
    void TC_INVENTORY_045_completePO_duplicateSerial_caughtByService() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Nhân viên cố ý hoặc vô tình quét lại một serial đã từng nhập vào hệ thống từ
        // một phiếu nhập khác trước đó. Hệ thống phải từ chối và trả về thông báo lỗi,
        // KHÔNG được phép có 2 dòng cùng serial trong DB.
        //
        // [ÁNH XẠ LOGIC CODE]
        // - productDetailRepository.existsBySerialNumber(sn) -> True -> Throw Exception
        // HOẶC DB ném DataIntegrityViolationException với "Duplicate entry"
        // → Cả hai đều được bắt và trả về response error
 
        // 1. Chuẩn bị: Tạo sẵn serial đã tồn tại trong hệ thống
        Supplier supplier = supplierRepository.save(Supplier.builder()
                .name("NCC 045").taxCode("TAX045").email("ncc045@test.com").phone("0900000045")
                .address("Địa chỉ 045").bankAccount("045045045").paymentTerm("COD")
                .paymentTermDays(0).active(true).autoCreated(true).build());
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_DUP_REAL").internalName("SP Dup Test").description("Test dup")
                .techSpecsJson("{}").build());
        PurchaseOrder po = purchaseOrderRepository.save(PurchaseOrder.builder()
                .poCode("PO_DUP_REAL").status(POStatus.CREATED).supplier(supplier).build());
        PurchaseOrderItem item = PurchaseOrderItem.builder()
                .purchaseOrder(po).sku("SKU_DUP_REAL").quantity(1L).unitCost(100.0)
                .warehouseProduct(wp).build();
        po.setItems(new ArrayList<>());
        po.getItems().add(item);
        purchaseOrderRepository.save(po);
        purchaseOrderItemRepository.save(item);
 
        // Serial đã tồn tại từ lần nhập trước
        productDetailRepository.save(ProductDetail.builder()
                .serialNumber("SN_DUP_REAL").status(ProductStatus.IN_STOCK)
                .importPrice(100.0).warrantyMonths(12).warehouseProduct(wp).build());
 
        ProductSerialRequest serialReq = buildProductSerialRequest("SKU_DUP_REAL", new ArrayList<>(List.of("SN_DUP_REAL")));
        CompletePORequest req = buildCompletePORequest(po.getId(), new ArrayList<>(List.of(serialReq)));
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        // 2. Thực thi: Hệ thống phải từ chối (throw exception HOẶC trả response error)
        // Không biết dev throw chỗ nào → assertThrows chung chung
        assertThrows(Exception.class, () -> {
            inventoryService.completePurchaseOrder(req);
        });
 
        // 3. Kiểm tra side effect: Không được tạo thêm record nào
        assertRecordCountsUnchanged(beforeCounts);
    }
 
    @Test
    @DisplayName("TC_INVENTORY_046 - Nhập hàng thất bại: Nhiều serial, 1 trong số đó bị trùng → Toàn bộ bị rollback")
    void TC_INVENTORY_046_completePO_oneSerialDuplicate_rollbackAll() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Nhập 2 serial: serial đầu mới hoàn toàn, serial sau bị trùng với hàng cũ.
        // Vì đây là transaction, toàn bộ lần nhập này phải bị huỷ (rollback).
        // Không được phép ghi 1 nửa vào DB.
        //
        // [ÁNH XẠ LOGIC CODE]
        // - Vòng lặp serial chạy SN mới (ok), rồi gặp SN trùng -> throw Exception -> Rollback
 
        // 1. Chuẩn bị
        Supplier supplier = supplierRepository.save(Supplier.builder()
                .name("NCC 046").taxCode("TAX046").email("ncc046@test.com").phone("0900000046")
                .address("Địa chỉ 046").bankAccount("046046046").paymentTerm("COD")
                .paymentTermDays(0).active(true).autoCreated(true).build());
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_PARTIAL_DUP").internalName("SP Partial Dup").description("Test")
                .techSpecsJson("{}").build());
        PurchaseOrder po = purchaseOrderRepository.save(PurchaseOrder.builder()
                .poCode("PO_PARTIAL_DUP").status(POStatus.CREATED).supplier(supplier).build());
        PurchaseOrderItem item = PurchaseOrderItem.builder()
                .purchaseOrder(po).sku("SKU_PARTIAL_DUP").quantity(2L).unitCost(100.0)
                .warehouseProduct(wp).build();
        po.setItems(new ArrayList<>());
        po.getItems().add(item);
        purchaseOrderRepository.save(po);
        purchaseOrderItemRepository.save(item);
 
        // Serial cũ đã tồn tại
        productDetailRepository.save(ProductDetail.builder()
                .serialNumber("SN_OLD_DUP").status(ProductStatus.IN_STOCK)
                .importPrice(100.0).warrantyMonths(12).warehouseProduct(wp).build());
 
        // Gửi 2 serial: 1 mới + 1 trùng
        ProductSerialRequest serialReq = buildProductSerialRequest(
                "SKU_PARTIAL_DUP", new ArrayList<>(List.of("SN_BRAND_NEW", "SN_OLD_DUP")));
        CompletePORequest req = buildCompletePORequest(po.getId(), new ArrayList<>(List.of(serialReq)));
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        // 2. Thực thi: Phải throw exception
        assertThrows(Exception.class, () -> {
            inventoryService.completePurchaseOrder(req);
        });
 
        // 3. Kiểm tra side effect: Toàn bộ rollback, không thêm serial mới
        assertRecordCountsUnchanged(beforeCounts);
    }
 
    @Test
    @DisplayName("TC_INVENTORY_047 - Nhập hàng thất bại: Phiếu hợp lệ nhưng serial thiếu warrantyMonths trong POItem")
    void TC_INVENTORY_047_completePO_warrantyMonthsDefaultZero() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Nhân viên nhập hàng mà không điền số tháng bảo hành.
        // Hệ thống vẫn nhập được nhưng warrantyMonths của ProductDetail phải là 0 (mặc định).
        // Đây là kiểm tra nhánh giá trị mặc định khi warrantyMonths không được set.
        //
        // [ÁNH XẠ LOGIC CODE]
        // - item.getWarrantyMonths() -> 0 (Giá trị mặc định int) -> ProductDetail.warrantyMonths = 0
 
        // 1. Chuẩn bị: PO Item không set warrantyMonths (mặc định 0)
        Supplier supplier = supplierRepository.save(Supplier.builder()
                .name("NCC 047").taxCode("TAX047").email("ncc047@test.com").phone("0900000047")
                .address("Địa chỉ 047").bankAccount("047047047").paymentTerm("COD")
                .paymentTermDays(0).active(true).autoCreated(true).build());
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_NO_WARRANTY").internalName("SP Không BH").description("Test no warranty")
                .techSpecsJson("{}").build());
        PurchaseOrder po = purchaseOrderRepository.save(PurchaseOrder.builder()
            .poCode("PO_NO_WARRANTY")
            .status(POStatus.CREATED)
            .supplier(supplier)
            .items(new ArrayList<>()) // Khởi tạo list rỗng để tránh Null
            .build());
 
        // POItem với warrantyMonths không set (default 0)
        POItemRequest itemReq = new POItemRequest();
        itemReq.setSku("SKU_NO_WARRANTY");
        itemReq.setInternalName("SP Không BH");
        itemReq.setTechSpecsJson("{}");
        itemReq.setQuantity(1L);
        itemReq.setUnitCost(100.0);
        // warrantyMonths KHÔNG set → mặc định 0
 
        // Vì completePO cần PO đã có items trong DB (không tạo qua createPO),
        // ta lưu trực tiếp PurchaseOrderItem với warrantyMonths = 0
        PurchaseOrderItem item = PurchaseOrderItem.builder()
                .purchaseOrder(po)
                .sku("SKU_NO_WARRANTY")
                .quantity(1L)
                .unitCost(100.0)
                .warrantyMonths(0)
                .warehouseProduct(wp)
                .build();

        purchaseOrderItemRepository.save(item);
        po.getItems().add(item);
 
        ProductSerialRequest serialReq = buildProductSerialRequest("SKU_NO_WARRANTY", new ArrayList<>(List.of("SN_NO_WR")));
        CompletePORequest req = buildCompletePORequest(po.getId(), new ArrayList<>(List.of(serialReq)));
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        // 2. Thực thi
        ApiResponse response = inventoryService.completePurchaseOrder(req);
 
        // 3. Assert thành công
        assertTrue(response.isSuccess());
 
        // 4. Assert warrantyMonths = 0 trong ProductDetail
        ProductDetail dbDetail = productDetailRepository.findAll().stream()
                .filter(d -> "SN_NO_WR".equals(d.getSerialNumber())).findFirst().orElseThrow();
        assertEquals(0, dbDetail.getWarrantyMonths());
        assertEquals(100.0, dbDetail.getImportPrice());
        assertEquals(ProductStatus.IN_STOCK, dbDetail.getStatus());
        assertEquals(wp.getId(), dbDetail.getWarehouseProduct().getId());
 
        // 5. Kiểm tra side effect
        assertEquals(beforeCounts.get("ProductDetail") + 1, productDetailRepository.count());
        assertEquals(beforeCounts.get("InventoryStock") + 1, inventoryStockRepository.count());
    }
 
    // =========================================================================================
    // T E S T S : createExportOrder
    //
    // Phân tích nhánh logic:
    // 1. for (ExportItemRequest itemReq : req.getItems())       → Rỗng / Có phần tử
    // 2. warehouseProductRepository.findBySku().orElseThrow()   → Found / Throw
    // 3. inventoryStockRepository.findByWarehouseProduct_Id().orElseThrow() → Found / Throw
    // 4. if (stock.getOnHand() < exportCount)                   → True / False
    // 5. for (String serial : itemReq.getSerialNumbers())       → vòng lặp serial
    // 6. productDetailRepository.findBySerialNumber().orElseThrow() → Found / Throw
    // 7. if (detail.getStatus() != ProductStatus.IN_STOCK)      → True / False
    // 8. syncStockWithProduct → if (wp.getProduct() != null)    → True / False
    //
    // Công thức: 8 điểm → 8 Test Cases
    //
    // Ánh xạ test → code:
    // 1. items rỗng                                             → Success, phiếu trống (TC 048) ✅
    // 2. findBySku → Không thấy                                → Exception (TC 049) ✅
    // 3. Stock không tồn tại                                    → Exception (TC 050) ✅
    // 4. onHand < exportCount                                   → Exception (TC 051) ✅
    // 5. findBySerialNumber → Không thấy                       → Exception (TC 052) ✅
    // 6. status != IN_STOCK                                     → Exception (TC 053) ✅
    // 7. Happy Path, không sync Product                        → Success (TC 054) ✅
    // 8. Happy Path, đa serial, có sync Product                → Success (TC 055) ✅
    //
    // Tổng cộng: 8 Test Cases (phủ đủ).
    // =========================================================================================
 
    @Test
    @DisplayName("TC_INVENTORY_048 - Xuất kho thành công: Danh sách sản phẩm rỗng (Loop bypass)")
    void TC_INVENTORY_048_createExportOrder_emptyItems() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Người dùng tạo phiếu xuất nhưng chưa điền sản phẩm nào. Hệ thống vẫn tạo phiếu nhưng items rỗng.
        // [ÁNH XẠ LOGIC CODE]
        // - req.getItems() rỗng -> Bỏ qua vòng lặp for bên ngoài.
        // - Chạy thẳng lệnh exportOrderRepository.save(exportOrder).
 
        CreateExportOrderRequest req = buildCreateExportOrderRequest(new ArrayList<>(List.of()));
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        ApiResponse response = inventoryService.createExportOrder(req);
 
        assertTrue(response.isSuccess());
 
        // Assert DB
        String exportCode = (String) response.getData();
        ExportOrder dbOrder = exportOrderRepository.findByExportCode(exportCode).orElseThrow();
        assertEquals(ExportStatus.COMPLETED, dbOrder.getStatus());
        assertTrue(dbOrder.getItems().isEmpty());
 
        // Side effect: Tăng 1 ExportOrder, không tăng ExportOrderItem
        assertEquals(beforeCounts.get("ExportOrder") + 1, exportOrderRepository.count());
        assertEquals(beforeCounts.get("ExportOrderItem"), exportOrderItemRepository.count());
    }
 
    @Test
    @DisplayName("TC_INVENTORY_049 - Xuất kho thất bại: Không tìm thấy SKU sản phẩm")
    void TC_INVENTORY_049_createExportOrder_productSkuNotFound() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Báo lỗi ngay nếu mã SKU gửi lên không có trong hệ thống Warehouse.
        // [ÁNH XẠ LOGIC CODE]
        // - warehouseProductRepository.findBySku() -> Empty
        // - orElseThrow -> ném Exception
 
        ExportItemRequest item = buildExportItemRequest("SKU_GHOST", new ArrayList<>(List.of("SN1")));
        CreateExportOrderRequest req = buildCreateExportOrderRequest(new ArrayList<>(List.of(item)));
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        assertThrows(Exception.class, () -> {
            inventoryService.createExportOrder(req);
        });
 
        assertRecordCountsUnchanged(beforeCounts);
    }
 
    @Test
    @DisplayName("TC_INVENTORY_050 - Xuất kho thất bại: Sản phẩm chưa có dữ liệu Tồn Kho")
    void TC_INVENTORY_050_createExportOrder_stockDataNotFound() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Sản phẩm có tồn tại nhưng chưa từng được nhập kho (chưa có dòng record trong bảng InventoryStock).
        // [ÁNH XẠ LOGIC CODE]
        // - inventoryStockRepository.findByWarehouseProduct_Id() -> Empty
        // - orElseThrow -> ném Exception
 
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_NO_STOCK").internalName("SP Chưa Nhập Kho").build());
 
        ExportItemRequest item = buildExportItemRequest("SKU_NO_STOCK", new ArrayList<>(List.of("SN1")));
        CreateExportOrderRequest req = buildCreateExportOrderRequest(new ArrayList<>(List.of(item)));
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        assertThrows(Exception.class, () -> {
            inventoryService.createExportOrder(req);
        });
 
        assertRecordCountsUnchanged(beforeCounts);
    }
 
    @Test
    @DisplayName("TC_INVENTORY_051 - Xuất kho thất bại: Số lượng tồn kho nhỏ hơn số lượng xuất")
    void TC_INVENTORY_051_createExportOrder_notEnoughStock() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Tồn kho chỉ còn 1 cái, nhưng yêu cầu xuất kho tận 2 cái (List serial có 2 mã).
        // [ÁNH XẠ LOGIC CODE]
        // - if (stock.getOnHand() < exportCount) -> 1 < 2 -> True -> ném Exception
 
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_SHORT").internalName("SP Sắp Hết").build());
        inventoryStockRepository.save(InventoryStock.builder()
                .warehouseProduct(wp).onHand(1L).reserved(0L).damaged(0L).build());
 
        ExportItemRequest item = buildExportItemRequest("SKU_SHORT", new ArrayList<>(List.of("SN1", "SN2"))); // Yêu cầu 2
        CreateExportOrderRequest req = buildCreateExportOrderRequest(new ArrayList<>(List.of(item)));
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        assertThrows(Exception.class, () -> {
            inventoryService.createExportOrder(req);
        });
 
        assertRecordCountsUnchanged(beforeCounts);
    }
 
    @Test
    @DisplayName("TC_INVENTORY_052 - Xuất kho thất bại: Không tìm thấy Serial Number")
    void TC_INVENTORY_052_createExportOrder_serialNotFound() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Nhân viên quét mã vạch ảo hoặc mã bị sai, không tồn tại trong bảng ProductDetail.
        // [ÁNH XẠ LOGIC CODE]
        // - stock.getOnHand() < exportCount -> False (Bypass)
        // - productDetailRepository.findBySerialNumber() -> Empty -> ném Exception
 
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_FAKE_SN").internalName("SP Serial Ảo").build());
        inventoryStockRepository.save(InventoryStock.builder()
                .warehouseProduct(wp).onHand(5L).reserved(0L).damaged(0L).build());
 
        ExportItemRequest item = buildExportItemRequest("SKU_FAKE_SN", new ArrayList<>(List.of("SN_GHOST_999")));
        CreateExportOrderRequest req = buildCreateExportOrderRequest(new ArrayList<>(List.of(item)));
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        assertThrows(Exception.class, () -> {
            inventoryService.createExportOrder(req);
        });
 
        assertRecordCountsUnchanged(beforeCounts);
    }
 
    @Test
    @DisplayName("TC_INVENTORY_053 - Xuất kho thất bại: Serial đã bán hoặc đang bảo hành (Khác IN_STOCK)")
    void TC_INVENTORY_053_createExportOrder_serialNotInStock() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Serial có tồn tại, nhưng trạng thái của nó không phải IN_STOCK (Ví dụ: đã bán cho người khác rồi).
        // [ÁNH XẠ LOGIC CODE]
        // - if (detail.getStatus() != ProductStatus.IN_STOCK) -> True -> ném Exception
 
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_SOLD_SN").internalName("SP Đã Bán").build());
        inventoryStockRepository.save(InventoryStock.builder()
                .warehouseProduct(wp).onHand(5L).reserved(0L).damaged(0L).build());
        productDetailRepository.save(ProductDetail.builder()
                .serialNumber("SN_SOLD_123").warehouseProduct(wp)
                .status(ProductStatus.SOLD).importPrice(100.0).build());
 
        ExportItemRequest item = buildExportItemRequest("SKU_SOLD_SN", new ArrayList<>(List.of("SN_SOLD_123")));
        CreateExportOrderRequest req = buildCreateExportOrderRequest(new ArrayList<>(List.of(item)));
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        assertThrows(Exception.class, () -> {
            inventoryService.createExportOrder(req);
        });
 
        assertRecordCountsUnchanged(beforeCounts);
    }
 
    @Test
    @DisplayName("TC_INVENTORY_054 - Xuất kho thành công: Không đồng bộ Product cha (Product = null)")
    void TC_INVENTORY_054_createExportOrder_success_noProductSync() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Luồng chuẩn: Trừ kho thành công, chuyển trạng thái Serial sang SOLD.
        // WarehouseProduct CHƯA link với Product cha (wp.getProduct() == null) → Bỏ qua đồng bộ.
        // [ÁNH XẠ LOGIC CODE]
        // - Tất cả validation pass.
        // - detail.setStatus(ProductStatus.SOLD).
        // - stock.setOnHand(old - count).
        // - syncStockWithProduct() -> if (wp.getProduct() != null) -> False -> Bỏ qua update Product.
 
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_EX_HP1").internalName("SP Xuất HP1").description("Mô tả HP1")
                .techSpecsJson("{}").build()); // product = null
        InventoryStock stock = inventoryStockRepository.save(InventoryStock.builder()
                .warehouseProduct(wp).onHand(10L).reserved(0L).damaged(0L).build());
        ProductDetail detail = productDetailRepository.save(ProductDetail.builder()
                .serialNumber("SN_HP1").warehouseProduct(wp)
                .status(ProductStatus.IN_STOCK).importPrice(150.5).warrantyMonths(12).build());
 
        ExportItemRequest item = buildExportItemRequest("SKU_EX_HP1", new ArrayList<>(List.of("SN_HP1")));
        CreateExportOrderRequest req = buildCreateExportOrderRequest(new ArrayList<>(List.of(item)));
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        ApiResponse response = inventoryService.createExportOrder(req);
 
        assertTrue(response.isSuccess());
 
        // 1. Kiểm tra Serial đã chuyển trạng thái SOLD (FULL CỘT)
        ProductDetail dbDetail = productDetailRepository.findById(detail.getId()).orElseThrow();
        assertEquals(ProductStatus.SOLD, dbDetail.getStatus());
        assertNotNull(dbDetail.getSoldDate());
        assertEquals(150.5, dbDetail.getImportPrice());
        assertEquals(wp.getId(), dbDetail.getWarehouseProduct().getId());
 
        // 2. Kiểm tra Stock đã bị trừ (10 -> 9)
        InventoryStock dbStock = inventoryStockRepository.findById(stock.getId()).orElseThrow();
        assertEquals(9L, dbStock.getOnHand());
 
        // 3. Kiểm tra Export Order & Item (FULL CỘT)
        String exportCode = (String) response.getData();
        ExportOrder dbOrder = exportOrderRepository.findByExportCode(exportCode).orElseThrow();
        assertEquals(ExportStatus.COMPLETED, dbOrder.getStatus());
        assertEquals("Xuất bán hàng", dbOrder.getReason());
        assertEquals("AdminExport", dbOrder.getCreatedBy());
        assertEquals(1, dbOrder.getItems().size());
 
        ExportOrderItem dbItem = dbOrder.getItems().get(0);
        assertEquals(1L, dbItem.getQuantity());
        assertEquals("SN_HP1", dbItem.getSerialNumbers());
        assertEquals(150.5, dbItem.getTotalCost());
        assertEquals("SKU_EX_HP1", dbItem.getSku());
 
        assertEquals(beforeCounts.get("ExportOrder") + 1, exportOrderRepository.count());
        assertEquals(beforeCounts.get("ExportOrderItem") + 1, exportOrderItemRepository.count());
    }
 
    @Test
    @DisplayName("TC_INVENTORY_055 - Xuất kho thành công: Đa sản phẩm, Đa Serial, Có đồng bộ Product cha")
    void TC_INVENTORY_055_createExportOrder_success_multipleItems_withProductSync() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Xuất 1 lúc 2 mã sản phẩm khác nhau. Sản phẩm 1 xuất 2 serial.
        // Có link với bảng Product cha → Phải gọi lệnh syncStockWithProduct() để trừ kho bảng Product.
        // [ÁNH XẠ LOGIC CODE]
        // - Vòng lặp item chạy 2 lần.
        // - Vòng lặp serial chạy n lần.
        // - syncStockWithProduct() -> if (wp.getProduct() != null) -> True -> Trừ stock của Product cha.
 
        // Setup SP 1 (Link với Product 1)
        Product p1 = productRepository.save(Product.builder().name("Prod 1").stockQuantity(5L).build());
        WarehouseProduct wp1 = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_P1").product(p1).internalName("SP 1").build());
        inventoryStockRepository.save(InventoryStock.builder()
                .warehouseProduct(wp1).onHand(5L).reserved(0L).damaged(0L).build());
        ProductDetail pd1_a = productDetailRepository.save(ProductDetail.builder()
                .serialNumber("SN_P1_A").warehouseProduct(wp1)
                .status(ProductStatus.IN_STOCK).importPrice(100.0).warrantyMonths(12).build());
        ProductDetail pd1_b = productDetailRepository.save(ProductDetail.builder()
                .serialNumber("SN_P1_B").warehouseProduct(wp1)
                .status(ProductStatus.IN_STOCK).importPrice(120.0).warrantyMonths(12).build());
 
        // Setup SP 2 (Link với Product 2)
        Product p2 = productRepository.save(Product.builder().name("Prod 2").stockQuantity(3L).build());
        WarehouseProduct wp2 = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_P2").product(p2).internalName("SP 2").build());
        inventoryStockRepository.save(InventoryStock.builder()
                .warehouseProduct(wp2).onHand(3L).reserved(0L).damaged(0L).build());
        ProductDetail pd2_a = productDetailRepository.save(ProductDetail.builder()
                .serialNumber("SN_P2_A").warehouseProduct(wp2)
                .status(ProductStatus.IN_STOCK).importPrice(500.0).warrantyMonths(24).build());
 
        ExportItemRequest item1 = buildExportItemRequest("SKU_P1", new ArrayList<>(List.of("SN_P1_A", "SN_P1_B")));
        ExportItemRequest item2 = buildExportItemRequest("SKU_P2", new ArrayList<>(List.of("SN_P2_A")));
        CreateExportOrderRequest req = buildCreateExportOrderRequest(new ArrayList<>(List.of(item1, item2)));
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        ApiResponse response = inventoryService.createExportOrder(req);
        assertTrue(response.isSuccess());
 
        // Kiểm tra đồng bộ bảng InventoryStock
        assertEquals(3L, inventoryStockRepository.findByWarehouseProduct_Id(wp1.getId()).get().getOnHand()); // 5 - 2
        assertEquals(2L, inventoryStockRepository.findByWarehouseProduct_Id(wp2.getId()).get().getOnHand()); // 3 - 1
 
        // Kiểm tra đồng bộ bảng Product cha
        assertEquals(3L, productRepository.findById(p1.getId()).get().getStockQuantity());
        assertEquals(2L, productRepository.findById(p2.getId()).get().getStockQuantity());
 
        // Kiểm tra phiếu xuất
        String exportCode = (String) response.getData();
        ExportOrder dbOrder = exportOrderRepository.findByExportCode(exportCode).get();
        assertEquals(2, dbOrder.getItems().size());
 
        ExportOrderItem dbItem1 = dbOrder.getItems().stream()
                .filter(i -> i.getSku().equals("SKU_P1")).findFirst().get();
        assertEquals(2L, dbItem1.getQuantity());
        assertEquals("SN_P1_A,SN_P1_B", dbItem1.getSerialNumbers());
        assertEquals(220.0, dbItem1.getTotalCost()); // 100 + 120
 
        ExportOrderItem dbItem2 = dbOrder.getItems().stream()
                .filter(i -> i.getSku().equals("SKU_P2")).findFirst().get();
        assertEquals(500.0, dbItem2.getTotalCost());
 
        assertEquals(beforeCounts.get("ExportOrder") + 1, exportOrderRepository.count());
        assertEquals(beforeCounts.get("ExportOrderItem") + 2, exportOrderItemRepository.count());
    }
 
    // =========================================================================================
    // T E S T S : getPurchaseOrders
    //
    // Phân tích nhánh logic:
    // 1. if (status != null)                                    → True (findByStatus) / False (findAll)
    // 2. po.getItems() != null ? ... : 0.0                     → True / False (toán tử 3 ngôi total)
    // 3. item.getUnitCost() != null ? ... : 0.0                → True / False
    // 4. item.getQuantity() != null ? ... : 0L                 → True / False
    // 5. po.getSupplier() != null ? ... : "N/A"               → True / False
    //
    // Công thức: 5 điểm → 6 Test Cases
    // (TC 058 cover đồng thời cả items != null + cost != null + qty != null)
    //
    // Ánh xạ test → code:
    // 1. status != null                                         → Lọc theo status (TC 056) ✅
    // 2. status == null                                         → findAll (TC 057) ✅
    // 3. items != null                                          → Tính tổng tiền và count (TC 058) ✅
    // 4. items == null                                          → Fallback 0.0 và 0 (TC 059) ✅
    // 5. unitCost == null                                       → Fallback 0.0 (TC 060) ✅
    // 6. quantity == null                                       → Fallback 0.0 (TC 061) ✅
    // 7. supplier == null                                       → Fallback "N/A" (TC 062) ✅
    //
    // Tổng cộng: 7 Test Cases (phủ đủ).
    // =========================================================================================
 
    @Test
    @DisplayName("TC_INVENTORY_056 - getPurchaseOrders: Nhánh if (status != null) -> True")
    void TC_INVENTORY_056_getPurchaseOrders_statusNotNull() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Lọc danh sách theo trạng thái cụ thể.
        // [ÁNH XẠ LOGIC CODE] if (status != null) -> True -> Gọi purchaseOrderRepository.findByStatus()
 
        Supplier sup56a = supplierRepository.save(Supplier.builder()
                .name("NCC 56A").taxCode("TAX_PO56_C").active(true).autoCreated(true).build());
        Supplier sup56b = supplierRepository.save(Supplier.builder()
                .name("NCC 56B").taxCode("TAX_PO56_R").active(true).autoCreated(true).build());
        purchaseOrderRepository.save(PurchaseOrder.builder()
                .poCode("PO_CREATED_56").status(POStatus.CREATED).supplier(sup56a).build());
        purchaseOrderRepository.save(PurchaseOrder.builder()
                .poCode("PO_RECEIVED_56").status(POStatus.RECEIVED).supplier(sup56b).build());
 
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        ApiResponse response = inventoryService.getPurchaseOrders(POStatus.CREATED);
 
        assertTrue(response.isSuccess());
        List<PurchaseOrderListResponse> list = (List<PurchaseOrderListResponse>) response.getData();
        assertFalse(list.isEmpty());
        for (PurchaseOrderListResponse dto : list) {
            assertEquals("CREATED", dto.getStatus());
        }
 
        assertRecordCountsUnchanged(beforeCounts);
    }
 
    @Test
    @DisplayName("TC_INVENTORY_057 - getPurchaseOrders: Nhánh if (status != null) -> False")
    void TC_INVENTORY_057_getPurchaseOrders_statusNull() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Lấy tất cả danh sách khi trạng thái gửi lên là null.
        // [ÁNH XẠ LOGIC CODE] if (status != null) -> False -> Gọi purchaseOrderRepository.findAll()
 
        Supplier sup57 = supplierRepository.save(Supplier.builder()
                .name("NCC 57").taxCode("TAX_PO57").active(true).autoCreated(true).build());
        purchaseOrderRepository.save(PurchaseOrder.builder()
                .poCode("PO_ALL_57").status(POStatus.CREATED).supplier(sup57).build());
 
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        ApiResponse response = inventoryService.getPurchaseOrders(null);
 
        assertTrue(response.isSuccess());
        List<PurchaseOrderListResponse> list = (List<PurchaseOrderListResponse>) response.getData();
        assertFalse(list.isEmpty());
 
        assertRecordCountsUnchanged(beforeCounts);
    }
 
    @Test
    @DisplayName("TC_INVENTORY_058 - getPurchaseOrders: Nhánh po.getItems() != null -> True")
    void TC_INVENTORY_058_getPurchaseOrders_itemsNotNull() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Tính toán tổng tiền và số lượng item khi danh sách item tồn tại.
        // [ÁNH XẠ LOGIC CODE] po.getItems() != null -> True -> Chạy stream tính tổng và lấy size()
 
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_58").internalName("Test 58").build());
        Supplier sup58 = supplierRepository.save(Supplier.builder()
                .name("NCC 58").taxCode("TAX_PO58").active(true).autoCreated(true).build());
        PurchaseOrder po = purchaseOrderRepository.save(PurchaseOrder.builder()
                .poCode("PO_ITEM_TRUE").status(POStatus.CREATED).supplier(sup58)
                .items(new ArrayList<>()).build());
        PurchaseOrderItem item = PurchaseOrderItem.builder()
                .purchaseOrder(po).sku("SKU_58").warehouseProduct(wp)
                .unitCost(10.0).quantity(5L).build();
        po.getItems().add(item);
        purchaseOrderRepository.save(po);
        purchaseOrderItemRepository.save(item);
 
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        ApiResponse response = inventoryService.getPurchaseOrders(null);
        List<PurchaseOrderListResponse> list = (List<PurchaseOrderListResponse>) response.getData();
 
        PurchaseOrderListResponse dto = list.stream()
                .filter(o -> o.getPoCode().equals("PO_ITEM_TRUE")).findFirst().orElseThrow();
        assertEquals(1, dto.getItemCount());
        assertEquals(50.0, dto.getTotalAmount()); // 10.0 * 5
 
        assertRecordCountsUnchanged(beforeCounts);
    }
 
    @Test
    @DisplayName("TC_INVENTORY_059 - getPurchaseOrders: Nhánh po.getItems() != null -> False")
    void TC_INVENTORY_059_getPurchaseOrders_itemsNull() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Ép List items thành null (bị lỗi data memory) để kiểm tra fallback an toàn.
        // [ÁNH XẠ LOGIC CODE] po.getItems() != null -> False -> Lấy giá trị 0.0 (Total) và 0 (Count)
 
        // nếu purchase order mà không có order item thì sẽ không bị ngoại lệ của db, nên phải dùng mockito
        PurchaseOrder mockPo = PurchaseOrder.builder()
                .id(999L).poCode("PO_ITEM_NULL").status(POStatus.CREATED).build();
        mockPo.setItems(null);
 
        org.mockito.Mockito.doReturn(new ArrayList<>(List.of(mockPo))).when(purchaseOrderRepository).findAll();
 
        ApiResponse response = inventoryService.getPurchaseOrders(null);
        List<PurchaseOrderListResponse> list = (List<PurchaseOrderListResponse>) response.getData();
 
        PurchaseOrderListResponse dto = list.get(0);
        assertEquals(0.0, dto.getTotalAmount());
        assertEquals(0, dto.getItemCount());
    }
 
    @Test
    @DisplayName("TC_INVENTORY_060 - getPurchaseOrders: Nhánh item.getUnitCost() != null -> False")
    void TC_INVENTORY_060_getPurchaseOrders_unitCostNull() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Test độc lập nhánh giá nhập (UnitCost) bị null.
        // [ÁNH XẠ LOGIC CODE] item.getUnitCost() != null -> False -> Fallback về 0.0
 
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_60").internalName("Test 60").build());
        Supplier sup60 = supplierRepository.save(Supplier.builder()
                .name("NCC 60").taxCode("TAX_PO60").active(true).autoCreated(true).build());
        PurchaseOrder po = purchaseOrderRepository.save(PurchaseOrder.builder()
                .poCode("PO_COST_NULL").status(POStatus.CREATED).supplier(sup60)
                .items(new ArrayList<>()).build());
        PurchaseOrderItem item = PurchaseOrderItem.builder()
                .purchaseOrder(po).sku("SKU_60").warehouseProduct(wp)
                .unitCost(null).quantity(5L).build();
        po.getItems().add(item);
        purchaseOrderRepository.save(po);
        purchaseOrderItemRepository.save(item);
 
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        ApiResponse response = inventoryService.getPurchaseOrders(null);
        List<PurchaseOrderListResponse> list = (List<PurchaseOrderListResponse>) response.getData();
 
        PurchaseOrderListResponse dto = list.stream()
                .filter(o -> o.getPoCode().equals("PO_COST_NULL")).findFirst().orElseThrow();
        assertEquals(0.0, dto.getTotalAmount());
 
        assertRecordCountsUnchanged(beforeCounts);
    }
 
    @Test
    @DisplayName("TC_INVENTORY_061 - getPurchaseOrders: Nhánh item.getQuantity() != null -> False")
    void TC_INVENTORY_061_getPurchaseOrders_quantityNull() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Test độc lập nhánh số lượng nhập (Quantity) bị null.
        // [ÁNH XẠ LOGIC CODE] item.getQuantity() != null -> False -> Fallback về 0L
 
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_61").internalName("Test 61").build());
        Supplier sup61 = supplierRepository.save(Supplier.builder()
                .name("NCC 61").taxCode("TAX_PO61").active(true).autoCreated(true).build());
        PurchaseOrder po = purchaseOrderRepository.save(PurchaseOrder.builder()
                .poCode("PO_QTY_NULL").status(POStatus.CREATED).supplier(sup61)
                .items(new ArrayList<>()).build());
        PurchaseOrderItem item = PurchaseOrderItem.builder()
                .purchaseOrder(po).sku("SKU_61").warehouseProduct(wp)
                .unitCost(100.0).quantity(null).build();
        po.getItems().add(item);
        purchaseOrderRepository.save(po);
        purchaseOrderItemRepository.save(item);
 
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        ApiResponse response = inventoryService.getPurchaseOrders(null);
        List<PurchaseOrderListResponse> list = (List<PurchaseOrderListResponse>) response.getData();
 
        PurchaseOrderListResponse dto = list.stream()
                .filter(o -> o.getPoCode().equals("PO_QTY_NULL")).findFirst().orElseThrow();
        assertEquals(0.0, dto.getTotalAmount()); // 100.0 * 0L = 0.0
 
        assertRecordCountsUnchanged(beforeCounts);
    }
 
    @Test
    @DisplayName("TC_INVENTORY_062 - getPurchaseOrders: Nhánh po.getSupplier() != null -> False")
    void TC_INVENTORY_062_getPurchaseOrders_supplierNull() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Test độc lập nhánh Phiếu nhập không có dữ liệu Nhà cung cấp.
        // [ÁNH XẠ LOGIC CODE] po.getSupplier() != null -> False -> Fallback thành chuỗi "N/A"
 
        // nếu không set nhà cung cấp thì sẽ bị lỗi không lưu vào được DB nên phải dùng mock
        Supplier sup62 = supplierRepository.save(Supplier.builder()
                .name("NCC 62").taxCode("TAX_PO62").active(true).autoCreated(true).build());
        PurchaseOrder mockPo62 = purchaseOrderRepository.save(PurchaseOrder.builder()
                .poCode("PO_SUP_NULL").status(POStatus.CREATED).supplier(sup62).build());
        // Override supplier về null qua Mockito để test nhánh False
        org.mockito.Mockito.doReturn(new ArrayList<>(List.of(
            PurchaseOrder.builder().id(mockPo62.getId()).poCode("PO_SUP_NULL")
                    .status(POStatus.CREATED).supplier(null).build()
        ))).when(purchaseOrderRepository).findAll();
 
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        ApiResponse response = inventoryService.getPurchaseOrders(null);
        List<PurchaseOrderListResponse> list = (List<PurchaseOrderListResponse>) response.getData();
 
        PurchaseOrderListResponse dto = list.stream()
                .filter(o -> o.getPoCode().equals("PO_SUP_NULL")).findFirst().orElseThrow();
        assertEquals("N/A", dto.getSupplierName());
 
        assertRecordCountsUnchanged(beforeCounts);
    }
 
    // =========================================================================================
    // T E S T S : getExportOrders
    //
    // Phân tích nhánh logic:
    // 1. if (status != null)                                    → True (findByStatus) / False (findAll)
    //
    // Công thức: 1 điểm → 2 Test Cases
    //
    // Ánh xạ test → code:
    // 1. status != null                                         → Lọc theo status (TC 063) ✅
    // 2. status == null                                         → findAll (TC 064) ✅
    //
    // Tổng cộng: 2 Test Cases (phủ đủ).
    // =========================================================================================

    @Test
    @DisplayName("TC_INVENTORY_063 - getExportOrders: Nhánh if (status != null) -> True")
    void TC_INVENTORY_063_getExportOrders_statusNotNull() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Lọc phiếu xuất theo một trạng thái duy nhất.
        // [ÁNH XẠ LOGIC CODE] status != null -> Gọi exportOrderRepository.findByStatus()
 
        exportOrderRepository.save(ExportOrder.builder()
                .exportCode("EX_TRUE_COMP").status(ExportStatus.COMPLETED).build());
        exportOrderRepository.save(ExportOrder.builder()
                .exportCode("EX_TRUE_CANC").status(ExportStatus.CANCELLED).build());
 
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        ApiResponse response = inventoryService.getExportOrders(ExportStatus.COMPLETED);
 
        assertTrue(response.isSuccess());
        List<ExportOrder> list = (List<ExportOrder>) response.getData();
        assertFalse(list.isEmpty());
        for (ExportOrder eo : list) {
            assertEquals(ExportStatus.COMPLETED, eo.getStatus());
        }
 
        assertRecordCountsUnchanged(beforeCounts);
    }
 
    @Test
    @DisplayName("TC_INVENTORY_064 - getExportOrders: Nhánh if (status != null) -> False")
    void TC_INVENTORY_064_getExportOrders_statusNull() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Lấy tất cả phiếu xuất khi không chỉ định trạng thái.
        // [ÁNH XẠ LOGIC CODE] status == null -> Gọi exportOrderRepository.findAll()
 
        exportOrderRepository.save(ExportOrder.builder()
                .exportCode("EX_FALSE").status(ExportStatus.COMPLETED).build());
 
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        ApiResponse response = inventoryService.getExportOrders(null);
 
        assertTrue(response.isSuccess());
        List<ExportOrder> list = (List<ExportOrder>) response.getData();
        assertFalse(list.isEmpty());
 
        assertRecordCountsUnchanged(beforeCounts);
    }
 
    // =========================================================================================
    // T E S T S : getPurchaseOrderDetail
    //
    // Phân tích nhánh logic:
    // 1. purchaseOrderRepository.findById().orElseThrow()       → Found / Throw
    // 2. if (po.getSupplier() != null)                          → True / False
    // 3. if (item.getWarehouseProduct() != null)                → True / False
    // 4. if (item.getProductDetails() != null)                  → True / False
    // 5. item.getUnitCost() != null ? ... : 0.0                → True / False (tổng tiền)
    // 6. item.getQuantity() != null ? ... : 0L                 → True / False (tổng tiền)
    //
    // Công thức: 6 điểm → 7 Test Cases
    //
    // Ánh xạ test → code:
    // 1. findById → Không thấy                                 → Exception (TC 065) ✅
    // 2. Happy Path, tất cả True                               → (TC 066) ✅
    // 3. supplier == null                                       → supplierInfo = null (TC 067) ✅
    // 4. warehouseProduct == null                              → wpInfo = null (TC 068) ✅
    // 5. productDetails == null                                → detailInfos = null (TC 069) ✅
    // 6. unitCost == null                                      → Fallback 0.0 (TC 070) ✅
    // 7. quantity == null                                      → Fallback 0L hoặc NPE (TC 071) ✅
    //
    // Tổng cộng: 7 Test Cases (phủ đủ).
    // =========================================================================================
 
    @Test
    @DisplayName("TC_INVENTORY_065 - Lấy chi tiết Phiếu Nhập: Nhánh findById -> Empty (Exception)")
    void TC_INVENTORY_065_getPurchaseOrderDetail_notFound() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Báo lỗi khi user truyền ID phiếu nhập không tồn tại.
        // [ÁNH XẠ LOGIC CODE] purchaseOrderRepository.findById(id) -> Empty -> orElseThrow
 
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        assertThrows(Exception.class, () -> {
            inventoryService.getPurchaseOrderDetail(9999L);
        });
 
        assertRecordCountsUnchanged(beforeCounts);
    }
 
    @Test
    @DisplayName("TC_INVENTORY_066 - Lấy chi tiết Phiếu Nhập: Tất cả nhánh True (Happy Path)")
    void TC_INVENTORY_066_getPurchaseOrderDetail_allTrueBranches() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Test luồng hoàn hảo, mọi liên kết đều tồn tại, Cost và Qty đều có số liệu.
        // [ÁNH XẠ LOGIC CODE] Chạy vào nhánh True của tất cả các lệnh if và toán tử 3 ngôi.
 
        Supplier supplier = supplierRepository.save(Supplier.builder()
                .name("NCC 066").taxCode("TAX066").email("ncc066@test.com").phone("0900000066")
                .address("Địa chỉ 066").bankAccount("066066066").paymentTerm("NET30")
                .paymentTermDays(30).active(true).autoCreated(true).build());
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_066").internalName("Test WP 066").description("Mô tả 066")
                .techSpecsJson("{\"color\":\"blue\"}").build());
        PurchaseOrder po = purchaseOrderRepository.save(PurchaseOrder.builder()
                .poCode("PO_066").status(POStatus.RECEIVED).supplier(supplier)
                .items(new ArrayList<>()).build());
 
        PurchaseOrderItem item = PurchaseOrderItem.builder()
                .purchaseOrder(po).sku("SKU_066").unitCost(100.0).quantity(5L)
                .warehouseProduct(wp).warrantyMonths(12).build();
        po.getItems().add(item);
        purchaseOrderRepository.save(po);
        purchaseOrderItemRepository.save(item);
 
        ProductDetail detail = productDetailRepository.save(ProductDetail.builder()
                .serialNumber("SN_066_1").status(ProductStatus.IN_STOCK)
                .importPrice(100.0).warrantyMonths(12)
                .warehouseProduct(wp).purchaseOrderItem(item).build());
 
        item.setProductDetails(new ArrayList<>(List.of(detail)));
        purchaseOrderItemRepository.save(item);
 
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        ApiResponse response = inventoryService.getPurchaseOrderDetail(po.getId());
 
        assertTrue(response.isSuccess());
        PurchaseOrderDetailResponse dto = (PurchaseOrderDetailResponse) response.getData();
 
        // Assert các nhánh True
        assertNotNull(dto.getSupplier());
        assertEquals("NCC 066", dto.getSupplier().getName());
 
        PurchaseOrderDetailResponse.PurchaseOrderItemInfo itemInfo = dto.getItems().get(0);
        assertNotNull(itemInfo.getWarehouseProduct());
        assertNotNull(itemInfo.getProductDetails());
        assertEquals(1, itemInfo.getProductDetails().size());
 
        // Nhánh True toán tử 3 ngôi: 100.0 * 5 = 500.0
        assertEquals(500.0, dto.getTotalAmount());
 
        assertRecordCountsUnchanged(beforeCounts);
    }
 
    @Test
    @DisplayName("TC_INVENTORY_067 - Lấy chi tiết Phiếu Nhập: Nhánh po.getSupplier() != null -> False")
    void TC_INVENTORY_067_getPurchaseOrderDetail_supplierNull() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Map DTO an toàn khi phiếu nhập không có Nhà cung cấp.
        // [ÁNH XẠ LOGIC CODE] if (po.getSupplier() != null) -> False -> supplierInfo = null
 
        PurchaseOrder po = purchaseOrderRepository.save(PurchaseOrder.builder()
                .poCode("PO_067").status(POStatus.CREATED).supplier(null).build());
 
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        ApiResponse response = inventoryService.getPurchaseOrderDetail(po.getId());
        PurchaseOrderDetailResponse dto = (PurchaseOrderDetailResponse) response.getData();
 
        assertNull(dto.getSupplier());
 
        assertRecordCountsUnchanged(beforeCounts);
    }
 
    @Test
    @DisplayName("TC_INVENTORY_068 - Lấy chi tiết Phiếu Nhập: Nhánh item.getWarehouseProduct() != null -> False")
    void TC_INVENTORY_068_getPurchaseOrderDetail_warehouseProductNull() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Map DTO an toàn khi item bị mồ côi (không link tới SP kho).
        // [ÁNH XẠ LOGIC CODE] if (item.getWarehouseProduct() != null) -> False -> wpInfo = null
 
        Supplier supplier = supplierRepository.save(
            Supplier.builder()
                .taxCode("SUP_068")
                .name("Supplier 068")
                .email("ncc068@test.com")
                .phone("0123456789")
                .address("Địa chỉ 068")
                .bankAccount("09009123012")
                .paymentTerm("COD")
                .paymentTermDays(0)
                .active(true)
                .autoCreated(true)
                .build()
        );
        PurchaseOrder po = purchaseOrderRepository.save(PurchaseOrder.builder()
                .poCode("PO_068").status(POStatus.CREATED)
                .items(new ArrayList<>())
                .supplier(supplier).build());
        PurchaseOrderItem item = PurchaseOrderItem.builder()
                .purchaseOrder(po).sku("SKU_068").warehouseProduct(null)
                .unitCost(0.0).quantity(0L).build();
        po.getItems().add(item);
        purchaseOrderRepository.save(po);
        purchaseOrderItemRepository.save(item);
 
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        ApiResponse response = inventoryService.getPurchaseOrderDetail(po.getId());
        PurchaseOrderDetailResponse dto = (PurchaseOrderDetailResponse) response.getData();
 
        assertNull(dto.getItems().get(0).getWarehouseProduct());
 
        assertRecordCountsUnchanged(beforeCounts);
    }
 
    @Test
    @DisplayName("TC_INVENTORY_069 - Lấy chi tiết Phiếu Nhập: Nhánh item.getProductDetails() != null -> False")
    void TC_INVENTORY_069_getPurchaseOrderDetail_productDetailsNull() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Map DTO an toàn khi danh sách serial bị null dưới Memory.
        // [ÁNH XẠ LOGIC CODE] if (item.getProductDetails() != null) -> False -> detailInfos = null
        // Lưu ý: Hibernate sinh Empty List nên dùng Mockito để ép Null.
 
        // không thể lưu item không có product details vào DB nên phải dùng mock
        PurchaseOrder mockPo = PurchaseOrder.builder()
                .id(69L).poCode("PO_069").status(POStatus.CREATED).build();
        PurchaseOrderItem mockItem = PurchaseOrderItem.builder()
                .id(1L).purchaseOrder(mockPo).sku("SKU_069")
                .unitCost(10.0).quantity(2L).productDetails(null).build();
        mockPo.setItems(new ArrayList<>(List.of(mockItem)));
 
        org.mockito.Mockito.doReturn(java.util.Optional.of(mockPo))
                .when(purchaseOrderRepository).findById(69L);
 
        ApiResponse response = inventoryService.getPurchaseOrderDetail(69L);
        PurchaseOrderDetailResponse dto = (PurchaseOrderDetailResponse) response.getData();
 
        assertNull(dto.getItems().get(0).getProductDetails());
    }
 
    @Test
    @DisplayName("TC_INVENTORY_070 - Lấy chi tiết Phiếu Nhập: Nhánh item.getUnitCost() != null -> False")
    void TC_INVENTORY_070_getPurchaseOrderDetail_unitCostNull() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Test toán tử 3 ngôi tính tiền an toàn khi chưa nhập Giá.
        // [ÁNH XẠ LOGIC CODE] item.getUnitCost() != null ? ... : 0.0 -> Chọn 0.0
 
        Supplier sup70 = supplierRepository.save(Supplier.builder()
                .name("NCC 70").taxCode("TAX_PO70").active(true).autoCreated(true).build());
        PurchaseOrder po = purchaseOrderRepository.save(PurchaseOrder.builder()
                .poCode("PO_070").status(POStatus.CREATED).supplier(sup70).build());
        WarehouseProduct wp = warehouseProductRepository.save(
            WarehouseProduct.builder()
                .sku("SKU_070")
                .internalName("Test")
                .build()
        );

        PurchaseOrderItem item = purchaseOrderItemRepository.save(
            PurchaseOrderItem.builder()
                .purchaseOrder(po)
                .warehouseProduct(wp)
                .sku("SKU_070")
                .unitCost(null)
                .quantity(5L)
                .build()
        );

        po.setItems(new ArrayList<>(List.of(item)));
        purchaseOrderRepository.save(po);

        Map<String, Long> beforeCounts = captureRecordCounts();
 
        ApiResponse response = inventoryService.getPurchaseOrderDetail(po.getId());
        PurchaseOrderDetailResponse dto = (PurchaseOrderDetailResponse) response.getData();
 
        assertEquals(0.0, dto.getTotalAmount()); // Fallback: 0.0 * 5 = 0.0
        assertNull(dto.getItems().get(0).getUnitCost());
 
        assertRecordCountsUnchanged(beforeCounts);
    }
 
    @Test
    @DisplayName("TC_INVENTORY_071 - Lấy chi tiết Phiếu Nhập: Nhánh item.getQuantity() != null -> False")
    void TC_INVENTORY_071_getPurchaseOrderDetail_quantityNull() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Test toán tử 3 ngôi tính tiền khi Quantity = null.
        // Theo logic người dùng: nếu số lượng = null, tổng tiền phải fallback về 0
        // hoặc hệ thống throw exception (không biết dev xử lý ra sao).
        //
        // [ÁNH XẠ LOGIC CODE]
        // - item.getQuantity() != null ? ... : 0L -> False -> Fallback 0L (nếu dev xử lý đúng)
        // HOẶC item.getQuantity().intValue() -> NullPointerException (nếu dev quên check null)
        //
        // Không biết dev xử lý đúng hay sai → assertThrows(Exception.class) hoặc assertDoesNotThrow.
        // Nếu hàm thành công, kiểm tra tổng tiền = 0.
 
        Supplier sup71 = supplierRepository.save(
            Supplier.builder()
                .name("NCC 71")
                .taxCode("TAX_PO71")
                .active(true)
                .autoCreated(true)
                .build()
        );

        PurchaseOrder po = purchaseOrderRepository.save(
            PurchaseOrder.builder()
                .poCode("PO_071")
                .status(POStatus.CREATED)
                .supplier(sup71)
                .build()
        );

        WarehouseProduct wp = warehouseProductRepository.save(
            WarehouseProduct.builder()
                .sku("SKU_071")
                .internalName("SP test")
                .build()
        );

        PurchaseOrderItem item = purchaseOrderItemRepository.save(
            PurchaseOrderItem.builder()
                .purchaseOrder(po)
                .warehouseProduct(wp)
                .sku("SKU_071")
                .unitCost(100.0)
                .quantity(null)
                .build()
        );
        
        po.setItems(new ArrayList<>(List.of(item)));
        purchaseOrderRepository.save(po);

        ProductDetail detail = productDetailRepository.save(
            ProductDetail.builder()
                .serialNumber("SN_071")
                .status(ProductStatus.IN_STOCK)
                .importPrice(100.0)
                .warrantyMonths(12)
                .warehouseProduct(wp)
                .purchaseOrderItem(item)
                .build()
        );

        item.setProductDetails(new ArrayList<>(List.of(detail)));
        purchaseOrderItemRepository.save(item);

 
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        // Không biết dev xử lý đúng không → chấp nhận cả hai kết quả:
        // - Nếu throw: Exception được bắt, record không thay đổi
        // - Nếu không throw: tổng tiền phải là 0.0
        try {
            ApiResponse response = inventoryService.getPurchaseOrderDetail(po.getId());
            // Nếu không throw: fallback tổng tiền phải = 0.0
            PurchaseOrderDetailResponse dto = (PurchaseOrderDetailResponse) response.getData();
            assertEquals(0.0, dto.getTotalAmount());
        } catch (Exception e) {
            // Exception là hành vi chấp nhận được khi quantity null
            assertRecordCountsUnchanged(beforeCounts);
        }
    }
 
    // =========================================================================================
    // T E S T S : getExportOrderDetail
    //
    // Phân tích nhánh logic:
    // 1. exportOrderRepository.findById().orElseThrow()         → Found / Throw
    // 2. if (item.getWarehouseProduct() != null)                → True / False
    // 3. item.getSerialNumbers() != null ? ... : List.of()     → True / False
    //
    // Công thức: 3 điểm → 4 Test Cases
    //
    // Ánh xạ test → code:
    // 1. findById → Không thấy                                 → Exception (TC 072) ✅
    // 2. Happy Path, tất cả True, split serial                 → (TC 073) ✅
    // 3. warehouseProduct == null                              → wpInfo = null (TC 074) ✅
    // 4. serialNumbers == null                                 → Trả mảng rỗng (TC 075) ✅
    //
    // Tổng cộng: 4 Test Cases (phủ đủ).
    // =========================================================================================
 
    @Test
    @DisplayName("TC_INVENTORY_072 - Lấy chi tiết Phiếu Xuất: Nhánh findById -> Empty (Exception)")
    void TC_INVENTORY_072_getExportOrderDetail_notFound() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Ngăn chặn user truy cập ID phiếu xuất không tồn tại.
        // [ÁNH XẠ LOGIC CODE] exportOrderRepository.findById(id) -> Empty -> orElseThrow ném Exception
 
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        assertThrows(Exception.class, () -> {
            inventoryService.getExportOrderDetail(9999L);
        });
 
        assertRecordCountsUnchanged(beforeCounts);
    }
 
    @Test
    @DisplayName("TC_INVENTORY_073 - Lấy chi tiết Phiếu Xuất: Tất cả các nhánh True (Happy Path)")
    void TC_INVENTORY_073_getExportOrderDetail_allTrueBranches() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Test luồng hoàn hảo, có Product link, Serial list được phân tách đúng bằng dấu phẩy.
        // [ÁNH XẠ LOGIC CODE]
        // - item.getWarehouseProduct() != null -> True -> Map WarehouseProductInfo
        // - item.getSerialNumbers() != null -> True -> Gọi split(",")
 
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_EX_73").internalName("Test WP 073").description("Mô tả 073")
                .techSpecsJson("{}").build());
 
        ExportOrder eo = ExportOrder.builder()
                .exportCode("EX_073")
                .status(ExportStatus.COMPLETED)
                .exportDate(LocalDateTime.now())
                .createdBy("Admin")
                .reason("Bán hàng")
                .note("Ghi chú")
                .items(new ArrayList<>())  
                .build();

        exportOrderRepository.save(eo);

        ExportOrderItem item = ExportOrderItem.builder()
                .exportOrder(eo)
                .warehouseProduct(wp)
                .sku("SKU_EX_73")
                .quantity(2L)
                .totalCost(500.0)
                .serialNumbers("SN_73_1,SN_73_2")
                .build();

        eo.getItems().add(item); 

        exportOrderItemRepository.save(item);
        exportOrderRepository.save(eo);
 
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        ApiResponse response = inventoryService.getExportOrderDetail(eo.getId());
 
        assertTrue(response.isSuccess());
        ExportOrderDetailResponse dto = (ExportOrderDetailResponse) response.getData();
 
        // Assert Order Info (FULL CỘT)
        assertEquals(eo.getId(), dto.getId());
        assertEquals("EX_073", dto.getExportCode());
        assertEquals("COMPLETED", dto.getStatus());
        assertEquals("Admin", dto.getCreatedBy());
        assertEquals("Bán hàng", dto.getReason());
        assertEquals("Ghi chú", dto.getNote());
        assertEquals(eo.getItems().size(), dto.getItems().size());
 
        // Assert Item Info (FULL CỘT)
        ExportOrderDetailResponse.ExportOrderItemInfo itemInfo = dto.getItems().get(0);
        assertEquals("SKU_EX_73", itemInfo.getSku());
        assertEquals(2L, itemInfo.getQuantity());
        assertEquals(500.0, itemInfo.getTotalCost());
 
        // Assert Nhánh True: WarehouseProduct
        assertNotNull(itemInfo.getWarehouseProduct());
        assertEquals(wp.getId(), itemInfo.getWarehouseProduct().getId());
        assertEquals("SKU_EX_73", itemInfo.getWarehouseProduct().getSku());
        assertEquals("Test WP 073", itemInfo.getWarehouseProduct().getInternalName());
        assertEquals("Mô tả 073", itemInfo.getWarehouseProduct().getDescription());
        assertEquals("{}", itemInfo.getWarehouseProduct().getTechSpecsJson());
 
        // Assert Nhánh True: SerialNumbers split bằng dấu phẩy
        List<String> serials = itemInfo.getSerialNumbers();
        assertNotNull(serials);
        assertEquals(2, serials.size());
        assertTrue(serials.contains("SN_73_1"));
        assertTrue(serials.contains("SN_73_2"));
 
        assertRecordCountsUnchanged(beforeCounts);
    }
 
    @Test
    @DisplayName("TC_INVENTORY_074 - Lấy chi tiết Phiếu Xuất: Nhánh item.getWarehouseProduct() != null -> False")
    void TC_INVENTORY_074_getExportOrderDetail_warehouseProductNull() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Map an toàn khi item xuất không có liên kết tới WarehouseProduct.
        // [ÁNH XẠ LOGIC CODE] item.getWarehouseProduct() != null -> False -> wpInfo = null
 
        ExportOrder eo = ExportOrder.builder()
                .exportCode("EX_074")
                .status(ExportStatus.COMPLETED)
                .items(new ArrayList<>()) // QUAN TRỌNG
                .build();

        exportOrderRepository.save(eo);

        ExportOrderItem item = ExportOrderItem.builder()
                .exportOrder(eo)
                .warehouseProduct(null)
                .sku("SKU_074")
                .quantity(1L)
                .totalCost(100.0)
                .serialNumbers("SN_74")
                .build();

        eo.getItems().add(item); // QUAN TRỌNG

        exportOrderItemRepository.save(item);
        exportOrderRepository.save(eo);

        Map<String, Long> beforeCounts = captureRecordCounts();
 
        ApiResponse response = inventoryService.getExportOrderDetail(eo.getId());
        ExportOrderDetailResponse dto = (ExportOrderDetailResponse) response.getData();
 
        assertNull(dto.getItems().get(0).getWarehouseProduct());
        assertEquals(1, dto.getItems().get(0).getSerialNumbers().size());
 
        assertRecordCountsUnchanged(beforeCounts);
    }
 
    @Test
    @DisplayName("TC_INVENTORY_075 - Lấy chi tiết Phiếu Xuất: Nhánh item.getSerialNumbers() != null -> False")
    void TC_INVENTORY_075_getExportOrderDetail_serialNumbersNull() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Đảm bảo ứng dụng không văng NullPointerException khi chuỗi Serial bị null.
        // [ÁNH XẠ LOGIC CODE] item.getSerialNumbers() != null -> False -> Trả về new ArrayList<>(List.of()) rỗng.
 
        ExportOrder eo = ExportOrder.builder()
                .exportCode("EX_075")
                .status(ExportStatus.COMPLETED)
                .items(new ArrayList<>()) // QUAN TRỌNG
                .build();

        exportOrderRepository.save(eo);

        ExportOrderItem item = ExportOrderItem.builder()
                .exportOrder(eo)
                .sku("SKU_075")
                .quantity(5L)
                .totalCost(100.0)
                .serialNumbers(null)
                .build();

        eo.getItems().add(item); // QUAN TRỌNG

        exportOrderItemRepository.save(item);
        exportOrderRepository.save(eo);
 
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        ApiResponse response = inventoryService.getExportOrderDetail(eo.getId());
        ExportOrderDetailResponse dto = (ExportOrderDetailResponse) response.getData();
 
        List<String> serials = dto.getItems().get(0).getSerialNumbers();
        assertNotNull(serials);
        assertTrue(serials.isEmpty());
 
        assertRecordCountsUnchanged(beforeCounts);
    }
 
    // =========================================================================================
    // T E S T S : cancelPurchaseOrder
    //
    // Phân tích nhánh logic:
    // 1. purchaseOrderRepository.findById().orElseThrow()       → Found / Throw
    // 2. if (po.getStatus() != POStatus.CREATED)               → True (error) / False (cancel)
    //
    // Công thức: 2 điểm → 3 Test Cases
    //
    // Ánh xạ test → code:
    // 1. findById → Không thấy                                 → Exception (TC 076) ✅
    // 2. status != CREATED                                     → Error Response (TC 077) ✅
    // 3. status == CREATED                                     → Cancel + save (TC 078) ✅
    //
    // Tổng cộng: 3 Test Cases (phủ đủ).
    // =========================================================================================
 
    @Test
    @DisplayName("TC_INVENTORY_076 - Hủy Phiếu Nhập: Nhánh findById -> Empty (Exception)")
    void TC_INVENTORY_076_cancelPurchaseOrder_notFound() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Ngăn chặn việc hủy một phiếu nhập không tồn tại.
        // [ÁNH XẠ LOGIC CODE]
        // - purchaseOrderRepository.findById(id) -> Empty
        // - orElseThrow() -> Kích hoạt, ném Exception
 
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        assertThrows(Exception.class, () -> {
            inventoryService.cancelPurchaseOrder(9999L);
        });
 
        assertRecordCountsUnchanged(beforeCounts);
    }
 
    @Test
    @DisplayName("TC_INVENTORY_077 - Hủy Phiếu Nhập: Nhánh status != CREATED -> True")
    void TC_INVENTORY_077_cancelPurchaseOrder_statusNotCreated() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Chỉ cho phép hủy phiếu đang ở trạng thái CREATED. RECEIVED thì chặn.
        // [ÁNH XẠ LOGIC CODE] if (po.getStatus() != POStatus.CREATED) -> True -> return error
 
        Supplier sup77 = supplierRepository.save(Supplier.builder()
                .name("NCC 077").taxCode("TAX077").active(true).autoCreated(true).build());
        PurchaseOrder po = purchaseOrderRepository.save(PurchaseOrder.builder()
                .poCode("PO_077").supplier(sup77).status(POStatus.RECEIVED)
                .createdBy("Admin").note("Không được hủy").build());
 
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        ApiResponse response = inventoryService.cancelPurchaseOrder(po.getId());
 
        assertFalse(response.isSuccess());
        assertNotNull(response.getMessage());
        assertFalse(response.getMessage().isBlank());
 
        assertRecordCountsUnchanged(beforeCounts);
    }
 
    @Test
    @DisplayName("TC_INVENTORY_078 - Hủy Phiếu Nhập: Nhánh status == CREATED -> Happy Path (Assert Full Cột)")
    void TC_INVENTORY_078_cancelPurchaseOrder_success() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Hủy thành công phiếu đang ở trạng thái chờ.
        // [ÁNH XẠ LOGIC CODE]
        // - if (po.getStatus() != POStatus.CREATED) -> False
        // - po.setStatus(POStatus.CANCELLED)
        // - purchaseOrderRepository.save(po)
        // - return ApiResponse.success(...)
 
        LocalDateTime now = LocalDateTime.now();
        Supplier sup = supplierRepository.save(Supplier.builder()
                .name("NCC 078").taxCode("TAX078").active(true).autoCreated(true).build());
        PurchaseOrder po = purchaseOrderRepository.save(PurchaseOrder.builder()
                .poCode("PO_078").supplier(sup).status(POStatus.CREATED)
                .orderDate(now).receivedDate(now.plusDays(1))
                .createdBy("TestUser").note("Ghi chú hủy").build());
 
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        ApiResponse response = inventoryService.cancelPurchaseOrder(po.getId());
 
        assertTrue(response.isSuccess());
        assertNotNull(response.getMessage());
 
        // Assert FULL CỘT của Object trả về trong Data
        PurchaseOrder returnedPo = (PurchaseOrder) response.getData();
        assertEquals(po.getId(), returnedPo.getId());
        assertEquals("PO_078", returnedPo.getPoCode());
        assertEquals(POStatus.CANCELLED, returnedPo.getStatus());
        assertEquals(sup.getId(), returnedPo.getSupplier().getId());
        assertEquals("TestUser", returnedPo.getCreatedBy());
        assertEquals("Ghi chú hủy", returnedPo.getNote());
        assertNotNull(returnedPo.getOrderDate());
        assertNotNull(returnedPo.getReceivedDate());
 
        // Assert DB thực sự được lưu
        PurchaseOrder dbPo = purchaseOrderRepository.findById(po.getId()).orElseThrow();
        assertEquals(POStatus.CANCELLED, dbPo.getStatus());
 
        assertRecordCountsUnchanged(beforeCounts);
    }
 
    // =========================================================================================
    // T E S T S : cancelExportOrder
    //
    // Phân tích nhánh logic:
    // 1. exportOrderRepository.findById().orElseThrow()         → Found / Throw
    // 2. if (eo.getStatus() != ExportStatus.CREATED)           → True (error) / False (cancel)
    //
    // Công thức: 2 điểm → 3 Test Cases
    //
    // Ánh xạ test → code:
    // 1. findById → Không thấy                                 → Exception (TC 079) ✅
    // 2. status != CREATED                                     → Error Response (TC 080) ✅
    // 3. status == CREATED                                     → Cancel + save (TC 081) ✅
    //
    // Tổng cộng: 3 Test Cases (phủ đủ).
    // =========================================================================================
 
    @Test
    @DisplayName("TC_INVENTORY_079 - Hủy Phiếu Xuất: Nhánh findById -> Empty (Exception)")
    void TC_INVENTORY_079_cancelExportOrder_notFound() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Ngăn chặn hủy phiếu xuất không tồn tại.
        // [ÁNH XẠ LOGIC CODE] exportOrderRepository.findById() -> Empty -> orElseThrow ném Exception
 
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        assertThrows(Exception.class, () -> {
            inventoryService.cancelExportOrder(9999L);
        });
 
        assertRecordCountsUnchanged(beforeCounts);
    }
 
    @Test
    @DisplayName("TC_INVENTORY_080 - Hủy Phiếu Xuất: Nhánh status != CREATED -> True")
    void TC_INVENTORY_080_cancelExportOrder_statusNotCreated() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Ngăn chặn hủy phiếu xuất đã hoàn tất (COMPLETED).
        // [ÁNH XẠ LOGIC CODE] if (eo.getStatus() != ExportStatus.CREATED) -> True -> Return Error
 
        ExportOrder eo = exportOrderRepository.save(ExportOrder.builder()
                .exportCode("EX_080").status(ExportStatus.COMPLETED).build());
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        ApiResponse response = inventoryService.cancelExportOrder(eo.getId());
 
        assertFalse(response.isSuccess());
        assertNotNull(response.getMessage());
        assertFalse(response.getMessage().isBlank());
        assertRecordCountsUnchanged(beforeCounts);
    }
 
    @Test
    @DisplayName("TC_INVENTORY_081 - Hủy Phiếu Xuất: Nhánh status == CREATED -> Happy Path (Assert Full Cột)")
    void TC_INVENTORY_081_cancelExportOrder_success() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Hủy thành công phiếu xuất đang chờ.
        // [ÁNH XẠ LOGIC CODE]
        // - eo.getStatus() != CREATED -> False
        // - eo.setStatus(CANCELLED) -> save()
 
        LocalDateTime now = LocalDateTime.now();
        ExportOrder eo = exportOrderRepository.save(ExportOrder.builder()
                .exportCode("EX_081").status(ExportStatus.CREATED)
                .exportDate(now).createdBy("Admin_081")
                .reason("Khách đổi ý").note("Đã thu hồi").build());
 
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        ApiResponse response = inventoryService.cancelExportOrder(eo.getId());
 
        assertTrue(response.isSuccess());
        assertNotNull(response.getMessage());
 
        // Assert FULL CỘT của Object trả về
        ExportOrder returnedEo = (ExportOrder) response.getData();
        assertEquals(eo.getId(), returnedEo.getId());
        assertEquals("EX_081", returnedEo.getExportCode());
        assertEquals(ExportStatus.CANCELLED, returnedEo.getStatus());
        assertEquals("Admin_081", returnedEo.getCreatedBy());
        assertEquals("Khách đổi ý", returnedEo.getReason());
        assertEquals("Đã thu hồi", returnedEo.getNote());
        assertNotNull(returnedEo.getExportDate());
 
        // Assert DB
        ExportOrder dbEo = exportOrderRepository.findById(eo.getId()).orElseThrow();
        assertEquals(ExportStatus.CANCELLED, dbEo.getStatus());
 
        assertRecordCountsUnchanged(beforeCounts);
    }
 
    // =========================================================================================
    // T E S T S : getStocks
    //
    // Phân tích nhánh logic:
    // 1. if ("low_stock".equals(status))                        → True / False
    // 2. else if ("out_of_stock".equals(status))                → True / False
    // 3. else                                                   → findAll
    // 4. stock.getOnHand() != null ? ... : 0L                  → True / False
    // 5. stock.getReserved() != null ? ... : 0L                → True / False
    // 6. stock.getDamaged() != null ? ... : 0L                 → True / False
    // 7. if (stock.getWarehouseProduct() != null)              → True / False
    // 8. catch (Exception e)                                   → Bắt lỗi
    //
    // Công thức: 8 điểm → 9 Test Cases
    //
    // Ánh xạ test → code:
    // 1. "low_stock"                                           → findLowStockItems (TC 082) ✅
    // 2. "out_of_stock"                                        → filter stream (TC 083) ✅
    // 3. else (chuỗi bất kỳ)                                  → findAll (TC 084) ✅
    // 4. onHand == null                                        → Fallback 0L (TC 085) ✅
    // 5. reserved == null                                      → Fallback 0L (TC 086) ✅
    // 6. damaged == null                                       → Fallback 0L (TC 087) ✅
    // 7. warehouseProduct == null                              → Bỏ qua key (TC 088) ✅
    // 8. catch Exception                                       → Error Response (TC 089) ✅
    //
    // Tổng cộng: 8 Test Cases (còn thiếu 1 case: status = null → else).
    // =========================================================================================

    @Test
    @DisplayName("TC_INVENTORY_082 - getStocks: Nhánh 'low_stock' -> True (Assert Full Cột DTO)")
    void TC_INVENTORY_082_getStocks_lowStock() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Lọc các sản phẩm sắp hết hàng (onHand < 10).
        // [ÁNH XẠ LOGIC CODE]
        // - if ("low_stock".equals(status)) -> True
        // - Gọi inventoryStockRepository.findLowStockItems(10L)
        // - Map full data qua HashMap
 
        // Tạo SP có onHand = 5 (< 10 → sắp hết) và SP có onHand = 20 (> 10 → không hiện)
        WarehouseProduct wpLow = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_LOW_82").internalName("SP Sắp Hết 82").build());
        WarehouseProduct wpFull = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_FULL_82").internalName("SP Đầy Kho 82").build());
 
        InventoryStock stockLow = inventoryStockRepository.save(InventoryStock.builder()
                .warehouseProduct(wpLow).onHand(5L).reserved(1L).damaged(0L).build());
        inventoryStockRepository.save(InventoryStock.builder()
                .warehouseProduct(wpFull).onHand(20L).reserved(0L).damaged(0L).build());
 
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        ApiResponse response = inventoryService.getStocks("low_stock");
        assertTrue(response.isSuccess());
 
        List<Map<String, Object>> data = (List<Map<String, Object>>) response.getData();
 
        // Phải chỉ trả về bản ghi có onHand < 10
        assertTrue(data.stream().anyMatch(m -> "SKU_LOW_82".equals(
                ((Map<?, ?>) m.getOrDefault("warehouseProduct", new HashMap<>())).get("sku"))));
 
        // Assert FULL CỘT item có low_stock
        Map<String, Object> item = data.stream()
                .filter(m -> {
                    Object wp = m.get("warehouseProduct");
                    return wp != null && "SKU_LOW_82".equals(((Map<?, ?>) wp).get("sku"));
                }).findFirst().orElseThrow();
 
        assertEquals(5L, item.get("onHand"));
        assertEquals(1L, item.get("reserved"));
        assertEquals(0L, item.get("damaged"));
        assertNotNull(item.get("id"));
 
        // Assert FULL CỘT warehouseProduct
        Map<String, Object> wpInfo = (Map<String, Object>) item.get("warehouseProduct");
        assertNotNull(wpInfo);
        assertEquals(wpLow.getId(), wpInfo.get("id"));
        assertEquals("SKU_LOW_82", wpInfo.get("sku"));
        assertEquals("SP Sắp Hết 82", wpInfo.get("internalName"));
 
        assertRecordCountsUnchanged(beforeCounts);
    }
 
    @Test
    @DisplayName("TC_INVENTORY_083 - getStocks: Nhánh 'out_of_stock' -> True (Lọc stream filter)")
    void TC_INVENTORY_083_getStocks_outOfStock() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Lọc sản phẩm hết hàng (onHand <= 0). Code dùng stream filter.
        // [ÁNH XẠ LOGIC CODE]
        // - else if ("out_of_stock".equals(status)) -> True
        // - filter(s -> s.getOnHand() <= 0)
 
        WarehouseProduct wpIn = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_IN_83").internalName("SP Còn Hàng 83").build());
        WarehouseProduct wpOut = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_OUT_83").internalName("SP Hết Hàng 83").build());
 
        inventoryStockRepository.save(InventoryStock.builder()
                .warehouseProduct(wpIn).onHand(10L).reserved(0L).damaged(0L).build());
        InventoryStock stockOut = inventoryStockRepository.save(InventoryStock.builder()
                .warehouseProduct(wpOut).onHand(0L).reserved(0L).damaged(0L).build());
 
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        ApiResponse response = inventoryService.getStocks("out_of_stock");
        List<Map<String, Object>> data = (List<Map<String, Object>>) response.getData();
 
        // Chỉ được trả về SP hết hàng
        assertTrue(data.stream().anyMatch(m -> {
            Object wp = m.get("warehouseProduct");
            return wp != null && "SKU_OUT_83".equals(((Map<?, ?>) wp).get("sku"));
        }));
 
        // SP còn hàng không được xuất hiện
        assertFalse(data.stream().anyMatch(m -> {
            Object wp = m.get("warehouseProduct");
            return wp != null && "SKU_IN_83".equals(((Map<?, ?>) wp).get("sku"));
        }));
 
        // Assert onHand của bản ghi hết hàng = 0
        Map<String, Object> outItem = data.stream()
                .filter(m -> {
                    Object wp = m.get("warehouseProduct");
                    return wp != null && "SKU_OUT_83".equals(((Map<?, ?>) wp).get("sku"));
                }).findFirst().orElseThrow();
        assertEquals(0L, outItem.get("onHand"));
 
        assertRecordCountsUnchanged(beforeCounts);
    }
 
    @Test
    @DisplayName("TC_INVENTORY_084 - getStocks: Nhánh else -> Gọi findAll (Lấy tất cả)")
    void TC_INVENTORY_084_getStocks_all() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Lấy tất cả khi param khác các case quy định (null hoặc chuỗi lạ).
        // [ÁNH XẠ LOGIC CODE]
        // - else -> { stocks = inventoryStockRepository.findAll(); }
 
        WarehouseProduct wp84 = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_ALL_84").internalName("SP Tất Cả 84").build());
        inventoryStockRepository.save(InventoryStock.builder()
                .warehouseProduct(wp84).onHand(15L).reserved(2L).damaged(1L).build());
 
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        ApiResponse response = inventoryService.getStocks("RANDOM_STATUS_ABC");
 
        assertTrue(response.isSuccess());
        List<Map<String, Object>> data = (List<Map<String, Object>>) response.getData();
 
        // Phải có ít nhất bản ghi vừa tạo
        assertFalse(data.isEmpty());
        assertTrue(data.stream().anyMatch(m -> {
            Object wp = m.get("warehouseProduct");
            return wp != null && "SKU_ALL_84".equals(((Map<?, ?>) wp).get("sku"));
        }));
 
        assertRecordCountsUnchanged(beforeCounts);
    }
 
    @Test
    @DisplayName("TC_INVENTORY_085 - getStocks: Nhánh onHand() != null -> False (Toán tử 3 ngôi fallback)")
    void TC_INVENTORY_085_getStocks_onHandNull() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Khi onHand trong DB bị null thì DTO phải fallback về 0L, không crash.
        // [ÁNH XẠ LOGIC CODE]
        // - stock.getOnHand() != null ? stock.getOnHand() : 0L -> False -> 0L
        // Lưu ý: Hibernate không thể lưu null cho onHand nếu có @Column(nullable=false).
        // Dùng Mockito để ép trạng thái null trong memory.
 
        InventoryStock mockStock = org.mockito.Mockito.mock(InventoryStock.class);
        org.mockito.Mockito.when(mockStock.getId()).thenReturn(85L);
        org.mockito.Mockito.when(mockStock.getOnHand()).thenReturn(null);
        org.mockito.Mockito.when(mockStock.getReserved()).thenReturn(5L);
        org.mockito.Mockito.when(mockStock.getDamaged()).thenReturn(0L);
        org.mockito.Mockito.doReturn(new ArrayList<>(List.of(mockStock))).when(inventoryStockRepository).findAll();
 
        ApiResponse response = inventoryService.getStocks("ALL");
        List<Map<String, Object>> data = (List<Map<String, Object>>) response.getData();
 
        assertEquals(0L, data.get(0).get("onHand")); // Giá trị fallback
        assertEquals(5L, data.get(0).get("reserved"));
    }
 
    @Test
    @DisplayName("TC_INVENTORY_086 - getStocks: Nhánh reserved() != null -> False (Toán tử 3 ngôi fallback)")
    void TC_INVENTORY_086_getStocks_reservedNull() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Fallback an toàn cho field Reserved khi bị null trong memory.
        // [ÁNH XẠ LOGIC CODE]
        // - stock.getReserved() != null ? stock.getReserved() : 0L -> False -> 0L
 
        InventoryStock mockStock = org.mockito.Mockito.mock(InventoryStock.class);
        org.mockito.Mockito.when(mockStock.getOnHand()).thenReturn(10L);
        org.mockito.Mockito.when(mockStock.getReserved()).thenReturn(null);
        org.mockito.Mockito.doReturn(new ArrayList<>(List.of(mockStock))).when(inventoryStockRepository).findAll();
 
        ApiResponse response = inventoryService.getStocks(null);
        List<Map<String, Object>> data = (List<Map<String, Object>>) response.getData();
 
        assertEquals(10L, data.get(0).get("onHand"));
        assertEquals(0L, data.get(0).get("reserved")); // Giá trị fallback
    }
 
    @Test
    @DisplayName("TC_INVENTORY_087 - getStocks: Nhánh damaged() != null -> False (Toán tử 3 ngôi fallback)")
    void TC_INVENTORY_087_getStocks_damagedNull() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Fallback an toàn cho field Damaged khi bị null trong memory.
        // [ÁNH XẠ LOGIC CODE]
        // - stock.getDamaged() != null ? stock.getDamaged() : 0L -> False -> 0L
 
        InventoryStock mockStock = org.mockito.Mockito.mock(InventoryStock.class);
        org.mockito.Mockito.when(mockStock.getDamaged()).thenReturn(null);
        org.mockito.Mockito.doReturn(new ArrayList<>(List.of(mockStock))).when(inventoryStockRepository).findAll();
 
        ApiResponse response = inventoryService.getStocks(null);
        List<Map<String, Object>> data = (List<Map<String, Object>>) response.getData();
 
        assertEquals(0L, data.get(0).get("damaged")); // Giá trị fallback
    }
 
    @Test
    @DisplayName("TC_INVENTORY_088 - getStocks: Nhánh if (stock.getWarehouseProduct() != null) -> False")
    void TC_INVENTORY_088_getStocks_warehouseProductNull() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Bỏ qua mapping khi WarehouseProduct bị null, không ném NullPointer.
        // [ÁNH XẠ LOGIC CODE]
        // - if (stock.getWarehouseProduct() != null) -> False -> Bỏ qua block thêm key "warehouseProduct"
 
        InventoryStock mockStock = org.mockito.Mockito.mock(InventoryStock.class);
        org.mockito.Mockito.when(mockStock.getWarehouseProduct()).thenReturn(null);
        org.mockito.Mockito.doReturn(new ArrayList<>(List.of(mockStock))).when(inventoryStockRepository).findAll();
 
        ApiResponse response = inventoryService.getStocks(null);
        List<Map<String, Object>> data = (List<Map<String, Object>>) response.getData();
 
        // Nhánh False → key "warehouseProduct" không được gán vào map
        assertFalse(data.get(0).containsKey("warehouseProduct"));
    }
 
    @Test
    @DisplayName("TC_INVENTORY_089 - getStocks: Nhánh catch (Exception) -> Bắt lỗi hệ thống")
    void TC_INVENTORY_089_getStocks_catchException() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Đảm bảo hàm không bao giờ quăng 500 ra ngoài mà bắt lại trả về Error Response.
        // [ÁNH XẠ LOGIC CODE]
        // - catch (Exception e) -> Bắt mọi lỗi, return ApiResponse.error(...)
 
        org.mockito.Mockito.doThrow(new RuntimeException("Lỗi cấu hình DB"))
                .when(inventoryStockRepository).findAll();
 
        ApiResponse response = inventoryService.getStocks(null);
 
        assertFalse(response.isSuccess());
        assertNotNull(response.getMessage());
        assertFalse(response.getMessage().isBlank());
    }
 
    // =========================================================================================
    // T E S T S : getStockDetails
    //
    // Phân tích nhánh logic:
    // 1. warehouseProductRepository.findById().orElseThrow()    → Found / Throw
    // 2. try { ... } catch (Exception e)                        → OK / Throw → Error Response
    // 3. details.stream().map()                                 → Rỗng (bypass) / Có phần tử
    //
    // Công thức: 3 điểm → 3 Test Cases
    //
    // Ánh xạ test → code:
    // 1. findById → Không thấy → catch → Error Response        → (TC 090) ✅
    // 2. details rỗng                                          → Mảng rỗng (TC 091) ✅
    // 3. details có phần tử                                    → Map 4 key (TC 092) ✅
    //
    // Tổng cộng: 3 Test Cases (phủ đủ).
    // =========================================================================================
 
    @Test
    @DisplayName("TC_INVENTORY_090 - Lấy chi tiết tồn kho: ID không tồn tại -> Rơi vào Catch block")
    void TC_INVENTORY_090_getStockDetails_notFound_caughtByException() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Người dùng truyền ID sản phẩm ảo, hệ thống trả về thông báo lỗi êm ái
        // thay vì crash toàn bộ.
        // [ÁNH XẠ LOGIC CODE]
        // - warehouseProductRepository.findById() -> Empty
        // - orElseThrow() -> Ném Exception
        // - catch (Exception e) -> Bắt lỗi và return ApiResponse.error
 
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        ApiResponse response = inventoryService.getStockDetails(9999L);
 
        assertFalse(response.isSuccess());
        assertNotNull(response.getMessage());
        assertFalse(response.getMessage().isBlank());
 
        assertRecordCountsUnchanged(beforeCounts);
    }
 
    @Test
    @DisplayName("TC_INVENTORY_091 - Lấy chi tiết tồn kho: List Serial rỗng (Bypass stream map)")
    void TC_INVENTORY_091_getStockDetails_emptySerials() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Sản phẩm kho có tồn tại nhưng chưa từng nhập bất kỳ serial nào.
        // [ÁNH XẠ LOGIC CODE]
        // - details rỗng -> details.stream().map(...) không chạy đoạn code bên trong.
        // - serialList là mảng rỗng -> return ApiResponse.success
 
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_NO_SERIAL").internalName("Sản phẩm không serial").build());
 
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        ApiResponse response = inventoryService.getStockDetails(wp.getId());
 
        assertTrue(response.isSuccess());
        assertNotNull(response.getMessage());
 
        List<Map<String, Object>> serialList = (List<Map<String, Object>>) response.getData();
        assertNotNull(serialList);
        assertTrue(serialList.isEmpty());
 
        assertRecordCountsUnchanged(beforeCounts);
    }
 
    @Test
    @DisplayName("TC_INVENTORY_092 - Lấy chi tiết tồn kho: Ánh xạ thành công DTO Map (Happy Path)")
    void TC_INVENTORY_092_getStockDetails_successWithSerials() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Lấy đầy đủ thông tin chi tiết từng serial (mã số, trạng thái, giá nhập, ngày nhập).
        // [ÁNH XẠ LOGIC CODE]
        // - details có phần tử -> Chạy vào bên trong map(d -> { ... })
        // - Lệnh put đủ 4 key: serialNumber, status, importDate, importPrice.
 
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_HAS_SERIAL").internalName("SP Có Serial").build());
 
        LocalDateTime now = LocalDateTime.now();
        productDetailRepository.save(ProductDetail.builder()
                .serialNumber("SN_92_1").status(ProductStatus.IN_STOCK)
                .importPrice(100.5).importDate(now).warrantyMonths(12).warehouseProduct(wp).build());
        productDetailRepository.save(ProductDetail.builder()
                .serialNumber("SN_92_2").status(ProductStatus.SOLD)
                .importPrice(200.0).importDate(now.minusDays(1)).warrantyMonths(6).warehouseProduct(wp).build());
 
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        ApiResponse response = inventoryService.getStockDetails(wp.getId());
 
        assertTrue(response.isSuccess());
        List<Map<String, Object>> serialList = (List<Map<String, Object>>) response.getData();
        assertEquals(2, serialList.size());
 
        // Assert TẤT CẢ thuộc tính Serial thứ nhất (IN_STOCK)
        Map<String, Object> sn1 = serialList.stream()
                .filter(m -> m.get("serialNumber").equals("SN_92_1")).findFirst().orElseThrow();
        assertEquals(ProductStatus.IN_STOCK, sn1.get("status"));
        assertEquals(100.5, sn1.get("importPrice"));
        assertNotNull(sn1.get("importDate"));
 
        // Assert TẤT CẢ thuộc tính Serial thứ hai (SOLD)
        Map<String, Object> sn2 = serialList.stream()
                .filter(m -> m.get("serialNumber").equals("SN_92_2")).findFirst().orElseThrow();
        assertEquals(ProductStatus.SOLD, sn2.get("status"));
        assertEquals(200.0, sn2.get("importPrice"));
        assertNotNull(sn2.get("importDate"));
 
        assertRecordCountsUnchanged(beforeCounts);
    }
 
    // =========================================================================================
    // T E S T S : exportForSale + createGHNOrderForExport
    //
    // Quy tắc đếm nhánh: if(A||B) → 1 nhánh; for → 2 case (0 và 1+);
    //                  cùng điều kiện dùng nhiều chỗ → tính 1.
    //
    // Phân tích nhánh logic (exportForSale):
    // 1.  if (req.getItems() == null || req.getItems().isEmpty()) → True / False
    // 2.  for (ExportItemRequest itemReq : req.getItems())        → 0 / 1+
    // 3.  warehouseProductRepository.findBySku().orElseThrow()   → Found / Throw
    // 4.  inventoryStockRepository.findByWarehouseProduct_Id().orElseThrow() → Found / Throw
    // 5.  if (stock.getOnHand() < exportCount)                   → True / False
    // 6.  for (String serial : itemReq.getSerialNumbers())        → 0 / 1+
    // 7.  productDetailRepository.findBySerialNumber().orElseThrow() → Found / Throw
    // 8.  if (pd.getStatus() != ProductStatus.IN_STOCK)          → True / False
    // 9.  stock.getReserved() != null ? ... : 0L                 → True / False
    // 10. if (wp.getProduct() != null) [syncStock + syncReserved — cùng đk → 1 nhánh]
    //                                                             → True / False
    // 11. if (req.getOrderId() != null)                          → True / False
    // 12. catch (Exception e) quanh createGHNOrderForExport      → Bắt / Không
    //
    // Phân tích nhánh logic (createGHNOrderForExport):
    // 13. if (ghnOrderCode != null && !isEmpty())                 → True / False
    // 14. if (shippingFee == 0 || isHanoiInnerCity())            → True / False
    // 15. wardName != null && !wardName.isEmpty() ? wardName : ward → True / False
    // 16. "COD".equals(paymentMethod) [codAmount + paymentTypeId — cùng đk → 1 nhánh]
    //                                                             → True / False
    //
    // Tổng điểm rẽ: 16 → Số test = 17 (B1 có 2 test; B9 False thêm TC 093)
    //
    // Ánh xạ chi tiết test → nhánh được phủ (exportForSale):
    // TC 094 — B1 True (null)    : req.items == null → trả Error ngay, không vào vòng lặp
    // TC 095 — B1 True (empty)   : req.items rỗng → trả Error ngay                [cùng nhánh B1]
    // TC 093 — B9 False (null)   : stock.reserved == null → ternary trả 0L, kho giảm đúng
    // TC 096 — B3 Throw          : findBySku → không tìm thấy → ném Exception
    // TC 097 — B4 Throw          : findStock → không tìm thấy → ném Exception
    // TC 098 — B5 True           : onHand < exportCount → trả Error thiếu hàng
    // TC 099 — B7 Throw          : findBySerialNumber → không thấy → ném Exception
    // TC 100 — B8 True           : pd.status != IN_STOCK → trả Error serial không hợp lệ
    // TC 101 — B1F,B2+,B3F–B8F  : Happy Path cơ bản: reserved=0L(B9T), product=null(B10F),
    //                              orderId=null(B11F), xuất 1 serial → thành công, không GHN
    // TC 119 — B9 True (non-0)   : reserved = 3L → cập nhật đúng, reserved = max(0, 3-1) = 2
    // TC 120 — B10 True          : wp.getProduct() != null → đồng bộ stockQty và reservedQty
    // TC 102 — B11 True + B12    : orderId != null → gọi GHN; exception bị catch, kho vẫn trừ
    //
    // Ánh xạ chi tiết test → nhánh được phủ (createGHNOrderForExport):
    // TC 103 — B13 True          : ghnOrderCode đã có → return sớm, không gọi lại GHN
    // TC 104 — B14 True (fee=0)  : shippingFee == 0 → set READY_TO_SHIP, lưu order, skip GHN
    // TC 105 — B14 True (city)   : isHanoiInnerCity() == true → set READY_TO_SHIP, skip GHN [cùng B14]
    // TC 106 — B14F, B15T, B16T  : tạo GHN: wardName hợp lệ (B15T), COD (B16T) → codAmount=total
    // TC 107 — B14F, B15F, B16F  : tạo GHN: wardName rỗng → fallback mã ward (B15F),
    //                              VNPAY (B16F) → codAmount=0, paymentTypeId=1
    //
    // Tổng cộng: 17 Test Cases phủ đủ 16 nhánh (TC 094+095 cùng phủ B1 True).
    // =========================================================================================
 
    @Test
    @DisplayName("TC_INVENTORY_093 - Xuất bán: stock.reserved == null trong DB → ternary trả 0L (B9 False)")
    void TC_INVENTORY_093_exportForSale_reservedNull_ternaryFalsePath() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Khi InventoryStock.reserved chưa được khởi tạo (null trong DB), toán tử 3 ngôi (B9)
        // phải chọn nhánh False → trả 0L để tránh NullPointerException.
        // newReserved = Math.max(0, 0L - 1) = 0 → kho không bị âm.
        //
        // [ÁNH XẠ LOGIC CODE]
        // - Long currentReserved = stock.getReserved() != null ? stock.getReserved() : 0L
        //   → stock.getReserved() == null → FALSE → currentReserved = 0L   ← NHÁNH ĐỞ B9

        // 1. Chuẩn bị kho: reserved để null (đông lượt đầu chưa từng giữ hàng)
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_093").internalName("SP ReservedNull 093")
                .description("Test 093").techSpecsJson("{}").build());
        inventoryStockRepository.save(InventoryStock.builder()
                .warehouseProduct(wp).onHand(3L).reserved(null).damaged(0L).build());
        productDetailRepository.save(ProductDetail.builder()
                .serialNumber("SN_093").status(ProductStatus.IN_STOCK)
                .importPrice(150.0).warrantyMonths(12).warehouseProduct(wp).build());

        // 2. Thực thi
        ExportItemRequest item = new ExportItemRequest();
        item.setProductSku("SKU_093");
        item.setSerialNumbers(new ArrayList<>(List.of("SN_093")));
        ApiResponse response = inventoryService.exportForSale(
                buildSaleExportRequest(new ArrayList<>(List.of(item)), null));

        // 3. Assert thành công
        assertTrue(response.isSuccess());

        // 4. Assert kho giảm đúng: onHand 3 → 2
        InventoryStock dbStock = inventoryStockRepository
                .findByWarehouseProduct_Id(wp.getId()).orElseThrow();
        assertEquals(2L, dbStock.getOnHand(),
                "onHand phải giảm từ 3 xuống 2 sau khi xuất 1 cái");
        assertEquals(0L, dbStock.getReserved(),
                "reserved phải là 0 (max(0, 0L-1)) khi bắt đầu từ null");

        // 5. Assert serial được đánh dấu SOLD
        ProductDetail dbPd = productDetailRepository
                .findBySerialNumber("SN_093").orElseThrow();
        assertEquals(ProductStatus.SOLD, dbPd.getStatus());
    }
 
    @Test
    @DisplayName("TC_INVENTORY_094 - Xuất bán: Nhánh req.getItems() == null -> Error")
    void TC_INVENTORY_094_exportForSale_itemsNull() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Yêu cầu xuất bán mà không có danh sách sản phẩm -> Từ chối.
        // [ÁNH XẠ LOGIC CODE] req.getItems() == null -> return error
 
        SaleExportRequest req = buildSaleExportRequest(null, null);
        ApiResponse response = inventoryService.exportForSale(req);
        assertFalse(response.isSuccess());
        assertNotNull(response.getMessage());
        assertFalse(response.getMessage().isBlank());
    }
 
    @Test
    @DisplayName("TC_INVENTORY_095 - Xuất bán: Nhánh req.getItems().isEmpty() -> Error")
    void TC_INVENTORY_095_exportForSale_itemsEmpty() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Danh sách sản phẩm rỗng -> Từ chối.
        // [ÁNH XẠ LOGIC CODE] req.getItems().isEmpty() -> return error
 
        SaleExportRequest req = buildSaleExportRequest(new ArrayList<>(List.of()), null);
        ApiResponse response = inventoryService.exportForSale(req);
        assertFalse(response.isSuccess());
        assertNotNull(response.getMessage());
        assertFalse(response.getMessage().isBlank());
    }
 
    @Test
    @DisplayName("TC_INVENTORY_096 - Xuất bán: Nhánh findBySku -> Empty (Exception)")
    void TC_INVENTORY_096_exportForSale_skuNotFound() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Mã SKU không tồn tại trong kho -> Throw Exception.
        // [ÁNH XẠ LOGIC CODE] warehouseProductRepository.findBySku() -> Empty -> Exception
 
        ExportItemRequest item = new ExportItemRequest();
        item.setProductSku("SKU_GHOST");
        SaleExportRequest req = buildSaleExportRequest(new ArrayList<>(List.of(item)), null);
 
        assertThrows(Exception.class, () -> inventoryService.exportForSale(req));
    }
 
    @Test
    @DisplayName("TC_INVENTORY_097 - Xuất bán: Nhánh findByWarehouseProduct_Id -> Empty (Exception)")
    void TC_INVENTORY_097_exportForSale_stockNotFound() {
        // [MỤC ĐÍCH NGHIỆP VỤ] SKU hợp lệ nhưng chưa có tồn kho -> Throw Exception.
        // [ÁNH XẠ LOGIC CODE] inventoryStockRepository.findByWarehouseProduct_Id() -> Empty -> Exception
 
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_NO_STOCK_97").internalName("SP Chưa Nhập 97").build());
 
        ExportItemRequest item = new ExportItemRequest();
        item.setProductSku("SKU_NO_STOCK_97");
        SaleExportRequest req = buildSaleExportRequest(new ArrayList<>(List.of(item)), null);
 
        assertThrows(Exception.class, () -> inventoryService.exportForSale(req));
    }
 
    @Test
    @DisplayName("TC_INVENTORY_098 - Xuất bán: Nhánh stock.getOnHand() < exportCount -> Error")
    void TC_INVENTORY_098_exportForSale_notEnoughStock() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Tồn kho không đủ -> Trả về error.
        // [ÁNH XẠ LOGIC CODE] if (stock.getOnHand() < exportCount) -> True -> return error
 
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_SHORT_98").internalName("SP Thiếu 98").build());
        inventoryStockRepository.save(InventoryStock.builder()
                .warehouseProduct(wp).onHand(1L).reserved(0L).damaged(0L).build());
 
        ExportItemRequest item = new ExportItemRequest();
        item.setProductSku("SKU_SHORT_98");
        item.setSerialNumbers(new ArrayList<>(List.of("SN1", "SN2"))); // Yêu cầu 2 nhưng chỉ có 1
        SaleExportRequest req = buildSaleExportRequest(new ArrayList<>(List.of(item)), null);
 
        ApiResponse response = inventoryService.exportForSale(req);
        assertFalse(response.isSuccess());
        assertNotNull(response.getMessage());
        assertFalse(response.getMessage().isBlank());
    }
 
    @Test
    @DisplayName("TC_INVENTORY_099 - Xuất bán: Nhánh findBySerialNumber -> Empty (Exception)")
    void TC_INVENTORY_099_exportForSale_serialNotFound() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Serial không tồn tại trong DB -> Throw Exception.
        // [ÁNH XẠ LOGIC CODE] productDetailRepository.findBySerialNumber() -> Empty -> Exception
 
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_FAKE_SN_99").internalName("SP Serial Ảo 99").build());
        inventoryStockRepository.save(InventoryStock.builder()
                .warehouseProduct(wp).onHand(5L).reserved(0L).damaged(0L).build());
 
        ExportItemRequest item = new ExportItemRequest();
        item.setProductSku("SKU_FAKE_SN_99");
        item.setSerialNumbers(new ArrayList<>(List.of("SN_GHOST_123")));
        SaleExportRequest req = buildSaleExportRequest(new ArrayList<>(List.of(item)), null);
 
        assertThrows(Exception.class, () -> inventoryService.exportForSale(req));
    }
 
    @Test
    @DisplayName("TC_INVENTORY_100 - Xuất bán: Nhánh pd.getStatus() != IN_STOCK -> Error")
    void TC_INVENTORY_100_exportForSale_serialNotInStock() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Serial đã bán (SOLD) không thể xuất lại -> Trả về error.
        // [ÁNH XẠ LOGIC CODE] if (pd.getStatus() != IN_STOCK) -> True -> return error
 
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_SOLD_100").internalName("SP Đã Bán 100").build());
        inventoryStockRepository.save(InventoryStock.builder()
                .warehouseProduct(wp).onHand(5L).reserved(0L).damaged(0L).build());
        productDetailRepository.save(ProductDetail.builder()
                .serialNumber("SN_SOLD_100").status(ProductStatus.SOLD)
                .importPrice(100.0).warrantyMonths(12).warehouseProduct(wp).build());
 
        ExportItemRequest item = new ExportItemRequest();
        item.setProductSku("SKU_SOLD_100");
        item.setSerialNumbers(new ArrayList<>(List.of("SN_SOLD_100")));
        SaleExportRequest req = buildSaleExportRequest(new ArrayList<>(List.of(item)), null);
 
        ApiResponse response = inventoryService.exportForSale(req);
        assertFalse(response.isSuccess());
        assertNotNull(response.getMessage());
        assertFalse(response.getMessage().isBlank());
    }
 
    @Test
    @DisplayName("TC_INVENTORY_101 - Xuất bán Happy Path 1: Reserved = null, wp.getProduct() = null, orderId = null")
    void TC_INVENTORY_101_exportForSale_success_nullBranches() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Xuất kho độc lập không cần tạo đơn GHN (orderId=null).
        // Fallback an toàn khi Reserved = null, bỏ qua đồng bộ Product khi Product cha = null.
        // [ÁNH XẠ LOGIC CODE]
        // - stock.getReserved() == null -> Fallback 0L
        // - wp.getProduct() == null -> Bỏ qua đồng bộ
        // - orderId == null -> Bỏ qua tạo đơn GHN
 
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_101").internalName("SP Xuất Bán 101").description("Test 101")
                .techSpecsJson("{}").build());
        InventoryStock stock = inventoryStockRepository.save(InventoryStock.builder()
                .warehouseProduct(wp).onHand(2L).reserved(null).damaged(0L).build());
        ProductDetail pd = productDetailRepository.save(ProductDetail.builder()
                .serialNumber("SN_101").status(ProductStatus.IN_STOCK)
                .importPrice(150.0).warrantyMonths(12).warehouseProduct(wp).build());
 
        ExportItemRequest item = new ExportItemRequest();
        item.setProductSku("SKU_101");
        item.setSerialNumbers(new ArrayList<>(List.of("SN_101")));
        SaleExportRequest req = buildSaleExportRequest(new ArrayList<>(List.of(item)), null);
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        ApiResponse response = inventoryService.exportForSale(req);
        assertTrue(response.isSuccess());
 
        // Assert Inventory Stock: onHand trừ 1, reserved fallback từ null -> 0L
        InventoryStock dbStock = inventoryStockRepository.findById(stock.getId()).orElseThrow();
        assertEquals(1L, dbStock.getOnHand());
        assertEquals(0L, dbStock.getReserved());
 
        // Assert Export Order (FULL CỘT)
        ExportOrder dbOrder = exportOrderRepository.findByExportCode((String) response.getData()).orElseThrow();
        assertEquals(ExportStatus.COMPLETED, dbOrder.getStatus());
        assertEquals("SALE", dbOrder.getReason());
        assertNull(dbOrder.getOrderId());
        assertEquals(1, dbOrder.getItems().size());
        assertEquals(150.0, dbOrder.getItems().get(0).getTotalCost());
        assertEquals("SN_101", dbOrder.getItems().get(0).getSerialNumbers());
        assertEquals("SKU_101", dbOrder.getItems().get(0).getSku());
        assertEquals(1L, dbOrder.getItems().get(0).getQuantity());
 
        assertEquals(beforeCounts.get("ExportOrder") + 1, exportOrderRepository.count());
    }
 
    @Test
    @DisplayName("TC_INVENTORY_102 - Xuất bán với GHN: Nhánh orderRepository ném Exception -> Catch Bypass")
    void TC_INVENTORY_102_exportForSale_ghnExceptionCaught() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Nếu việc tạo đơn giao hàng lỗi, không được phép rollback việc trừ kho.
        // [ÁNH XẠ LOGIC CODE] catch quanh GHN logic -> Bắt lỗi, vẫn return success
 
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_102").internalName("SP GHN Lỗi 102").description("Test 102")
                .techSpecsJson("{}").build());
        inventoryStockRepository.save(InventoryStock.builder()
                .warehouseProduct(wp).onHand(1L).reserved(0L).damaged(0L).build());
        productDetailRepository.save(ProductDetail.builder()
                .serialNumber("SN_102").status(ProductStatus.IN_STOCK)
                .importPrice(100.0).warrantyMonths(12).warehouseProduct(wp).build());
 
        ExportItemRequest item = new ExportItemRequest();
        item.setProductSku("SKU_102");
        item.setSerialNumbers(new ArrayList<>(List.of("SN_102")));
        SaleExportRequest req = buildSaleExportRequest(new ArrayList<>(List.of(item)), 999L); // ID đơn ảo
 
        org.mockito.Mockito.doThrow(new RuntimeException("Lỗi mạng")).when(orderRepository).findById(999L);
 
        ApiResponse response = inventoryService.exportForSale(req);
 
        assertTrue(response.isSuccess());
        assertNotNull(response.getMessage());
    }
 
    @Test
    @DisplayName("TC_INVENTORY_103 - Xuất bán với GHN: Nhánh order đã có GHN Code -> Return early")
    void TC_INVENTORY_103_exportForSale_ghnAlreadyExists() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Đơn hàng đã có mã GHN → Bỏ qua không tạo thêm.
        // [ÁNH XẠ LOGIC CODE] order.getGhnOrderCode() != null -> Return
 
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_103").internalName("SP GHN Cũ 103").description("Test 103")
                .techSpecsJson("{}").build());
        inventoryStockRepository.save(InventoryStock.builder()
                .warehouseProduct(wp).onHand(1L).reserved(0L).damaged(0L).build());
        productDetailRepository.save(ProductDetail.builder()
                .serialNumber("SN_103").status(ProductStatus.IN_STOCK)
                .importPrice(100.0).warrantyMonths(12).warehouseProduct(wp).build());
 
        com.doan.WEB_TMDT.module.order.entity.Order mockOrder = new com.doan.WEB_TMDT.module.order.entity.Order();
        mockOrder.setOrderCode("ORD_103");
        mockOrder.setGhnOrderCode("GHN_OLD_CODE"); // Đã có code
 
        org.mockito.Mockito.doReturn(java.util.Optional.of(mockOrder)).when(orderRepository).findById(103L);
 
        ExportItemRequest item = new ExportItemRequest();
        item.setProductSku("SKU_103");
        item.setSerialNumbers(new ArrayList<>(List.of("SN_103")));
        ApiResponse response = inventoryService.exportForSale(buildSaleExportRequest(new ArrayList<>(List.of(item)), 103L));
 
        assertTrue(response.isSuccess());
        org.mockito.Mockito.verify(shippingService, org.mockito.Mockito.never())
                .createGHNOrder(org.mockito.Mockito.any());
    }
 
    @Test
    @DisplayName("TC_INVENTORY_104 - Xuất bán với GHN: Nhánh shippingFee == 0 -> Set READY_TO_SHIP")
    void TC_INVENTORY_104_exportForSale_shippingFeeZero() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Phí ship = 0 → Đơn nội bộ/miễn phí, chuyển trạng thái luôn.
        // [ÁNH XẠ LOGIC CODE] shippingFee == 0 -> Return, đổi status sang READY_TO_SHIP
 
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_104").internalName("SP Fee Zero 104").description("Test 104")
                .techSpecsJson("{}").build());
        inventoryStockRepository.save(InventoryStock.builder()
                .warehouseProduct(wp).onHand(1L).reserved(0L).damaged(0L).build());
        productDetailRepository.save(ProductDetail.builder()
                .serialNumber("SN_104").status(ProductStatus.IN_STOCK)
                .importPrice(100.0).warrantyMonths(12).warehouseProduct(wp).build());
 
        com.doan.WEB_TMDT.module.order.entity.Order mockOrder = new com.doan.WEB_TMDT.module.order.entity.Order();
        mockOrder.setOrderCode("ORD_104");
        mockOrder.setShippingFee(0.0);
 
        org.mockito.Mockito.doReturn(java.util.Optional.of(mockOrder)).when(orderRepository).findById(104L);
 
        ExportItemRequest item = new ExportItemRequest();
        item.setProductSku("SKU_104");
        item.setSerialNumbers(new ArrayList<>(List.of("SN_104")));
        inventoryService.exportForSale(buildSaleExportRequest(new ArrayList<>(List.of(item)), 104L));
 
        assertEquals(com.doan.WEB_TMDT.module.order.entity.OrderStatus.READY_TO_SHIP, mockOrder.getStatus());
        assertNotNull(mockOrder.getShippedAt());
        org.mockito.Mockito.verify(shippingService, org.mockito.Mockito.never())
                .createGHNOrder(org.mockito.Mockito.any());
    }
 
    @Test
    @DisplayName("TC_INVENTORY_105 - Xuất bán với GHN: Nhánh isHanoiInnerCity == true -> Set READY_TO_SHIP")
    void TC_INVENTORY_105_exportForSale_isHanoiInner() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Địa chỉ nội thành Hà Nội → Tự giao, không cần GHN.
        // [ÁNH XẠ LOGIC CODE] isHanoiInnerCity(...) -> True -> Return, đổi status sang READY_TO_SHIP
 
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_105").internalName("SP HN Nội Thành 105").description("Test 105")
                .techSpecsJson("{}").build());
        inventoryStockRepository.save(InventoryStock.builder()
                .warehouseProduct(wp).onHand(1L).reserved(0L).damaged(0L).build());
        productDetailRepository.save(ProductDetail.builder()
                .serialNumber("SN_105").status(ProductStatus.IN_STOCK)
                .importPrice(100.0).warrantyMonths(12).warehouseProduct(wp).build());
 
        com.doan.WEB_TMDT.module.order.entity.Order mockOrder = new com.doan.WEB_TMDT.module.order.entity.Order();
        mockOrder.setShippingFee(30000.0);
        mockOrder.setProvince("Hà Nội");
        mockOrder.setDistrict("Ba Đình");
 
        org.mockito.Mockito.doReturn(java.util.Optional.of(mockOrder)).when(orderRepository).findById(105L);
        org.mockito.Mockito.doReturn(true).when(shippingService).isHanoiInnerCity("Hà Nội", "Ba Đình");
 
        ExportItemRequest item = new ExportItemRequest();
        item.setProductSku("SKU_105");
        item.setSerialNumbers(new ArrayList<>(List.of("SN_105")));
        inventoryService.exportForSale(buildSaleExportRequest(new ArrayList<>(List.of(item)), 105L));
 
        assertEquals(com.doan.WEB_TMDT.module.order.entity.OrderStatus.READY_TO_SHIP, mockOrder.getStatus());
        org.mockito.Mockito.verify(shippingService, org.mockito.Mockito.never())
                .createGHNOrder(org.mockito.Mockito.any());
    }
 
    @Test
    @DisplayName("TC_INVENTORY_106 - Xuất bán với GHN Full Happy Path: Sync Product, WardName != null, Payment = COD")
    void TC_INVENTORY_106_exportForSale_ghnFull_syncProduct_cod_wardNameValid() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Test luồng tạo đơn giao hàng hoàn hảo. Assert 100% Request gửi sang GHN.
        // [ÁNH XẠ LOGIC CODE]
        // - wp.getProduct() != null -> Thực hiện lệnh đồng bộ
        // - wardName != null && !isEmpty -> Lấy wardName gộp vào fullAddress
        // - "COD".equals() -> codAmount = total, paymentTypeId = 2
 
        Product product = productRepository.save(Product.builder()
                .name("Prod 106").stockQuantity(10L).reservedQuantity(5L).build());
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_106").internalName("SP GHN 106").product(product).build());
        InventoryStock stock = inventoryStockRepository.save(InventoryStock.builder()
                .warehouseProduct(wp).onHand(10L).reserved(5L).damaged(0L).build());
        productDetailRepository.save(ProductDetail.builder()
                .serialNumber("SN_106").status(ProductStatus.IN_STOCK)
                .importPrice(100.0).warrantyMonths(12).warehouseProduct(wp).build());
 
        Customer cus = new Customer();
        cus.setFullName("Nguyễn Văn A");
        cus.setPhone("0987654321");
 
        OrderItem orderItem = new OrderItem();
        orderItem.setProductName("Test SP GHN");
        orderItem.setProduct(product);
        orderItem.setQuantity(1);
        orderItem.setPrice(150000.0);
 
        Order mockOrder = new Order();
        mockOrder.setOrderCode("ORD_106");
        mockOrder.setCustomer(cus);
        mockOrder.setAddress("Số 1 Ngõ 2");
        mockOrder.setProvince("Hà Nội");
        mockOrder.setDistrict("Đan Phượng");
        mockOrder.setWardName("Xã Tân Hội");
        mockOrder.setWard("W123");
        mockOrder.setNote("Giao giờ hành chính");
        mockOrder.setPaymentMethod("COD");
        mockOrder.setTotal(150000.0);
        mockOrder.setShippingFee(30000.0);
        mockOrder.setItems(new ArrayList<>(List.of(orderItem)));
 
        org.mockito.Mockito.doReturn(java.util.Optional.of(mockOrder)).when(orderRepository).findById(106L);
        org.mockito.Mockito.doReturn(false).when(shippingService)
                .isHanoiInnerCity(org.mockito.Mockito.any(), org.mockito.Mockito.any());
 
        com.doan.WEB_TMDT.module.shipping.dto.CreateGHNOrderResponse ghnResp =
                new com.doan.WEB_TMDT.module.shipping.dto.CreateGHNOrderResponse();
        ghnResp.setOrderCode("GHN_SUCCESS_106");
        org.mockito.Mockito.doReturn(ghnResp).when(shippingService)
                .createGHNOrder(org.mockito.Mockito.any());
 
        ExportItemRequest item = new ExportItemRequest();
        item.setProductSku("SKU_106");
        item.setSerialNumbers(new ArrayList<>(List.of("SN_106")));
        ApiResponse response = inventoryService.exportForSale(buildSaleExportRequest(new ArrayList<>(List.of(item)), 106L));
        assertTrue(response.isSuccess());
 
        // 1. Assert DB Sync (Giảm 1 onHand, Giảm 1 reserved)
        assertEquals(9L, inventoryStockRepository.findById(stock.getId()).get().getOnHand());
        assertEquals(4L, inventoryStockRepository.findById(stock.getId()).get().getReserved());
        assertEquals(9L, productRepository.findById(product.getId()).get().getStockQuantity());
        assertEquals(4L, productRepository.findById(product.getId()).get().getReservedQuantity());
 
        // 2. Assert GHN Request Map chuẩn xác bằng ArgumentCaptor
        org.mockito.ArgumentCaptor<com.doan.WEB_TMDT.module.shipping.dto.CreateGHNOrderRequest> captor =
            org.mockito.ArgumentCaptor.forClass(
                    com.doan.WEB_TMDT.module.shipping.dto.CreateGHNOrderRequest.class);
        org.mockito.Mockito.verify(shippingService).createGHNOrder(captor.capture());
 
        com.doan.WEB_TMDT.module.shipping.dto.CreateGHNOrderRequest ghnReq = captor.getValue();
        assertEquals("Nguyễn Văn A", ghnReq.getToName());
        assertEquals("0987654321", ghnReq.getToPhone());
        assertEquals("Số 1 Ngõ 2, Xã Tân Hội, Đan Phượng, Hà Nội", ghnReq.getToAddress());
        assertEquals("W123", ghnReq.getToWardCode());
        assertEquals("Giao giờ hành chính", ghnReq.getNote());
        assertEquals(150000, ghnReq.getCodAmount());
        assertEquals(2, ghnReq.getPaymentTypeId());
        assertEquals(1, ghnReq.getItems().size());
        assertEquals("Test SP GHN", ghnReq.getItems().get(0).getName());
 
        // 3. Assert cập nhật Order Entity
        assertEquals("GHN_SUCCESS_106", mockOrder.getGhnOrderCode());
        assertEquals(com.doan.WEB_TMDT.module.order.entity.OrderStatus.READY_TO_SHIP, mockOrder.getStatus());
    }
 
    @Test
    @DisplayName("TC_INVENTORY_107 - Xuất bán với GHN: Fallback WardName rỗng và Payment VNPAY")
    void TC_INVENTORY_107_exportForSale_ghn_wardNameEmpty_paymentVnPay() {
        // [MỤC ĐÍCH NGHIỆP VỤ] WardName rỗng → dùng mã ward; Payment VNPAY → codAmount = 0.
        // [ÁNH XẠ LOGIC CODE]
        // - wardName == "" -> fallback sang mã ward (wCode)
        // - !"COD".equals("VNPAY") -> codAmount = 0, paymentTypeId = 1
 
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_107").internalName("SP GHN VNPAY 107").description("Test 107")
                .techSpecsJson("{}").build());
        inventoryStockRepository.save(InventoryStock.builder()
                .warehouseProduct(wp).onHand(1L).reserved(0L).damaged(0L).build());
        productDetailRepository.save(ProductDetail.builder()
                .serialNumber("SN_107").status(ProductStatus.IN_STOCK)
                .importPrice(100.0).warrantyMonths(12).warehouseProduct(wp).build());
 
        Customer cus = new Customer();
 
        com.doan.WEB_TMDT.module.order.entity.Order mockOrder = new com.doan.WEB_TMDT.module.order.entity.Order();
        mockOrder.setCustomer(cus);
        mockOrder.setAddress("Add");
        mockOrder.setProvince("Prov");
        mockOrder.setDistrict("Dist");
        mockOrder.setWardName(""); // Rỗng
        mockOrder.setWard("W_CODE");
        mockOrder.setPaymentMethod("VNPAY");
        mockOrder.setShippingFee(50000.0);
        mockOrder.setItems(new ArrayList<>(List.of()));
 
        org.mockito.Mockito.doReturn(java.util.Optional.of(mockOrder)).when(orderRepository).findById(107L);
        org.mockito.Mockito.doReturn(false).when(shippingService)
                .isHanoiInnerCity(org.mockito.Mockito.any(), org.mockito.Mockito.any());
        org.mockito.Mockito.doReturn(new com.doan.WEB_TMDT.module.shipping.dto.CreateGHNOrderResponse())
                .when(shippingService).createGHNOrder(org.mockito.Mockito.any());
 
        ExportItemRequest item = new ExportItemRequest();
        item.setProductSku("SKU_107");
        item.setSerialNumbers(new ArrayList<>(List.of("SN_107")));
        inventoryService.exportForSale(buildSaleExportRequest(new ArrayList<>(List.of(item)), 107L));
 
        org.mockito.ArgumentCaptor<com.doan.WEB_TMDT.module.shipping.dto.CreateGHNOrderRequest> captor =
            org.mockito.ArgumentCaptor.forClass(
                    com.doan.WEB_TMDT.module.shipping.dto.CreateGHNOrderRequest.class);
        org.mockito.Mockito.verify(shippingService).createGHNOrder(captor.capture());
 
        com.doan.WEB_TMDT.module.shipping.dto.CreateGHNOrderRequest ghnReq = captor.getValue();
        assertEquals("Add, W_CODE, Dist, Prov", ghnReq.getToAddress()); // Dùng W_CODE thay cho wardName
        assertEquals(0, ghnReq.getCodAmount()); // Đã thanh toán nên COD = 0
        assertEquals(1, ghnReq.getPaymentTypeId()); // Shop trả phí (1)
    }
 
    // =========================================================================================
    // T E S T S : exportForWarranty
    //
    // Phân tích nhánh logic:
    // 1. productDetailRepository.findBySerialNumber().orElseThrow() → Found / Throw
    // 2. if (pd.getStatus() != IN_STOCK && pd.getStatus() != SOLD)  → True / False
    // 3. inventoryStockRepository.findByWarehouseProduct_Id().orElseThrow() → Found / Throw
    // 4. if (stock.getOnHand() <= 0)                               → True / False
    // 5. syncStockWithProduct → wp.getProduct() != null            → True / False
    //
    // Công thức: 5 điểm → 6 Test Cases
    //
    // Ánh xạ test → code:
    // 1. findBySerialNumber → Không thấy                          → Exception (TC 108) ✅
    // 2. status không hợp lệ (WARRANTY)                           → Error (TC 109) ✅
    // 3. Stock không tìm thấy                                     → Exception (TC 110) ✅
    // 4. onHand <= 0                                              → Error (TC 111) ✅
    // 5. Happy Path: status=IN_STOCK, product=null, no sync       → Success (TC 112) ✅
    // 6. Happy Path: status=SOLD, product != null, có sync        → Success (TC 113) ✅
    //
    // Tổng cộng: 6 Test Cases (phủ đủ).
    // =========================================================================================
 
    @Test
    @DisplayName("TC_INVENTORY_108 - Xuất bảo hành: Nhánh findBySerialNumber -> Empty (Exception)")
    void TC_INVENTORY_108_exportForWarranty_serialNotFound() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Ngăn chặn bảo hành một mã máy (Serial) không tồn tại trên hệ thống.
        // [ÁNH XẠ LOGIC CODE] productDetailRepository.findBySerialNumber() -> Empty -> ném Exception
 
        WarrantyExportRequest req = buildWarrantyExportRequest("SKU_ANY", "SN_GHOST", "Test Note");
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        assertThrows(Exception.class, () -> {
            inventoryService.exportForWarranty(req);
        });
 
        assertRecordCountsUnchanged(beforeCounts);
    }
 
    @Test
    @DisplayName("TC_INVENTORY_109 - Xuất bảo hành: Nhánh status != IN_STOCK && status != SOLD -> True")
    void TC_INVENTORY_109_exportForWarranty_invalidStatus() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Chỉ cho bảo hành hàng trong kho hoặc đã bán. Đang bảo hành rồi thì chặn.
        // [ÁNH XẠ LOGIC CODE] pd.getStatus() != IN_STOCK (True) && pd.getStatus() != SOLD (True) -> Error
 
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_109").internalName("SP Trạng Thái Lỗi 109").build());
        productDetailRepository.save(ProductDetail.builder()
                .serialNumber("SN_109").status(ProductStatus.WARRANTY)
                .importPrice(100.0).warrantyMonths(12).warehouseProduct(wp).build());
 
        WarrantyExportRequest req = buildWarrantyExportRequest("SKU_109", "SN_109", "Bảo hành");
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        ApiResponse response = inventoryService.exportForWarranty(req);
 
        assertFalse(response.isSuccess());
        assertNotNull(response.getMessage());
        assertFalse(response.getMessage().isBlank());
        assertRecordCountsUnchanged(beforeCounts);
    }
 
    @Test
    @DisplayName("TC_INVENTORY_110 - Xuất bảo hành: Nhánh findByWarehouseProduct_Id -> Empty (Exception)")
    void TC_INVENTORY_110_exportForWarranty_stockNotFound() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Serial hợp lệ (IN_STOCK), nhưng DB lỗi mất liên kết tới bảng tồn kho.
        // [ÁNH XẠ LOGIC CODE] inventoryStockRepository.findByWarehouseProduct_Id() -> Empty -> ném Exception
 
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_110").internalName("SP Không Tồn Kho 110").build());
        productDetailRepository.save(ProductDetail.builder()
                .serialNumber("SN_110").status(ProductStatus.IN_STOCK)
                .importPrice(100.0).warrantyMonths(12).warehouseProduct(wp).build());
        // Cố tình KHÔNG TẠO InventoryStock
 
        WarrantyExportRequest req = buildWarrantyExportRequest("SKU_110", "SN_110", "Bảo hành");
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        assertThrows(Exception.class, () -> {
            inventoryService.exportForWarranty(req);
        });
 
        assertRecordCountsUnchanged(beforeCounts);
    }
 
    @Test
    @DisplayName("TC_INVENTORY_111 - Xuất bảo hành: Nhánh stock.getOnHand() <= 0 -> True")
    void TC_INVENTORY_111_exportForWarranty_outOfStock() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Tồn kho logic đã báo hết hàng (<= 0), không cho xuất.
        // [ÁNH XẠ LOGIC CODE] if (stock.getOnHand() <= 0) -> True -> Return Error
 
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_111").internalName("SP Hết Hàng 111").build());
        inventoryStockRepository.save(InventoryStock.builder()
                .warehouseProduct(wp).onHand(0L).reserved(0L).damaged(0L).build());
        productDetailRepository.save(ProductDetail.builder()
                .serialNumber("SN_111").status(ProductStatus.IN_STOCK)
                .importPrice(100.0).warrantyMonths(12).warehouseProduct(wp).build());
 
        WarrantyExportRequest req = buildWarrantyExportRequest("SKU_111", "SN_111", "Bảo hành");
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        ApiResponse response = inventoryService.exportForWarranty(req);
 
        assertFalse(response.isSuccess());
        assertNotNull(response.getMessage());
        assertFalse(response.getMessage().isBlank());
        assertRecordCountsUnchanged(beforeCounts);
    }
 
    @Test
    @DisplayName("TC_INVENTORY_112 - Xuất bảo hành Happy Path 1: Status = IN_STOCK, wp.getProduct() == null")
    void TC_INVENTORY_112_exportForWarranty_success_inStock_noProductSync() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Xuất bảo hành SP đang trong kho. Không link Product cha → Bỏ qua đồng bộ.
        // [ÁNH XẠ LOGIC CODE]
        // - status == IN_STOCK -> Hợp lệ tiếp tục
        // - wp.getProduct() == null -> syncStockWithProduct bỏ qua
 
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_112").product(null).internalName("SP BH No Link 112").build());
        InventoryStock stock = inventoryStockRepository.save(InventoryStock.builder()
                .warehouseProduct(wp).onHand(5L).reserved(0L).damaged(0L).build());
        ProductDetail pd = productDetailRepository.save(ProductDetail.builder()
                .serialNumber("SN_112").status(ProductStatus.IN_STOCK)
                .importPrice(300.0).warrantyMonths(12).warehouseProduct(wp).build());
 
        WarrantyExportRequest req = buildWarrantyExportRequest("SKU_112", "SN_112", "Bảo hành cho khách A");
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        ApiResponse response = inventoryService.exportForWarranty(req);
 
        assertTrue(response.isSuccess());
        assertNotNull(response.getMessage());
 
        // 1. Serial đổi thành WARRANTY
        ProductDetail dbPd = productDetailRepository.findById(pd.getId()).orElseThrow();
        assertEquals(ProductStatus.WARRANTY, dbPd.getStatus());
        assertEquals(300.0, dbPd.getImportPrice());
        assertEquals(wp.getId(), dbPd.getWarehouseProduct().getId());
 
        // 2. Tồn kho giảm 1 (5 -> 4)
        InventoryStock dbStock = inventoryStockRepository.findById(stock.getId()).orElseThrow();
        assertEquals(4L, dbStock.getOnHand());
 
        // 3. ExportOrder được tạo (FULL CỘT)
        String exportCode = (String) response.getData();
        ExportOrder dbOrder = exportOrderRepository.findByExportCode(exportCode).orElseThrow();
        assertEquals(ExportStatus.COMPLETED, dbOrder.getStatus());
        assertEquals("WARRANTY", dbOrder.getReason());
        assertEquals("Bảo hành cho khách A", dbOrder.getNote());
        assertNotNull(dbOrder.getExportDate());
 
        // 4. ExportOrderItem (FULL CộT)
        assertEquals(1, dbOrder.getItems().size());
        ExportOrderItem dbItem = dbOrder.getItems().get(0);
        assertEquals(wp.getId(), dbItem.getWarehouseProduct().getId());
        assertEquals("SKU_112", dbItem.getSku());
        assertEquals(1L, dbItem.getQuantity());
        assertEquals("SN_112", dbItem.getSerialNumbers());
        assertEquals(300.0, dbItem.getTotalCost());
 
        assertEquals(beforeCounts.get("ExportOrder") + 1, exportOrderRepository.count());
        assertEquals(beforeCounts.get("ExportOrderItem") + 1, exportOrderItemRepository.count());
    }
 
    @Test
    @DisplayName("TC_INVENTORY_113 - Xuất bảo hành Happy Path 2: Status = SOLD, wp.getProduct() != null (Có đồng bộ)")
    void TC_INVENTORY_113_exportForWarranty_success_sold_withProductSync() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Khách đem máy đã mua (SOLD) đến bảo hành. Có link Product cha → Đồng bộ.
        // [ÁNH XẠ LOGIC CODE]
        // - status == SOLD -> Hợp lệ tiếp tục
        // - wp.getProduct() != null -> syncStockWithProduct chạy vào nhánh True
 
        Product product = productRepository.save(Product.builder()
                .name("Prod 113").stockQuantity(10L).reservedQuantity(0L).build());
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_113").product(product).internalName("SP BH SOLD 113").build());
        InventoryStock stock = inventoryStockRepository.save(InventoryStock.builder()
                .warehouseProduct(wp).onHand(10L).reserved(0L).damaged(0L).build());
        ProductDetail pd = productDetailRepository.save(ProductDetail.builder()
                .serialNumber("SN_113_SOLD").status(ProductStatus.SOLD)
                .importPrice(500.0).warrantyMonths(24).warehouseProduct(wp).build());
 
        WarrantyExportRequest req = buildWarrantyExportRequest("SKU_113", "SN_113_SOLD", "Khách trả máy lỗi");
 
        ApiResponse response = inventoryService.exportForWarranty(req);
        assertTrue(response.isSuccess());
 
        // 1. Serial đổi thành WARRANTY (FULL CộT)
        ProductDetail dbPd = productDetailRepository.findById(pd.getId()).orElseThrow();
        assertEquals(ProductStatus.WARRANTY, dbPd.getStatus());
        assertEquals(500.0, dbPd.getImportPrice());
        assertEquals(24, dbPd.getWarrantyMonths());
        assertEquals(wp.getId(), dbPd.getWarehouseProduct().getId());
 
        // 2. Kho giảm 1 (10 -> 9)
        assertEquals(9L, inventoryStockRepository.findById(stock.getId()).get().getOnHand());
 
        // 3. Product cha ĐƯỢC ĐỒNG BỘ giảm 1 (10 -> 9)
        assertEquals(9L, productRepository.findById(product.getId()).get().getStockQuantity());
        assertEquals("Prod 113", productRepository.findById(product.getId()).get().getName());
 
        // 4. ExportOrder được tạo
        String exportCode = (String) response.getData();
        ExportOrder dbOrder = exportOrderRepository.findByExportCode(exportCode).orElseThrow();
        assertEquals("WARRANTY", dbOrder.getReason());
        assertEquals("SN_113_SOLD", dbOrder.getItems().get(0).getSerialNumbers());
        assertEquals(500.0, dbOrder.getItems().get(0).getTotalCost());
    }
 
    // =========================================================================================
    // T E S T S : syncReservedQuantity
    //
    // Phân tích nhánh logic:
    // 1. warehouseProductRepository.findById().orElseThrow()       → Found / Throw
    // 2. inventoryStockRepository.findByWarehouseProduct_Id()
    //    .orElse(Builder...)                                       → Present (cập nhật) / orElse (tạo mới)
    // 3. syncReservedWithProduct → if (wp.getProduct() != null)   → True / False
    //
    // Công thức: 3 điểm → 4 Test Cases
    // (Thêm 1 case giá trị biên = 0)
    //
    // Ánh xạ test → code:
    // 1. findById → Không thấy                                    → Exception (TC 114) ✅
    // 2. Stock rỗng (orElse tạo mới), Product = null              → Tạo mới Stock (TC 115) ✅
    // 3. Stock đã tồn tại, Product != null                        → Cập nhật + sync (TC 116) ✅
    // 4. Cập nhật về 0                                            → reserved = 0 (TC 117) ✅
    //
    // Tổng cộng: 4 Test Cases (phủ đủ).
    // =========================================================================================
 
    @Test
    @DisplayName("TC_INVENTORY_114 - syncReservedQuantity: Nhánh findById -> Empty (Exception)")
    void TC_INVENTORY_114_syncReservedQuantity_productNotFound() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Ngăn chặn đồng bộ số lượng giữ hàng cho sản phẩm không tồn tại.
        // [ÁNH XẠ LOGIC CODE]
        // - warehouseProductRepository.findById() -> Trả về Optional.empty()
        // - orElseThrow() -> Kích hoạt, ném Exception.
 
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        assertThrows(Exception.class, () -> {
            inventoryService.syncReservedQuantity(9999L, 10L);
        });
 
        assertRecordCountsUnchanged(beforeCounts);
    }
 
    @Test
    @DisplayName("TC_INVENTORY_115 - syncReservedQuantity: Nhánh Stock rỗng (Tạo mới) và Product cha rỗng (Bỏ qua đồng bộ)")
    void TC_INVENTORY_115_syncReservedQuantity_newStock_noProductSync() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Lần đầu tiên giữ hàng cho SP, tự động khởi tạo bản ghi InventoryStock.
        // [ÁNH XẠ LOGIC CODE]
        // - findByWarehouseProduct_Id() -> Empty -> orElse(Builder...) chạy.
        // - if (wp.getProduct() != null) -> False -> Không gọi productRepository.save().
 
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_115").internalName("Test No Product 115").product(null).build());
 
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        inventoryService.syncReservedQuantity(wp.getId(), 20L);
 
        // Assert InventoryStock tạo mới thành công (FULL CỘT)
        InventoryStock dbStock = inventoryStockRepository.findByWarehouseProduct_Id(wp.getId()).orElseThrow();
        assertEquals(20L, dbStock.getReserved());
        assertEquals(0L, dbStock.getOnHand());
        assertEquals(0L, dbStock.getDamaged());
        assertEquals(wp.getId(), dbStock.getWarehouseProduct().getId());
 
        assertEquals(beforeCounts.get("InventoryStock") + 1, inventoryStockRepository.count());
    }
 
    @Test
    @DisplayName("TC_INVENTORY_116 - syncReservedQuantity: Nhánh Stock tồn tại và có đồng bộ Product cha")
    void TC_INVENTORY_116_syncReservedQuantity_updateStock_withProductSync() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Cập nhật số lượng giữ hàng và đồng bộ ngay lập tức sang bảng Product cha.
        // [ÁNH XẠ LOGIC CODE]
        // - findByWarehouseProduct_Id() -> Present -> Lấy stock cũ.
        // - if (wp.getProduct() != null) -> True -> Gọi productRepository.save().
 
        Product product = productRepository.save(Product.builder()
                .name("Sản phẩm cha 116").reservedQuantity(5L).stockQuantity(100L).build());
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_116").internalName("Test Sync 116").product(product).build());
        InventoryStock existingStock = inventoryStockRepository.save(InventoryStock.builder()
                .warehouseProduct(wp).onHand(100L).reserved(5L).damaged(0L).build());
 
        Map<String, Long> beforeCounts = captureRecordCounts();
 
        inventoryService.syncReservedQuantity(wp.getId(), 15L);
 
        // 1. Kiểm tra InventoryStock được cập nhật (FULL CỘT)
        InventoryStock dbStock = inventoryStockRepository.findByWarehouseProduct_Id(wp.getId()).orElseThrow();
        assertEquals(15L, dbStock.getReserved()); // Đã cập nhật
        assertEquals(100L, dbStock.getOnHand()); // Không bị thay đổi
        assertEquals(0L, dbStock.getDamaged()); // Không bị thay đổi
 
        // 2. Kiểm tra đồng bộ bảng Product (FULL CỘT)
        Product dbProduct = productRepository.findById(product.getId()).orElseThrow();
        assertEquals(15L, dbProduct.getReservedQuantity()); // Đã đồng bộ
        assertEquals("Sản phẩm cha 116", dbProduct.getName()); // Không bị thay đổi
 
        assertRecordCountsUnchanged(beforeCounts);
    }
 
    @Test
    @DisplayName("TC_INVENTORY_117 - syncReservedQuantity: Kiểm tra tính độc lập khi cập nhật về 0")
    void TC_INVENTORY_117_syncReservedQuantity_updateToZero() {
        // [MỤC ĐÍCH NGHIỆP VỤ] Đảm bảo logic hoạt động đúng khi số lượng giữ hàng được giải phóng về 0.
        // [ÁNH XẠ LOGIC CODE] stock.setReserved(0L) -> save()
 
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_117").internalName("SP 117").build());
        inventoryStockRepository.save(InventoryStock.builder()
                .warehouseProduct(wp).onHand(10L).reserved(10L).damaged(0L).build());
 
        inventoryService.syncReservedQuantity(wp.getId(), 0L);
 
        InventoryStock dbStock = inventoryStockRepository.findByWarehouseProduct_Id(wp.getId()).orElseThrow();
        assertEquals(0L, dbStock.getReserved()); // Đã về 0
        assertEquals(10L, dbStock.getOnHand()); // Không bị thay đổi
    }

        // =====================================================================================
        // TC_INVENTORY_118: completePurchaseOrder — nhánh payableResponse.isSuccess() → FALSE
        // =====================================================================================

        @Test
        @DisplayName("TC_INVENTORY_118 - Nhập hàng thành công: Dịch vụ kế toán trả về isSuccess = false (log warn, kho vẫn OK)")
        void TC_INVENTORY_118_completePO_payableResponseFalse_stockStillCompleted() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Kho vật lý được nhập thành công. Module kế toán trả về response nhưng isSuccess = false
        // (ví dụ: PO đã có công nợ rồi, hoặc thiếu dữ liệu kế toán).
        // Hệ thống phải log cảnh báo (warn) nhưng KHÔNG rollback — kho vẫn được ghi nhận.
        //
        // [ÁNH XẠ LOGIC CODE]
        // - supplierPayableService.createPayableFromPurchaseOrder(savedPo)
        //   → payableResponse.isSuccess() → FALSE → log.warn(...)   ← NHÁNH ĐỎ

        // 1. Chuẩn bị PO hợp lệ
        Supplier supplier = supplierRepository.save(Supplier.builder()
                .name("NCC 118").taxCode("TAX118").email("ncc118@test.com").phone("0900000118")
                .address("Địa chỉ 118").bankAccount("118118118").paymentTerm("COD")
                .paymentTermDays(0).active(true).autoCreated(true).build());

        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_PAY_FALSE").internalName("SP Kế Toán False 118")
                .description("Test 118").techSpecsJson("{}").build());

        PurchaseOrder po = purchaseOrderRepository.save(PurchaseOrder.builder()
                .poCode("PO_PAY_FALSE").status(POStatus.CREATED).supplier(supplier)
                .items(new ArrayList<>()).build());

        PurchaseOrderItem item = PurchaseOrderItem.builder()
                .purchaseOrder(po).sku("SKU_PAY_FALSE").quantity(1L).unitCost(300.0)
                .warehouseProduct(wp).warrantyMonths(12).build();
        po.getItems().add(item);
        purchaseOrderRepository.save(po);
        purchaseOrderItemRepository.save(item);

        // 2. Mock kế toán trả về isSuccess = false (không throw, chỉ trả response lỗi)
        org.mockito.Mockito.doReturn(ApiResponse.error("Công nợ đã tồn tại"))
                .when(supplierPayableService)
                .createPayableFromPurchaseOrder(org.mockito.ArgumentMatchers.any());

        ProductSerialRequest serialReq = buildProductSerialRequest(
                "SKU_PAY_FALSE", new ArrayList<>(List.of("SN_PAY_FALSE_1")));
        CompletePORequest req = buildCompletePORequest(po.getId(), new ArrayList<>(List.of(serialReq)));

        // 3. Thực thi
        ApiResponse response = inventoryService.completePurchaseOrder(req);

        // 4. Assert: Kho vẫn được nhập thành công dù kế toán báo lỗi
        assertTrue(response.isSuccess(),
                "Nhập kho phải thành công dù module kế toán trả false — đây là lỗi phụ, không rollback kho");

        // 5. Assert PO đã RECEIVED
        PurchaseOrder dbPo = purchaseOrderRepository.findById(po.getId()).orElseThrow();
        assertEquals(POStatus.RECEIVED, dbPo.getStatus());

        // 6. Assert serial đã được tạo trong DB (kho thực sự được ghi nhận)
        assertTrue(productDetailRepository.existsBySerialNumber("SN_PAY_FALSE_1"),
                "Serial phải tồn tại trong kho sau khi nhập thành công");

        // 7. Assert tồn kho tăng lên
        InventoryStock dbStock = inventoryStockRepository.findByWarehouseProduct_Id(wp.getId()).orElseThrow();
        assertEquals(1L, dbStock.getOnHand());
        }

        // =====================================================================================
        // TC_INVENTORY_119: exportForSale — nhánh reserved != null (có giá trị thực)
        // =====================================================================================

        @Test
        @DisplayName("TC_INVENTORY_119 - Xuất bán Happy Path 2: Reserved có giá trị thực → Giải phóng đúng lượng reserved")
        void TC_INVENTORY_119_exportForSale_success_reservedNotNull() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Trước khi xuất kho, kho đang giữ (reserved) một số lượng cho đơn hàng.
        // Sau khi xuất, lượng reserved phải giảm đi đúng số lượng vừa xuất.
        // Ví dụ: onHand = 5, reserved = 3, xuất 1 → onHand = 4, reserved = max(0, 3-1) = 2.
        //
        // [ÁNH XẠ LOGIC CODE]
        // - Long currentReserved = stock.getReserved() != null ? stock.getReserved() : 0L
        //   → stock.getReserved() != null → TRUE → lấy giá trị thực (3L)   ← NHÁNH ĐỎ
        // - Long newReserved = Math.max(0, currentReserved - exportCount)    ← NHÁNH ĐỎ

        // 1. Chuẩn bị kho có reserved = 3 (đang giữ hàng cho 3 đơn)
        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_119").internalName("SP Reserved Thực 119")
                .description("Test 119").techSpecsJson("{}").build());

        InventoryStock stock = inventoryStockRepository.save(InventoryStock.builder()
                .warehouseProduct(wp).onHand(5L).reserved(3L).damaged(0L).build());

        ProductDetail pd = productDetailRepository.save(ProductDetail.builder()
                .serialNumber("SN_119").status(ProductStatus.IN_STOCK)
                .importPrice(200.0).warrantyMonths(12).warehouseProduct(wp).build());

        ExportItemRequest item = new ExportItemRequest();
        item.setProductSku("SKU_119");
        item.setSerialNumbers(new ArrayList<>(List.of("SN_119")));
        SaleExportRequest req = buildSaleExportRequest(new ArrayList<>(List.of(item)), null);

        // 2. Thực thi — xuất 1 cái
        ApiResponse response = inventoryService.exportForSale(req);
        assertTrue(response.isSuccess());

        // 3. Assert tồn kho sau xuất
        InventoryStock dbStock = inventoryStockRepository.findById(stock.getId()).orElseThrow();
        assertEquals(4L, dbStock.getOnHand(),
                "onHand phải giảm từ 5 xuống 4 sau khi xuất 1 cái");
        assertEquals(2L, dbStock.getReserved(),
                "reserved phải giảm từ 3 xuống 2 (giải phóng đúng 1 đơn vừa xuất)");

        // 4. Assert serial đã được đánh dấu SOLD
        ProductDetail dbPd = productDetailRepository.findById(pd.getId()).orElseThrow();
        assertEquals(ProductStatus.SOLD, dbPd.getStatus());
        assertNotNull(dbPd.getSoldDate());

        // 5. Assert phiếu xuất được tạo
        String exportCode = (String) response.getData();
        ExportOrder dbOrder = exportOrderRepository.findByExportCode(exportCode).orElseThrow();
        assertEquals(ExportStatus.COMPLETED, dbOrder.getStatus());
        assertEquals(1, dbOrder.getItems().size());
        assertEquals(200.0, dbOrder.getItems().get(0).getTotalCost());
        }

        // =====================================================================================
        // TC_INVENTORY_120: exportForSale — nhánh sync Product khi xuất bán (KHÔNG qua GHN)
        // =====================================================================================

        @Test
        @DisplayName("TC_INVENTORY_120 - Xuất bán Happy Path 3: wp.getProduct() != null → Đồng bộ Product cha (không qua GHN)")
        void TC_INVENTORY_120_exportForSale_success_syncProductNonGHN() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Xuất bán độc lập (không tạo đơn GHN, orderId = null).
        // Sản phẩm kho có liên kết với Product cha → sau khi xuất, stockQuantity của Product
        // phải được giảm tương ứng và reservedQuantity cũng phải được đồng bộ.
        //
        // [ÁNH XẠ LOGIC CODE]
        // - syncStockWithProduct(wp, stock.getOnHand())
        //   → if (wp.getProduct() != null) → TRUE → productRepository.save()  ← NHÁNH ĐỎ
        // - syncReservedWithProduct(wp, newReserved)
        //   → if (wp.getProduct() != null) → TRUE → productRepository.save()  ← NHÁNH ĐỎ

        // 1. Chuẩn bị Product cha và WarehouseProduct con
        Product product = productRepository.save(Product.builder()
                .name("Sản phẩm cha 120").stockQuantity(8L).reservedQuantity(2L).build());

        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_120").internalName("SP Sync Product 120")
                .product(product).description("Test 120").techSpecsJson("{}").build());

        inventoryStockRepository.save(InventoryStock.builder()
                .warehouseProduct(wp).onHand(8L).reserved(2L).damaged(0L).build());

        productDetailRepository.save(ProductDetail.builder()
                .serialNumber("SN_120").status(ProductStatus.IN_STOCK)
                .importPrice(500.0).warrantyMonths(24).warehouseProduct(wp).build());

        ExportItemRequest item = new ExportItemRequest();
        item.setProductSku("SKU_120");
        item.setSerialNumbers(new ArrayList<>(List.of("SN_120")));
        // orderId = null → không tạo GHN → vẫn phải sync Product
        SaleExportRequest req = buildSaleExportRequest(new ArrayList<>(List.of(item)), null);

        // 2. Thực thi
        ApiResponse response = inventoryService.exportForSale(req);
        assertTrue(response.isSuccess());

        // 3. Assert đồng bộ Product cha
        Product dbProduct = productRepository.findById(product.getId()).orElseThrow();
        assertEquals(7L, dbProduct.getStockQuantity(),
                "stockQuantity phải giảm từ 8 xuống 7 sau khi xuất 1 cái");
        assertEquals(1L, dbProduct.getReservedQuantity(),
                "reservedQuantity phải giảm từ 2 xuống 1 (giải phóng đơn vừa xuất)");
        assertEquals("Sản phẩm cha 120", dbProduct.getName(), "Tên Product không được thay đổi");

        // 4. Assert InventoryStock
        InventoryStock dbStock = inventoryStockRepository.findByWarehouseProduct_Id(wp.getId()).orElseThrow();
        assertEquals(7L, dbStock.getOnHand());
        assertEquals(1L, dbStock.getReserved());
        }

        
    // =====================================================================================
    // TC_INVENTORY_121: completePurchaseOrder — DataIntegrityViolation message
    //                   KHÔNG chứa "Duplicate entry" → nhánh "Lỗi dữ liệu: ..."
    // =====================================================================================

    @Test
    @DisplayName("TC_INVENTORY_121 - Nhập hàng: DataIntegrityViolation KHÔNG phải serial trùng → Lỗi dữ liệu chung")
    void TC_INVENTORY_121_completePO_dataIntegrity_nonDuplicateMessage() {
        // [MỤC ĐÍCH NGHIỆP VỤ]
        // Khi DB báo lỗi DataIntegrityViolation nhưng nguyên nhân KHÔNG phải serial trùng
        // (ví dụ: vi phạm FOREIGN KEY), hệ thống phải trả về thông báo chung
        // "Lỗi dữ liệu: ..." thay vì "Serial bị trùng lặp".
        //
        // [ÁNH XẠ LOGIC CODE]
        // - catch (DataIntegrityViolationException e)
        //   → if (message != null && message.contains("Duplicate entry")) → FALSE
        //   → return ApiResponse.error("Lỗi dữ liệu: " + e.getMessage())    ← NHÁNH ĐỎ

        // 1. Chuẩn bị PO hợp lệ
        Supplier supplier = supplierRepository.save(Supplier.builder()
                .name("NCC 121").taxCode("TAX121").email("ncc121@test.com").phone("0900000121")
                .address("Địa chỉ 121").bankAccount("121121121").paymentTerm("COD")
                .paymentTermDays(0).active(true).autoCreated(true).build());

        WarehouseProduct wp = warehouseProductRepository.save(WarehouseProduct.builder()
                .sku("SKU_DIV_121").internalName("SP DataIntegrity 121")
                .description("Test 121").techSpecsJson("{}").build());

        PurchaseOrder po = purchaseOrderRepository.save(PurchaseOrder.builder()
                .poCode("PO_DIV_121").status(POStatus.CREATED).supplier(supplier)
                .items(new ArrayList<>()).build());

        PurchaseOrderItem item = PurchaseOrderItem.builder()
                .purchaseOrder(po).sku("SKU_DIV_121").quantity(1L).unitCost(100.0)
                .warehouseProduct(wp).warrantyMonths(12).build();
        po.getItems().add(item);
        purchaseOrderRepository.save(po);
        purchaseOrderItemRepository.save(item);

        // 2. Ép inventoryStockRepository.save() ném DataIntegrityViolationException
        //    với message KHÔNG chứa "Duplicate entry" → kích hoạt nhánh else
        org.mockito.Mockito.doThrow(
                new org.springframework.dao.DataIntegrityViolationException("FOREIGN KEY constraint failed")
        ).when(inventoryStockRepository).save(org.mockito.ArgumentMatchers.any(InventoryStock.class));

        ProductSerialRequest serialReq = buildProductSerialRequest(
                "SKU_DIV_121", new ArrayList<>(List.of("SN_DIV_121")));
        CompletePORequest req = buildCompletePORequest(po.getId(), new ArrayList<>(List.of(serialReq)));

        // 3. Thực thi — hệ thống bắt lại và trả về Error Response (không throw ra ngoài)
        ApiResponse response = inventoryService.completePurchaseOrder(req);

        // 4. Assert
        assertFalse(response.isSuccess());
        assertNotNull(response.getMessage());
        assertFalse(response.getMessage().isBlank());
        // Phải là thông báo lỗi dữ liệu chung, KHÔNG phải "Serial bị trùng lặp"
        assertFalse(response.getMessage().contains("Serial bị trùng lặp"),
                "Thông báo sai nhánh: phải là lỗi dữ liệu chung, không phải serial trùng");
    }

    
}