package com.doan.WEB_TMDT.module.inventory.service;

import com.doan.WEB_TMDT.common.dto.ApiResponse;
import com.doan.WEB_TMDT.module.inventory.dto.*;
import com.doan.WEB_TMDT.module.inventory.entity.*;
import com.doan.WEB_TMDT.module.inventory.repository.*;
import com.doan.WEB_TMDT.module.inventory.service.ProductSpecificationService;
import com.doan.WEB_TMDT.module.inventory.service.impl.InventoryServiceImpl;
import com.doan.WEB_TMDT.module.order.repository.OrderRepository;
import com.doan.WEB_TMDT.module.product.entity.Product;
import com.doan.WEB_TMDT.module.product.repository.ProductRepository;
import com.doan.WEB_TMDT.module.accounting.service.SupplierPayableService;
import com.doan.WEB_TMDT.module.shipping.service.ShippingService;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit test tích hợp cho InventoryServiceImpl.
 * Dùng MySQL local để test thẳng với database thật,
 * đảm bảo mỗi test độc lập và rollback sau khi chạy xong.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("INVENTORY SERVICE TEST")
class InventoryServiceImplTest {

    // =========================================================
    // AUTOWIRED: Inject service và repositories cần thiết
    // =========================================================
    @Autowired
    private InventoryServiceImpl inventoryService;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private WarehouseProductRepository warehouseProductRepository;

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private PurchaseOrderItemRepository purchaseOrderItemRepository;

    @Autowired
    private ProductDetailRepository productDetailRepository;

    @Autowired
    private InventoryStockRepository inventoryStockRepository;

    @Autowired
    private ExportOrderRepository exportOrderRepository;

    @Autowired
    private ExportOrderItemRepository exportOrderItemRepository;

    @Autowired
    private ProductRepository productRepository;

    // =========================================================
    // HELPER METHODS: Tạo dữ liệu mẫu cho từng test
    // =========================================================

    /** Tạo Supplier mẫu với taxCode duy nhất */
    private Supplier createTestSupplier(String suffix) {
        Supplier supplier = Supplier.builder()
                .name("Nhà cung cấp " + suffix)
                .taxCode("TAX" + suffix)
                .email("supplier" + suffix + "@test.com")
                .phone("09000" + suffix)
                .address("Địa chỉ " + suffix)
                .bankAccount("123456" + suffix)
                .paymentTerm("NET30")
                .paymentTermDays(30)
                .active(true)
                .autoCreated(false)
                .build();
        return supplierRepository.save(supplier);
    }

    /** Tạo WarehouseProduct mẫu với SKU duy nhất */
    private WarehouseProduct createTestWarehouseProduct(String sku, Supplier supplier) {
        WarehouseProduct wp = WarehouseProduct.builder()
                .sku(sku)
                .internalName("Sản phẩm " + sku)
                .supplier(supplier)
                .description("Mô tả " + sku)
                .techSpecsJson("{\"cpu\":\"Intel i5\"}")
                .lastImportDate(LocalDateTime.now())
                .build();
        return warehouseProductRepository.save(wp);
    }

    /** Tạo Product mẫu liên kết với WarehouseProduct */
    private Product createTestProduct(String sku, WarehouseProduct wp) {
        Product product = Product.builder()
                .sku(sku)
                .name("Sản phẩm " + sku)
                .stockQuantity(0L)
                .reservedQuantity(0L)
                .build();
        product = productRepository.save(product);
        wp.setProduct(product);
        warehouseProductRepository.save(wp);
        return product;
    }

    /** Tạo InventoryStock mẫu */
    private InventoryStock createTestStock(WarehouseProduct wp, long onHand, long reserved) {
        InventoryStock stock = InventoryStock.builder()
                .warehouseProduct(wp)
                .onHand(onHand)
                .reserved(reserved)
                .damaged(0L)
                .build();
        return inventoryStockRepository.save(stock);
    }

    /** Tạo ProductDetail (serial) mẫu */
    private ProductDetail createTestProductDetail(String serial, WarehouseProduct wp,
                                                   ProductStatus status, double importPrice) {
        ProductDetail pd = ProductDetail.builder()
                .serialNumber(serial)
                .importPrice(importPrice)
                .importDate(LocalDateTime.now())
                .warrantyMonths(12)
                .status(status)
                .warehouseProduct(wp)
                .build();
        return productDetailRepository.save(pd);
    }

    // =========================================================
    // CLEANUP: Dọn DB sau mỗi test để đảm bảo độc lập
    // =========================================================
    @AfterEach
    void cleanup() {
        exportOrderItemRepository.deleteAll();
        exportOrderRepository.deleteAll();
        productDetailRepository.deleteAll();
        purchaseOrderItemRepository.deleteAll();
        purchaseOrderRepository.deleteAll();
        inventoryStockRepository.deleteAll();
        warehouseProductRepository.deleteAll();
        productRepository.deleteAll();
        supplierRepository.deleteAll();
    }

    // =========================================================
    // *** TEST GROUP 1: getAllSuppliers ***
    // Mục đích: Kiểm tra lấy toàn bộ danh sách nhà cung cấp
    // =========================================================

    @Test
    @DisplayName("TC_INVENTORY_001 - Lấy danh sách nhà cung cấp khi DB rỗng")
    void TC_INVENTORY_001_getAllSuppliers_whenEmpty() {
        // Đảm bảo DB rỗng
        supplierRepository.deleteAll();
        long countBefore = supplierRepository.count();

        // Gọi service
        ApiResponse response = inventoryService.getAllSuppliers();

        // Kiểm tra response
        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getMessage()).isEqualTo("Danh sách nhà cung cấp");

        @SuppressWarnings("unchecked")
        List<Supplier> data = (List<Supplier>) response.getData();
        assertThat(data).isEmpty();

