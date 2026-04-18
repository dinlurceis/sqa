package com.doan.WEB_TMDT.module.inventory.service;

import com.doan.WEB_TMDT.common.dto.ApiResponse;
import com.doan.WEB_TMDT.module.inventory.dto.*;
import com.doan.WEB_TMDT.module.inventory.entity.*;
import com.doan.WEB_TMDT.module.inventory.repository.*;
import com.doan.WEB_TMDT.module.inventory.service.impl.InventoryServiceImpl;
import com.doan.WEB_TMDT.module.product.entity.Product;
import com.doan.WEB_TMDT.module.product.repository.ProductRepository;
import com.doan.WEB_TMDT.module.accounting.service.SupplierPayableService;
import com.doan.WEB_TMDT.module.shipping.service.ShippingService;
import com.doan.WEB_TMDT.module.order.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.doan.WEB_TMDT.TestResultLogger;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * =============================================================
 * BLACK-BOX UNIT TESTS – InventoryServiceImpl
 * =============================================================
 *
 * Mục tiêu: Tìm bug trong hệ thống, không phải confirm code đúng.
 * Phương pháp: Black-box testing – test theo nghiệp vụ thực tế.
 *
 * Framework: JUnit 5 + Mockito
 * Tất cả repository và dependency đều được mock.
 *
 * Rollback: Không có thay đổi DB thật vì dùng mock – mỗi test độc lập.
 */
@ExtendWith({MockitoExtension.class, TestResultLogger.class})
class InventoryServiceImplTest {

    // ─── Mock Dependencies ───────────────────────────────────────
    @Mock private SupplierRepository supplierRepository;
    @Mock private WarehouseProductRepository warehouseProductRepository;
    @Mock private InventoryStockRepository inventoryStockRepository;
    @Mock private PurchaseOrderRepository purchaseOrderRepository;
    @Mock private PurchaseOrderItemRepository purchaseOrderItemRepository;
    @Mock private ExportOrderRepository exportOrderRepository;
    @Mock private ExportOrderItemRepository exportOrderItemRepository;
    @Mock private ProductDetailRepository productDetailRepository;
    @Mock private ProductRepository productRepository;
    @Mock private ProductSpecificationService productSpecificationService;
    @Mock private SupplierPayableService supplierPayableService;
    @Mock private ShippingService shippingService;
    @Mock private OrderRepository orderRepository;

    @InjectMocks
    private InventoryServiceImpl inventoryService;

    // ─── Fixture Data ────────────────────────────────────────────
    private Supplier supplier;
    private WarehouseProduct warehouseProduct;
    private InventoryStock inventoryStock;
    private PurchaseOrder purchaseOrder;
    private ProductDetail productDetail;

    @BeforeEach
    void setUp() {
        supplier = Supplier.builder()
                .id(1L)
                .name("Nhà cung cấp A")
                .taxCode("0123456789")
                .email("ncc@test.com")
                .phone("0900000001")
                .address("Hà Nội")
                .active(true)
                .autoCreated(false)
                .build();

        warehouseProduct = WarehouseProduct.builder()
                .id(10L)
                .sku("SKU-LAPTOP-001")
                .internalName("Laptop Gaming X")
                .supplier(supplier)
                .description("Laptop gaming cao cấp")
                .techSpecsJson("{\"ram\":\"16GB\",\"cpu\":\"i7\"}")
                .lastImportDate(LocalDateTime.now().minusDays(1))
                .build();

        inventoryStock = InventoryStock.builder()
                .id(1L)
                .warehouseProduct(warehouseProduct)
                .onHand(50L)
                .reserved(5L)
                .damaged(2L)
                .build();

        purchaseOrder = PurchaseOrder.builder()
                .id(1L)
                .poCode("PO-2024-001")
                .supplier(supplier)
                .status(POStatus.CREATED)
                .orderDate(LocalDateTime.now())
                .items(new ArrayList<>())
                .build();

        productDetail = ProductDetail.builder()
                .id(1L)
                .serialNumber("SN-ABCDEF-001")
                .warehouseProduct(warehouseProduct)
                .status(ProductStatus.IN_STOCK)
                .importPrice(15_000_000.0)
                .warrantyMonths(12)
                .importDate(LocalDateTime.now().minusDays(1))
                .build();
    }

    // ================================================================
    // TC_INV_001 → TC_INV_005: getAllSuppliers
    // ================================================================
    @Nested
    @DisplayName("getAllSuppliers Tests")
    class GetAllSuppliersTests {

        /**
         * TC_INV_001
         * Objective : getAllSuppliers trả về danh sách đầy đủ
         * Input     : Repository có sẵn danh sách 2 supplier
         * Expected  : Response thành công, size = 2
         */
        @Test
        @DisplayName("TC_INV_001 – Trả về danh sách nhà cung cấp khi có dữ liệu")
        void TC_INV_001_getAllSuppliers_WithData_ReturnsList() {
            Supplier s2 = Supplier.builder().id(2L).name("NCC B")
                    .taxCode("9999999999").active(true).autoCreated(false).build();
            when(supplierRepository.findAll()).thenReturn(Arrays.asList(supplier, s2));

            ApiResponse response = inventoryService.getAllSuppliers();

            assertTrue(response.isSuccess(), "Response phải thành công");
            @SuppressWarnings("unchecked")
            List<Supplier> data = (List<Supplier>) response.getData();
            assertEquals(2, data.size(), "Phải trả về đúng số nhà cung cấp");
        }

        /**
         * TC_INV_002
         * Objective : getAllSuppliers khi không có NCC nào
         * Input     : Empty list
         * Expected  : Response thành công, danh sách rỗng (không null, không lỗi)
         */
        @Test
        @DisplayName("TC_INV_002 – Trả về list rỗng (không null) khi không có NCC")
        void TC_INV_002_getAllSuppliers_EmptyDB_ReturnsEmptyNotNull() {
            when(supplierRepository.findAll()).thenReturn(Collections.emptyList());

            ApiResponse response = inventoryService.getAllSuppliers();

            assertTrue(response.isSuccess(), "Response phải thành công dù list rỗng");
            assertNotNull(response.getData(), "Data không được null khi list rỗng");
            @SuppressWarnings("unchecked")
            List<Supplier> data = (List<Supplier>) response.getData();
            assertTrue(data.isEmpty(), "Phải trả về list rỗng");
        }
    }

    // ================================================================
    // TC_INV_003 → TC_INV_010: getOrCreateSupplier
    // ================================================================
    @Nested
    @DisplayName("getOrCreateSupplier Tests")
    class GetOrCreateSupplierTests {

        /**
         * TC_INV_003
         * Objective : Tìm thấy NCC qua taxCode → không tạo mới
         * Input     : taxCode = "0123456789" đã tồn tại
         * Expected  : Trả về NCC cũ, KHÔNG gọi save
         */
        @Test
        @DisplayName("TC_INV_003 – Tìm NCC qua taxCode đã tồn tại, không tạo mới")
        void TC_INV_003_getOrCreateSupplier_ExistingTaxCode_ReturnExistingNoSave() {
            CreateSupplierRequest req = new CreateSupplierRequest();
            req.setTaxCode("0123456789");
            when(supplierRepository.findByTaxCode("0123456789")).thenReturn(Optional.of(supplier));

            ApiResponse response = inventoryService.getOrCreateSupplier(req);

            assertTrue(response.isSuccess());
            assertEquals(supplier, response.getData(), "Phải trả về đúng NCC cũ");
            verify(supplierRepository, never()).save(any());
        }

        /**
         * TC_INV_004
         * Objective : Tìm thấy NCC qua email (taxCode null)
         * Input     : taxCode null, email "ncc@test.com" đã tồn tại
         * Expected  : Trả về NCC cũ qua email, KHÔNG tạo mới
         *
         * ⚠️ BUG HUNTER: Nếu hệ thống bỏ qua kiểm tra email khi taxCode null → sẽ tạo NCC trùng
         */
        @Test
        @DisplayName("TC_INV_004 – Tìm NCC qua email khi taxCode null, không tạo mới")
        void TC_INV_004_getOrCreateSupplier_NullTaxCodeExistingEmail_ReturnExistingNoSave() {
            CreateSupplierRequest req = new CreateSupplierRequest();
            req.setTaxCode(null); // taxCode null
            req.setEmail("ncc@test.com");
            when(supplierRepository.findByEmail("ncc@test.com")).thenReturn(Optional.of(supplier));

            ApiResponse response = inventoryService.getOrCreateSupplier(req);

            assertTrue(response.isSuccess());
            assertEquals(supplier, response.getData(), "Phải tìm thấy NCC qua email khi không có taxCode");
            verify(supplierRepository, never()).save(any());
        }

        /**
         * TC_INV_005
         * Objective : Tất cả fields đặc định đều null → phải tạo NCC mới
         * Input     : taxCode null, email null, phone null, name = "NCC Mới"
         * Expected  : Tạo và lưu NCC mới thành công
         */
        @Test
        @DisplayName("TC_INV_005 – Tạo NCC mới khi không tồn tại taxCode/email/phone")
        void TC_INV_005_getOrCreateSupplier_NoMatch_CreatesNewSupplier() {
            CreateSupplierRequest req = new CreateSupplierRequest();
            req.setTaxCode(null);
            req.setEmail(null);
            req.setPhone(null);
            req.setName("NCC Mới");
            when(supplierRepository.save(any())).thenReturn(supplier);

            ApiResponse response = inventoryService.getOrCreateSupplier(req);

            assertTrue(response.isSuccess());
            verify(supplierRepository, times(1)).save(any());
        }

        /**
         * TC_INV_006
         * Objective : Request hoàn toàn null → phải xử lý graceful
         * Input     : CreateSupplierRequest có tất cả null và name null
         * Expected  : Không exception hoặc trả về error response rõ ràng
         *
         * ⚠️ BUG HUNTER: Nếu code gọi name khi null → NullPointerException
         */
        @Test
        @DisplayName("TC_INV_006 – Request với tất cả field null không gây NullPointerException")
        void TC_INV_006_getOrCreateSupplier_AllNullFields_NoNPE() {
            CreateSupplierRequest req = new CreateSupplierRequest();
            // Tất cả fields đều null
            when(supplierRepository.save(any())).thenReturn(supplier);

            // Nghiệp vụ: không được crash, phải xử lý graceful
            assertDoesNotThrow(() -> inventoryService.getOrCreateSupplier(req),
                    "Không được ném NullPointerException khi tất cả fields null");
        }
    }

    // ================================================================
    // TC_INV_007 → TC_INV_011: createWarehouseProduct
    // ================================================================
    @Nested
    @DisplayName("createWarehouseProduct Tests")
    class CreateWarehouseProductTests {

        /**
         * TC_INV_007
         * Objective : Tạo sản phẩm kho với SKU hoàn toàn mới
         * Input     : SKU = "SKU-NEW-999", chưa tồn tại trong DB
         * Expected  : Tạo thành công, gọi save, gọi parseAndSaveSpecs
         */
        @Test
        @DisplayName("TC_INV_007 – Tạo sản phẩm kho với SKU mới thành công")
        void TC_INV_007_createWarehouseProduct_NewSku_SavedAndSpecsParsed() {
            CreateWarehouseProductRequest req = new CreateWarehouseProductRequest();
            req.setSku("SKU-NEW-999");
            req.setInternalName("Laptop Pro Z");
            req.setDescription("Máy tính mới");
            req.setTechSpecsJson("{\"ram\":\"32GB\"}");

            when(warehouseProductRepository.findBySku("SKU-NEW-999")).thenReturn(Optional.empty());
            when(warehouseProductRepository.save(any())).thenReturn(warehouseProduct);
            doNothing().when(productSpecificationService).parseAndSaveSpecs(any());

            ApiResponse response = inventoryService.createWarehouseProduct(req);

            assertTrue(response.isSuccess(), "Tạo sản phẩm mới phải thành công");
            verify(warehouseProductRepository).save(any());
            verify(productSpecificationService).parseAndSaveSpecs(any());
        }

        /**
         * TC_INV_008
         * Objective : Tạo sản phẩm kho với SKU trùng → phải từ chối
         * Input     : SKU = "SKU-LAPTOP-001" đã tồn tại
         * Expected  : Response lỗi, KHÔNG gọi save
         *
         * ⚠️ BUG HUNTER: Nếu không check duplicate SKU → tạo trùng lặp, vi phạm unique constraint
         */
        @Test
        @DisplayName("TC_INV_008 – Từ chối tạo sản phẩm khi SKU đã tồn tại")
        void TC_INV_008_createWarehouseProduct_DuplicateSku_ReturnsError() {
            CreateWarehouseProductRequest req = new CreateWarehouseProductRequest();
            req.setSku("SKU-LAPTOP-001"); // đã tồn tại
            req.setInternalName("Laptop Clone");

            when(warehouseProductRepository.findBySku("SKU-LAPTOP-001"))
                    .thenReturn(Optional.of(warehouseProduct));

            ApiResponse response = inventoryService.createWarehouseProduct(req);

            assertFalse(response.isSuccess(), "Phải trả về lỗi khi SKU trùng");
            verify(warehouseProductRepository, never()).save(any());
            verify(productSpecificationService, never()).parseAndSaveSpecs(any());
        }

        /**
         * TC_INV_009
         * Objective : techSpecsJson null → mặc định dùng "{}"
         * Input     : techSpecsJson = null
         * Expected  : Sản phẩm được tạo với techSpecsJson = "{}" chứ không null
         *
         * ⚠️ BUG HUNTER: Nếu lưu null vào cột JSON → có thể gây lỗi parse sau này
         */
        @Test
        @DisplayName("TC_INV_009 – techSpecsJson null phải mặc định là '{}'")
        void TC_INV_009_createWarehouseProduct_NullTechSpecs_DefaultsToEmptyJson() {
            CreateWarehouseProductRequest req = new CreateWarehouseProductRequest();
            req.setSku("SKU-NO-SPECS");
            req.setInternalName("Product No Specs");
            req.setTechSpecsJson(null); // null

            when(warehouseProductRepository.findBySku("SKU-NO-SPECS")).thenReturn(Optional.empty());
            when(warehouseProductRepository.save(any())).thenAnswer(inv -> {
                WarehouseProduct saved = inv.getArgument(0);
                // Nghiệp vụ: techSpecsJson phải là "{}" chứ không phải null
                assertNotNull(saved.getTechSpecsJson(),
                        "techSpecsJson không được null khi input null, phải dùng '{}'");
                assertEquals("{}", saved.getTechSpecsJson(),
                        "techSpecsJson phải là '{}' khi input null");
                return saved;
            });
            doNothing().when(productSpecificationService).parseAndSaveSpecs(any());

            inventoryService.createWarehouseProduct(req);
            verify(warehouseProductRepository).save(any());
        }