        // Kiểm tra DB không thay đổi
        assertThat(supplierRepository.count()).isEqualTo(countBefore);
    }

    @Test
    @DisplayName("TC_INVENTORY_002 - Lấy danh sách nhà cung cấp khi có dữ liệu")
    void TC_INVENTORY_002_getAllSuppliers_whenHasData() {
        // Chuẩn bị: tạo 2 nhà cung cấp
        Supplier s1 = createTestSupplier("A01");
        Supplier s2 = createTestSupplier("B02");
        long countBefore = supplierRepository.count(); // = 2

        // Gọi service
        ApiResponse response = inventoryService.getAllSuppliers();

        // Kiểm tra response thành công
        assertThat(response.isSuccess()).isTrue();

        @SuppressWarnings("unchecked")
        List<Supplier> data = (List<Supplier>) response.getData();
        assertThat(data).hasSize(2);

        // Kiểm tra từng thuộc tính của phần tử đầu tiên khớp với DB
        Supplier fromDb1 = supplierRepository.findById(s1.getId()).orElseThrow();
        assertThat(fromDb1.getName()).isEqualTo("Nhà cung cấp A01");
        assertThat(fromDb1.getTaxCode()).isEqualTo("TAXA01");
        assertThat(fromDb1.getEmail()).isEqualTo("supplierA01@test.com");
        assertThat(fromDb1.getPhone()).isEqualTo("09000A01");
        assertThat(fromDb1.getActive()).isTrue();

        // Kiểm tra DB không bị thêm/xóa ngoài mong muốn
        assertThat(supplierRepository.count()).isEqualTo(countBefore);
    }

    // =========================================================
    // *** TEST GROUP 2: getOrCreateSupplier ***
    // Mục đích: Kiểm tra tìm hoặc tạo nhà cung cấp theo taxCode/email/phone
    // =========================================================

    @Test
    @DisplayName("TC_INVENTORY_003 - Tìm thấy nhà cung cấp theo taxCode (không tạo mới)")
    void TC_INVENTORY_003_getOrCreateSupplier_foundByTaxCode() {
        // Chuẩn bị: tạo supplier với taxCode cụ thể
        Supplier existing = createTestSupplier("TAX001");
        long countBefore = supplierRepository.count();

        CreateSupplierRequest req = new CreateSupplierRequest();
        req.setTaxCode("TAXTAX001");
        req.setName("Nhà cung cấp khác");

        // Gọi service
        ApiResponse response = inventoryService.getOrCreateSupplier(req);

        // Phải trả về supplier cũ, KHÔNG tạo mới
        assertThat(response.isSuccess()).isTrue();
        Supplier returned = (Supplier) response.getData();
        assertThat(returned.getId()).isEqualTo(existing.getId());
        assertThat(returned.getTaxCode()).isEqualTo("TAXTAX001");

        // Kiểm tra DB không insert thêm record
        assertThat(supplierRepository.count()).isEqualTo(countBefore);
    }

    @Test
    @DisplayName("TC_INVENTORY_004 - Tìm thấy nhà cung cấp theo email khi taxCode null")
    void TC_INVENTORY_004_getOrCreateSupplier_foundByEmail() {
        // Chuẩn bị: supplier đã tồn tại
        Supplier existing = createTestSupplier("EM01");
        long countBefore = supplierRepository.count();

        CreateSupplierRequest req = new CreateSupplierRequest();
        req.setTaxCode(null); // taxCode null → tìm theo email
        req.setEmail("supplierEM01@test.com");

        ApiResponse response = inventoryService.getOrCreateSupplier(req);

        assertThat(response.isSuccess()).isTrue();
        Supplier returned = (Supplier) response.getData();
        assertThat(returned.getId()).isEqualTo(existing.getId());

        // Số lượng record không đổi
        assertThat(supplierRepository.count()).isEqualTo(countBefore);
    }

    @Test
    @DisplayName("TC_INVENTORY_005 - Tìm thấy nhà cung cấp theo phone khi taxCode và email null")
    void TC_INVENTORY_005_getOrCreateSupplier_foundByPhone() {
        Supplier existing = createTestSupplier("PH01");
        long countBefore = supplierRepository.count();

        CreateSupplierRequest req = new CreateSupplierRequest();
        req.setTaxCode(null);
        req.setEmail(null);
        req.setPhone("09000PH01");

        ApiResponse response = inventoryService.getOrCreateSupplier(req);

        assertThat(response.isSuccess()).isTrue();
        Supplier returned = (Supplier) response.getData();
        assertThat(returned.getId()).isEqualTo(existing.getId());
        assertThat(supplierRepository.count()).isEqualTo(countBefore);
    }

    @Test
    @DisplayName("TC_INVENTORY_006 - Tạo mới nhà cung cấp khi không tìm thấy theo bất kỳ trường nào")
    void TC_INVENTORY_006_getOrCreateSupplier_createNew() {
        long countBefore = supplierRepository.count();

        CreateSupplierRequest req = new CreateSupplierRequest();
        req.setName("Nhà cung cấp hoàn toàn mới");
        req.setTaxCode("TAXNEW999");
        req.setEmail("new999@test.com");
        req.setPhone("0988999888");
        req.setAddress("Hà Nội");
        req.setBankAccount("ACC999");
        req.setPaymentTerm("NET60");
        req.setPaymentTermDays(60);

        ApiResponse response = inventoryService.getOrCreateSupplier(req);

        // Kiểm tra response
        assertThat(response.isSuccess()).isTrue();
        Supplier returned = (Supplier) response.getData();
        assertThat(returned.getId()).isNotNull();

        // Kiểm tra DB tăng thêm 1 record
        assertThat(supplierRepository.count()).isEqualTo(countBefore + 1);

        // Lấy từ DB và assert tất cả thuộc tính
        Supplier fromDb = supplierRepository.findById(returned.getId()).orElseThrow();
        assertThat(fromDb.getName()).isEqualTo("Nhà cung cấp hoàn toàn mới");
        assertThat(fromDb.getTaxCode()).isEqualTo("TAXNEW999");
        assertThat(fromDb.getEmail()).isEqualTo("new999@test.com");
        assertThat(fromDb.getPhone()).isEqualTo("0988999888");
        assertThat(fromDb.getAddress()).isEqualTo("Hà Nội");
        assertThat(fromDb.getBankAccount()).isEqualTo("ACC999");
        assertThat(fromDb.getPaymentTerm()).isEqualTo("NET60");
        assertThat(fromDb.getPaymentTermDays()).isEqualTo(60);
        assertThat(fromDb.getActive()).isTrue();
        assertThat(fromDb.getAutoCreated()).isTrue();
    }

    @Test
    @DisplayName("TC_INVENTORY_007 - getOrCreateSupplier với tất cả trường null (tạo mới không định danh)")
    void TC_INVENTORY_007_getOrCreateSupplier_allNull() {
        long countBefore = supplierRepository.count();

        CreateSupplierRequest req = new CreateSupplierRequest();
        req.setTaxCode(null);
        req.setEmail(null);
        req.setPhone(null);
        req.setName("Supplier ẩn danh");

        ApiResponse response = inventoryService.getOrCreateSupplier(req);

        // Vẫn tạo mới vì không có trường nào để lookup
        assertThat(response.isSuccess()).isTrue();
        assertThat(supplierRepository.count()).isEqualTo(countBefore + 1);
    }

    // =========================================================
    // *** TEST GROUP 3: createWarehouseProduct ***
    // Mục đích: Kiểm tra tạo sản phẩm kho mới
    // =========================================================

    @Test
    @DisplayName("TC_INVENTORY_008 - Tạo warehouse product thành công")
    void TC_INVENTORY_008_createWarehouseProduct_success() {
        Supplier supplier = createTestSupplier("WP01");
        long countBefore = warehouseProductRepository.count();

        CreateWarehouseProductRequest req = new CreateWarehouseProductRequest();
        req.setSku("SKU-WP-001");
        req.setInternalName("Laptop ABC");
        req.setSupplierId(supplier.getId());
        req.setDescription("Laptop cao cấp");
        req.setTechSpecsJson("{\"ram\":\"16GB\",\"cpu\":\"i7\"}");

        ApiResponse response = inventoryService.createWarehouseProduct(req);

        // Kiểm tra response
        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getMessage()).isEqualTo("Tạo sản phẩm kho thành công");

        // Kiểm tra DB tăng thêm 1
        assertThat(warehouseProductRepository.count()).isEqualTo(countBefore + 1);

        // Lấy từ DB và assert tất cả thuộc tính
        WarehouseProduct fromDb = warehouseProductRepository.findBySku("SKU-WP-001").orElseThrow();
        assertThat(fromDb.getSku()).isEqualTo("SKU-WP-001");
        assertThat(fromDb.getInternalName()).isEqualTo("Laptop ABC");
        assertThat(fromDb.getDescription()).isEqualTo("Laptop cao cấp");
        assertThat(fromDb.getTechSpecsJson()).isEqualTo("{\"ram\":\"16GB\",\"cpu\":\"i7\"}");
        assertThat(fromDb.getSupplier().getId()).isEqualTo(supplier.getId());
        assertThat(fromDb.getLastImportDate()).isNotNull();
    }

    @Test
    @DisplayName("TC_INVENTORY_009 - Tạo warehouse product thất bại khi SKU trùng")
    void TC_INVENTORY_009_createWarehouseProduct_duplicateSku() {
        Supplier supplier = createTestSupplier("WP02");
        // Tạo sẵn product với SKU này
        createTestWarehouseProduct("SKU-DUP-001", supplier);
        long countBefore = warehouseProductRepository.count();

        CreateWarehouseProductRequest req = new CreateWarehouseProductRequest();
        req.setSku("SKU-DUP-001"); // SKU đã tồn tại
        req.setInternalName("Sản phẩm trùng SKU");

        ApiResponse response = inventoryService.createWarehouseProduct(req);

        // Phải trả về lỗi
        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).contains("SKU đã tồn tại");

        // DB không được insert thêm
        assertThat(warehouseProductRepository.count()).isEqualTo(countBefore);
    }

    @Test
    @DisplayName("TC_INVENTORY_010 - Tạo warehouse product với supplierId không tồn tại → exception")
    void TC_INVENTORY_010_createWarehouseProduct_supplierNotFound() {
        long countBefore = warehouseProductRepository.count();

        CreateWarehouseProductRequest req = new CreateWarehouseProductRequest();
        req.setSku("SKU-NOSUP-001");
        req.setInternalName("Sản phẩm không có NCC");
        req.setSupplierId(999999L); // ID không tồn tại

        // Phải throw exception
        assertThatThrownBy(() -> inventoryService.createWarehouseProduct(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Không tìm thấy nhà cung cấp");

        // DB không thay đổi
        assertThat(warehouseProductRepository.count()).isEqualTo(countBefore);
    }

    @Test
    @DisplayName("TC_INVENTORY_011 - Tạo warehouse product với techSpecsJson null → dùng '{}'")
    void TC_INVENTORY_011_createWarehouseProduct_nullTechSpecs() {
        Supplier supplier = createTestSupplier("WP03");
        long countBefore = warehouseProductRepository.count();

        CreateWarehouseProductRequest req = new CreateWarehouseProductRequest();
        req.setSku("SKU-NULLSPEC-001");
        req.setInternalName("Sản phẩm không có specs");
        req.setSupplierId(supplier.getId());
        req.setTechSpecsJson(null); // null → phải default là "{}"

        ApiResponse response = inventoryService.createWarehouseProduct(req);

        assertThat(response.isSuccess()).isTrue();
        assertThat(warehouseProductRepository.count()).isEqualTo(countBefore + 1);

        WarehouseProduct fromDb = warehouseProductRepository.findBySku("SKU-NULLSPEC-001").orElseThrow();
        assertThat(fromDb.getTechSpecsJson()).isEqualTo("{}");
    }

    @Test
    @DisplayName("TC_INVENTORY_012 - Tạo warehouse product không có supplierId (null)")
    void TC_INVENTORY_012_createWarehouseProduct_noSupplier() {
        long countBefore = warehouseProductRepository.count();

        CreateWarehouseProductRequest req = new CreateWarehouseProductRequest();
        req.setSku("SKU-NOSUP-002");
        req.setInternalName("Sản phẩm tự cung cấp");
        req.setSupplierId(null); // không có supplier

        ApiResponse response = inventoryService.createWarehouseProduct(req);

        assertThat(response.isSuccess()).isTrue();
        assertThat(warehouseProductRepository.count()).isEqualTo(countBefore + 1);

        WarehouseProduct fromDb = warehouseProductRepository.findBySku("SKU-NOSUP-002").orElseThrow();
        assertThat(fromDb.getSupplier()).isNull();
    }

    // =========================================================
    // *** TEST GROUP 4: updateWarehouseProduct ***
    // Mục đích: Kiểm tra cập nhật thông tin sản phẩm kho
    // =========================================================

    @Test
    @DisplayName("TC_INVENTORY_013 - Cập nhật warehouse product thành công")
    void TC_INVENTORY_013_updateWarehouseProduct_success() {
        Supplier supplier = createTestSupplier("UPD01");
        WarehouseProduct wp = createTestWarehouseProduct("SKU-UPD-001", supplier);
        long countBefore = warehouseProductRepository.count();

        CreateWarehouseProductRequest req = new CreateWarehouseProductRequest();
        req.setSku("SKU-UPD-001"); // giữ nguyên SKU
        req.setInternalName("Laptop XYZ UPDATED");
        req.setDescription("Mô tả đã cập nhật");
        req.setTechSpecsJson("{\"ram\":\"32GB\"}");
        req.setSupplierId(supplier.getId());

        ApiResponse response = inventoryService.updateWarehouseProduct(wp.getId(), req);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getMessage()).isEqualTo("Cập nhật sản phẩm kho thành công");

        // Số record không đổi (update, không insert)
        assertThat(warehouseProductRepository.count()).isEqualTo(countBefore);

        // Lấy từ DB và assert tất cả thuộc tính đã được cập nhật
        WarehouseProduct fromDb = warehouseProductRepository.findById(wp.getId()).orElseThrow();
        assertThat(fromDb.getInternalName()).isEqualTo("Laptop XYZ UPDATED");
        assertThat(fromDb.getDescription()).isEqualTo("Mô tả đã cập nhật");
        assertThat(fromDb.getTechSpecsJson()).isEqualTo("{\"ram\":\"32GB\"}");
    }

    @Test
    @DisplayName("TC_INVENTORY_014 - Cập nhật warehouse product với SKU mới bị trùng")
    void TC_INVENTORY_014_updateWarehouseProduct_skuConflict() {
        Supplier supplier = createTestSupplier("UPD02");
        WarehouseProduct wp1 = createTestWarehouseProduct("SKU-ORIG-001", supplier);
        WarehouseProduct wp2 = createTestWarehouseProduct("SKU-CONFLICT-001", supplier);
        long countBefore = warehouseProductRepository.count();

        CreateWarehouseProductRequest req = new CreateWarehouseProductRequest();
        req.setSku("SKU-CONFLICT-001"); // SKU đã thuộc về wp2
        req.setInternalName("Laptop Trùng");

        ApiResponse response = inventoryService.updateWarehouseProduct(wp1.getId(), req);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).contains("SKU đã tồn tại");

        // DB không thay đổi
        assertThat(warehouseProductRepository.count()).isEqualTo(countBefore);

        // wp1 vẫn còn SKU cũ
        WarehouseProduct unchanged = warehouseProductRepository.findById(wp1.getId()).orElseThrow();
        assertThat(unchanged.getSku()).isEqualTo("SKU-ORIG-001");
    }

    @Test
    @DisplayName("TC_INVENTORY_015 - Cập nhật warehouse product với ID không tồn tại → exception")
    void TC_INVENTORY_015_updateWarehouseProduct_notFound() {
        CreateWarehouseProductRequest req = new CreateWarehouseProductRequest();
        req.setSku("SKU-ANY");
        req.setInternalName("Bất kỳ");

        assertThatThrownBy(() -> inventoryService.updateWarehouseProduct(999999L, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Không tìm thấy sản phẩm");
    }

    // =========================================================
    // *** TEST GROUP 5: createPurchaseOrder ***
    // Mục đích: Kiểm tra tạo phiếu nhập hàng
    // =========================================================

    @Test
    @DisplayName("TC_INVENTORY_016 - Tạo phiếu nhập hàng thành công với NCC đã tồn tại")
    void TC_INVENTORY_016_createPurchaseOrder_existingSupplier() {
        Supplier supplier = createTestSupplier("PO01");
        long poBefore = purchaseOrderRepository.count();
        long wpBefore = warehouseProductRepository.count();

        CreateSupplierRequest sreq = new CreateSupplierRequest();
        sreq.setTaxCode("TAXPO01");
        sreq.setName("Nhà cung cấp PO01");

        POItemRequest itemReq = new POItemRequest();
        itemReq.setSku("SKU-PO-001");
        itemReq.setInternalName("Sản phẩm PO test");
        itemReq.setQuantity(5L);
        itemReq.setUnitCost(1000000.0);
        itemReq.setWarrantyMonths(12);
        itemReq.setTechSpecsJson("{\"color\":\"black\"}");

        CreatePORequest req = new CreatePORequest();
        req.setPoCode("PO-TEST-001");
        req.setSupplier(sreq);
        req.setItems(List.of(itemReq));
        req.setCreatedBy("admin");
        req.setNote("Test PO");

        ApiResponse response = inventoryService.createPurchaseOrder(req);

        // Kiểm tra response
        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getMessage()).isEqualTo("Tạo phiếu nhập hàng thành công");

        // Kiểm tra DB: tăng thêm 1 PO
        assertThat(purchaseOrderRepository.count()).isEqualTo(poBefore + 1);
        // Tăng thêm 1 WarehouseProduct (SKU mới)
        assertThat(warehouseProductRepository.count()).isEqualTo(wpBefore + 1);

        // Lấy từ DB và assert
        PurchaseOrder fromDb = purchaseOrderRepository.findByPoCode("PO-TEST-001").orElseThrow();
        assertThat(fromDb.getPoCode()).isEqualTo("PO-TEST-001");
        assertThat(fromDb.getStatus()).isEqualTo(POStatus.CREATED);
        assertThat(fromDb.getCreatedBy()).isEqualTo("admin");
        assertThat(fromDb.getNote()).isEqualTo("Test PO");
        assertThat(fromDb.getSupplier().getTaxCode()).isEqualTo("TAXPO01");
        assertThat(fromDb.getItems()).hasSize(1);

        PurchaseOrderItem item = fromDb.getItems().get(0);
        assertThat(item.getSku()).isEqualTo("SKU-PO-001");
        assertThat(item.getQuantity()).isEqualTo(5L);
        assertThat(item.getUnitCost()).isEqualTo(1000000.0);
        assertThat(item.getWarrantyMonths()).isEqualTo(12);
    }

    @Test
    @DisplayName("TC_INVENTORY_017 - Tạo phiếu nhập hàng với NCC mới (tự động tạo NCC)")
    void TC_INVENTORY_017_createPurchaseOrder_newSupplierAutoCreated() {
        long supplierBefore = supplierRepository.count();
        long poBefore = purchaseOrderRepository.count();

        CreateSupplierRequest sreq = new CreateSupplierRequest();
        sreq.setTaxCode("TAXNEWSUP999");
        sreq.setName("NCC Mới Tự Động");
        sreq.setEmail("newsupauto@test.com");
        sreq.setPhone("0999888777");
        sreq.setAddress("TP HCM");

        POItemRequest itemReq = new POItemRequest();
        itemReq.setSku("SKU-PO-AUTO-001");
        itemReq.setQuantity(2L);
        itemReq.setUnitCost(500000.0);

        CreatePORequest req = new CreatePORequest();
        req.setPoCode("PO-AUTO-001");
        req.setSupplier(sreq);
        req.setItems(List.of(itemReq));
        req.setCreatedBy("system");

        ApiResponse response = inventoryService.createPurchaseOrder(req);

        assertThat(response.isSuccess()).isTrue();
        // Phải tạo thêm 1 supplier mới
        assertThat(supplierRepository.count()).isEqualTo(supplierBefore + 1);
        assertThat(purchaseOrderRepository.count()).isEqualTo(poBefore + 1);

        // Kiểm tra supplier được tạo đúng
        Supplier newSup = supplierRepository.findByTaxCode("TAXNEWSUP999").orElseThrow();
        assertThat(newSup.getName()).isEqualTo("NCC Mới Tự Động");
        assertThat(newSup.getAutoCreated()).isTrue();
        assertThat(newSup.getActive()).isTrue();
    }

    @Test
    @DisplayName("TC_INVENTORY_018 - Tạo phiếu nhập thất bại khi thiếu thông tin NCC (taxCode null)")
    void TC_INVENTORY_018_createPurchaseOrder_missingTaxCode() {
        long poBefore = purchaseOrderRepository.count();

        CreateSupplierRequest sreq = new CreateSupplierRequest();
        sreq.setTaxCode(null); // thiếu taxCode

        CreatePORequest req = new CreatePORequest();
        req.setPoCode("PO-INVALID-001");
        req.setSupplier(sreq);
        req.setItems(List.of());

        assertThatThrownBy(() -> inventoryService.createPurchaseOrder(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Thiếu thông tin nhà cung cấp");

        // DB không thay đổi
        assertThat(purchaseOrderRepository.count()).isEqualTo(poBefore);
    }

    @Test
    @DisplayName("TC_INVENTORY_019 - Tạo phiếu nhập thất bại khi supplier null")
    void TC_INVENTORY_019_createPurchaseOrder_nullSupplier() {
        long poBefore = purchaseOrderRepository.count();

        CreatePORequest req = new CreatePORequest();
        req.setPoCode("PO-NULLSUP-001");
        req.setSupplier(null); // supplier null

        assertThatThrownBy(() -> inventoryService.createPurchaseOrder(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Thiếu thông tin nhà cung cấp");

        assertThat(purchaseOrderRepository.count()).isEqualTo(poBefore);
    }

    @Test
    @DisplayName("TC_INVENTORY_020 - Tạo phiếu nhập với WarehouseProduct đã tồn tại (không tạo mới)")
    void TC_INVENTORY_020_createPurchaseOrder_existingWarehouseProduct() {
        Supplier supplier = createTestSupplier("PO02");
        WarehouseProduct existingWp = createTestWarehouseProduct("SKU-EXIST-PO", supplier);
        long wpBefore = warehouseProductRepository.count();

        CreateSupplierRequest sreq = new CreateSupplierRequest();
        sreq.setTaxCode("TAXPO02");

        POItemRequest itemReq = new POItemRequest();
        itemReq.setSku("SKU-EXIST-PO"); // SKU đã tồn tại
        itemReq.setQuantity(3L);
        itemReq.setUnitCost(200000.0);

        CreatePORequest req = new CreatePORequest();
        req.setPoCode("PO-REUSE-001");
        req.setSupplier(sreq);
        req.setItems(List.of(itemReq));

        ApiResponse response = inventoryService.createPurchaseOrder(req);

        assertThat(response.isSuccess()).isTrue();
        // WarehouseProduct không được tạo thêm
        assertThat(warehouseProductRepository.count()).isEqualTo(wpBefore);
    }

    // =========================================================
    // *** TEST GROUP 6: completePurchaseOrder ***
    // Mục đích: Kiểm tra hoàn tất nhập hàng (gắn serial, cập nhật tồn kho)
    // =========================================================

    @Test
    @DisplayName("TC_INVENTORY_021 - Hoàn tất nhập hàng thành công")
    @Transactional
    void TC_INVENTORY_021_completePurchaseOrder_success() {
        // Chuẩn bị PO
        Supplier supplier = createTestSupplier("CPO01");
        WarehouseProduct wp = createTestWarehouseProduct("SKU-CPO-001", supplier);

        PurchaseOrder po = PurchaseOrder.builder()
                .poCode("PO-COMPLETE-001")
                .supplier(supplier)
                .status(POStatus.CREATED)
                .orderDate(LocalDateTime.now())
                .createdBy("admin")
                .build();

        PurchaseOrderItem item = PurchaseOrderItem.builder()
                .purchaseOrder(po)
                .sku("SKU-CPO-001")
                .warehouseProduct(wp)
                .quantity(2L)
                .unitCost(1500000.0)
                .warrantyMonths(24)
                .build();

        po.setItems(List.of(item));
        purchaseOrderRepository.save(po);

        long detailBefore = productDetailRepository.count();
        long stockBefore = inventoryStockRepository.count();

        // Chuẩn bị request hoàn tất
        ProductSerialRequest serialReq = new ProductSerialRequest();
        serialReq.setProductSku("SKU-CPO-001");
        serialReq.setSerialNumbers(List.of("SN-CPO-001", "SN-CPO-002"));

        CompletePORequest req = new CompletePORequest();
        req.setPoId(po.getId());
        req.setSerials(List.of(serialReq));
        req.setReceivedDate(LocalDateTime.now());

        ApiResponse response = inventoryService.completePurchaseOrder(req);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getMessage()).isEqualTo("Hoàn tất nhập hàng thành công!");

        // Kiểm tra PO status đã chuyển RECEIVED
        PurchaseOrder updatedPo = purchaseOrderRepository.findById(po.getId()).orElseThrow();
        assertThat(updatedPo.getStatus()).isEqualTo(POStatus.RECEIVED);
        assertThat(updatedPo.getReceivedDate()).isNotNull();

        // Kiểm tra 2 ProductDetail được tạo
        assertThat(productDetailRepository.count()).isEqualTo(detailBefore + 2);

        ProductDetail pd1 = productDetailRepository.findBySerialNumber("SN-CPO-001").orElseThrow();
        assertThat(pd1.getStatus()).isEqualTo(ProductStatus.IN_STOCK);
        assertThat(pd1.getImportPrice()).isEqualTo(1500000.0);
        assertThat(pd1.getWarrantyMonths()).isEqualTo(24);
        assertThat(pd1.getImportDate()).isNotNull();

        ProductDetail pd2 = productDetailRepository.findBySerialNumber("SN-CPO-002").orElseThrow();
        assertThat(pd2.getStatus()).isEqualTo(ProductStatus.IN_STOCK);

        // Kiểm tra tồn kho được cập nhật
        InventoryStock stock = inventoryStockRepository.findByWarehouseProduct_Id(wp.getId()).orElseThrow();
        assertThat(stock.getOnHand()).isEqualTo(2L);
    }

    @Test
    @DisplayName("TC_INVENTORY_022 - Hoàn tất nhập hàng thất bại khi PO không tồn tại")
    void TC_INVENTORY_022_completePurchaseOrder_poNotFound() {
        long detailBefore = productDetailRepository.count();

        CompletePORequest req = new CompletePORequest();
        req.setPoId(999999L);

        assertThatThrownBy(() -> inventoryService.completePurchaseOrder(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Không tìm thấy phiếu nhập");

        // Không có ProductDetail nào được tạo
        assertThat(productDetailRepository.count()).isEqualTo(detailBefore);
    }

    @Test
    @DisplayName("TC_INVENTORY_023 - Hoàn tất nhập hàng thất bại khi PO không ở trạng thái CREATED")
    void TC_INVENTORY_023_completePurchaseOrder_wrongStatus() {
        Supplier supplier = createTestSupplier("CPO02");
        WarehouseProduct wp = createTestWarehouseProduct("SKU-CPO-002", supplier);

        PurchaseOrder po = PurchaseOrder.builder()
                .poCode("PO-RECEIVED-002")
                .supplier(supplier)
                .status(POStatus.RECEIVED) // Đã nhập rồi
                .orderDate(LocalDateTime.now())
                .build();
        po.setItems(List.of());
        purchaseOrderRepository.save(po);

        long detailBefore = productDetailRepository.count();

        CompletePORequest req = new CompletePORequest();
        req.setPoId(po.getId());
        req.setSerials(List.of());

        ApiResponse response = inventoryService.completePurchaseOrder(req);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).contains("không ở trạng thái chờ nhập hàng");

        // Không có gì thay đổi trong DB
        assertThat(productDetailRepository.count()).isEqualTo(detailBefore);
    }

    @Test
    @DisplayName("TC_INVENTORY_024 - Hoàn tất nhập hàng thất bại khi số serial không khớp số lượng")
    @Transactional
    void TC_INVENTORY_024_completePurchaseOrder_serialCountMismatch() {
        Supplier supplier = createTestSupplier("CPO03");
        WarehouseProduct wp = createTestWarehouseProduct("SKU-CPO-003", supplier);

        PurchaseOrder po = PurchaseOrder.builder()
                .poCode("PO-MISMATCH-003")
                .supplier(supplier)
                .status(POStatus.CREATED)
                .orderDate(LocalDateTime.now())
                .build();

        PurchaseOrderItem item = PurchaseOrderItem.builder()
                .purchaseOrder(po)
                .sku("SKU-CPO-003")
                .warehouseProduct(wp)
                .quantity(3L) // yêu cầu 3 serial
                .unitCost(1000000.0)
                .warrantyMonths(12)
                .build();

        po.setItems(List.of(item));
        purchaseOrderRepository.save(po);
        long detailBefore = productDetailRepository.count();

        ProductSerialRequest serialReq = new ProductSerialRequest();
        serialReq.setProductSku("SKU-CPO-003");
        serialReq.setSerialNumbers(List.of("SN-MM-001", "SN-MM-002")); // chỉ 2 serial, thiếu 1

        CompletePORequest req = new CompletePORequest();
        req.setPoId(po.getId());
        req.setSerials(List.of(serialReq));
        req.setReceivedDate(LocalDateTime.now());

        assertThatThrownBy(() -> inventoryService.completePurchaseOrder(req))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Số serial")
                .hasMessageContaining("không khớp");

        // Kiểm tra rollback: không có detail nào được tạo
        assertThat(productDetailRepository.count()).isEqualTo(detailBefore);
    }

    @Test
    @DisplayName("TC_INVENTORY_025 - Hoàn tất nhập hàng thất bại khi serial đã tồn tại trong hệ thống")
    @Transactional
    void TC_INVENTORY_025_completePurchaseOrder_duplicateSerial() {
        Supplier supplier = createTestSupplier("CPO04");
        WarehouseProduct wp = createTestWarehouseProduct("SKU-CPO-004", supplier);

        // Tạo sẵn serial trùng
        createTestProductDetail("SN-DUP-EXIST", wp, ProductStatus.IN_STOCK, 1000000.0);

        PurchaseOrder po = PurchaseOrder.builder()
                .poCode("PO-DUPSER-004")
                .supplier(supplier)
                .status(POStatus.CREATED)
                .orderDate(LocalDateTime.now())
                .build();

        PurchaseOrderItem item = PurchaseOrderItem.builder()
                .purchaseOrder(po)
                .sku("SKU-CPO-004")
                .warehouseProduct(wp)
                .quantity(1L)
                .unitCost(1000000.0)
                .warrantyMonths(12)
                .build();

        po.setItems(List.of(item));
        purchaseOrderRepository.save(po);
        long detailBefore = productDetailRepository.count();

        ProductSerialRequest serialReq = new ProductSerialRequest();
        serialReq.setProductSku("SKU-CPO-004");
        serialReq.setSerialNumbers(List.of("SN-DUP-EXIST")); // serial đã tồn tại

        CompletePORequest req = new CompletePORequest();
        req.setPoId(po.getId());
        req.setSerials(List.of(serialReq));

        assertThatThrownBy(() -> inventoryService.completePurchaseOrder(req))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Serial")
                .hasMessageContaining("đã tồn tại");

        // DB không thay đổi (rollback thành công)
        assertThat(productDetailRepository.count()).isEqualTo(detailBefore);
    }

    @Test
    @DisplayName("TC_INVENTORY_026 - Hoàn tất nhập hàng thất bại khi serial rỗng")
    @Transactional
    void TC_INVENTORY_026_completePurchaseOrder_emptySerial() {
        Supplier supplier = createTestSupplier("CPO05");
        WarehouseProduct wp = createTestWarehouseProduct("SKU-CPO-005", supplier);

        PurchaseOrder po = PurchaseOrder.builder()
                .poCode("PO-EMPTYSER-005")
                .supplier(supplier)
                .status(POStatus.CREATED)
                .orderDate(LocalDateTime.now())
                .build();

        PurchaseOrderItem item = PurchaseOrderItem.builder()
                .purchaseOrder(po)
                .sku("SKU-CPO-005")
                .warehouseProduct(wp)
                .quantity(1L)
                .unitCost(1000000.0)
                .warrantyMonths(12)
                .build();

        po.setItems(List.of(item));
        purchaseOrderRepository.save(po);
        long detailBefore = productDetailRepository.count();

        ProductSerialRequest serialReq = new ProductSerialRequest();
        serialReq.setProductSku("SKU-CPO-005");
        serialReq.setSerialNumbers(List.of("")); // serial trống

        CompletePORequest req = new CompletePORequest();
        req.setPoId(po.getId());
        req.setSerials(List.of(serialReq));

        assertThatThrownBy(() -> inventoryService.completePurchaseOrder(req))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Serial không được để trống");

        assertThat(productDetailRepository.count()).isEqualTo(detailBefore);
    }

    @Test
    @DisplayName("TC_INVENTORY_027 - Hoàn tất nhập hàng thất bại khi SKU không thuộc phiếu nhập")
    @Transactional
    void TC_INVENTORY_027_completePurchaseOrder_skuNotInPO() {
        Supplier supplier = createTestSupplier("CPO06");
        WarehouseProduct wp = createTestWarehouseProduct("SKU-CPO-006", supplier);

        PurchaseOrder po = PurchaseOrder.builder()
                .poCode("PO-WRONGSKU-006")
                .supplier(supplier)
                .status(POStatus.CREATED)
                .orderDate(LocalDateTime.now())
                .build();

        PurchaseOrderItem item = PurchaseOrderItem.builder()
                .purchaseOrder(po)
                .sku("SKU-CPO-006")
                .warehouseProduct(wp)
                .quantity(1L)
                .unitCost(1000000.0)
                .warrantyMonths(12)
                .build();

        po.setItems(List.of(item));
        purchaseOrderRepository.save(po);

        ProductSerialRequest serialReq = new ProductSerialRequest();
        serialReq.setProductSku("SKU-WRONG-999"); // SKU không thuộc PO này
        serialReq.setSerialNumbers(List.of("SN-WRONG-001"));

        CompletePORequest req = new CompletePORequest();
        req.setPoId(po.getId());
        req.setSerials(List.of(serialReq));

        assertThatThrownBy(() -> inventoryService.completePurchaseOrder(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("không thuộc phiếu nhập");
    }

    // =========================================================
    // *** TEST GROUP 7: createExportOrder ***
    // Mục đích: Kiểm tra xuất kho thủ công (không phải bán hàng)
    // =========================================================

    @Test
    @DisplayName("TC_INVENTORY_028 - Xuất kho thủ công thành công")
    @Transactional
    void TC_INVENTORY_028_createExportOrder_success() {
        Supplier supplier = createTestSupplier("EXP01");
        WarehouseProduct wp = createTestWarehouseProduct("SKU-EXP-001", supplier);
        createTestProductDetail("SN-EXP-001", wp, ProductStatus.IN_STOCK, 2000000.0);
        createTestStock(wp, 1L, 0L);
        long exportBefore = exportOrderRepository.count();

        ExportItemRequest itemReq = new ExportItemRequest();
        itemReq.setProductSku("SKU-EXP-001");
        itemReq.setSerialNumbers(List.of("SN-EXP-001"));

        CreateExportOrderRequest req = new CreateExportOrderRequest();
        req.setCreatedBy("warehouse_staff");
        req.setReason("Xuất để kiểm kho");
        req.setNote("Test xuất kho");
        req.setItems(List.of(itemReq));

        ApiResponse response = inventoryService.createExportOrder(req);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getMessage()).isEqualTo("Xuất kho thành công!");

        // Kiểm tra phiếu xuất được tạo
        assertThat(exportOrderRepository.count()).isEqualTo(exportBefore + 1);

        // Kiểm tra serial đã chuyển sang SOLD
        ProductDetail pd = productDetailRepository.findBySerialNumber("SN-EXP-001").orElseThrow();
        assertThat(pd.getStatus()).isEqualTo(ProductStatus.SOLD);
        assertThat(pd.getSoldDate()).isNotNull();

        // Kiểm tra tồn kho giảm xuống 0
        InventoryStock stock = inventoryStockRepository.findByWarehouseProduct_Id(wp.getId()).orElseThrow();
        assertThat(stock.getOnHand()).isEqualTo(0L);
    }

    @Test
    @DisplayName("TC_INVENTORY_029 - Xuất kho thất bại khi không đủ hàng trong kho")
    @Transactional
    void TC_INVENTORY_029_createExportOrder_insufficientStock() {
        Supplier supplier = createTestSupplier("EXP02");
        WarehouseProduct wp = createTestWarehouseProduct("SKU-EXP-002", supplier);
        createTestProductDetail("SN-EXP-002", wp, ProductStatus.IN_STOCK, 1000000.0);
        createTestStock(wp, 0L, 0L); // tồn kho = 0
        long exportBefore = exportOrderRepository.count();

        ExportItemRequest itemReq = new ExportItemRequest();
        itemReq.setProductSku("SKU-EXP-002");
        itemReq.setSerialNumbers(List.of("SN-EXP-002"));

        CreateExportOrderRequest req = new CreateExportOrderRequest();
        req.setCreatedBy("staff");
        req.setItems(List.of(itemReq));

        assertThatThrownBy(() -> inventoryService.createExportOrder(req))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Không đủ hàng trong kho");

        // Phiếu xuất không được tạo
        assertThat(exportOrderRepository.count()).isEqualTo(exportBefore);

        // Serial không bị thay đổi trạng thái
        ProductDetail pd = productDetailRepository.findBySerialNumber("SN-EXP-002").orElseThrow();
        assertThat(pd.getStatus()).isEqualTo(ProductStatus.IN_STOCK);
    }

    @Test
    @DisplayName("TC_INVENTORY_030 - Xuất kho thất bại khi SKU không tồn tại")
    @Transactional
    void TC_INVENTORY_030_createExportOrder_skuNotFound() {
        long exportBefore = exportOrderRepository.count();

        ExportItemRequest itemReq = new ExportItemRequest();
        itemReq.setProductSku("SKU-NOT-EXIST-999");
        itemReq.setSerialNumbers(List.of("SN-ANY-001"));

        CreateExportOrderRequest req = new CreateExportOrderRequest();
        req.setItems(List.of(itemReq));

        assertThatThrownBy(() -> inventoryService.createExportOrder(req))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Không tìm thấy sản phẩm SKU");

        assertThat(exportOrderRepository.count()).isEqualTo(exportBefore);
    }

    @Test
    @DisplayName("TC_INVENTORY_031 - Xuất kho thất bại khi serial không ở trạng thái IN_STOCK")
    @Transactional
    void TC_INVENTORY_031_createExportOrder_serialNotInStock() {
        Supplier supplier = createTestSupplier("EXP03");
        WarehouseProduct wp = createTestWarehouseProduct("SKU-EXP-003", supplier);
        createTestProductDetail("SN-EXP-003", wp, ProductStatus.SOLD, 1000000.0); // đã bán rồi
        createTestStock(wp, 2L, 0L);
        long exportBefore = exportOrderRepository.count();

        ExportItemRequest itemReq = new ExportItemRequest();
        itemReq.setProductSku("SKU-EXP-003");
        itemReq.setSerialNumbers(List.of("SN-EXP-003"));

        CreateExportOrderRequest req = new CreateExportOrderRequest();
        req.setItems(List.of(itemReq));

        assertThatThrownBy(() -> inventoryService.createExportOrder(req))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("không ở trạng thái IN_STOCK");

        assertThat(exportOrderRepository.count()).isEqualTo(exportBefore);
    }

    // =========================================================
    // *** TEST GROUP 8: getPurchaseOrders ***
    // Mục đích: Kiểm tra lấy danh sách phiếu nhập với filter
    // =========================================================

    @Test
    @DisplayName("TC_INVENTORY_032 - Lấy tất cả phiếu nhập khi status null")
    void TC_INVENTORY_032_getPurchaseOrders_noFilter() {
        Supplier supplier = createTestSupplier("GP01");

        // Tạo 2 PO với trạng thái khác nhau
        PurchaseOrder po1 = purchaseOrderRepository.save(PurchaseOrder.builder()
                .poCode("PO-GP-001").supplier(supplier).status(POStatus.CREATED)
                .orderDate(LocalDateTime.now()).items(List.of()).build());
        PurchaseOrder po2 = purchaseOrderRepository.save(PurchaseOrder.builder()
                .poCode("PO-GP-002").supplier(supplier).status(POStatus.RECEIVED)
                .orderDate(LocalDateTime.now()).items(List.of()).build());

        long countInDb = purchaseOrderRepository.count();

        ApiResponse response = inventoryService.getPurchaseOrders(null);

        assertThat(response.isSuccess()).isTrue();

        @SuppressWarnings("unchecked")
        List<PurchaseOrderListResponse> data = (List<PurchaseOrderListResponse>) response.getData();
        assertThat(data).hasSize((int) countInDb);

        // Kiểm tra từng phần tử trong list
        PurchaseOrderListResponse dto1 = data.stream()
                .filter(d -> d.getPoCode().equals("PO-GP-001")).findFirst().orElseThrow();
        assertThat(dto1.getId()).isEqualTo(po1.getId());
        assertThat(dto1.getPoCode()).isEqualTo("PO-GP-001");
        assertThat(dto1.getStatus()).isEqualTo("CREATED");
        assertThat(dto1.getSupplierName()).isEqualTo(supplier.getName());
        assertThat(dto1.getOrderDate()).isNotNull();

        PurchaseOrderListResponse dto2 = data.stream()
                .filter(d -> d.getPoCode().equals("PO-GP-002")).findFirst().orElseThrow();
        assertThat(dto2.getStatus()).isEqualTo("RECEIVED");
    }

    @Test
    @DisplayName("TC_INVENTORY_033 - Lấy phiếu nhập theo status CREATED")
    void TC_INVENTORY_033_getPurchaseOrders_filterByCreated() {
        Supplier supplier = createTestSupplier("GP02");

        purchaseOrderRepository.save(PurchaseOrder.builder()
                .poCode("PO-CREATED-001").supplier(supplier).status(POStatus.CREATED)
                .orderDate(LocalDateTime.now()).items(List.of()).build());
        purchaseOrderRepository.save(PurchaseOrder.builder()
                .poCode("PO-RECEIVED-001").supplier(supplier).status(POStatus.RECEIVED)
                .orderDate(LocalDateTime.now()).items(List.of()).build());

        ApiResponse response = inventoryService.getPurchaseOrders(POStatus.CREATED);

        assertThat(response.isSuccess()).isTrue();
        @SuppressWarnings("unchecked")
        List<PurchaseOrderListResponse> data = (List<PurchaseOrderListResponse>) response.getData();

        // Chỉ có PO với status CREATED
        assertThat(data).allMatch(d -> d.getStatus().equals("CREATED"));
        assertThat(data.stream().anyMatch(d -> d.getPoCode().equals("PO-CREATED-001"))).isTrue();
        assertThat(data.stream().noneMatch(d -> d.getPoCode().equals("PO-RECEIVED-001"))).isTrue();
    }

    @Test
    @DisplayName("TC_INVENTORY_034 - Lấy phiếu nhập khi danh sách rỗng")
    void TC_INVENTORY_034_getPurchaseOrders_empty() {
        purchaseOrderRepository.deleteAll();

        ApiResponse response = inventoryService.getPurchaseOrders(null);

        assertThat(response.isSuccess()).isTrue();
        @SuppressWarnings("unchecked")
        List<?> data = (List<?>) response.getData();
        assertThat(data).isEmpty();
    }

    // =========================================================
    // *** TEST GROUP 9: getPurchaseOrderDetail ***
    // Mục đích: Kiểm tra lấy chi tiết một phiếu nhập
    // =========================================================

    @Test
    @DisplayName("TC_INVENTORY_035 - Lấy chi tiết phiếu nhập thành công")
    @Transactional
    void TC_INVENTORY_035_getPurchaseOrderDetail_success() {
        Supplier supplier = createTestSupplier("POD01");
        WarehouseProduct wp = createTestWarehouseProduct("SKU-POD-001", supplier);

        PurchaseOrder po = PurchaseOrder.builder()
                .poCode("PO-DETAIL-001")
                .supplier(supplier)
                .status(POStatus.CREATED)
                .orderDate(LocalDateTime.now())
                .createdBy("admin")
                .note("Chi tiết test")
                .build();

        PurchaseOrderItem item = PurchaseOrderItem.builder()
                .purchaseOrder(po)
                .sku("SKU-POD-001")
                .warehouseProduct(wp)
                .quantity(3L)
                .unitCost(750000.0)
                .warrantyMonths(6)
                .note("item note")
                .build();

        po.setItems(List.of(item));
        purchaseOrderRepository.save(po);

        ApiResponse response = inventoryService.getPurchaseOrderDetail(po.getId());

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getMessage()).isEqualTo("Chi tiết phiếu nhập");

        PurchaseOrderDetailResponse dto = (PurchaseOrderDetailResponse) response.getData();
        assertThat(dto.getId()).isEqualTo(po.getId());
        assertThat(dto.getPoCode()).isEqualTo("PO-DETAIL-001");
        assertThat(dto.getStatus()).isEqualTo("CREATED");
        assertThat(dto.getCreatedBy()).isEqualTo("admin");
        assertThat(dto.getNote()).isEqualTo("Chi tiết test");
        assertThat(dto.getTotalAmount()).isEqualTo(3L * 750000.0);

        // Kiểm tra thông tin supplier
        assertThat(dto.getSupplier()).isNotNull();
        assertThat(dto.getSupplier().getTaxCode()).isEqualTo("TAXPOD01");
        assertThat(dto.getSupplier().getName()).isEqualTo("Nhà cung cấp POD01");

        // Kiểm tra items
        assertThat(dto.getItems()).hasSize(1);
        PurchaseOrderDetailResponse.PurchaseOrderItemInfo itemInfo = dto.getItems().get(0);
        assertThat(itemInfo.getSku()).isEqualTo("SKU-POD-001");
        assertThat(itemInfo.getQuantity()).isEqualTo(3);
        assertThat(itemInfo.getUnitCost()).isEqualTo(750000.0);
        assertThat(itemInfo.getWarrantyMonths()).isEqualTo(6);
        assertThat(itemInfo.getNote()).isEqualTo("item note");

        // Kiểm tra warehouseProduct trong item
        assertThat(itemInfo.getWarehouseProduct()).isNotNull();
        assertThat(itemInfo.getWarehouseProduct().getSku()).isEqualTo("SKU-POD-001");
    }

    @Test
    @DisplayName("TC_INVENTORY_036 - Lấy chi tiết phiếu nhập thất bại khi không tồn tại")
    void TC_INVENTORY_036_getPurchaseOrderDetail_notFound() {
        assertThatThrownBy(() -> inventoryService.getPurchaseOrderDetail(999999L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Không tìm thấy phiếu nhập");
    }

    // =========================================================
    // *** TEST GROUP 10: cancelPurchaseOrder ***
    // Mục đích: Kiểm tra hủy phiếu nhập hàng
    // =========================================================

    @Test
    @DisplayName("TC_INVENTORY_037 - Hủy phiếu nhập thành công khi đang ở trạng thái CREATED")
    void TC_INVENTORY_037_cancelPurchaseOrder_success() {
        Supplier supplier = createTestSupplier("CAN01");
        PurchaseOrder po = purchaseOrderRepository.save(PurchaseOrder.builder()
                .poCode("PO-CANCEL-001").supplier(supplier).status(POStatus.CREATED)
                .orderDate(LocalDateTime.now()).items(List.of()).build());

        ApiResponse response = inventoryService.cancelPurchaseOrder(po.getId());

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getMessage()).isEqualTo("Đã hủy phiếu nhập thành công");

        // Kiểm tra DB: status đã chuyển CANCELLED
        PurchaseOrder fromDb = purchaseOrderRepository.findById(po.getId()).orElseThrow();
        assertThat(fromDb.getStatus()).isEqualTo(POStatus.CANCELLED);
    }

    @Test
    @DisplayName("TC_INVENTORY_038 - Hủy phiếu nhập thất bại khi không ở trạng thái CREATED")
    void TC_INVENTORY_038_cancelPurchaseOrder_wrongStatus() {
        Supplier supplier = createTestSupplier("CAN02");
        PurchaseOrder po = purchaseOrderRepository.save(PurchaseOrder.builder()
                .poCode("PO-CANCEL-002").supplier(supplier).status(POStatus.RECEIVED)
                .orderDate(LocalDateTime.now()).items(List.of()).build());

        ApiResponse response = inventoryService.cancelPurchaseOrder(po.getId());

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).contains("Chỉ có thể hủy phiếu ở trạng thái chờ xử lý");

        // DB không thay đổi
        PurchaseOrder fromDb = purchaseOrderRepository.findById(po.getId()).orElseThrow();
        assertThat(fromDb.getStatus()).isEqualTo(POStatus.RECEIVED); // vẫn RECEIVED
    }

    @Test
    @DisplayName("TC_INVENTORY_039 - Hủy phiếu nhập thất bại khi ID không tồn tại")
    void TC_INVENTORY_039_cancelPurchaseOrder_notFound() {
        assertThatThrownBy(() -> inventoryService.cancelPurchaseOrder(999999L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Không tìm thấy phiếu nhập");
    }

    // =========================================================
    // *** TEST GROUP 11: getStocks ***
    // Mục đích: Kiểm tra lấy danh sách tồn kho với filter
    // =========================================================

    @Test
    @DisplayName("TC_INVENTORY_040 - Lấy tất cả tồn kho không có filter")
    void TC_INVENTORY_040_getStocks_noFilter() {
        Supplier supplier = createTestSupplier("STK01");
        WarehouseProduct wp1 = createTestWarehouseProduct("SKU-STK-001", supplier);
        WarehouseProduct wp2 = createTestWarehouseProduct("SKU-STK-002", supplier);
        createTestStock(wp1, 10L, 2L);
        createTestStock(wp2, 5L, 1L);
        long stockCount = inventoryStockRepository.count();

        ApiResponse response = inventoryService.getStocks(null);

        assertThat(response.isSuccess()).isTrue();
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> data = (List<Map<String, Object>>) response.getData();
        assertThat(data).hasSize((int) stockCount);

        // Kiểm tra từng thuộc tính của phần tử đầu tiên
        Map<String, Object> first = data.stream()
                .filter(d -> ((Map<?, ?>) d.get("warehouseProduct")).get("sku").equals("SKU-STK-001"))
                .findFirst().orElseThrow();
        assertThat(first.get("onHand")).isEqualTo(10L);
        assertThat(first.get("reserved")).isEqualTo(2L);
        assertThat(first.get("damaged")).isEqualTo(0L);
    }

    @Test
    @DisplayName("TC_INVENTORY_041 - Lấy tồn kho với filter 'low_stock'")
    void TC_INVENTORY_041_getStocks_lowStockFilter() {
        Supplier supplier = createTestSupplier("STK02");
        WarehouseProduct wp1 = createTestWarehouseProduct("SKU-STK-LOW", supplier);
        WarehouseProduct wp2 = createTestWarehouseProduct("SKU-STK-HIGH", supplier);
        createTestStock(wp1, 5L, 0L);   // low stock (< 10)
        createTestStock(wp2, 100L, 0L); // không low stock

        ApiResponse response = inventoryService.getStocks("low_stock");

        assertThat(response.isSuccess()).isTrue();
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> data = (List<Map<String, Object>>) response.getData();

        // Chỉ có sản phẩm low_stock
        assertThat(data).allMatch(d -> (Long) d.get("onHand") <= 10L);
        assertThat(data.stream().anyMatch(d ->
                ((Map<?, ?>) d.get("warehouseProduct")).get("sku").equals("SKU-STK-LOW"))).isTrue();
        assertThat(data.stream().noneMatch(d ->
                ((Map<?, ?>) d.get("warehouseProduct")).get("sku").equals("SKU-STK-HIGH"))).isTrue();
    }

    @Test
    @DisplayName("TC_INVENTORY_042 - Lấy tồn kho với filter 'out_of_stock'")
    void TC_INVENTORY_042_getStocks_outOfStockFilter() {
        Supplier supplier = createTestSupplier("STK03");
        WarehouseProduct wp1 = createTestWarehouseProduct("SKU-STK-OUT", supplier);
        WarehouseProduct wp2 = createTestWarehouseProduct("SKU-STK-INSTOCK", supplier);
        createTestStock(wp1, 0L, 0L);  // hết hàng
        createTestStock(wp2, 3L, 0L);  // còn hàng

        ApiResponse response = inventoryService.getStocks("out_of_stock");

        assertThat(response.isSuccess()).isTrue();
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> data = (List<Map<String, Object>>) response.getData();

        assertThat(data).allMatch(d -> (Long) d.get("onHand") <= 0L);
        assertThat(data.stream().anyMatch(d ->
                ((Map<?, ?>) d.get("warehouseProduct")).get("sku").equals("SKU-STK-OUT"))).isTrue();
    }

    @Test
    @DisplayName("TC_INVENTORY_043 - Lấy tồn kho khi không có record nào")
    void TC_INVENTORY_043_getStocks_empty() {
        inventoryStockRepository.deleteAll();

        ApiResponse response = inventoryService.getStocks(null);

        assertThat(response.isSuccess()).isTrue();
        @SuppressWarnings("unchecked")
        List<?> data = (List<?>) response.getData();
        assertThat(data).isEmpty();
    }

    // =========================================================
    // *** TEST GROUP 12: getStockDetails ***
    // Mục đích: Kiểm tra lấy danh sách serial theo warehouse product
    // =========================================================

    @Test
    @DisplayName("TC_INVENTORY_044 - Lấy danh sách serial theo warehouse product thành công")
    void TC_INVENTORY_044_getStockDetails_success() {
        Supplier supplier = createTestSupplier("STDET01");
        WarehouseProduct wp = createTestWarehouseProduct("SKU-DET-001", supplier);
        createTestProductDetail("SN-DET-001", wp, ProductStatus.IN_STOCK, 1000000.0);
        createTestProductDetail("SN-DET-002", wp, ProductStatus.SOLD, 1000000.0);

        ApiResponse response = inventoryService.getStockDetails(wp.getId());

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getMessage()).isEqualTo("Danh sách Serial");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> data = (List<Map<String, Object>>) response.getData();
        assertThat(data).hasSize(2);

        // Kiểm tra từng phần tử
        Map<String, Object> det1 = data.stream()
                .filter(d -> d.get("serialNumber").equals("SN-DET-001")).findFirst().orElseThrow();
        assertThat(det1.get("status")).isEqualTo(ProductStatus.IN_STOCK);
        assertThat(det1.get("importPrice")).isEqualTo(1000000.0);
        assertThat(det1.get("importDate")).isNotNull();

        Map<String, Object> det2 = data.stream()
                .filter(d -> d.get("serialNumber").equals("SN-DET-002")).findFirst().orElseThrow();
        assertThat(det2.get("status")).isEqualTo(ProductStatus.SOLD);
    }

    @Test
    @DisplayName("TC_INVENTORY_045 - Lấy danh sách serial khi warehouse product không tồn tại → exception")
    void TC_INVENTORY_045_getStockDetails_notFound() {
        ApiResponse response = inventoryService.getStockDetails(999999L);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).contains("Lỗi lấy chi tiết serial");
    }

    @Test
    @DisplayName("TC_INVENTORY_046 - Lấy danh sách serial khi không có serial nào")
    void TC_INVENTORY_046_getStockDetails_noSerials() {
        Supplier supplier = createTestSupplier("STDET02");
        WarehouseProduct wp = createTestWarehouseProduct("SKU-DET-002", supplier);

        ApiResponse response = inventoryService.getStockDetails(wp.getId());

        assertThat(response.isSuccess()).isTrue();
        @SuppressWarnings("unchecked")
        List<?> data = (List<?>) response.getData();
        assertThat(data).isEmpty();
    }

    // =========================================================
    // *** TEST GROUP 13: exportForSale ***
    // Mục đích: Kiểm tra xuất kho khi bán hàng
    // =========================================================

    @Test
    @DisplayName("TC_INVENTORY_047 - Xuất kho bán hàng thành công")
    @Transactional
    void TC_INVENTORY_047_exportForSale_success() {
        Supplier supplier = createTestSupplier("SALE01");
        WarehouseProduct wp = createTestWarehouseProduct("SKU-SALE-001", supplier);
        createTestProductDetail("SN-SALE-001", wp, ProductStatus.IN_STOCK, 3000000.0);
        InventoryStock stock = createTestStock(wp, 1L, 1L); // reserved 1
        long exportBefore = exportOrderRepository.count();

        ExportItemRequest itemReq = new ExportItemRequest();
        itemReq.setProductSku("SKU-SALE-001");
        itemReq.setSerialNumbers(List.of("SN-SALE-001"));

        SaleExportRequest req = new SaleExportRequest();
        req.setOrderId(null); // không có orderId để tránh call GHN
        req.setCreatedBy("seller");
        req.setNote("Bán hàng test");
        req.setItems(List.of(itemReq));

        ApiResponse response = inventoryService.exportForSale(req);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getMessage()).isEqualTo("Xuất kho bán hàng thành công");

        // Phiếu xuất được tạo
        assertThat(exportOrderRepository.count()).isEqualTo(exportBefore + 1);

        // Serial đã chuyển SOLD
        ProductDetail pd = productDetailRepository.findBySerialNumber("SN-SALE-001").orElseThrow();
        assertThat(pd.getStatus()).isEqualTo(ProductStatus.SOLD);
        assertThat(pd.getSoldDate()).isNotNull();

        // Tồn kho giảm và reserved giảm
        InventoryStock updatedStock = inventoryStockRepository.findByWarehouseProduct_Id(wp.getId()).orElseThrow();
        assertThat(updatedStock.getOnHand()).isEqualTo(0L);
        assertThat(updatedStock.getReserved()).isEqualTo(0L); // reserved cũng được giải phóng
    }

    @Test
    @DisplayName("TC_INVENTORY_048 - Xuất kho bán hàng thất bại khi danh sách items rỗng")
    void TC_INVENTORY_048_exportForSale_emptyItems() {
        long exportBefore = exportOrderRepository.count();

        SaleExportRequest req = new SaleExportRequest();
        req.setItems(List.of()); // rỗng

        ApiResponse response = inventoryService.exportForSale(req);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).contains("Danh sách sản phẩm xuất không được để trống");

        assertThat(exportOrderRepository.count()).isEqualTo(exportBefore);
    }

    @Test
    @DisplayName("TC_INVENTORY_049 - Xuất kho bán hàng thất bại khi items null")
    void TC_INVENTORY_049_exportForSale_nullItems() {
        long exportBefore = exportOrderRepository.count();

        SaleExportRequest req = new SaleExportRequest();
        req.setItems(null);

        ApiResponse response = inventoryService.exportForSale(req);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).contains("Danh sách sản phẩm xuất không được để trống");

        assertThat(exportOrderRepository.count()).isEqualTo(exportBefore);
    }

    @Test
    @DisplayName("TC_INVENTORY_050 - Xuất kho bán hàng thất bại khi serial không ở trạng thái IN_STOCK")
    @Transactional
    void TC_INVENTORY_050_exportForSale_serialNotInStock() {
        Supplier supplier = createTestSupplier("SALE02");
        WarehouseProduct wp = createTestWarehouseProduct("SKU-SALE-002", supplier);
        createTestProductDetail("SN-SALE-WARRANTY", wp, ProductStatus.WARRANTY, 2000000.0);
        createTestStock(wp, 5L, 0L);
        long exportBefore = exportOrderRepository.count();

        ExportItemRequest itemReq = new ExportItemRequest();
        itemReq.setProductSku("SKU-SALE-002");
        itemReq.setSerialNumbers(List.of("SN-SALE-WARRANTY"));

        SaleExportRequest req = new SaleExportRequest();
        req.setItems(List.of(itemReq));

        ApiResponse response = inventoryService.exportForSale(req);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).contains("không ở trạng thái IN_STOCK");

        assertThat(exportOrderRepository.count()).isEqualTo(exportBefore);
    }

    // =========================================================
    // *** TEST GROUP 14: exportForWarranty ***
    // Mục đích: Kiểm tra xuất kho để bảo hành
    // =========================================================

    @Test
    @DisplayName("TC_INVENTORY_051 - Xuất kho bảo hành thành công với serial IN_STOCK")
    @Transactional
    void TC_INVENTORY_051_exportForWarranty_success_inStock() {
        Supplier supplier = createTestSupplier("WAR01");
        WarehouseProduct wp = createTestWarehouseProduct("SKU-WAR-001", supplier);
        createTestProductDetail("SN-WAR-001", wp, ProductStatus.IN_STOCK, 5000000.0);
        createTestStock(wp, 2L, 0L);
        long exportBefore = exportOrderRepository.count();

        ExportItemRequest itemReq = new ExportItemRequest();
        itemReq.setProductSku("SKU-WAR-001");
        itemReq.setSerialNumbers(List.of("SN-WAR-001"));

        WarrantyExportRequest req = new WarrantyExportRequest();
        req.setNote("Bảo hành khách hàng ABC");
        req.setItems(List.of(itemReq));

        ApiResponse response = inventoryService.exportForWarranty(req);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getMessage()).isEqualTo("Xuất kho bảo hành thành công");

        // Phiếu xuất bảo hành được tạo
        assertThat(exportOrderRepository.count()).isEqualTo(exportBefore + 1);

        // Serial chuyển sang WARRANTY
        ProductDetail pd = productDetailRepository.findBySerialNumber("SN-WAR-001").orElseThrow();
        assertThat(pd.getStatus()).isEqualTo(ProductStatus.WARRANTY);

        // Tồn kho giảm 1
        InventoryStock stock = inventoryStockRepository.findByWarehouseProduct_Id(wp.getId()).orElseThrow();
        assertThat(stock.getOnHand()).isEqualTo(1L);
    }

    @Test
    @DisplayName("TC_INVENTORY_052 - Xuất kho bảo hành thành công với serial SOLD")
    @Transactional
    void TC_INVENTORY_052_exportForWarranty_success_sold() {
        Supplier supplier = createTestSupplier("WAR02");
        WarehouseProduct wp = createTestWarehouseProduct("SKU-WAR-002", supplier);
        createTestProductDetail("SN-WAR-SOLD", wp, ProductStatus.SOLD, 5000000.0);
        createTestStock(wp, 1L, 0L);

        ExportItemRequest itemReq = new ExportItemRequest();
        itemReq.setProductSku("SKU-WAR-002");
        itemReq.setSerialNumbers(List.of("SN-WAR-SOLD"));

        WarrantyExportRequest req = new WarrantyExportRequest();
        req.setNote("Bảo hành sản phẩm đã bán");
        req.setItems(List.of(itemReq));

        ApiResponse response = inventoryService.exportForWarranty(req);

        // Cả SOLD lẫn IN_STOCK đều có thể xuất bảo hành
        assertThat(response.isSuccess()).isTrue();

        ProductDetail pd = productDetailRepository.findBySerialNumber("SN-WAR-SOLD").orElseThrow();
        assertThat(pd.getStatus()).isEqualTo(ProductStatus.WARRANTY);
    }

    @Test
    @DisplayName("TC_INVENTORY_053 - Xuất kho bảo hành thất bại khi hết hàng trong kho")
    @Transactional
    void TC_INVENTORY_053_exportForWarranty_outOfStock() {
        Supplier supplier = createTestSupplier("WAR03");
        WarehouseProduct wp = createTestWarehouseProduct("SKU-WAR-003", supplier);
        createTestProductDetail("SN-WAR-003", wp, ProductStatus.IN_STOCK, 5000000.0);
        createTestStock(wp, 0L, 0L); // hết hàng
        long exportBefore = exportOrderRepository.count();

        ExportItemRequest itemReq = new ExportItemRequest();
        itemReq.setProductSku("SKU-WAR-003");
        itemReq.setSerialNumbers(List.of("SN-WAR-003"));

        WarrantyExportRequest req = new WarrantyExportRequest();
        req.setItems(List.of(itemReq));

        ApiResponse response = inventoryService.exportForWarranty(req);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).contains("Không còn hàng trong kho");

        // Không có phiếu xuất nào được tạo
        assertThat(exportOrderRepository.count()).isEqualTo(exportBefore);

        // Serial không bị thay đổi
        ProductDetail pd = productDetailRepository.findBySerialNumber("SN-WAR-003").orElseThrow();
        assertThat(pd.getStatus()).isEqualTo(ProductStatus.IN_STOCK);
    }

    @Test
    @DisplayName("TC_INVENTORY_054 - Xuất kho bảo hành thất bại khi serial không hợp lệ")
    @Transactional
    void TC_INVENTORY_054_exportForWarranty_invalidSerial() {
        ExportItemRequest itemReq = new ExportItemRequest();
        itemReq.setProductSku("SKU-ANY");
        itemReq.setSerialNumbers(List.of("SN-NOT-EXIST-999"));

        WarrantyExportRequest req = new WarrantyExportRequest();
        req.setItems(List.of(itemReq));

        assertThatThrownBy(() -> inventoryService.exportForWarranty(req))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Không tìm thấy serial cần bảo hành");
    }

    @Test
    @DisplayName("TC_INVENTORY_055 - Xuất kho bảo hành thất bại khi serial trạng thái không hợp lệ (WARRANTY)")
    @Transactional
    void TC_INVENTORY_055_exportForWarranty_invalidStatus() {
        Supplier supplier = createTestSupplier("WAR04");
        WarehouseProduct wp = createTestWarehouseProduct("SKU-WAR-004", supplier);
        // Đặt serial ở trạng thái WARRANTY (không phải IN_STOCK hoặc SOLD)
        createTestProductDetail("SN-WAR-ALREADY", wp, ProductStatus.WARRANTY, 5000000.0);
        createTestStock(wp, 1L, 0L);

        ExportItemRequest itemReq = new ExportItemRequest();
        itemReq.setProductSku("SKU-WAR-004");
        itemReq.setSerialNumbers(List.of("SN-WAR-ALREADY"));

        WarrantyExportRequest req = new WarrantyExportRequest();
        req.setItems(List.of(itemReq));

        ApiResponse response = inventoryService.exportForWarranty(req);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).contains("Serial không thể xuất bảo hành");
    }

    // =========================================================
    // *** TEST GROUP 15: syncReservedQuantity ***
    // Mục đích: Kiểm tra đồng bộ số lượng reserved
    // =========================================================

    @Test
    @DisplayName("TC_INVENTORY_056 - Đồng bộ reserved quantity thành công")
    @Transactional
    void TC_INVENTORY_056_syncReservedQuantity_success() {
        Supplier supplier = createTestSupplier("SYNC01");
        WarehouseProduct wp = createTestWarehouseProduct("SKU-SYNC-001", supplier);
        Product product = createTestProduct("SKU-SYNC-001", wp);
        createTestStock(wp, 10L, 0L);

        // Đồng bộ reserved = 3
        inventoryService.syncReservedQuantity(wp.getId(), 3L);

        // Kiểm tra InventoryStock
        InventoryStock stock = inventoryStockRepository.findByWarehouseProduct_Id(wp.getId()).orElseThrow();
        assertThat(stock.getReserved()).isEqualTo(3L);

        // Kiểm tra Product đã được đồng bộ
        Product updatedProduct = productRepository.findById(product.getId()).orElseThrow();
        assertThat(updatedProduct.getReservedQuantity()).isEqualTo(3L);
    }

    @Test
    @DisplayName("TC_INVENTORY_057 - Đồng bộ reserved quantity khi chưa có InventoryStock (tạo mới)")
    @Transactional
    void TC_INVENTORY_057_syncReservedQuantity_createNewStock() {
        Supplier supplier = createTestSupplier("SYNC02");
        WarehouseProduct wp = createTestWarehouseProduct("SKU-SYNC-002", supplier);
        // Không tạo InventoryStock trước
        long stockBefore = inventoryStockRepository.count();

        inventoryService.syncReservedQuantity(wp.getId(), 5L);

        // InventoryStock được tạo mới
        assertThat(inventoryStockRepository.count()).isEqualTo(stockBefore + 1);

        InventoryStock stock = inventoryStockRepository.findByWarehouseProduct_Id(wp.getId()).orElseThrow();
        assertThat(stock.getReserved()).isEqualTo(5L);
        assertThat(stock.getOnHand()).isEqualTo(0L);
    }

    @Test
    @DisplayName("TC_INVENTORY_058 - Đồng bộ reserved thất bại khi warehouseProduct không tồn tại")
    void TC_INVENTORY_058_syncReservedQuantity_wpNotFound() {
        assertThatThrownBy(() -> inventoryService.syncReservedQuantity(999999L, 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Không tìm thấy sản phẩm kho");
    }

    // =========================================================
    // *** TEST GROUP 16: getExportOrders ***
    // Mục đích: Kiểm tra lấy danh sách phiếu xuất với filter
    // =========================================================

    @Test
    @DisplayName("TC_INVENTORY_059 - Lấy tất cả phiếu xuất không filter")
    void TC_INVENTORY_059_getExportOrders_noFilter() {
        exportOrderRepository.save(ExportOrder.builder()
                .exportCode("EX-001").status(ExportStatus.CREATED)
                .exportDate(LocalDateTime.now()).items(List.of()).build());
        exportOrderRepository.save(ExportOrder.builder()
                .exportCode("EX-002").status(ExportStatus.COMPLETED)
                .exportDate(LocalDateTime.now()).items(List.of()).build());

        long countInDb = exportOrderRepository.count();

        ApiResponse response = inventoryService.getExportOrders(null);

        assertThat(response.isSuccess()).isTrue();
        @SuppressWarnings("unchecked")
        List<ExportOrder> data = (List<ExportOrder>) response.getData();
        assertThat(data).hasSize((int) countInDb);
    }

    @Test
    @DisplayName("TC_INVENTORY_060 - Lấy phiếu xuất theo status COMPLETED")
    void TC_INVENTORY_060_getExportOrders_filterByCompleted() {
        exportOrderRepository.save(ExportOrder.builder()
                .exportCode("EX-FILT-001").status(ExportStatus.CREATED)
                .exportDate(LocalDateTime.now()).items(List.of()).build());
        exportOrderRepository.save(ExportOrder.builder()
                .exportCode("EX-FILT-002").status(ExportStatus.COMPLETED)
                .exportDate(LocalDateTime.now()).items(List.of()).build());

        ApiResponse response = inventoryService.getExportOrders(ExportStatus.COMPLETED);

        assertThat(response.isSuccess()).isTrue();
        @SuppressWarnings("unchecked")
        List<ExportOrder> data = (List<ExportOrder>) response.getData();
        assertThat(data).allMatch(e -> e.getStatus() == ExportStatus.COMPLETED);
    }

    // =========================================================
    // *** TEST GROUP 17: cancelExportOrder ***
    // Mục đích: Kiểm tra hủy phiếu xuất
    // =========================================================

    @Test
    @DisplayName("TC_INVENTORY_061 - Hủy phiếu xuất thành công khi trạng thái CREATED")
    void TC_INVENTORY_061_cancelExportOrder_success() {
        ExportOrder eo = exportOrderRepository.save(ExportOrder.builder()
                .exportCode("EX-CANCEL-001").status(ExportStatus.CREATED)
                .exportDate(LocalDateTime.now()).items(List.of()).build());

        ApiResponse response = inventoryService.cancelExportOrder(eo.getId());

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getMessage()).isEqualTo("Đã hủy phiếu xuất thành công");

        ExportOrder fromDb = exportOrderRepository.findById(eo.getId()).orElseThrow();
        assertThat(fromDb.getStatus()).isEqualTo(ExportStatus.CANCELLED);
    }

    @Test
    @DisplayName("TC_INVENTORY_062 - Hủy phiếu xuất thất bại khi không ở trạng thái CREATED")
    void TC_INVENTORY_062_cancelExportOrder_wrongStatus() {
        ExportOrder eo = exportOrderRepository.save(ExportOrder.builder()
                .exportCode("EX-CANCEL-002").status(ExportStatus.COMPLETED)
                .exportDate(LocalDateTime.now()).items(List.of()).build());

        ApiResponse response = inventoryService.cancelExportOrder(eo.getId());

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).contains("Chỉ có thể hủy phiếu ở trạng thái chờ xử lý");

        ExportOrder fromDb = exportOrderRepository.findById(eo.getId()).orElseThrow();
        assertThat(fromDb.getStatus()).isEqualTo(ExportStatus.COMPLETED); // không đổi
    }

    @Test
    @DisplayName("TC_INVENTORY_063 - Hủy phiếu xuất thất bại khi ID không tồn tại")
    void TC_INVENTORY_063_cancelExportOrder_notFound() {
        assertThatThrownBy(() -> inventoryService.cancelExportOrder(999999L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Không tìm thấy phiếu xuất");
    }

    // =========================================================
    // *** TEST GROUP 18: getExportOrderDetail ***
    // Mục đích: Kiểm tra lấy chi tiết phiếu xuất
    // =========================================================

    @Test
    @DisplayName("TC_INVENTORY_064 - Lấy chi tiết phiếu xuất thành công")
    @Transactional
    void TC_INVENTORY_064_getExportOrderDetail_success() {
        Supplier supplier = createTestSupplier("EOD01");
        WarehouseProduct wp = createTestWarehouseProduct("SKU-EOD-001", supplier);

        ExportOrder eo = ExportOrder.builder()
                .exportCode("EX-DETAIL-001")
                .status(ExportStatus.COMPLETED)
                .exportDate(LocalDateTime.now())
                .createdBy("staff")
                .reason("Kiểm kho")
                .note("Ghi chú xuất")
                .build();

        ExportOrderItem item = ExportOrderItem.builder()
                .exportOrder(eo)
                .warehouseProduct(wp)
                .sku("SKU-EOD-001")
                .quantity(2L)
                .serialNumbers("SN-EOD-001,SN-EOD-002")
                .totalCost(4000000.0)
                .build();

        eo.setItems(List.of(item));
        exportOrderRepository.save(eo);

        ApiResponse response = inventoryService.getExportOrderDetail(eo.getId());

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getMessage()).isEqualTo("Chi tiết phiếu xuất");

        ExportOrderDetailResponse dto = (ExportOrderDetailResponse) response.getData();
        assertThat(dto.getId()).isEqualTo(eo.getId());
        assertThat(dto.getExportCode()).isEqualTo("EX-DETAIL-001");
        assertThat(dto.getStatus()).isEqualTo("COMPLETED");
        assertThat(dto.getCreatedBy()).isEqualTo("staff");
        assertThat(dto.getReason()).isEqualTo("Kiểm kho");
        assertThat(dto.getNote()).isEqualTo("Ghi chú xuất");
        assertThat(dto.getExportDate()).isNotNull();

        // Kiểm tra items
        assertThat(dto.getItems()).hasSize(1);
        ExportOrderDetailResponse.ExportOrderItemInfo itemInfo = dto.getItems().get(0);
        assertThat(itemInfo.getSku()).isEqualTo("SKU-EOD-001");
        assertThat(itemInfo.getQuantity()).isEqualTo(2L);
        assertThat(itemInfo.getTotalCost()).isEqualTo(4000000.0);
        assertThat(itemInfo.getSerialNumbers()).containsExactlyInAnyOrder("SN-EOD-001", "SN-EOD-002");

        // Kiểm tra warehouseProduct trong item
        assertThat(itemInfo.getWarehouseProduct()).isNotNull();
        assertThat(itemInfo.getWarehouseProduct().getSku()).isEqualTo("SKU-EOD-001");
        assertThat(itemInfo.getWarehouseProduct().getInternalName()).isEqualTo("Sản phẩm SKU-EOD-001");
    }

    @Test
    @DisplayName("TC_INVENTORY_065 - Lấy chi tiết phiếu xuất thất bại khi không tồn tại")
    void TC_INVENTORY_065_getExportOrderDetail_notFound() {
        assertThatThrownBy(() -> inventoryService.getExportOrderDetail(999999L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Không tìm thấy phiếu xuất");
    }

    // =========================================================
    // *** TEST GROUP 19: Edge cases và giá trị biên ***
    // =========================================================

    @Test
    @DisplayName("TC_INVENTORY_066 - Tổng tiền phiếu nhập tính đúng khi có nhiều items")
    @Transactional
    void TC_INVENTORY_066_purchaseOrderDetail_totalAmountCalculation() {
        Supplier supplier = createTestSupplier("TOTAL01");
        WarehouseProduct wp1 = createTestWarehouseProduct("SKU-TOTAL-001", supplier);
        WarehouseProduct wp2 = createTestWarehouseProduct("SKU-TOTAL-002", supplier);

        PurchaseOrder po = PurchaseOrder.builder()
                .poCode("PO-TOTAL-001").supplier(supplier).status(POStatus.CREATED)
                .orderDate(LocalDateTime.now()).build();

        PurchaseOrderItem item1 = PurchaseOrderItem.builder()
                .purchaseOrder(po).sku("SKU-TOTAL-001").warehouseProduct(wp1)
                .quantity(3L).unitCost(100000.0).warrantyMonths(12).build();

        PurchaseOrderItem item2 = PurchaseOrderItem.builder()
                .purchaseOrder(po).sku("SKU-TOTAL-002").warehouseProduct(wp2)
                .quantity(2L).unitCost(250000.0).warrantyMonths(6).build();

        po.setItems(List.of(item1, item2));
        purchaseOrderRepository.save(po);

        ApiResponse response = inventoryService.getPurchaseOrderDetail(po.getId());
        PurchaseOrderDetailResponse dto = (PurchaseOrderDetailResponse) response.getData();

        // Tổng = 3*100000 + 2*250000 = 300000 + 500000 = 800000
        assertThat(dto.getTotalAmount()).isEqualTo(800000.0);
        assertThat(dto.getItems()).hasSize(2);
    }

    @Test
    @DisplayName("TC_INVENTORY_067 - Tổng tiền phiếu nhập khi unitCost null → tính là 0")
    @Transactional
    void TC_INVENTORY_067_purchaseOrderDetail_nullUnitCost() {
        Supplier supplier = createTestSupplier("TOTAL02");
        WarehouseProduct wp = createTestWarehouseProduct("SKU-TOTAL-003", supplier);

        PurchaseOrder po = PurchaseOrder.builder()
                .poCode("PO-NULLCOST-001").supplier(supplier).status(POStatus.CREATED)
                .orderDate(LocalDateTime.now()).build();

        PurchaseOrderItem item = PurchaseOrderItem.builder()
                .purchaseOrder(po).sku("SKU-TOTAL-003").warehouseProduct(wp)
                .quantity(5L).unitCost(null).warrantyMonths(12).build(); // unitCost null

        po.setItems(List.of(item));
        purchaseOrderRepository.save(po);

        ApiResponse response = inventoryService.getPurchaseOrderDetail(po.getId());
        PurchaseOrderDetailResponse dto = (PurchaseOrderDetailResponse) response.getData();

        // Tổng = 0 (vì unitCost null)
        assertThat(dto.getTotalAmount()).isEqualTo(0.0);
    }

    @Test
    @DisplayName("TC_INVENTORY_068 - Xuất kho bảo hành thất bại khi serial null")
    void TC_INVENTORY_068_exportForWarranty_nullSerial() {
        ExportItemRequest itemReq = new ExportItemRequest();
        itemReq.setSerialNumbers(List.of("SN-NULL-999"));

        WarrantyExportRequest req = new WarrantyExportRequest();
        req.setItems(List.of(itemReq));

        assertThatThrownBy(() -> inventoryService.exportForWarranty(req))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Không tìm thấy serial cần bảo hành");
    }

    @Test
    @DisplayName("TC_INVENTORY_069 - Hoàn tất nhập hàng đồng bộ tồn kho với Product khi có liên kết")
    @Transactional
    void TC_INVENTORY_069_completePurchaseOrder_syncWithProduct() {
        Supplier supplier = createTestSupplier("SYNC03");
        WarehouseProduct wp = createTestWarehouseProduct("SKU-SYNC-003", supplier);
        Product product = createTestProduct("SKU-SYNC-003", wp); // liên kết với product

        PurchaseOrder po = PurchaseOrder.builder()
                .poCode("PO-SYNC-003").supplier(supplier).status(POStatus.CREATED)
                .orderDate(LocalDateTime.now()).build();

        PurchaseOrderItem item = PurchaseOrderItem.builder()
                .purchaseOrder(po).sku("SKU-SYNC-003").warehouseProduct(wp)
                .quantity(4L).unitCost(100000.0).warrantyMonths(12).build();

        po.setItems(List.of(item));
        purchaseOrderRepository.save(po);

        ProductSerialRequest serialReq = new ProductSerialRequest();
        serialReq.setProductSku("SKU-SYNC-003");
        serialReq.setSerialNumbers(List.of("SN-SYNC-001", "SN-SYNC-002", "SN-SYNC-003", "SN-SYNC-004"));

        CompletePORequest req = new CompletePORequest();
        req.setPoId(po.getId());
        req.setSerials(List.of(serialReq));
        req.setReceivedDate(LocalDateTime.now());

        inventoryService.completePurchaseOrder(req);

        // Kiểm tra Product.stockQuantity đã được đồng bộ = 4
        Product updatedProduct = productRepository.findById(product.getId()).orElseThrow();
        assertThat(updatedProduct.getStockQuantity()).isEqualTo(4L);
    }

    @Test
    @DisplayName("TC_INVENTORY_070 - Xuất kho bán hàng đồng bộ stock và reserved với Product")
    @Transactional
    void TC_INVENTORY_070_exportForSale_syncProductStockAndReserved() {
        Supplier supplier = createTestSupplier("SYNC04");
        WarehouseProduct wp = createTestWarehouseProduct("SKU-SYNC-004", supplier);
        Product product = createTestProduct("SKU-SYNC-004", wp);
        product.setStockQuantity(3L);
        product.setReservedQuantity(2L);
        productRepository.save(product);

        createTestProductDetail("SN-SYNC-SALE", wp, ProductStatus.IN_STOCK, 1000000.0);
        createTestStock(wp, 3L, 2L);

        ExportItemRequest itemReq = new ExportItemRequest();
        itemReq.setProductSku("SKU-SYNC-004");
        itemReq.setSerialNumbers(List.of("SN-SYNC-SALE"));

        SaleExportRequest req = new SaleExportRequest();
        req.setItems(List.of(itemReq));
        req.setOrderId(null);

        inventoryService.exportForSale(req);

        // Product.stockQuantity phải giảm xuống 2
        Product updatedProduct = productRepository.findById(product.getId()).orElseThrow();
        assertThat(updatedProduct.getStockQuantity()).isEqualTo(2L);
        // Product.reservedQuantity phải giảm xuống 1 (2-1)
        assertThat(updatedProduct.getReservedQuantity()).isEqualTo(1L);
    }
}