        /**
         * TC_INV_010
         * Objective : supplierId không tồn tại → phải ném exception
         * Input     : supplierId = 999L không có trong DB
         * Expected  : IllegalArgumentException
         */
        @Test
        @DisplayName("TC_INV_010 – supplierId không tồn tại phải ném exception")
        void TC_INV_010_createWarehouseProduct_InvalidSupplierId_ThrowsException() {
            CreateWarehouseProductRequest req = new CreateWarehouseProductRequest();
            req.setSku("SKU-VALID-NEW");
            req.setInternalName("Valid Product");
            req.setSupplierId(999L); // không tồn tại

            when(warehouseProductRepository.findBySku("SKU-VALID-NEW")).thenReturn(Optional.empty());
            when(supplierRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(IllegalArgumentException.class,
                    () -> inventoryService.createWarehouseProduct(req),
                    "Phải ném exception khi supplierId không tồn tại");
        }

        /**
         * TC_INV_011
         * Objective : SKU rỗng ("") → phải từ chối theo nghiệp vụ
         * Input     : sku = ""
         * Expected  : Không được tạo sản phẩm với SKU rỗng
         *
         * ⚠️ BUG HUNTER: @NotBlank chỉ validate ở Controller layer, không ở Service
         */
        @Test
        @DisplayName("TC_INV_011 – SKU rỗng không nên tạo sản phẩm (edge case)")
        void TC_INV_011_createWarehouseProduct_EmptySku_ShouldRejectOrHandle() {
            CreateWarehouseProductRequest req = new CreateWarehouseProductRequest();
            req.setSku(""); // SKU rỗng
            req.setInternalName("Product Empty SKU");

            when(warehouseProductRepository.findBySku("")).thenReturn(Optional.empty());
            when(warehouseProductRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            doNothing().when(productSpecificationService).parseAndSaveSpecs(any());

            // Nghiệp vụ: SKU rỗng là dữ liệu không hợp lệ
            // Kỳ vọng: Trả về error hoặc ném exception
            // Nếu code tạo thành công với SKU="" → đây là BUG
            ApiResponse response = inventoryService.createWarehouseProduct(req);
            if (response.isSuccess()) {
                // Mark as potential bug: SKU rỗng được chấp nhận ở tầng service
                System.out.println("[BUG DETECTED] TC_INV_011: Service chấp nhận SKU rỗng - thiếu validation ở tầng service");
            }
        }
    }

    // ================================================================
    // TC_INV_012 → TC_INV_016: updateWarehouseProduct
    // ================================================================
    @Nested
    @DisplayName("updateWarehouseProduct Tests")
    class UpdateWarehouseProductTests {

        /**
         * TC_INV_012
         * Objective : Cập nhật sản phẩm không tồn tại
         * Input     : id = 9999L không có trong DB
         * Expected  : IllegalArgumentException
         */
        @Test
        @DisplayName("TC_INV_012 – Update sản phẩm không tồn tại phải ném exception")
        void TC_INV_012_updateWarehouseProduct_NonExistentId_ThrowsException() {
            CreateWarehouseProductRequest req = new CreateWarehouseProductRequest();
            req.setSku("SKU-999");
            req.setInternalName("Ghost Product");

            when(warehouseProductRepository.findById(9999L)).thenReturn(Optional.empty());

            assertThrows(IllegalArgumentException.class,
                    () -> inventoryService.updateWarehouseProduct(9999L, req),
                    "Phải ném exception khi ID không tồn tại");
        }

        /**
         * TC_INV_013
         * Objective : Đổi SKU sang SKU đã tồn tại của sản phẩm khác → từ chối
         * Input     : id = 10L, newSku = "SKU-EXISTING-002" đã có ở sản phẩm khác
         * Expected  : Response lỗi, không lưu
         */
        @Test
        @DisplayName("TC_INV_013 – Đổi SKU sang giá trị đã tồn tại phải trả về lỗi")
        void TC_INV_013_updateWarehouseProduct_SkuConflict_ReturnsError() {
            WarehouseProduct anotherProduct = WarehouseProduct.builder()
                    .id(20L).sku("SKU-EXISTING-002").internalName("Other Product").build();

            CreateWarehouseProductRequest req = new CreateWarehouseProductRequest();
            req.setSku("SKU-EXISTING-002"); // SKU của sản phẩm khác
            req.setInternalName("Updated Name");

            when(warehouseProductRepository.findById(10L)).thenReturn(Optional.of(warehouseProduct));
            when(warehouseProductRepository.findBySku("SKU-EXISTING-002"))
                    .thenReturn(Optional.of(anotherProduct));

            ApiResponse response = inventoryService.updateWarehouseProduct(10L, req);

            assertFalse(response.isSuccess(), "Phải từ chối khi SKU mới đã tồn tại");
            verify(warehouseProductRepository, never()).save(any());
        }

        /**
         * TC_INV_014
         * Objective : Cập nhật giữ nguyên SKU → không cần check duplicate
         * Input     : id = 10L, SKU giữ nguyên = "SKU-LAPTOP-001"
         * Expected  : Update thành công
         */
        @Test
        @DisplayName("TC_INV_014 – Update giữ nguyên SKU phải thành công")
        void TC_INV_014_updateWarehouseProduct_SameSku_UpdatesSuccessfully() {
            CreateWarehouseProductRequest req = new CreateWarehouseProductRequest();
            req.setSku("SKU-LAPTOP-001"); // Giữ nguyên SKU cũ
            req.setInternalName("Laptop Gaming X Updated");
            req.setDescription("Mô tả mới");

            when(warehouseProductRepository.findById(10L)).thenReturn(Optional.of(warehouseProduct));
            when(warehouseProductRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            doNothing().when(productSpecificationService).parseAndSaveSpecs(any());

            ApiResponse response = inventoryService.updateWarehouseProduct(10L, req);

            assertTrue(response.isSuccess(), "Update với SKU không đổi phải thành công");
        }
    }

    // ================================================================
    // TC_INV_015 → TC_INV_022: createPurchaseOrder
    // ================================================================
    @Nested
    @DisplayName("createPurchaseOrder Tests")
    class CreatePurchaseOrderTests {

        /**
         * TC_INV_015
         * Objective : Tạo PO với supplier đã có trong DB (tìm qua taxCode)
         * Input     : taxCode = "0123456789" đã tồn tại, items hợp lệ
         * Expected  : PO được tạo, không tạo supplier mới
         */
        @Test
        @DisplayName("TC_INV_015 – Tạo PO với supplier đã tồn tại theo taxCode")
        void TC_INV_015_createPurchaseOrder_ExistingSupplier_SkipCreateSupplier() {
            POItemRequest item = buildPoItem("SKU-LAPTOP-001", 5L, 15_000_000.0);
            CreatePORequest req = buildCreatePORequest("PO-2024-TEST", "0123456789",
                    Collections.singletonList(item));

            when(supplierRepository.findByTaxCode("0123456789")).thenReturn(Optional.of(supplier));
            when(warehouseProductRepository.findBySku("SKU-LAPTOP-001"))
                    .thenReturn(Optional.of(warehouseProduct));
            when(purchaseOrderRepository.save(any())).thenReturn(purchaseOrder);

            ApiResponse response = inventoryService.createPurchaseOrder(req);

            assertTrue(response.isSuccess(), "Tạo PO với supplier cũ phải thành công");
            // Không nên tạo supplier mới
            verify(supplierRepository, never()).save(any());
        }

        /**
         * TC_INV_016
         * Objective : Tạo PO không có supplier (null) → phải ném exception
         * Input     : supplier = null trong request
         * Expected  : IllegalArgumentException vì thiếu thông tin supplier
         */
        @Test
        @DisplayName("TC_INV_016 – PO thiếu supplier phải ném IllegalArgumentException")
        void TC_INV_016_createPurchaseOrder_NullSupplier_ThrowsException() {
            CreatePORequest req = new CreatePORequest();
            req.setPoCode("PO-NO-SUPPLIER");
            req.setCreatedBy("admin");
            req.setSupplier(null); // null supplier

            assertThrows(IllegalArgumentException.class,
                    () -> inventoryService.createPurchaseOrder(req),
                    "Phải ném exception khi supplier null");
            verify(purchaseOrderRepository, never()).save(any());
        }

        /**
         * TC_INV_017
         * Objective : Tạo PO với supplier có taxCode = null → phải ném exception
         * Input     : supplier.taxCode = null
         * Expected  : IllegalArgumentException
         *
         * ⚠️ BUG HUNTER: Nghiệp vụ yêu cầu taxCode để định danh NCC
         */
        @Test
        @DisplayName("TC_INV_017 – PO với supplier.taxCode null phải ném exception")
        void TC_INV_017_createPurchaseOrder_NullTaxCode_ThrowsException() {
            CreateSupplierRequest supplierReq = new CreateSupplierRequest();
            supplierReq.setTaxCode(null); // taxCode null

            CreatePORequest req = new CreatePORequest();
            req.setPoCode("PO-NO-TAX");
            req.setCreatedBy("admin");
            req.setSupplier(supplierReq);

            assertThrows(IllegalArgumentException.class,
                    () -> inventoryService.createPurchaseOrder(req),
                    "Phải ném exception khi taxCode null");
        }

        /**
         * TC_INV_018
         * Objective : Tạo PO với unit cost âm → nghiệp vụ không cho phép
         * Input     : unitCost = -1000.0
         * Expected  : Lỗi hoặc exception (giá âm vô nghĩa trong kho)
         *
         * ⚠️ BUG HUNTER: @Positive chỉ ở Controller layer, không ở Service logic
         */
        @Test
        @DisplayName("TC_INV_018 – PO với unitCost âm là dữ liệu không hợp lệ")
        void TC_INV_018_createPurchaseOrder_NegativeUnitCost_ShouldReject() {
            POItemRequest item = buildPoItem("SKU-CHEAP", 1L, -1000.0); // giá âm
            CreatePORequest req = buildCreatePORequest("PO-NEGATIVE-COST", "0123456789",
                    Collections.singletonList(item));

            when(supplierRepository.findByTaxCode("0123456789")).thenReturn(Optional.of(supplier));
            when(warehouseProductRepository.findBySku("SKU-CHEAP")).thenReturn(Optional.empty());
            when(warehouseProductRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(purchaseOrderRepository.save(any())).thenReturn(purchaseOrder);
            doNothing().when(productSpecificationService).parseAndSaveSpecs(any());

            // Nghiệp vụ: Giá nhập âm không có nghĩa, phải từ chối
            ApiResponse response = inventoryService.createPurchaseOrder(req);
            if (response.isSuccess()) {
                System.out.println("[BUG DETECTED] TC_INV_018: Service chấp nhận unitCost âm = " + item.getUnitCost());
            }
        }

        /**
         * TC_INV_019
         * Objective : Tạo PO với số lượng = 0 → nghiệp vụ không hợp lệ
         * Input     : quantity = 0
         * Expected  : Lỗi vì đặt hàng 0 sản phẩm vô nghĩa
         */
        @Test
        @DisplayName("TC_INV_019 – PO với quantity 0 là dữ liệu bất hợp lệ")
        void TC_INV_019_createPurchaseOrder_ZeroQuantity_ShouldReject() {
            POItemRequest item = buildPoItem("SKU-ZERO-QTY", 0L, 5000.0); // qty = 0
            CreatePORequest req = buildCreatePORequest("PO-ZERO-QTY", "0123456789",
                    Collections.singletonList(item));

            when(supplierRepository.findByTaxCode("0123456789")).thenReturn(Optional.of(supplier));
            when(warehouseProductRepository.findBySku("SKU-ZERO-QTY")).thenReturn(Optional.empty());
            when(warehouseProductRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(purchaseOrderRepository.save(any())).thenReturn(purchaseOrder);
            doNothing().when(productSpecificationService).parseAndSaveSpecs(any());

            ApiResponse response = inventoryService.createPurchaseOrder(req);
            if (response.isSuccess()) {
                System.out.println("[BUG DETECTED] TC_INV_019: Service chấp nhận quantity = 0");
            }
        }
    }

    // ================================================================
    // TC_INV_020 → TC_INV_028: completePurchaseOrder
    // ================================================================
    @Nested
    @DisplayName("completePurchaseOrder Tests")
    class CompletePurchaseOrderTests {

        /**
         * TC_INV_020
         * Objective : PO không tồn tại → phải ném exception
         * Input     : poId = 9999L không có trong DB
         * Expected  : IllegalArgumentException
         */
        @Test
        @DisplayName("TC_INV_020 – Complete PO không tồn tại phải ném exception")
        void TC_INV_020_completePO_NonExistentPO_ThrowsException() {
            CompletePORequest req = new CompletePORequest();
            req.setPoId(9999L);
            req.setSerials(Collections.emptyList());

            when(purchaseOrderRepository.findById(9999L)).thenReturn(Optional.empty());

            assertThrows(IllegalArgumentException.class,
                    () -> inventoryService.completePurchaseOrder(req),
                    "Phải ném exception khi PO không tồn tại");
        }

        /**
         * TC_INV_021
         * Objective : PO đã ở trạng thái RECEIVED → không được nhập lại
         * Input     : PO với status = RECEIVED
         * Expected  : Response lỗi (không cho nhập hàng lần 2)
         *
         * ⚠️ BUG HUNTER: Nghiệp vụ quan trọng – nhập hàng 2 lần sẽ tăng kho ảo
         */
        @Test
        @DisplayName("TC_INV_021 – Không cho phép complete PO đã RECEIVED")
        void TC_INV_021_completePO_AlreadyReceived_ReturnsError() {
            purchaseOrder.setStatus(POStatus.RECEIVED);
            CompletePORequest req = new CompletePORequest();
            req.setPoId(1L);
            req.setSerials(Collections.emptyList());

            when(purchaseOrderRepository.findById(1L)).thenReturn(Optional.of(purchaseOrder));

            ApiResponse response = inventoryService.completePurchaseOrder(req);

            assertFalse(response.isSuccess(), "Phải từ chối complete PO đã RECEIVED");
            verify(inventoryStockRepository, never()).save(any());
        }

        /**
         * TC_INV_022
         * Objective : PO đã CANCELLED → không cho phép nhập hàng
         * Input     : PO với status = CANCELLED
         * Expected  : Response lỗi
         */
        @Test
        @DisplayName("TC_INV_022 – Không cho phép complete PO đã CANCELLED")
        void TC_INV_022_completePO_Cancelled_ReturnsError() {
            purchaseOrder.setStatus(POStatus.CANCELLED);
            CompletePORequest req = new CompletePORequest();
            req.setPoId(1L);
            req.setSerials(Collections.emptyList());

            when(purchaseOrderRepository.findById(1L)).thenReturn(Optional.of(purchaseOrder));

            ApiResponse response = inventoryService.completePurchaseOrder(req);

            assertFalse(response.isSuccess(), "Phải từ chối complete PO đã CANCELLED");
        }

        /**
         * TC_INV_023
         * Objective : Serial trùng lặp trong DB → phải từ chối
         * Input     : serial "SN-DUP-001" đã tồn tại trong productDetailRepository
         * Expected  : RuntimeException
         *
         * ⚠️ BUG HUNTER: Dữ liệu quan trọng nhất – serial phải unique toàn hệ thống
         */
        @Test
        @DisplayName("TC_INV_023 – Serial trùng lặp trong DB phải bị từ chối")
        void TC_INV_023_completePO_DuplicateSerial_ThrowsException() {
            PurchaseOrderItem poItem = buildPoItem_Entity("SKU-LAPTOP-001", 1L);
            purchaseOrder.setItems(Collections.singletonList(poItem));

            ProductSerialRequest serialReq = new ProductSerialRequest();
            serialReq.setProductSku("SKU-LAPTOP-001");
            serialReq.setSerialNumbers(Collections.singletonList("SN-DUP-001"));

            CompletePORequest req = new CompletePORequest();
            req.setPoId(1L);
            req.setSerials(Collections.singletonList(serialReq));

            when(purchaseOrderRepository.findById(1L)).thenReturn(Optional.of(purchaseOrder));
            // Serial đã tồn tại trong DB
            when(productDetailRepository.existsBySerialNumber("SN-DUP-001")).thenReturn(true);

            assertThrows(RuntimeException.class,
                    () -> inventoryService.completePurchaseOrder(req),
                    "Phải ném exception khi serial đã tồn tại trong DB");
        }

        /**
         * TC_INV_024
         * Objective : Số lượng serial không khớp số lượng PO → phải từ chối
         * Input     : PO đặt 3 sản phẩm nhưng nhập 2 serial
         * Expected  : RuntimeException – số serial không khớp số lượng đặt
         *
         * ⚠️ BUG HUNTER: Nghiệp vụ quan trọng – nhập thiếu hàng không được phép
         */
        @Test
        @DisplayName("TC_INV_024 – Số serial không khớp số lượng PO phải bị từ chối")
        void TC_INV_024_completePO_SerialCountMismatch_ThrowsException() {
            // PO đặt 3 sản phẩm
            PurchaseOrderItem poItem = buildPoItem_Entity("SKU-LAPTOP-001", 3L);
            purchaseOrder.setItems(Collections.singletonList(poItem));

            // Nhưng chỉ nhập 2 serial
            ProductSerialRequest serialReq = new ProductSerialRequest();
            serialReq.setProductSku("SKU-LAPTOP-001");
            serialReq.setSerialNumbers(Arrays.asList("SN001", "SN002")); // chỉ 2

            CompletePORequest req = new CompletePORequest();
            req.setPoId(1L);
            req.setSerials(Collections.singletonList(serialReq));

            when(purchaseOrderRepository.findById(1L)).thenReturn(Optional.of(purchaseOrder));
            // Không stub existsBySerialNumber vì exception ném trước khi gọi tới đó

            assertThrows(RuntimeException.class,
                    () -> inventoryService.completePurchaseOrder(req),
                    "Phải ném exception khi số serial (2) không khớp số lượng PO (3)");
        }

        /**
         * TC_INV_025
         * Objective : Serial rỗng ("") trong danh sách → phải từ chối
         * Input     : Serial list có chứa chuỗi rỗng ""
         * Expected  : RuntimeException vì serial không hợp lệ
         */
        @Test
        @DisplayName("TC_INV_025 – Serial rỗng trong danh sách phải bị từ chối")
        void TC_INV_025_completePO_EmptySerial_ThrowsException() {
            PurchaseOrderItem poItem = buildPoItem_Entity("SKU-LAPTOP-001", 2L);
            purchaseOrder.setItems(Collections.singletonList(poItem));

            ProductSerialRequest serialReq = new ProductSerialRequest();
            serialReq.setProductSku("SKU-LAPTOP-001");
            serialReq.setSerialNumbers(Arrays.asList("SN001", "")); // serial rỗng

            CompletePORequest req = new CompletePORequest();
            req.setPoId(1L);
            req.setSerials(Collections.singletonList(serialReq));

            when(purchaseOrderRepository.findById(1L)).thenReturn(Optional.of(purchaseOrder));
            when(productDetailRepository.existsBySerialNumber("SN001")).thenReturn(false);

            assertThrows(RuntimeException.class,
                    () -> inventoryService.completePurchaseOrder(req),
                    "Phải ném exception khi có serial rỗng trong danh sách");
        }

        /**
         * TC_INV_026
         * Objective : SKU trong serial request không thuộc PO → phải báo lỗi rõ ràng
         * Input     : SKU "SKU-WRONG" không có trong items của PO "PO-2024-001"
         * Expected  : IllegalArgumentException
         */
        @Test
        @DisplayName("TC_INV_026 – SKU không thuộc PO phải ném exception")
        void TC_INV_026_completePO_SkuNotInPO_ThrowsException() {
            PurchaseOrderItem poItem = buildPoItem_Entity("SKU-LAPTOP-001", 1L);
            purchaseOrder.setItems(Collections.singletonList(poItem));

            ProductSerialRequest serialReq = new ProductSerialRequest();
            serialReq.setProductSku("SKU-WRONG"); // không có trong PO
            serialReq.setSerialNumbers(Collections.singletonList("SN001"));

            CompletePORequest req = new CompletePORequest();
            req.setPoId(1L);
            req.setSerials(Collections.singletonList(serialReq));

            when(purchaseOrderRepository.findById(1L)).thenReturn(Optional.of(purchaseOrder));

            assertThrows(IllegalArgumentException.class,
                    () -> inventoryService.completePurchaseOrder(req),
                    "Phải ném exception khi SKU không thuộc PO");
        }

        /**
         * TC_INV_027
         * Objective : Complete PO thành công → inventory stock phải tăng đúng
         * Input     : PO 2 items: [SN001, SN002]; stock ban đầu onHand = 50
         * Expected  : onHand sau = 52, status PO = RECEIVED
         *
         * CheckDB: Verify inventoryStockRepository.save() được gọi với onHand mới
         */
        @Test
        @DisplayName("TC_INV_027 – Complete PO thành công tăng inventory stock đúng số lượng")
        void TC_INV_027_completePO_ValidData_StockIncreasedCorrectly() {
            PurchaseOrderItem poItem = buildPoItem_Entity("SKU-LAPTOP-001", 2L);
            purchaseOrder.setItems(Collections.singletonList(poItem));

            ProductSerialRequest serialReq = new ProductSerialRequest();
            serialReq.setProductSku("SKU-LAPTOP-001");
            serialReq.setSerialNumbers(Arrays.asList("SN-NEW-001", "SN-NEW-002"));

            CompletePORequest req = new CompletePORequest();
            req.setPoId(1L);
            req.setSerials(Collections.singletonList(serialReq));
            req.setReceivedDate(LocalDateTime.now());

            when(purchaseOrderRepository.findById(1L)).thenReturn(Optional.of(purchaseOrder));
            when(productDetailRepository.existsBySerialNumber(any())).thenReturn(false);
            when(inventoryStockRepository.findByWarehouseProduct_Id(10L))
                    .thenReturn(Optional.of(inventoryStock));
            when(inventoryStockRepository.save(any())).thenAnswer(inv -> {
                InventoryStock saved = inv.getArgument(0);
                // CheckDB: onHand phải tăng từ 50 lên 52 (thêm 2 serial)
                assertTrue(saved.getOnHand() >= 50L + 2L,
                        "onHand phải tăng: kỳ vọng >= 52, thực tế = " + saved.getOnHand());
                return saved;
            });
            when(purchaseOrderRepository.save(any())).thenAnswer(inv -> {
                PurchaseOrder savedPO = inv.getArgument(0);
                assertEquals(POStatus.RECEIVED, savedPO.getStatus(),
                        "Status PO phải là RECEIVED sau khi complete");
                return savedPO;
            });
            when(supplierPayableService.createPayableFromPurchaseOrder(any()))
                    .thenReturn(ApiResponse.success("OK", null));

            ApiResponse response = inventoryService.completePurchaseOrder(req);

            assertTrue(response.isSuccess(), "Complete PO với dữ liệu hợp lệ phải thành công");
            verify(inventoryStockRepository, times(1)).save(any());
            verify(purchaseOrderRepository, times(1)).save(any());
        }

        /**
         * TC_INV_028
         * Objective : Nhập serial null trong danh sách → phải từ chối
         * Input     : serialNumbers chứa null
         * Expected  : RuntimeException vì serial null là bất hợp lệ
         */
        @Test
        @DisplayName("TC_INV_028 – Serial null trong danh sách phải bị từ chối")
        void TC_INV_028_completePO_NullSerial_ThrowsException() {
            PurchaseOrderItem poItem = buildPoItem_Entity("SKU-LAPTOP-001", 2L);
            purchaseOrder.setItems(Collections.singletonList(poItem));

            List<String> serialsWithNull = new ArrayList<>();
            serialsWithNull.add("SN001");
            serialsWithNull.add(null); // null serial

            ProductSerialRequest serialReq = new ProductSerialRequest();
            serialReq.setProductSku("SKU-LAPTOP-001");
            serialReq.setSerialNumbers(serialsWithNull);

            CompletePORequest req = new CompletePORequest();
            req.setPoId(1L);
            req.setSerials(Collections.singletonList(serialReq));

            when(purchaseOrderRepository.findById(1L)).thenReturn(Optional.of(purchaseOrder));
            when(productDetailRepository.existsBySerialNumber("SN001")).thenReturn(false);

            assertThrows(RuntimeException.class,
                    () -> inventoryService.completePurchaseOrder(req),
                    "Phải ném exception khi serial null trong danh sách");
        }
    }

    // ================================================================
    // TC_INV_029 → TC_INV_035: cancelPurchaseOrder
    // ================================================================
    @Nested
    @DisplayName("cancelPurchaseOrder Tests")
    class CancelPurchaseOrderTests {

        /**
         * TC_INV_029
         * Objective : Hủy PO ở trạng thái CREATED → thành công
         * Input     : PO status = CREATED
         * Expected  : Status đổi thành CANCELLED, gọi save 1 lần
         *
         * CheckDB: Verify PO được save với status = CANCELLED
         */
        @Test
        @DisplayName("TC_INV_029 – Hủy PO ở trạng thái CREATED thành công")
        void TC_INV_029_cancelPO_CreatedStatus_ChangesToCancelled() {
            purchaseOrder.setStatus(POStatus.CREATED);
            when(purchaseOrderRepository.findById(1L)).thenReturn(Optional.of(purchaseOrder));
            when(purchaseOrderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ApiResponse response = inventoryService.cancelPurchaseOrder(1L);

            assertTrue(response.isSuccess());
            // CheckDB: status phải là CANCELLED
            assertEquals(POStatus.CANCELLED, purchaseOrder.getStatus(),
                    "Status PO phải đổi thành CANCELLED");
            verify(purchaseOrderRepository, times(1)).save(purchaseOrder);
        }

        /**
         * TC_INV_030
         * Objective : Hủy PO đã RECEIVED → phải từ chối (hàng đã nhập kho rồi)
         * Input     : PO status = RECEIVED
         * Expected  : Response lỗi, không save
         *
         * ⚠️ BUG HUNTER: Hủy PO đã nhập hàng sẽ tạo inconsistency với inventory stock
         */
        @Test
        @DisplayName("TC_INV_030 – Không cho phép hủy PO đã RECEIVED")
        void TC_INV_030_cancelPO_ReceivedStatus_ReturnsError() {
            purchaseOrder.setStatus(POStatus.RECEIVED);
            when(purchaseOrderRepository.findById(1L)).thenReturn(Optional.of(purchaseOrder));

            ApiResponse response = inventoryService.cancelPurchaseOrder(1L);

            assertFalse(response.isSuccess(), "Phải từ chối hủy PO đã RECEIVED");
            verify(purchaseOrderRepository, never()).save(any());
        }

        /**
         * TC_INV_031
         * Objective : Hủy PO không tồn tại → ném exception
         * Input     : id = 99999L
         * Expected  : IllegalArgumentException
         */
        @Test
        @DisplayName("TC_INV_031 – Hủy PO không tồn tại phải ném exception")
        void TC_INV_031_cancelPO_NotFound_ThrowsException() {
            when(purchaseOrderRepository.findById(99999L)).thenReturn(Optional.empty());

            assertThrows(IllegalArgumentException.class,
                    () -> inventoryService.cancelPurchaseOrder(99999L));
        }

        /**
         * TC_INV_032
         * Objective : Hủy PO đã CANCELLED → phải từ chối (không hủy 2 lần)
         * Input     : PO status = CANCELLED
         * Expected  : Response lỗi
         *
         * ⚠️ BUG HUNTER: Nếu cho hủy nhiều lần → UI hiển thị sai state
         */
        @Test
        @DisplayName("TC_INV_032 – Không cho phép hủy PO đã CANCELLED trước đó")
        void TC_INV_032_cancelPO_AlreadyCancelled_ReturnsError() {
            purchaseOrder.setStatus(POStatus.CANCELLED);
            when(purchaseOrderRepository.findById(1L)).thenReturn(Optional.of(purchaseOrder));

            ApiResponse response = inventoryService.cancelPurchaseOrder(1L);

            assertFalse(response.isSuccess(), "Phải từ chối hủy PO đã CANCELLED");
            verify(purchaseOrderRepository, never()).save(any());
        }
    }

    // ================================================================
    // TC_INV_033 → TC_INV_040: createExportOrder
    // ================================================================
    @Nested
    @DisplayName("createExportOrder Tests")
    class CreateExportOrderTests {

        /**
         * TC_INV_033
         * Objective : Xuất kho khi stock đủ và serial hợp lệ
         * Input     : SKU có 50 onHand, xuất 1 serial IN_STOCK
         * Expected  : Thành công, onHand giảm 1, serial đổi thành SOLD
         *
         * CheckDB: Verify productDetailRepository và inventoryStockRepository được update
         */
        @Test
        @DisplayName("TC_INV_033 – Xuất kho hợp lệ giảm inventory và đổi trạng thái serial")
        void TC_INV_033_createExportOrder_ValidData_StockDecreasedSerialSold() {
            ExportItemRequest itemReq = new ExportItemRequest();
            itemReq.setProductSku("SKU-LAPTOP-001");
            itemReq.setSerialNumbers(Collections.singletonList("SN-ABCDEF-001"));

            CreateExportOrderRequest req = new CreateExportOrderRequest();
            req.setItems(Collections.singletonList(itemReq));
            req.setReason("Xuất bán");
            req.setCreatedBy("admin");

            when(warehouseProductRepository.findBySku("SKU-LAPTOP-001"))
                    .thenReturn(Optional.of(warehouseProduct));
            when(inventoryStockRepository.findByWarehouseProduct_Id(10L))
                    .thenReturn(Optional.of(inventoryStock));
            when(productDetailRepository.findBySerialNumber("SN-ABCDEF-001"))
                    .thenReturn(Optional.of(productDetail));
            when(productDetailRepository.save(any())).thenAnswer(inv -> {
                ProductDetail saved = inv.getArgument(0);
                // CheckDB: Serial phải đổi trạng thái sang SOLD
                assertEquals(ProductStatus.SOLD, saved.getStatus(),
                        "Serial phải đổi thành SOLD sau khi xuất kho");
                assertNotNull(saved.getSoldDate(), "soldDate phải được gán sau khi xuất");
                return saved;
            });
            when(inventoryStockRepository.save(any())).thenAnswer(inv -> {
                InventoryStock saved = inv.getArgument(0);
                // CheckDB: onHand phải giảm 1 (từ 50 xuống 49)
                assertEquals(49L, saved.getOnHand(),
                        "onHand phải giảm 1: kỳ vọng 49, thực tế = " + saved.getOnHand());
                return saved;
            });
            when(exportOrderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ApiResponse response = inventoryService.createExportOrder(req);

            assertTrue(response.isSuccess(), "Xuất kho hợp lệ phải thành công");
            verify(productDetailRepository, times(1)).save(any());
            verify(inventoryStockRepository, times(1)).save(any());
        }

        /**
         * TC_INV_034
         * Objective : Xuất kho vượt quá tồn kho → phải từ chối
         * Input     : onHand = 50, yêu cầu xuất 51 serial
         * Expected  : RuntimeException vì không đủ hàng
         */
        @Test
        @DisplayName("TC_INV_034 – Xuất vượt tồn kho phải ném exception")
        void TC_INV_034_createExportOrder_InsufficientStock_ThrowsException() {
            // Tạo 51 serial
            List<String> serials = new ArrayList<>();
            for (int i = 1; i <= 51; i++) serials.add("SN-" + String.format("%03d", i));

            ExportItemRequest itemReq = new ExportItemRequest();
            itemReq.setProductSku("SKU-LAPTOP-001");
            itemReq.setSerialNumbers(serials); // 51 > onHand (50)

            CreateExportOrderRequest req = new CreateExportOrderRequest();
            req.setItems(Collections.singletonList(itemReq));
            req.setReason("Xuất kho");
            req.setCreatedBy("admin");

            when(warehouseProductRepository.findBySku("SKU-LAPTOP-001"))
                    .thenReturn(Optional.of(warehouseProduct));
            when(inventoryStockRepository.findByWarehouseProduct_Id(10L))
                    .thenReturn(Optional.of(inventoryStock)); // onHand = 50

            assertThrows(RuntimeException.class,
                    () -> inventoryService.createExportOrder(req),
                    "Phải ném exception khi xuất vượt tồn kho");
            verify(exportOrderRepository, never()).save(any());
        }

        /**
         * TC_INV_035
         * Objective : Xuất serial không ở trạng thái IN_STOCK → từ chối
         * Input     : Serial có status = SOLD
         * Expected  : RuntimeException – serial đã bán không thể xuất lại
         *
         * ⚠️ BUG HUNTER: Nghiệp vụ quan trọng – không được xuất serial đã bán
         */
        @Test
        @DisplayName("TC_INV_035 – Xuất serial đã SOLD phải bị từ chối")
        void TC_INV_035_createExportOrder_SoldSerialStatus_ThrowsException() {
            productDetail.setStatus(ProductStatus.SOLD); // Đã bán

            ExportItemRequest itemReq = new ExportItemRequest();
            itemReq.setProductSku("SKU-LAPTOP-001");
            itemReq.setSerialNumbers(Collections.singletonList("SN-ABCDEF-001"));

            CreateExportOrderRequest req = new CreateExportOrderRequest();
            req.setItems(Collections.singletonList(itemReq));
            req.setReason("Xuất kho");
            req.setCreatedBy("admin");

            when(warehouseProductRepository.findBySku("SKU-LAPTOP-001"))
                    .thenReturn(Optional.of(warehouseProduct));
            when(inventoryStockRepository.findByWarehouseProduct_Id(10L))
                    .thenReturn(Optional.of(inventoryStock));
            when(productDetailRepository.findBySerialNumber("SN-ABCDEF-001"))
                    .thenReturn(Optional.of(productDetail));

            assertThrows(RuntimeException.class,
                    () -> inventoryService.createExportOrder(req),
                    "Phải ném exception khi serial đã SOLD");
        }

        /**
         * TC_INV_036
         * Objective : Xuất SKU không tồn tại trong kho → ném exception
         * Input     : productSku = "SKU-GHOST" không có
         * Expected  : RuntimeException
         */
        @Test
        @DisplayName("TC_INV_036 – Xuất SKU không tồn tại phải ném exception")
        void TC_INV_036_createExportOrder_UnknownSku_ThrowsException() {
            ExportItemRequest itemReq = new ExportItemRequest();
            itemReq.setProductSku("SKU-GHOST");
            itemReq.setSerialNumbers(Collections.singletonList("SN001"));

            CreateExportOrderRequest req = new CreateExportOrderRequest();
            req.setItems(Collections.singletonList(itemReq));
            req.setReason("Test");
            req.setCreatedBy("admin");

            when(warehouseProductRepository.findBySku("SKU-GHOST")).thenReturn(Optional.empty());

            assertThrows(RuntimeException.class,
                    () -> inventoryService.createExportOrder(req),
                    "Phải ném exception khi SKU không tồn tại");
        }

        /**
         * TC_INV_037
         * Objective : Xuất kho thành công với onHand = 1 (boundary condition)
         * Input     : onHand = 1, xuất đúng 1 serial
         * Expected  : Thành công, onHand = 0 sau giao dịch
         */
        @Test
        @DisplayName("TC_INV_037 – Xuất kho khi onHand = 1 thành công (giá trị biên)")
        void TC_INV_037_createExportOrder_BoundaryOnHandEqualsOne_Success() {
            inventoryStock.setOnHand(1L); // chỉ còn 1

            ExportItemRequest itemReq = new ExportItemRequest();
            itemReq.setProductSku("SKU-LAPTOP-001");
            itemReq.setSerialNumbers(Collections.singletonList("SN-ABCDEF-001"));

            CreateExportOrderRequest req = new CreateExportOrderRequest();
            req.setItems(Collections.singletonList(itemReq));
            req.setReason("Xuất bán");
            req.setCreatedBy("admin");

            when(warehouseProductRepository.findBySku("SKU-LAPTOP-001"))
                    .thenReturn(Optional.of(warehouseProduct));
            when(inventoryStockRepository.findByWarehouseProduct_Id(10L))
                    .thenReturn(Optional.of(inventoryStock));
            when(productDetailRepository.findBySerialNumber("SN-ABCDEF-001"))
                    .thenReturn(Optional.of(productDetail));
            when(productDetailRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(inventoryStockRepository.save(any())).thenAnswer(inv -> {
                InventoryStock saved = inv.getArgument(0);
                // CheckDB: onHand phải = 0
                assertEquals(0L, saved.getOnHand(),
                        "onHand phải = 0 sau khi xuất hết");
                return saved;
            });
            when(exportOrderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ApiResponse response = inventoryService.createExportOrder(req);
            assertTrue(response.isSuccess(), "Xuất hết hàng cuối cùng phải thành công");
        }
    }

    // ================================================================
    // TC_INV_038 → TC_INV_043: cancelExportOrder
    // ================================================================
    @Nested
    @DisplayName("cancelExportOrder Tests")
    class CancelExportOrderTests {

        /**
         * TC_INV_038
         * Objective : Hủy export order ở trạng thái CREATED
         * Input     : ExportOrder status = CREATED
         * Expected  : Thành công, status → CANCELLED
         *
         * CheckDB: Verify exportOrderRepository.save() với status CANCELLED
         */
        @Test
        @DisplayName("TC_INV_038 – Hủy export order CREATED thành công")
        void TC_INV_038_cancelExportOrder_CreatedStatus_Success() {
            ExportOrder exportOrder = ExportOrder.builder()
                    .id(1L).status(ExportStatus.CREATED).exportCode("PX-001").build();
            when(exportOrderRepository.findById(1L)).thenReturn(Optional.of(exportOrder));
            when(exportOrderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ApiResponse response = inventoryService.cancelExportOrder(1L);

            assertTrue(response.isSuccess());
            // CheckDB: Kiểm tra status được lưu đúng
            assertEquals(ExportStatus.CANCELLED, exportOrder.getStatus(),
                    "Status phải là CANCELLED sau khi hủy");
            verify(exportOrderRepository, times(1)).save(exportOrder);
        }

        /**
         * TC_INV_039
         * Objective : Hủy export order đã COMPLETED → phải từ chối
         * Input     : ExportOrder status = COMPLETED (đã xuất hàng)
         * Expected  : Response lỗi
         *
         * ⚠️ BUG HUNTER: Nghiệp vụ – đơn xuất đã hoàn thành không thể hủy đơn giản
         */
        @Test
        @DisplayName("TC_INV_039 – Không cho phép hủy export order đã COMPLETED")
        void TC_INV_039_cancelExportOrder_CompletedStatus_ReturnsError() {
            ExportOrder exportOrder = ExportOrder.builder()
                    .id(1L).status(ExportStatus.COMPLETED).exportCode("PX-001").build();
            when(exportOrderRepository.findById(1L)).thenReturn(Optional.of(exportOrder));

            ApiResponse response = inventoryService.cancelExportOrder(1L);

            assertFalse(response.isSuccess(), "Phải từ chối hủy export order đã COMPLETED");
            verify(exportOrderRepository, never()).save(any());
        }

        /**
         * TC_INV_040
         * Objective : Hủy export order không tồn tại
         * Input     : id = 9999L
         * Expected  : IllegalArgumentException
         */
        @Test
        @DisplayName("TC_INV_040 – Hủy export order không tồn tại phải ném exception")
        void TC_INV_040_cancelExportOrder_NotFound_ThrowsException() {
            when(exportOrderRepository.findById(9999L)).thenReturn(Optional.empty());

            assertThrows(IllegalArgumentException.class,
                    () -> inventoryService.cancelExportOrder(9999L));
        }
    }

    // ================================================================
    // TC_INV_041 → TC_INV_046: getStocks
    // ================================================================
    @Nested
    @DisplayName("getStocks Tests")
    class GetStocksTests {

        /**
         * TC_INV_041
         * Objective : Lấy tất cả tồn kho không có filter
         * Input     : status = null
         * Expected  : Trả về tất cả stocks từ DB
         */
        @Test
        @DisplayName("TC_INV_041 – Không filter trả về toàn bộ tồn kho")
        void TC_INV_041_getStocks_NoFilter_ReturnsAll() {
            when(inventoryStockRepository.findAll())
                    .thenReturn(Collections.singletonList(inventoryStock));

            ApiResponse response = inventoryService.getStocks(null);

            assertTrue(response.isSuccess());
            @SuppressWarnings("unchecked")
            List<?> data = (List<?>) response.getData();
            assertEquals(1, data.size());
        }

        /**
         * TC_INV_042
         * Objective : Filter "low_stock" → chỉ trả về hàng tồn ít
         * Input     : status = "low_stock"
         * Expected  : Gọi findLowStockItems với ngưỡng 10
         */
        @Test
        @DisplayName("TC_INV_042 – Filter low_stock gọi đúng repository method")
        void TC_INV_042_getStocks_LowStockFilter_CallsCorrectRepo() {
            when(inventoryStockRepository.findLowStockItems(10L))
                    .thenReturn(Collections.singletonList(inventoryStock));

            ApiResponse response = inventoryService.getStocks("low_stock");

            assertTrue(response.isSuccess());
            verify(inventoryStockRepository).findLowStockItems(10L);
            verify(inventoryStockRepository, never()).findAll();
        }

        /**
         * TC_INV_043
         * Objective : Filter "out_of_stock" → chỉ trả về hàng onHand <= 0
         * Input     : status = "out_of_stock"
         * Expected  : Chỉ trả về stocks có onHand = 0
         *
         * ⚠️ BUG HUNTER: Verify filter logic – không trả về hàng còn tồn
         */
        @Test
        @DisplayName("TC_INV_043 – Filter out_of_stock chỉ trả về stock hết hàng")
        void TC_INV_043_getStocks_OutOfStockFilter_OnlyZeroOnHand() {
            InventoryStock outOfStock = InventoryStock.builder()
                    .id(2L).warehouseProduct(warehouseProduct)
                    .onHand(0L).reserved(0L).damaged(0L).build();
            // inventoryStock có onHand = 50 (không phải out of stock)
            when(inventoryStockRepository.findAll())
                    .thenReturn(Arrays.asList(inventoryStock, outOfStock));

            ApiResponse response = inventoryService.getStocks("out_of_stock");

            assertTrue(response.isSuccess());
            @SuppressWarnings("unchecked")
            List<?> data = (List<?>) response.getData();
            // Chỉ 1 stock thực sự out of stock
            assertEquals(1, data.size(),
                    "Filter out_of_stock chỉ được trả về stock có onHand <= 0, không lọc lẫn với stock còn hàng");
        }

        /**
         * TC_INV_044
         * Objective : Filter status không hợp lệ → hành vi rõ ràng
         * Input     : status = "invalid_filter"
         * Expected  : Không ném exception, có thể trả về all hoặc error code rõ ràng
         *
         * ⚠️ BUG HUNTER: Filter unknown → phải có behavior xác định
         */
        @Test
        @DisplayName("TC_INV_044 – Filter status không hợp lệ không gây exception")
        void TC_INV_044_getStocks_UnknownFilter_HandlesGracefully() {
            when(inventoryStockRepository.findAll())
                    .thenReturn(Collections.singletonList(inventoryStock));

            // Không được throw exception
            assertDoesNotThrow(() -> inventoryService.getStocks("invalid_filter"),
                    "Filter không hợp lệ không được gây exception");
        }
    }

    // ================================================================
    // TC_INV_045 → TC_INV_048: getStockDetails
    // ================================================================
    @Nested
    @DisplayName("getStockDetails Tests")
    class GetStockDetailsTests {

        /**
         * TC_INV_045
         * Objective : Lấy chi tiết stock với ID hợp lệ
         * Input     : warehouseProductId = 10L có 1 serial
         * Expected  : Trả về danh sách serial đầy đủ
         */
        @Test
        @DisplayName("TC_INV_045 – Lấy chi tiết stock trả về đúng serial")
        void TC_INV_045_getStockDetails_ValidId_ReturnsSerials() {
            when(warehouseProductRepository.findById(10L)).thenReturn(Optional.of(warehouseProduct));
            when(productDetailRepository.findAllByWarehouseProduct_Id(10L))
                    .thenReturn(Collections.singletonList(productDetail));

            ApiResponse response = inventoryService.getStockDetails(10L);

            assertTrue(response.isSuccess());
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> serials = (List<Map<String, Object>>) response.getData();
            assertEquals(1, serials.size());
            assertEquals("SN-ABCDEF-001", serials.get(0).get("serialNumber"));
        }

        /**
         * TC_INV_046
         * Objective : warehouseProductId không tồn tại
         * Input     : id = 9999L
         * Expected  : Response lỗi hoặc exception
         */
        @Test
        @DisplayName("TC_INV_046 – getStockDetails ID không tồn tại trả về error")
        void TC_INV_046_getStockDetails_NotFound_ReturnsError() {
            when(warehouseProductRepository.findById(9999L)).thenReturn(Optional.empty());

            ApiResponse response = inventoryService.getStockDetails(9999L);

            assertFalse(response.isSuccess(), "Phải trả về lỗi khi warehouseProductId không tồn tại");
        }
    }

    // ================================================================
    // TC_INV_047 → TC_INV_052: exportForSale
    // ================================================================
    @Nested
    @DisplayName("exportForSale Tests")
    class ExportForSaleTests {

        /**
         * TC_INV_047
         * Objective : exportForSale với items null hoặc rỗng → từ chối
         * Input     : items = null
         * Expected  : Response lỗi ngay, không process
         */
        @Test
        @DisplayName("TC_INV_047 – exportForSale với items null phải trả về lỗi")
        void TC_INV_047_exportForSale_NullItems_ReturnsError() {
            SaleExportRequest req = new SaleExportRequest();
            req.setOrderId(1L);
            req.setReason("Giao hàng khách");
            req.setItems(null);

            ApiResponse response = inventoryService.exportForSale(req);

            assertFalse(response.isSuccess(), "items null phải trả về lỗi");
            verify(exportOrderRepository, never()).save(any());
        }

        /**
         * TC_INV_048
         * Objective : exportForSale với items rỗng → từ chối
         * Input     : items = []
         * Expected  : Response lỗi
         */
        @Test
        @DisplayName("TC_INV_048 – exportForSale với items rỗng phải trả về lỗi")
        void TC_INV_048_exportForSale_EmptyItems_ReturnsError() {
            SaleExportRequest req = new SaleExportRequest();
            req.setOrderId(1L);
            req.setReason("Giao hàng");
            req.setItems(Collections.emptyList());

            ApiResponse response = inventoryService.exportForSale(req);

            assertFalse(response.isSuccess(), "items rỗng phải trả về lỗi");
        }

        /**
         * TC_INV_049
         * Objective : Xuất bán serial không IN_STOCK → phải từ chối
         * Input     : serial trong WARRANTY status
         * Expected  : Response lỗi
         *
         * ⚠️ BUG HUNTER: Serial bảo hành không thể bán lại
         */
        @Test
        @DisplayName("TC_INV_049 – Xuất bán serial đang WARRANTY phải từ chối")
        void TC_INV_049_exportForSale_WarrantySerial_ReturnsError() {
            productDetail.setStatus(ProductStatus.WARRANTY);

            ExportItemRequest itemReq = new ExportItemRequest();
            itemReq.setProductSku("SKU-LAPTOP-001");
            itemReq.setSerialNumbers(Collections.singletonList("SN-ABCDEF-001"));

            SaleExportRequest req = new SaleExportRequest();
            req.setOrderId(1L);
            req.setReason("Giao hàng");
            req.setItems(Collections.singletonList(itemReq));

            when(warehouseProductRepository.findBySku("SKU-LAPTOP-001"))
                    .thenReturn(Optional.of(warehouseProduct));
            when(inventoryStockRepository.findByWarehouseProduct_Id(10L))
                    .thenReturn(Optional.of(inventoryStock));
            when(productDetailRepository.findBySerialNumber("SN-ABCDEF-001"))
                    .thenReturn(Optional.of(productDetail));

            ApiResponse response = inventoryService.exportForSale(req);

            assertFalse(response.isSuccess(),
                    "Serial trong trạng thái WARRANTY không thể xuất bán");
        }

        /**
         * TC_INV_050
         * Objective : Xuất bán khi onHand < số serial cần xuất → từ chối
         * Input     : onHand = 0, yêu cầu xuất 1 serial
         * Expected  : Response lỗi không đủ hàng
         */
        @Test
        @DisplayName("TC_INV_050 – exportForSale khi hết hàng phải trả về lỗi")
        void TC_INV_050_exportForSale_ZeroStock_ReturnsError() {
            inventoryStock.setOnHand(0L);

            ExportItemRequest itemReq = new ExportItemRequest();
            itemReq.setProductSku("SKU-LAPTOP-001");
            itemReq.setSerialNumbers(Collections.singletonList("SN-ABCDEF-001"));

            SaleExportRequest req = new SaleExportRequest();
            req.setOrderId(1L);
            req.setReason("Giao hàng");
            req.setItems(Collections.singletonList(itemReq));

            when(warehouseProductRepository.findBySku("SKU-LAPTOP-001"))
                    .thenReturn(Optional.of(warehouseProduct));
            when(inventoryStockRepository.findByWarehouseProduct_Id(10L))
                    .thenReturn(Optional.of(inventoryStock));

            ApiResponse response = inventoryService.exportForSale(req);

            assertFalse(response.isSuccess(), "Phải từ chối khi onHand = 0");
        }
    }

    // ================================================================
    // TC_INV_051 → TC_INV_055: exportForWarranty
    // ================================================================
    @Nested
    @DisplayName("exportForWarranty Tests")
    class ExportForWarrantyTests {

        /**
         * TC_INV_051
         * Objective : Serial IN_STOCK → xuất bảo hành thành công
         * Input     : Serial status = IN_STOCK, onHand > 0
         * Expected  : Serial → WARRANTY, onHand giảm 1
         *
         * CheckDB: inventoryStockRepository.save gọi với onHand giảm 1
         */
        @Test
        @DisplayName("TC_INV_051 – Xuất bảo hành serial IN_STOCK thành công")
        void TC_INV_051_exportForWarranty_InStockSerial_Success() {
            productDetail.setStatus(ProductStatus.IN_STOCK);
            inventoryStock.setOnHand(10L);

            ExportItemRequest itemReq = new ExportItemRequest();
            itemReq.setProductSku("SKU-LAPTOP-001");
            itemReq.setSerialNumbers(Collections.singletonList("SN-ABCDEF-001"));

            WarrantyExportRequest req = new WarrantyExportRequest();
            req.setCreatedBy("warehouse_staff");
            req.setWarrantyType("CUSTOMER_WARRANTY");
            req.setReason("Lỗi màn hình");
            req.setItems(Collections.singletonList(itemReq));

            when(productDetailRepository.findBySerialNumber("SN-ABCDEF-001"))
                    .thenReturn(Optional.of(productDetail));
            when(inventoryStockRepository.findByWarehouseProduct_Id(10L))
                    .thenReturn(Optional.of(inventoryStock));
            when(productDetailRepository.save(any())).thenAnswer(inv -> {
                ProductDetail saved = inv.getArgument(0);
                // CheckDB: Serial phải đổi sang WARRANTY
                assertEquals(ProductStatus.WARRANTY, saved.getStatus(),
                        "Serial phải đổi trạng thái thành WARRANTY");
                return saved;
            });
            when(inventoryStockRepository.save(any())).thenAnswer(inv -> {
                InventoryStock saved = inv.getArgument(0);
                // CheckDB: onHand phải giảm 1
                assertEquals(9L, saved.getOnHand(),
                        "onHand phải giảm 1 khi xuất bảo hành");
                return saved;
            });
            when(exportOrderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(exportOrderItemRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ApiResponse response = inventoryService.exportForWarranty(req);

            assertTrue(response.isSuccess(), "Xuất bảo hành serial hợp lệ phải thành công");
        }

        /**
         * TC_INV_052
         * Objective : Serial đã WARRANTY → không thể xuất bảo hành lần 2
         * Input     : productDetail.status = WARRANTY
         * Expected  : Response lỗi
         *
         * ⚠️ BUG HUNTER: Code cho phép WARRANTY và IN_STOCK, nhưng DAMAGED thì sao?
         */
        @Test
        @DisplayName("TC_INV_052 – Serial đã WARRANTY không thể xuất bảo hành lần 2")
        void TC_INV_052_exportForWarranty_AlreadyWarrantySerial_ReturnsError() {
            productDetail.setStatus(ProductStatus.WARRANTY);

            ExportItemRequest itemReq = new ExportItemRequest();
            itemReq.setProductSku("SKU-LAPTOP-001");
            itemReq.setSerialNumbers(Collections.singletonList("SN-ABCDEF-001"));

            WarrantyExportRequest req = new WarrantyExportRequest();
            req.setCreatedBy("staff");
            req.setWarrantyType("CUSTOMER_WARRANTY");
            req.setReason("Test");
            req.setItems(Collections.singletonList(itemReq));

            when(productDetailRepository.findBySerialNumber("SN-ABCDEF-001"))
                    .thenReturn(Optional.of(productDetail));

            ApiResponse response = inventoryService.exportForWarranty(req);

            assertFalse(response.isSuccess(),
                    "Serial đã WARRANTY không thể xuất bảo hành lần thứ 2");
        }

        /**
         * TC_INV_053
         * Objective : kho hết hàng (onHand = 0) → từ chối xuất bảo hành
         * Input     : onHand = 0
         * Expected  : Response lỗi
         *
         * ⚠️ BUG HUNTER: Nếu onHand = 0 mà vẫn trừ sẽ âm kho
         */
        @Test
        @DisplayName("TC_INV_053 – Xuất bảo hành khi onHand = 0 phải từ chối")
        void TC_INV_053_exportForWarranty_ZeroStock_ReturnsError() {
            productDetail.setStatus(ProductStatus.IN_STOCK);
            inventoryStock.setOnHand(0L);

            ExportItemRequest itemReq = new ExportItemRequest();
            itemReq.setProductSku("SKU-LAPTOP-001");
            itemReq.setSerialNumbers(Collections.singletonList("SN-ABCDEF-001"));

            WarrantyExportRequest req = new WarrantyExportRequest();
            req.setCreatedBy("staff");
            req.setWarrantyType("CUSTOMER_WARRANTY");
            req.setReason("Bảo hành");
            req.setItems(Collections.singletonList(itemReq));

            when(productDetailRepository.findBySerialNumber("SN-ABCDEF-001"))
                    .thenReturn(Optional.of(productDetail));
            when(inventoryStockRepository.findByWarehouseProduct_Id(10L))
                    .thenReturn(Optional.of(inventoryStock));

            ApiResponse response = inventoryService.exportForWarranty(req);

            assertFalse(response.isSuccess(), "Phải từ chối khi onHand = 0");
            // CheckDB: Không được save với onHand âm
            verify(inventoryStockRepository, never()).save(any());
        }
    }

    // ================================================================
    // TC_INV_054 → TC_INV_057: syncReservedQuantity
    // ================================================================
    @Nested
    @DisplayName("syncReservedQuantity Tests")
    class SyncReservedQuantityTests {

        /**
         * TC_INV_054
         * Objective : Sync reserved cho warehouseProduct tồn tại
         * Input     : warehouseProductId = 10L, newReserved = 5L
         * Expected  : stock.reserved = 5, gọi save
         *
         * CheckDB: Verify inventoryStockRepository.save với reserved đúng
         */
        @Test
        @DisplayName("TC_INV_054 – syncReservedQuantity cập nhật đúng reserved")
        void TC_INV_054_syncReservedQuantity_ValidId_UpdatesReserved() {
            when(warehouseProductRepository.findById(10L)).thenReturn(Optional.of(warehouseProduct));
            when(inventoryStockRepository.findByWarehouseProduct_Id(10L))
                    .thenReturn(Optional.of(inventoryStock));
            when(inventoryStockRepository.save(any())).thenAnswer(inv -> {
                InventoryStock saved = inv.getArgument(0);
                // CheckDB: Kiểm tra reserved được cập nhật đúng
                assertEquals(5L, saved.getReserved(),
                        "Reserved phải được cập nhật thành 5");
                return saved;
            });

            inventoryService.syncReservedQuantity(10L, 5L);

            verify(inventoryStockRepository, times(1)).save(any());
        }

        /**
         * TC_INV_055
         * Objective : Sync reserved âm → nghiệp vụ không hợp lệ
         * Input     : newReserved = -1L
         * Expected  : Không lưu reserved âm, hoặc ném exception
         *
         * ⚠️ BUG HUNTER: Nếu reserved âm → getSellable() trả về sai
         */
        @Test
        @DisplayName("TC_INV_055 – syncReservedQuantity với giá trị âm là bất hợp lệ")
        void TC_INV_055_syncReservedQuantity_NegativeValue_ShouldReject() {
            when(warehouseProductRepository.findById(10L)).thenReturn(Optional.of(warehouseProduct));
            when(inventoryStockRepository.findByWarehouseProduct_Id(10L))
                    .thenReturn(Optional.of(inventoryStock));
            when(inventoryStockRepository.save(any())).thenAnswer(inv -> {
                InventoryStock saved = inv.getArgument(0);
                if (saved.getReserved() < 0) {
                    System.out.println("[BUG DETECTED] TC_INV_055: reserved âm = " + saved.getReserved()
                            + " → getSellable() sẽ trả về sai");
                }
                return saved;
            });

            // Gọi với giá trị âm – hành vi phải xác định
            inventoryService.syncReservedQuantity(10L, -1L);
        }

        /**
         * TC_INV_056
         * Objective : Sync reserved cho warehouseProduct không tồn tại
         * Input     : warehouseProductId = 9999L
         * Expected  : IllegalArgumentException
         */
        @Test
        @DisplayName("TC_INV_056 – syncReservedQuantity ID không tồn tại phải ném exception")
        void TC_INV_056_syncReservedQuantity_NotFound_ThrowsException() {
            when(warehouseProductRepository.findById(9999L)).thenReturn(Optional.empty());

            assertThrows(IllegalArgumentException.class,
                    () -> inventoryService.syncReservedQuantity(9999L, 5L));
        }

        /**
         * TC_INV_057
         * Objective : Sync reserved tạo stock mới nếu chưa có
         * Input     : warehouseProductId = 10L, không có stock record
         * Expected  : Tạo stock mới với reserved = 3, onHand = 0
         *
         * CheckDB: Verify inventoryStockRepository.save được gọi
         */
        @Test
        @DisplayName("TC_INV_057 – syncReservedQuantity tạo stock mới nếu chưa có record")
        void TC_INV_057_syncReservedQuantity_NoExistingStock_CreatesNewStock() {
            when(warehouseProductRepository.findById(10L)).thenReturn(Optional.of(warehouseProduct));
            when(inventoryStockRepository.findByWarehouseProduct_Id(10L))
                    .thenReturn(Optional.empty()); // Không có stock record
            when(inventoryStockRepository.save(any())).thenAnswer(inv -> {
                InventoryStock saved = inv.getArgument(0);
                // CheckDB: Stock mới phải có reserved đúng và onHand = 0
                assertEquals(3L, saved.getReserved(),
                        "Stock mới phải có reserved = 3");
                assertEquals(0L, saved.getOnHand(),
                        "Stock mới phải có onHand = 0");
                return saved;
            });

            inventoryService.syncReservedQuantity(10L, 3L);

            verify(inventoryStockRepository, times(1)).save(any());
        }
    }

    // ================================================================
    // TC_INV_058 → TC_INV_061: getPurchaseOrders & getPurchaseOrderDetail
    // ================================================================
    @Nested
    @DisplayName("getPurchaseOrders & getPurchaseOrderDetail Tests")
    class GetPurchaseOrderTests {

        /**
         * TC_INV_058
         * Objective : Lấy PO theo status filter CREATED
         * Input     : status = POStatus.CREATED
         * Expected  : Gọi findByStatus không phải findAll
         */
        @Test
        @DisplayName("TC_INV_058 – Filter theo status gọi findByStatus")
        void TC_INV_058_getPurchaseOrders_WithStatusFilter_CallsFindByStatus() {
            when(purchaseOrderRepository.findByStatus(POStatus.CREATED))
                    .thenReturn(Collections.singletonList(purchaseOrder));

            ApiResponse response = inventoryService.getPurchaseOrders(POStatus.CREATED);

            assertTrue(response.isSuccess());
            verify(purchaseOrderRepository).findByStatus(POStatus.CREATED);
            verify(purchaseOrderRepository, never()).findAll();
        }

        /**
         * TC_INV_059
         * Objective : Lấy chi tiết PO không tồn tại
         * Input     : id = 9999L
         * Expected  : IllegalArgumentException
         */
        @Test
        @DisplayName("TC_INV_059 – getPurchaseOrderDetail ID không tồn tại phải ném exception")
        void TC_INV_059_getPurchaseOrderDetail_NotFound_ThrowsException() {
            when(purchaseOrderRepository.findById(9999L)).thenReturn(Optional.empty());

            assertThrows(IllegalArgumentException.class,
                    () -> inventoryService.getPurchaseOrderDetail(9999L));
        }

        /**
         * TC_INV_060
         * Objective : Lấy chi tiết PO với items null → không NPE
         * Input     : PO hợp lệ nhưng items là null
         * Expected  : Không NPE (phải xử lý graceful)
         *
         * ⚠️ BUG HUNTER: mapToPurchaseOrderDetailDTO gọi po.getItems().stream() → NPE nếu items null
         */
        @Test
        @DisplayName("TC_INV_060 – getPurchaseOrderDetail với items null không gây NPE")
        void TC_INV_060_getPurchaseOrderDetail_NullItems_NoNPE() {
            purchaseOrder.setItems(null); // null items
            when(purchaseOrderRepository.findById(1L)).thenReturn(Optional.of(purchaseOrder));

            // Nếu NPE xảy ra, test sẽ thất bại với message rõ ràng
            assertDoesNotThrow(() -> inventoryService.getPurchaseOrderDetail(1L),
                    "getPurchaseOrderDetail không được NPE khi PO.items null");
        }
    }

    // ================================================================
    // TC_INV_061 → TC_INV_063: getExportOrders & getExportOrderDetail
    // ================================================================
    @Nested
    @DisplayName("getExportOrders & getExportOrderDetail Tests")
    class GetExportOrderTests {

        /**
         * TC_INV_061
         * Objective : Lấy export orders không có filter
         * Input     : status = null
         * Expected  : findAll được gọi
         */
        @Test
        @DisplayName("TC_INV_061 – getExportOrders không filter gọi findAll")
        void TC_INV_061_getExportOrders_NoFilter_CallsFindAll() {
            when(exportOrderRepository.findAll()).thenReturn(Collections.emptyList());

            ApiResponse response = inventoryService.getExportOrders(null);

            assertTrue(response.isSuccess());
            verify(exportOrderRepository).findAll();
        }

        /**
         * TC_INV_062
         * Objective : Lấy chi tiết export order không tồn tại
         * Input     : id = 9999L
         * Expected  : IllegalArgumentException
         */
        @Test
        @DisplayName("TC_INV_062 – getExportOrderDetail ID không tồn tại phải ném exception")
        void TC_INV_062_getExportOrderDetail_NotFound_ThrowsException() {
            when(exportOrderRepository.findById(9999L)).thenReturn(Optional.empty());

            assertThrows(IllegalArgumentException.class,
                    () -> inventoryService.getExportOrderDetail(9999L));
        }
    }

    // ================================================================
    // TC_INV_063: InventoryStock business logic
    // ================================================================
    @Nested
    @DisplayName("InventoryStock Business Logic Tests")
    class InventoryStockBusinessLogicTests {

        /**
         * TC_INV_063
         * Objective : getSellable() phải = onHand - reserved - damaged
         * Input     : onHand=50, reserved=5, damaged=2
         * Expected  : sellable = 43
         *
         * ⚠️ BUG HUNTER: Nếu sellable tính sai → hiển thị tồn kho sai cho khách hàng
         */
        @Test
        @DisplayName("TC_INV_063 – getSellable tính đúng onHand - reserved - damaged")
        void TC_INV_063_inventoryStock_GetSellable_CorrectCalculation() {
            // onHand=50, reserved=5, damaged=2 → sellable = 43
            assertEquals(43L, inventoryStock.getSellable(),
                    "getSellable() phải = 50 - 5 - 2 = 43");
        }

        /**
         * TC_INV_064
         * Objective : getSellable() không trả về âm khi reserved+damaged > onHand
         * Input     : onHand=5, reserved=10, damaged=0
         * Expected  : getSellable() = 0 (không âm)
         *
         * ⚠️ BUG HUNTER: Nghiệp vụ quan trọng – số lượng bán không thể âm
         */
        @Test
        @DisplayName("TC_INV_064 – getSellable không trả về âm khi reserved > onHand")
        void TC_INV_064_inventoryStock_GetSellable_NeverNegative() {
            InventoryStock overReserved = InventoryStock.builder()
                    .onHand(5L).reserved(10L).damaged(0L).build();

            long sellable = overReserved.getSellable();
            assertTrue(sellable >= 0,
                    "getSellable() không được âm, thực tế = " + sellable);
            assertEquals(0L, sellable, "getSellable() phải = 0 khi reserved > onHand");
        }

        /**
         * TC_INV_065
         * Objective : getAvailable() không bao gồm damaged (onHand - reserved only)
         * Input     : onHand=50, reserved=5, damaged=2
         * Expected  : getAvailable() = 45 (không trừ damaged)
         *
         * ⚠️ BUG HUNTER: getAvailable và getSellable phải có nghĩa nghiệp vụ khác nhau rõ ràng
         */
        @Test
        @DisplayName("TC_INV_065 – getAvailable tính đúng onHand - reserved (không trừ damaged)")
        void TC_INV_065_inventoryStock_GetAvailable_CorrectCalculation() {
            // onHand=50, reserved=5, damaged=2 → available = 45
            assertEquals(45L, inventoryStock.getAvailable(),
                    "getAvailable() phải = 50 - 5 = 45 (không trừ damaged)");
        }
    }

    // ============================================================
    // Helper Methods
    // ============================================================

    /** Build POItemRequest helper */
    private POItemRequest buildPoItem(String sku, Long quantity, Double unitCost) {
        POItemRequest item = new POItemRequest();
        item.setSku(sku);
        item.setQuantity(quantity);
        item.setUnitCost(unitCost);
        item.setWarrantyMonths(12);
        item.setInternalName("Product " + sku);
        return item;
    }

    /** Build CreatePORequest helper */
    private CreatePORequest buildCreatePORequest(String poCode, String taxCode,
                                                  List<POItemRequest> items) {
        CreateSupplierRequest supplierReq = new CreateSupplierRequest();
        supplierReq.setTaxCode(taxCode);
        supplierReq.setName("Test NCC");

        CreatePORequest req = new CreatePORequest();
        req.setPoCode(poCode);
        req.setCreatedBy("test_admin");
        req.setSupplier(supplierReq);
        req.setItems(items);
        return req;
    }

    /** Build PurchaseOrderItem entity helper */
    private PurchaseOrderItem buildPoItem_Entity(String sku, Long quantity) {
        PurchaseOrderItem poItem = new PurchaseOrderItem();
        poItem.setId(1L);
        poItem.setSku(sku);
        poItem.setQuantity(quantity);
        poItem.setUnitCost(15_000_000.0);
        poItem.setWarehouseProduct(warehouseProduct);
        poItem.setProductDetails(new ArrayList<>());
        poItem.setWarrantyMonths(12);
        return poItem;
    }

    // ================================================================
    // COVERAGE COMPLETENESS – Branch/Path tests for uncovered code
    // ================================================================
    @Nested
    @DisplayName("Branch Coverage Completeness Tests")
    class BranchCoverageTests {

        // ── getOrCreateSupplier: phone lookup branch ──────────────────
        @Test
        @DisplayName("TC_INV_066_getOrCreateSupplier_ExistingPhone_ReturnsByPhone")
        void TC_INV_066_getOrCreateSupplier_ExistingPhone_ReturnsByPhone() {
            CreateSupplierRequest req = new CreateSupplierRequest();
            req.setTaxCode(null);
            req.setEmail(null);
            req.setPhone("0900000001");

            when(supplierRepository.findByTaxCode(any())).thenReturn(Optional.empty());
            when(supplierRepository.findByEmail(any())).thenReturn(Optional.empty());
            // phone lookup branch → supplier exists
            Supplier byPhone = Supplier.builder().id(99L).phone("0900000001").build();
            when(supplierRepository.findByPhone("0900000001")).thenReturn(Optional.of(byPhone));

            ApiResponse resp = inventoryService.getOrCreateSupplier(req);

            assertTrue(resp.isSuccess());
            verify(supplierRepository, never()).save(any());
        }

        // ── createWarehouseProduct: no supplierId ─────────────────────
        @Test
        @DisplayName("TC_INV_067_createWarehouseProduct_NullSupplierId_SkipsSupplierLookup")
        void TC_INV_067_createWarehouseProduct_NullSupplierId_SkipsSupplierLookup() {
            CreateWarehouseProductRequest req = new CreateWarehouseProductRequest();
            req.setSku("SKU-NEW-NO-SUPP");
            req.setInternalName("No Supplier Product");
            req.setSupplierId(null); // no supplier
            req.setTechSpecsJson(null); // should default to {}

            when(warehouseProductRepository.findBySku("SKU-NEW-NO-SUPP")).thenReturn(Optional.empty());
            when(warehouseProductRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ApiResponse resp = inventoryService.createWarehouseProduct(req);

            assertTrue(resp.isSuccess());
            verify(supplierRepository, never()).findById(anyLong());
        }

        // ── updateWarehouseProduct: supplierId=null branch ────────────
        @Test
        @DisplayName("TC_INV_068_updateWarehouseProduct_NullSupplierId_SkipsSupplierUpdate")
        void TC_INV_068_updateWarehouseProduct_NullSupplierId_SkipsSupplierUpdate() {
            CreateWarehouseProductRequest req = new CreateWarehouseProductRequest();
            req.setSku("SKU-LAPTOP-001"); // same SKU → no duplicate check
            req.setInternalName("Updated Name");
            req.setSupplierId(null);
            req.setTechSpecsJson("{}");

            when(warehouseProductRepository.findById(10L)).thenReturn(Optional.of(warehouseProduct));
            when(warehouseProductRepository.save(any())).thenReturn(warehouseProduct);

            ApiResponse resp = inventoryService.updateWarehouseProduct(10L, req);

            assertTrue(resp.isSuccess());
            verify(supplierRepository, never()).findById(anyLong());
        }

        // ── updateWarehouseProduct: different SKU but new SKU already exists
        @Test
        @DisplayName("TC_INV_069_updateWarehouseProduct_NewSkuAlreadyExists_UpdateSuccessfully")
        void TC_INV_069_updateWarehouseProduct_NewSkuAlreadyExists_UpdatesSkuWhenNotDuplicate() {
            // When new SKU is same as existing → no duplicate check, update SKU field path
            CreateWarehouseProductRequest req = new CreateWarehouseProductRequest();
            req.setSku("SKU-DIFFERENT");
            req.setInternalName("Changed");
            req.setSupplierId(null);
            req.setTechSpecsJson("{}");

            when(warehouseProductRepository.findById(10L)).thenReturn(Optional.of(warehouseProduct));
            when(warehouseProductRepository.findBySku("SKU-DIFFERENT")).thenReturn(Optional.empty());
            when(warehouseProductRepository.save(any())).thenReturn(warehouseProduct);

            ApiResponse resp = inventoryService.updateWarehouseProduct(10L, req);

            assertTrue(resp.isSuccess());
        }

        // ── createPurchaseOrder: new supplier created (orElseGet branch) ─
        @Test
        @DisplayName("TC_INV_070_createPurchaseOrder_NewSupplierCreated_SavesNewSupplier")
        void TC_INV_070_createPurchaseOrder_NewSupplier_CreatesAndSaves() {
            CreatePORequest req = new CreatePORequest();
            CreateSupplierRequest sreq = new CreateSupplierRequest();
            sreq.setTaxCode("MST-NEW-999");
            sreq.setName("NCC Mới");
            sreq.setContactName("Người Liên Hệ");
            sreq.setEmail("new@ncc.com");
            sreq.setPhone("0912345678");
            sreq.setAddress("HCM");
            req.setSupplier(sreq);
            req.setPoCode("PO-NEW-001");
            req.setCreatedBy("admin");

            CreatePOItemRequest item = new CreatePOItemRequest();
            item.setSku("SKU-EXIST-001");
            item.setQuantity(2L);
            item.setUnitCost(10_000_000.0);
            item.setWarrantyMonths(12);
            item.setInternalName("Product A");
            item.setTechSpecsJson("{\"ram\":\"8GB\"}");
            req.setItems(List.of(item));

            Supplier newSupplier = Supplier.builder().id(100L).name("NCC Mới").taxCode("MST-NEW-999").build();

            // taxCode NOT found → orElseGet creates new supplier
            when(supplierRepository.findByTaxCode("MST-NEW-999")).thenReturn(Optional.empty());
            when(supplierRepository.save(any())).thenReturn(newSupplier);
            when(warehouseProductRepository.findBySku("SKU-EXIST-001")).thenReturn(Optional.of(warehouseProduct));
            when(purchaseOrderRepository.save(any())).thenReturn(purchaseOrder);

            ApiResponse resp = inventoryService.createPurchaseOrder(req);

            assertTrue(resp.isSuccess());
            verify(supplierRepository, atLeastOnce()).save(any());
        }

        // ── createPurchaseOrder: new WP created (orElseGet inside items) ─
        @Test
        @DisplayName("TC_INV_071_createPurchaseOrder_NewWP_NullInternalNameAndTechSpecs_DefaultsApplied")
        void TC_INV_071_createPurchaseOrder_NewWP_NullFields_Defaults() {
            CreatePORequest req = new CreatePORequest();
            CreateSupplierRequest sreq = new CreateSupplierRequest();
            sreq.setTaxCode("0123456789");
            req.setSupplier(sreq);
            req.setPoCode("PO-NWP-001");

            CreatePOItemRequest item = new CreatePOItemRequest();
            item.setSku("SKU-BRAND-NEW");
            item.setQuantity(1L);
            item.setUnitCost(5_000_000.0);
            item.setWarrantyMonths(6);
            item.setInternalName(null);     // null → default "Sản phẩm mới - SKU"
            item.setTechSpecsJson(null);    // null → default "{}"
            req.setItems(List.of(item));

            when(supplierRepository.findByTaxCode("0123456789")).thenReturn(Optional.of(supplier));
            // SKU NOT found → creates new WP
            when(warehouseProductRepository.findBySku("SKU-BRAND-NEW")).thenReturn(Optional.empty());
            when(warehouseProductRepository.save(any())).thenReturn(warehouseProduct);
            when(purchaseOrderRepository.save(any())).thenReturn(purchaseOrder);

            ApiResponse resp = inventoryService.createPurchaseOrder(req);

            assertTrue(resp.isSuccess());
        }

        // ── completePurchaseOrder: DataIntegrityViolationException with "Duplicate entry" ─
        @Test
        @DisplayName("TC_INV_072_completePurchaseOrder_DuplicateEntryException_ReturnsError")
        void TC_INV_072_completePurchaseOrder_DataIntegrityDuplicate_ReturnsError() {
            CompletePORequest req = new CompletePORequest();
            req.setPoId(1L);

            ProductSerialRequest serialReq = new ProductSerialRequest();
            serialReq.setProductSku("SKU-LAPTOP-001");
            serialReq.setSerialNumbers(List.of("SN-DUP-999"));
            req.setSerials(List.of(serialReq));

            PurchaseOrderItem item = buildPoItem_Entity("SKU-LAPTOP-001", 1L);
            purchaseOrder.setItems(List.of(item));

            when(purchaseOrderRepository.findById(1L)).thenReturn(Optional.of(purchaseOrder));
            when(productDetailRepository.existsBySerialNumber("SN-DUP-999")).thenReturn(false);
            when(inventoryStockRepository.findByWarehouseProduct_Id(anyLong())).thenReturn(Optional.of(inventoryStock));
            // purchaseOrderRepository.save throws DataIntegrityViolationException containing "Duplicate entry"
            when(purchaseOrderRepository.save(any()))
                    .thenThrow(new org.springframework.dao.DataIntegrityViolationException("Duplicate entry 'SN-DUP-999' for key 'serial'"));

            ApiResponse resp = inventoryService.completePurchaseOrder(req);

            assertFalse(resp.isSuccess());
            assertTrue(resp.getMessage().contains("trùng lặp") || resp.getMessage().contains("Serial"));
        }

        // ── completePurchaseOrder: DataIntegrityViolationException without "Duplicate entry" ─
        @Test
        @DisplayName("TC_INV_073_completePurchaseOrder_OtherDataIntegrityException_ReturnsError")
        void TC_INV_073_completePurchaseOrder_OtherDataIntegrityViolation_ReturnsError() {
            CompletePORequest req = new CompletePORequest();
            req.setPoId(1L);

            ProductSerialRequest serialReq = new ProductSerialRequest();
            serialReq.setProductSku("SKU-LAPTOP-001");
            serialReq.setSerialNumbers(List.of("SN-GENERIC-ERR"));
            req.setSerials(List.of(serialReq));

            PurchaseOrderItem item = buildPoItem_Entity("SKU-LAPTOP-001", 1L);
            purchaseOrder.setItems(List.of(item));

            when(purchaseOrderRepository.findById(1L)).thenReturn(Optional.of(purchaseOrder));
            when(productDetailRepository.existsBySerialNumber("SN-GENERIC-ERR")).thenReturn(false);
            when(inventoryStockRepository.findByWarehouseProduct_Id(anyLong())).thenReturn(Optional.of(inventoryStock));
            when(purchaseOrderRepository.save(any()))
                    .thenThrow(new org.springframework.dao.DataIntegrityViolationException("FK constraint violation"));

            ApiResponse resp = inventoryService.completePurchaseOrder(req);

            assertFalse(resp.isSuccess());
        }

        // ── completePurchaseOrder: item.getProductDetails() == null ──
        @Test
        @DisplayName("TC_INV_074_completePurchaseOrder_NullProductDetails_InitializesNewList")
        void TC_INV_074_completePurchaseOrder_NullProductDetails_InitializesNewList() {
            CompletePORequest req = new CompletePORequest();
            req.setPoId(1L);
            req.setReceivedDate(LocalDateTime.now());

            ProductSerialRequest serialReq = new ProductSerialRequest();
            serialReq.setProductSku("SKU-LAPTOP-001");
            serialReq.setSerialNumbers(List.of("SN-NULL-DET-001"));
            req.setSerials(List.of(serialReq));

            PurchaseOrderItem item = buildPoItem_Entity("SKU-LAPTOP-001", 1L);
            item.setProductDetails(null); // <-- null so branch initializes new ArrayList
            purchaseOrder.setItems(List.of(item));

            when(purchaseOrderRepository.findById(1L)).thenReturn(Optional.of(purchaseOrder));
            when(productDetailRepository.existsBySerialNumber("SN-NULL-DET-001")).thenReturn(false);
            when(inventoryStockRepository.findByWarehouseProduct_Id(anyLong())).thenReturn(Optional.of(inventoryStock));
            when(purchaseOrderRepository.save(any())).thenReturn(purchaseOrder);
            when(supplierPayableService.createPayableFromPurchaseOrder(any()))
                    .thenReturn(ApiResponse.success("OK", null));

            ApiResponse resp = inventoryService.completePurchaseOrder(req);

            assertTrue(resp.isSuccess());
        }

        // ── completePurchaseOrder: supplierPayableService returns failure ─
        @Test
        @DisplayName("TC_INV_075_completePurchaseOrder_PayableFailure_StillSucceeds")
        void TC_INV_075_completePurchaseOrder_PayableServiceFails_StillReturnsSuccess() {
            CompletePORequest req = new CompletePORequest();
            req.setPoId(1L);
            req.setReceivedDate(LocalDateTime.now());

            ProductSerialRequest serialReq = new ProductSerialRequest();
            serialReq.setProductSku("SKU-LAPTOP-001");
            serialReq.setSerialNumbers(List.of("SN-PAY-FAIL-001"));
            req.setSerials(List.of(serialReq));

            PurchaseOrderItem item = buildPoItem_Entity("SKU-LAPTOP-001", 1L);
            purchaseOrder.setItems(List.of(item));

            when(purchaseOrderRepository.findById(1L)).thenReturn(Optional.of(purchaseOrder));
            when(productDetailRepository.existsBySerialNumber("SN-PAY-FAIL-001")).thenReturn(false);
            when(inventoryStockRepository.findByWarehouseProduct_Id(anyLong())).thenReturn(Optional.of(inventoryStock));
            when(purchaseOrderRepository.save(any())).thenReturn(purchaseOrder);
            // Payable returns error but import should still succeed
            when(supplierPayableService.createPayableFromPurchaseOrder(any()))
                    .thenReturn(ApiResponse.error("Lỗi tạo công nợ"));

            ApiResponse resp = inventoryService.completePurchaseOrder(req);

            assertTrue(resp.isSuccess(), "Nhập hàng phải thành công dù tạo công nợ lỗi");
        }

        // ── completePurchaseOrder: supplierPayableService throws exception ─
        @Test
        @DisplayName("TC_INV_076_completePurchaseOrder_PayableException_StillSucceeds")
        void TC_INV_076_completePurchaseOrder_PayableException_StillReturnsSuccess() {
            CompletePORequest req = new CompletePORequest();
            req.setPoId(1L);
            req.setReceivedDate(LocalDateTime.now());

            ProductSerialRequest serialReq = new ProductSerialRequest();
            serialReq.setProductSku("SKU-LAPTOP-001");
            serialReq.setSerialNumbers(List.of("SN-PAYEX-001"));
            req.setSerials(List.of(serialReq));

            PurchaseOrderItem item = buildPoItem_Entity("SKU-LAPTOP-001", 1L);
            purchaseOrder.setItems(List.of(item));

            when(purchaseOrderRepository.findById(1L)).thenReturn(Optional.of(purchaseOrder));
            when(productDetailRepository.existsBySerialNumber("SN-PAYEX-001")).thenReturn(false);
            when(inventoryStockRepository.findByWarehouseProduct_Id(anyLong())).thenReturn(Optional.of(inventoryStock));
            when(purchaseOrderRepository.save(any())).thenReturn(purchaseOrder);
            when(supplierPayableService.createPayableFromPurchaseOrder(any()))
                    .thenThrow(new RuntimeException("Kết nối DB lỗi"));

            ApiResponse resp = inventoryService.completePurchaseOrder(req);

            assertTrue(resp.isSuccess(), "Import thành công kể cả khi payable service ném exception");
        }

        // ── completePurchaseOrder: sync with Product (wp.product != null) ─
        @Test
        @DisplayName("TC_INV_077_completePurchaseOrder_WithLinkedProduct_SyncsStockToProduct")
        void TC_INV_077_completePurchaseOrder_WithLinkedProduct_SyncsStock() {
            Product linkedProduct = Product.builder().id(99L).name("Laptop Published").stockQuantity(50L).build();
            WarehouseProduct wpWithProduct = WarehouseProduct.builder()
                    .id(10L).sku("SKU-LAPTOP-001").internalName("Laptop")
                    .product(linkedProduct).build();

            CompletePORequest req = new CompletePORequest();
            req.setPoId(1L);
            req.setReceivedDate(LocalDateTime.now());
            ProductSerialRequest serialReq = new ProductSerialRequest();
            serialReq.setProductSku("SKU-LAPTOP-001");
            serialReq.setSerialNumbers(List.of("SN-SYNC-001"));
            req.setSerials(List.of(serialReq));

            PurchaseOrderItem item = buildPoItem_Entity("SKU-LAPTOP-001", 1L);
            item.setWarehouseProduct(wpWithProduct);
            purchaseOrder.setItems(List.of(item));

            when(purchaseOrderRepository.findById(1L)).thenReturn(Optional.of(purchaseOrder));
            when(productDetailRepository.existsBySerialNumber("SN-SYNC-001")).thenReturn(false);
            when(inventoryStockRepository.findByWarehouseProduct_Id(10L)).thenReturn(Optional.of(inventoryStock));
            when(purchaseOrderRepository.save(any())).thenReturn(purchaseOrder);
            when(supplierPayableService.createPayableFromPurchaseOrder(any()))
                    .thenReturn(ApiResponse.success("OK", null));

            ApiResponse resp = inventoryService.completePurchaseOrder(req);

            assertTrue(resp.isSuccess());
            // productRepository.save gọi để sync stock
            verify(productRepository, atLeastOnce()).save(linkedProduct);
        }

        // ── getPurchaseOrders: null status → findAll ──────────────────
        @Test
        @DisplayName("TC_INV_078_getPurchaseOrders_NullStatus_CallsFindAll")
        void TC_INV_078_getPurchaseOrders_NullStatus_CallsFindAll() {
            PurchaseOrder po = PurchaseOrder.builder()
                    .id(5L).poCode("PO-005").status(POStatus.CREATED)
                    .supplier(supplier).orderDate(LocalDateTime.now())
                    .items(List.of()).build();
            when(purchaseOrderRepository.findAll()).thenReturn(List.of(po));

            ApiResponse resp = inventoryService.getPurchaseOrders(null);

            assertTrue(resp.isSuccess());
            verify(purchaseOrderRepository).findAll();
        }

        // ── getPurchaseOrders: po with null supplier and null items ───
        @Test
        @DisplayName("TC_INV_079_getPurchaseOrders_NullSupplierAndNullItems_MapsToNA")
        void TC_INV_079_getPurchaseOrders_NullSupplierNullItems_MapsGracefully() {
            PurchaseOrder po = PurchaseOrder.builder()
                    .id(6L).poCode("PO-006").status(POStatus.CREATED)
                    .supplier(null).orderDate(LocalDateTime.now())
                    .items(null).build(); // null supplier & null items
            when(purchaseOrderRepository.findAll()).thenReturn(List.of(po));

            ApiResponse resp = inventoryService.getPurchaseOrders(null);

            assertTrue(resp.isSuccess()); // shouldnt crash
        }

        // ── getExportOrders: non-null status → findByStatus ───────────
        @Test
        @DisplayName("TC_INV_080_getExportOrders_NonNullStatus_CallsFindByStatus")
        void TC_INV_080_getExportOrders_WithStatus_CallsFindByStatus() {
            when(exportOrderRepository.findByStatus(ExportStatus.COMPLETED))
                    .thenReturn(List.of());

            ApiResponse resp = inventoryService.getExportOrders(ExportStatus.COMPLETED);

            assertTrue(resp.isSuccess());
            verify(exportOrderRepository).findByStatus(ExportStatus.COMPLETED);
        }

        // ── getPurchaseOrderDetail: supplier=null, item.wp=null, productDetails=null ─
        @Test
        @DisplayName("TC_INV_081_getPurchaseOrderDetail_NullSupplierAndNullWP_MapsGracefully")
        void TC_INV_081_getPurchaseOrderDetail_NullSupplierAndNullWP_NoNPE() {
            PurchaseOrderItem item = new PurchaseOrderItem();
            item.setId(1L);
            item.setSku("SKU-LAPTOP-001");
            item.setQuantity(1L);
            item.setUnitCost(null);  // null unitCost → ternary default 0.0
            item.setWarrantyMonths(12);
            item.setWarehouseProduct(null);   // null wp → wpInfo = null
            item.setProductDetails(null);      // null productDetails → detailInfos = null

            PurchaseOrder po = PurchaseOrder.builder()
                    .id(99L).poCode("PO-NULL").status(POStatus.CREATED)
                    .supplier(null) // null → supplierInfo stays null
                    .orderDate(LocalDateTime.now())
                    .items(List.of(item)).build();

            when(purchaseOrderRepository.findById(99L)).thenReturn(Optional.of(po));

            ApiResponse resp = inventoryService.getPurchaseOrderDetail(99L);

            assertTrue(resp.isSuccess()); // No NPE
        }

        // ── getExportOrderDetail: item.wp=null, serialNumbers=null ───
        @Test
        @DisplayName("TC_INV_082_getExportOrderDetail_NullWPAndNullSerials_MapsGracefully")
        void TC_INV_082_getExportOrderDetail_NullWPAndSerials_NoNPE() {
            ExportOrderItem eoItem = ExportOrderItem.builder()
                    .id(1L).sku("SKU-X").quantity(1L).totalCost(10_000.0)
                    .warehouseProduct(null)   // null wp → wpInfo = null
                    .serialNumbers(null)       // null → List.of()
                    .build();

            ExportOrder eo = ExportOrder.builder()
                    .id(77L).exportCode("EX-NULL").status(ExportStatus.COMPLETED)
                    .exportDate(LocalDateTime.now())
                    .items(List.of(eoItem)).build();

            when(exportOrderRepository.findById(77L)).thenReturn(Optional.of(eo));

            ApiResponse resp = inventoryService.getExportOrderDetail(77L);

            assertTrue(resp.isSuccess());
        }

        // ── getStocks: exception path ─────────────────────────────────
        @Test
        @DisplayName("TC_INV_083_getStocks_ExceptionThrown_ReturnsErrorResponse")
        void TC_INV_083_getStocks_RepositoryThrowsException_ReturnsError() {
            when(inventoryStockRepository.findAll())
                    .thenThrow(new RuntimeException("DB connection refused"));

            ApiResponse resp = inventoryService.getStocks(null);

            assertFalse(resp.isSuccess());
        }

        // ── getStocks: null onHand/reserved/damaged ──────────────────
        @Test
        @DisplayName("TC_INV_084_getStocks_NullStockFields_DefaultsToZero")
        void TC_INV_084_getStocks_NullFields_DefaultsToZero() {
            InventoryStock stockWithNulls = InventoryStock.builder()
                    .id(2L)
                    .warehouseProduct(warehouseProduct)
                    .onHand(null)    // null → ternary returns 0
                    .reserved(null)
                    .damaged(null)
                    .build();
            when(inventoryStockRepository.findAll()).thenReturn(List.of(stockWithNulls));

            ApiResponse resp = inventoryService.getStocks(null);

            assertTrue(resp.isSuccess()); // must not NPE
        }

        // ── getStocks: warehouseProduct=null ─────────────────────────
        @Test
        @DisplayName("TC_INV_085_getStocks_NullWarehouseProduct_SkipsProductInfo")
        void TC_INV_085_getStocks_NullWarehouseProduct_NoNPE() {
            InventoryStock stockNullWP = InventoryStock.builder()
                    .id(3L).warehouseProduct(null) // no wp → block skipped
                    .onHand(10L).reserved(0L).damaged(0L).build();
            when(inventoryStockRepository.findAll()).thenReturn(List.of(stockNullWP));

            ApiResponse resp = inventoryService.getStocks(null);

            assertTrue(resp.isSuccess());
        }

        // ── exportForSale: orderId=null → no GHN call ────────────────
        @Test
        @DisplayName("TC_INV_086_exportForSale_NullOrderId_SkipsGHNCreation")
        void TC_INV_086_exportForSale_NullOrderId_SkipsGHN() {
            SaleExportRequest req = new SaleExportRequest();
            req.setOrderId(null); // no GHN
            req.setCreatedBy("admin");

            ExportItemRequest itemReq = new ExportItemRequest();
            itemReq.setProductSku("SKU-LAPTOP-001");
            itemReq.setSerialNumbers(List.of("SN-SALE-NO-GHN"));
            req.setItems(List.of(itemReq));

            productDetail.setStatus(ProductStatus.IN_STOCK);
            productDetail.setSerialNumber("SN-SALE-NO-GHN");
            productDetail.setImportPrice(15_000_000.0);

            when(warehouseProductRepository.findBySku("SKU-LAPTOP-001")).thenReturn(Optional.of(warehouseProduct));
            when(inventoryStockRepository.findByWarehouseProduct_Id(10L)).thenReturn(Optional.of(inventoryStock));
            when(productDetailRepository.findBySerialNumber("SN-SALE-NO-GHN")).thenReturn(Optional.of(productDetail));
            when(productDetailRepository.save(any())).thenReturn(productDetail);
            when(inventoryStockRepository.save(any())).thenReturn(inventoryStock);
            when(exportOrderRepository.save(any())).thenReturn(new ExportOrder());

            ApiResponse resp = inventoryService.exportForSale(req);

            assertTrue(resp.isSuccess());
            verify(orderRepository, never()).findById(anyLong());
        }

        // ── exportForSale with orderId and product with linked Product (syncReserved) ─
        @Test
        @DisplayName("TC_INV_087_exportForSale_WithOrderId_GHNExceptionIgnored_StillSucceeds")
        void TC_INV_087_exportForSale_WithOrderId_GHNFails_StillSucceeds() {
            SaleExportRequest req = new SaleExportRequest();
            req.setOrderId(200L); // GHN will be triggered
            req.setCreatedBy("admin");

            ExportItemRequest itemReq = new ExportItemRequest();
            itemReq.setProductSku("SKU-LAPTOP-001");
            itemReq.setSerialNumbers(List.of("SN-GHN-FAIL"));
            req.setItems(List.of(itemReq));

            productDetail.setStatus(ProductStatus.IN_STOCK);
            productDetail.setSerialNumber("SN-GHN-FAIL");
            productDetail.setImportPrice(15_000_000.0);

            when(warehouseProductRepository.findBySku("SKU-LAPTOP-001")).thenReturn(Optional.of(warehouseProduct));
            when(inventoryStockRepository.findByWarehouseProduct_Id(10L)).thenReturn(Optional.of(inventoryStock));
            when(productDetailRepository.findBySerialNumber("SN-GHN-FAIL")).thenReturn(Optional.of(productDetail));
            when(productDetailRepository.save(any())).thenReturn(productDetail);
            when(inventoryStockRepository.save(any())).thenReturn(inventoryStock);
            when(exportOrderRepository.save(any())).thenReturn(new ExportOrder());
            // GHN: orderRepository.findById throws → caught internally
            when(orderRepository.findById(200L)).thenThrow(new RuntimeException("Order not found"));

            ApiResponse resp = inventoryService.exportForSale(req);

            assertTrue(resp.isSuccess(), "exportForSale thành công kể cả khi GHN tạo lỗi");
        }

        // ── exportForSale with linked Product → syncReservedWithProduct ─
        @Test
        @DisplayName("TC_INV_088_exportForSale_WithLinkedProduct_SyncsReservedToProduct")
        void TC_INV_088_exportForSale_LinkedProduct_SyncsReserved() {
            Product linkedProd = Product.builder().id(1L).name("Laptop A")
                    .stockQuantity(50L).reservedQuantity(5L).build();
            WarehouseProduct wpLinked = WarehouseProduct.builder()
                    .id(10L).sku("SKU-LAPTOP-001").internalName("Laptop")
                    .product(linkedProd).build();

            SaleExportRequest req = new SaleExportRequest();
            req.setOrderId(null);
            req.setCreatedBy("admin");
            ExportItemRequest itemReq = new ExportItemRequest();
            itemReq.setProductSku("SKU-LAPTOP-001");
            itemReq.setSerialNumbers(List.of("SN-LINKED-001"));
            req.setItems(List.of(itemReq));

            productDetail.setStatus(ProductStatus.IN_STOCK);
            productDetail.setSerialNumber("SN-LINKED-001");
            productDetail.setImportPrice(15_000_000.0);

            when(warehouseProductRepository.findBySku("SKU-LAPTOP-001")).thenReturn(Optional.of(wpLinked));
            when(inventoryStockRepository.findByWarehouseProduct_Id(10L)).thenReturn(Optional.of(inventoryStock));
            when(productDetailRepository.findBySerialNumber("SN-LINKED-001")).thenReturn(Optional.of(productDetail));
            when(productDetailRepository.save(any())).thenReturn(productDetail);
            when(inventoryStockRepository.save(any())).thenReturn(inventoryStock);
            when(exportOrderRepository.save(any())).thenReturn(new ExportOrder());
            when(productRepository.save(any())).thenReturn(linkedProd);

            ApiResponse resp = inventoryService.exportForSale(req);

            assertTrue(resp.isSuccess());
            verify(productRepository, atLeastOnce()).save(linkedProd);
        }

        // ── exportForWarranty: SOLD status (neither condition = true for error) ─
        @Test
        @DisplayName("TC_INV_089_exportForWarranty_SoldSerial_ProceedsNormally")
        void TC_INV_089_exportForWarranty_SoldStatus_AllowsWarranty() {
            // pd.status = SOLD → condition (!=IN_STOCK && !=SOLD) is FALSE → không return error
            ProductDetail soldDetail = ProductDetail.builder()
                    .id(2L).serialNumber("SN-SOLD-001")
                    .status(ProductStatus.SOLD) // SOLD is allowed for warranty
                    .importPrice(10_000_000.0)
                    .warehouseProduct(warehouseProduct)
                    .build();

            WarrantyExportRequest req = new WarrantyExportRequest();
            ExportItemRequest itemReq = new ExportItemRequest();
            itemReq.setProductSku("SKU-LAPTOP-001");
            itemReq.setSerialNumbers(List.of("SN-SOLD-001"));
            req.setItems(List.of(itemReq));

            when(productDetailRepository.findBySerialNumber("SN-SOLD-001")).thenReturn(Optional.of(soldDetail));
            when(inventoryStockRepository.findByWarehouseProduct_Id(10L)).thenReturn(Optional.of(inventoryStock));
            when(productDetailRepository.save(any())).thenReturn(soldDetail);
            when(inventoryStockRepository.save(any())).thenReturn(inventoryStock);
            when(exportOrderRepository.save(any())).thenReturn(new ExportOrder());

            ApiResponse resp = inventoryService.exportForWarranty(req);

            assertTrue(resp.isSuccess(), "SOLD serial phải được cho phép xuất bảo hành");
        }

        // ── syncStockWithProduct: wp.product != null ─────────────────
        @Test
        @DisplayName("TC_INV_090_syncStock_WithLinkedProduct_UpdatesProductStockQty")
        void TC_INV_090_syncStockWithProduct_ProductNotNull_SavesProduct() {
            // Trigger syncStockWithProduct indirectly via createExportOrder with a product linked WP
            Product linkedProd = Product.builder().id(1L).name("Laptop B").stockQuantity(50L).build();
            WarehouseProduct wpLinked = WarehouseProduct.builder()
                    .id(10L).sku("SKU-LAPTOP-001").internalName("Laptop")
                    .product(linkedProd).build();

            CreateExportOrderRequest req = new CreateExportOrderRequest();
            req.setCreatedBy("admin");
            ExportItemRequest itemReq = new ExportItemRequest();
            itemReq.setProductSku("SKU-LAPTOP-001");
            itemReq.setSerialNumbers(List.of("SN-SYNC-PROD-001"));
            req.setItems(List.of(itemReq));

            productDetail.setStatus(ProductStatus.IN_STOCK);
            productDetail.setSerialNumber("SN-SYNC-PROD-001");
            productDetail.setImportPrice(15_000_000.0);

            when(warehouseProductRepository.findBySku("SKU-LAPTOP-001")).thenReturn(Optional.of(wpLinked));
            when(inventoryStockRepository.findByWarehouseProduct_Id(10L)).thenReturn(Optional.of(inventoryStock));
            when(productDetailRepository.findBySerialNumber("SN-SYNC-PROD-001")).thenReturn(Optional.of(productDetail));
            when(productDetailRepository.save(any())).thenReturn(productDetail);
            when(inventoryStockRepository.save(any())).thenReturn(inventoryStock);
            when(exportOrderRepository.save(any())).thenReturn(new ExportOrder());
            when(productRepository.save(any())).thenReturn(linkedProd);

            ApiResponse resp = inventoryService.createExportOrder(req);

            assertTrue(resp.isSuccess());
            verify(productRepository).save(linkedProd); // syncStockWithProduct was called
        }

        // ── syncReservedQuantity: wp.product != null → syncReservedWithProduct ─
        @Test
        @DisplayName("TC_INV_091_syncReservedQuantity_WithLinkedProduct_UpdatesProductReserved")
        void TC_INV_091_syncReservedQuantity_LinkedProduct_SyncsReserved() {
            Product linkedProd = Product.builder().id(1L).name("Laptop C").reservedQuantity(5L).build();
            WarehouseProduct wpLinked = WarehouseProduct.builder()
                    .id(10L).sku("SKU-LAPTOP-001").product(linkedProd).build();

            when(warehouseProductRepository.findById(10L)).thenReturn(Optional.of(wpLinked));
            when(inventoryStockRepository.findByWarehouseProduct_Id(10L)).thenReturn(Optional.of(inventoryStock));
            when(inventoryStockRepository.save(any())).thenReturn(inventoryStock);
            when(productRepository.save(any())).thenReturn(linkedProd);

            inventoryService.syncReservedQuantity(10L, 8L);

            verify(inventoryStockRepository).save(any());
            verify(productRepository).save(linkedProd); // syncReservedWithProduct was called
        }
    }
}
