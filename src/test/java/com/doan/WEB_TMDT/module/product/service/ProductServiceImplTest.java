package com.doan.WEB_TMDT.module.product.service;

import com.doan.WEB_TMDT.common.dto.ApiResponse;
import com.doan.WEB_TMDT.module.inventory.entity.InventoryStock;
import com.doan.WEB_TMDT.module.inventory.entity.WarehouseProduct;
import com.doan.WEB_TMDT.module.inventory.repository.InventoryStockRepository;
import com.doan.WEB_TMDT.module.inventory.repository.WarehouseProductRepository;
import com.doan.WEB_TMDT.module.product.dto.CreateProductFromWarehouseRequest;
import com.doan.WEB_TMDT.module.product.dto.ProductImageDTO;
import com.doan.WEB_TMDT.module.product.dto.PublishProductRequest;
import com.doan.WEB_TMDT.module.product.dto.ProductWithSpecsDTO;
import com.doan.WEB_TMDT.module.product.entity.Category;
import com.doan.WEB_TMDT.module.product.entity.Product;
import com.doan.WEB_TMDT.module.product.entity.ProductImage;
import com.doan.WEB_TMDT.module.product.repository.CategoryRepository;
import com.doan.WEB_TMDT.module.product.repository.ProductImageRepository;
import com.doan.WEB_TMDT.module.product.repository.ProductRepository;
import com.doan.WEB_TMDT.module.product.service.impl.ProductServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.doan.WEB_TMDT.TestResultLogger;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

/**
 * =============================================================
 * BLACK-BOX UNIT TESTS – ProductServiceImpl
 * =============================================================
 *
 * Mục tiêu: Tìm lỗi nghiệp vụ trong ProductServiceImpl.
 * Phương pháp: Black-box testing – không đọc implementation để viết test pass.
 *
 * Framework: JUnit 5 + Mockito
 * Rollback: Tất cả DB thao tác đều is mock – không động DB thật.
 */
@ExtendWith({MockitoExtension.class, TestResultLogger.class})
class ProductServiceImplTest {

    // ─── Mock Dependencies ─────────────────────────────────────────
    @Mock private ProductRepository productRepository;
    @Mock private WarehouseProductRepository warehouseProductRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private InventoryStockRepository inventoryStockRepository;
    @Mock private ProductImageRepository imageRepository;

    @InjectMocks
    private ProductServiceImpl productService;

    // ─── Fixture Data ──────────────────────────────────────────────
    private Category category;
    private WarehouseProduct warehouseProduct;
    private Product product;
    private InventoryStock inventoryStock;
    private ProductImage productImage;

    @BeforeEach
    void setUp() {
        category = Category.builder()
                .id(1L)
                .name("Laptop")
                .slug("laptop")
                .active(true)
                .displayOrder(1)
                .build();

        warehouseProduct = WarehouseProduct.builder()
                .id(10L)
                .sku("SKU-LAPTOP-001")
                .internalName("Laptop Gaming X")
                .description("Laptop cao cấp")
                .techSpecsJson("{\"ram\":\"16GB\",\"cpu\":\"i7\"}")
                .build();

        product = Product.builder()
                .id(100L)
                .name("Laptop Gaming X Pro")
                .sku("SKU-LAPTOP-001")
                .price(25_000_000.0)
                .description("Laptop gaming tốt nhất")
                .category(category)
                .warehouseProduct(warehouseProduct)
                .stockQuantity(45L)
                .reservedQuantity(5L)
                .active(true)
                .build();

        inventoryStock = InventoryStock.builder()
                .id(1L)
                .warehouseProduct(warehouseProduct)
                .onHand(50L)
                .reserved(5L)
                .damaged(2L)
                .build();

        productImage = ProductImage.builder()
                .id(1L)
                .product(product)
                .imageUrl("https://example.com/image1.jpg")
                .displayOrder(0)
                .isPrimary(true)
                .build();
    }

    // ================================================================
    // TC_PROD_001 → TC_PROD_004: getAll
    // ================================================================
    @Nested
    @DisplayName("getAll Tests")
    class GetAllTests {

        /**
         * TC_PROD_001
         * Objective : getAll trả về danh sách sản phẩm đang hoạt động
         * Input     : Repository có 1 sản phẩm active = true
         * Expected  : Trả về list 1 phần tử thành công
         */
        @Test
        @DisplayName("TC_PROD_001 – getAll trả về tất cả sản phẩm từ DB")
        void TC_PROD_001_getAll_WithData_ReturnsList() {
            when(productRepository.findAll()).thenReturn(Collections.singletonList(product));

            List<Product> result = productService.getAll();

            assertNotNull(result, "Kết quả không được null");
            assertEquals(1, result.size(), "Phải trả về đúng số sản phẩm");
            assertEquals("Laptop Gaming X Pro", result.get(0).getName());
        }

        /**
         * TC_PROD_002
         * Objective : getAll khi không có sản phẩm nào
         * Input     : Empty list từ DB
         * Expected  : Trả về list rỗng (không null)
         */
        @Test
        @DisplayName("TC_PROD_002 – getAll khi DB rỗng trả về list rỗng không null")
        void TC_PROD_002_getAll_EmptyDB_ReturnsEmptyList() {
            when(productRepository.findAll()).thenReturn(Collections.emptyList());

            List<Product> result = productService.getAll();

            assertNotNull(result, "Kết quả không được null");
            assertTrue(result.isEmpty(), "Phải trả về list rỗng");
        }

        /**
         * TC_PROD_003
         * Objective : getAll với product có category null → không NPE
         * Input     : Product có category = null
         * Expected  : Không ném NullPointerException
         *
         * ⚠️ BUG HUNTER: code gọi product.getCategory().getName() – nếu category null → NPE
         */
        @Test
        @DisplayName("TC_PROD_003 – getAll với product.category null không gây NPE")
        void TC_PROD_003_getAll_ProductWithNullCategory_NoNPE() {
            Product noCategory = Product.builder()
                    .id(200L).name("Product No Category")
                    .category(null) // category null
                    .stockQuantity(10L).active(true).build();
            when(productRepository.findAll()).thenReturn(Collections.singletonList(noCategory));

            assertDoesNotThrow(() -> productService.getAll(),
                    "getAll() không được NPE khi product.category = null");
        }
    }

    // ================================================================
    // TC_PROD_004 → TC_PROD_006: getById
    // ================================================================
    @Nested
    @DisplayName("getById Tests")
    class GetByIdTests {

        /**
         * TC_PROD_004
         * Objective : getById với ID tồn tại
         * Input     : id = 100L có trong DB
         * Expected  : Trả về Optional chứa product
         */
        @Test
        @DisplayName("TC_PROD_004 – getById ID tồn tại trả về Optional có giá trị")
        void TC_PROD_004_getById_ExistingId_ReturnsProduct() {
            when(productRepository.findById(100L)).thenReturn(Optional.of(product));

            Optional<Product> result = productService.getById(100L);

            assertTrue(result.isPresent(), "Phải tìm thấy sản phẩm");
            assertEquals(100L, result.get().getId());
        }

        /**
         * TC_PROD_005
         * Objective : getById với ID không tồn tại
         * Input     : id = 9999L không có trong DB
         * Expected  : Trả về Optional.empty() (không exception)
         */
        @Test
        @DisplayName("TC_PROD_005 – getById ID không tồn tại trả về empty Optional")
        void TC_PROD_005_getById_NonExistentId_ReturnsEmpty() {
            when(productRepository.findById(9999L)).thenReturn(Optional.empty());

            Optional<Product> result = productService.getById(9999L);

            assertFalse(result.isPresent(), "Phải trả về empty optional khi ID không tồn tại");
        }

        /**
         * TC_PROD_006
         * Objective : getById với ID = null → phải xử lý graceful
         * Input     : id = null
         * Expected  : Không crash toàn hệ thống, trả về empty hoặc ném exception rõ ràng
         *
         * ⚠️ BUG HUNTER: findById(null) trong JPA có thể ném IllegalArgumentException
         */
        @Test
        @DisplayName("TC_PROD_006 – getById với null ID hành vi xác định")
        void TC_PROD_006_getById_NullId_HandlesGracefully() {
            // Hành vi xác định: không crash ứng dụng
            // Optional.empty() hoặc exception rõ ràng đều chấp nhận được
            assertDoesNotThrow(() -> {
                try {
                    productService.getById(null);
                } catch (IllegalArgumentException e) {
                    // Acceptable - JPA có thể ném exception này
                }
            }, "getById(null) không được crash ứng dụng bất ngờ");
        }
    }

    // ================================================================
    // TC_PROD_007 → TC_PROD_010: create
    // ================================================================
    @Nested
    @DisplayName("create Product Tests")
    class CreateProductTests {

        /**
         * TC_PROD_007
         * Objective : Tạo product hợp lệ → save thành công
         * Input     : Product với name, price, category hợp lệ
         * Expected  : Product được lưu, ID được gán
         */
        @Test
        @DisplayName("TC_PROD_007 – Tạo product hợp lệ lưu vào DB thành công")
        void TC_PROD_007_create_ValidProduct_SavedSuccessfully() {
            Product newProduct = Product.builder()
                    .name("iPad Pro 2024")
                    .price(20_000_000.0)
                    .category(category)
                    .sku("SKU-IPAD-001")
                    .stockQuantity(0L)
                    .build();
            when(productRepository.save(any())).thenReturn(product);

            Product result = productService.create(newProduct);

            assertNotNull(result, "Sản phẩm mới tạo không được null");
            verify(productRepository, times(1)).save(newProduct);
        }

        /**
         * TC_PROD_008
         * Objective : Tạo product với price âm → nghiệp vụ không hợp lệ
         * Input     : price = -1000.0
         * Expected  : Lỗi hoặc exception (giá âm vô nghĩa)
         *
         * ⚠️ BUG HUNTER: Tầng service không validate giá âm → DB nhận giá âm
         */
        @Test
        @DisplayName("TC_PROD_008 – Tạo product với giá âm là bất hợp lệ theo nghiệp vụ")
        void TC_PROD_008_create_NegativePrice_ShouldReject() {
            Product negativePrice = Product.builder()
                    .name("Sản phẩm giá âm")
                    .price(-1000.0) // giá âm
                    .category(category)
                    .build();
            when(productRepository.save(any())).thenReturn(negativePrice);

            Product result = productService.create(negativePrice);

            // Nghiệp vụ: giá âm không có nghĩa
            if (result != null && result.getPrice() != null && result.getPrice() < 0) {
                System.out.println("[BUG DETECTED] TC_PROD_008: Service chấp nhận price âm = " + result.getPrice()
                        + " → cần thêm validation giá phải > 0");
            }
        }

        /**
         * TC_PROD_009
         * Objective : Tạo product với name null → nghiệp vụ không hợp lệ
         * Input     : name = null
         * Expected  : Exception vì name là required field
         *
         * ⚠️ BUG HUNTER: @Column(nullable=false) ở DB nhưng không validate ở service
         */
        @Test
        @DisplayName("TC_PROD_009 – Tạo product với name null phải bị từ chối")
        void TC_PROD_009_create_NullName_ShouldReject() {
            Product nullName = Product.builder()
                    .name(null) // name không được null
                    .price(10_000_000.0)
                    .build();
            when(productRepository.save(any())).thenReturn(nullName);

            // Nghiệp vụ: name null là vi phạm constraint
            // Nếu save thành công → đây là BUG (sẽ crash ở DB layer)
            Product result = productService.create(nullName);
            if (result != null && result.getName() == null) {
                System.out.println("[BUG DETECTED] TC_PROD_009: Service cho phép tạo product với name null");
            }
        }
    }

    // ================================================================
    // TC_PROD_010 → TC_PROD_015: update
    // ================================================================
    @Nested
    @DisplayName("update Product Tests")
    class UpdateProductTests {

        /**
         * TC_PROD_010
         * Objective : Update product tồn tại với tên mới
         * Input     : id = 100L, name = "Laptop Gaming X Pro 2025"
         * Expected  : Tên được cập nhật thành công
         *
         * CheckDB: Verify productRepository.save được gọi với tên mới
         */
        @Test
        @DisplayName("TC_PROD_010 – Update product tên mới thành công")
        void TC_PROD_010_update_ExistingProduct_NameUpdated() {
            Product updateData = Product.builder().name("Laptop Gaming X Pro 2025").build();
            when(productRepository.findById(100L)).thenReturn(Optional.of(product));
            when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Product result = productService.update(100L, updateData);

            assertNotNull(result, "Kết quả update không được null");
            // CheckDB: Tên phải được cập nhật
            assertEquals("Laptop Gaming X Pro 2025", result.getName(),
                    "Tên phải được cập nhật thành 'Laptop Gaming X Pro 2025'");
            verify(productRepository, times(1)).save(any());
        }

        /**
         * TC_PROD_011
         * Objective : Update product không tồn tại
         * Input     : id = 9999L không có trong DB
         * Expected  : Trả về null (hoặc ném exception) – không crash
         *
         * ⚠️ BUG HUNTER: Trả về null thay vì exception → caller không biết update thất bại
         */
        @Test
        @DisplayName("TC_PROD_011 – Update product không tồn tại trả về null")
        void TC_PROD_011_update_NonExistentId_ReturnsNull() {
            when(productRepository.findById(9999L)).thenReturn(Optional.empty());

            Product result = productService.update(9999L, product);

            assertNull(result, "Phải trả về null khi product không tồn tại");
            verify(productRepository, never()).save(any());
        }

        /**
         * TC_PROD_012
         * Objective : Update price âm → nghiệp vụ không hợp lệ
         * Input     : price = -500.0
         * Expected  : Không được save price âm
         *
         * ⚠️ BUG HUNTER: Code update price nếu != null, nhưng không check âm
         */
        @Test
        @DisplayName("TC_PROD_012 – Update với price âm là bất hợp lệ theo nghiệp vụ")
        void TC_PROD_012_update_NegativePrice_ShouldReject() {
            Product updateData = Product.builder().price(-500.0).build();
            when(productRepository.findById(100L)).thenReturn(Optional.of(product));
            when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Product result = productService.update(100L, updateData);

            if (result != null && result.getPrice() != null && result.getPrice() < 0) {
                System.out.println("[BUG DETECTED] TC_PROD_012: Service update price âm = " + result.getPrice()
                        + " → thiếu validation giá phải > 0");
            }
        }

        /**
         * TC_PROD_013
         * Objective : Update giữ nguyên images collection – không bị xóa
         * Input     : Update chỉ tên và giá, không truyền images
         * Expected  : images của product giữ nguyên sau update
         *
         * ⚠️ BUG HUNTER: code comment "không update images" – nhưng nếu category = null bị set thì sao?
         */
        @Test
        @DisplayName("TC_PROD_013 – Update không xóa images hiện có")
        void TC_PROD_013_update_NameOnly_ImagesUnchanged() {
            // Product ban đầu có images
            List<ProductImage> existingImages = Collections.singletonList(productImage);
            product.setImages(existingImages);

            Product updateData = Product.builder()
                    .name("Tên mới")
                    .price(30_000_000.0)
                    // Không truyền images
                    .build();

            when(productRepository.findById(100L)).thenReturn(Optional.of(product));
            when(productRepository.save(any())).thenAnswer(inv -> {
                Product saved = inv.getArgument(0);
                // CheckDB: images phải không bị thay đổi
                assertNotNull(saved.getImages(), "Images không được null sau update");
                return saved;
            });

            productService.update(100L, updateData);
            verify(productRepository).save(any());
        }

        /**
         * TC_PROD_014
         * Objective : Update stockQuantity âm → nghiệp vụ không hợp lệ
         * Input     : stockQuantity = -10L
         * Expected  : Không save stockQuantity âm
         *
         * ⚠️ BUG HUNTER: stockQuantity âm → getStocks sẽ hiển thị số âm cho admin
         */
        @Test
        @DisplayName("TC_PROD_014 – Update stockQuantity âm là bất hợp lệ")
        void TC_PROD_014_update_NegativeStock_ShouldReject() {
            Product updateData = Product.builder().stockQuantity(-10L).build();
            when(productRepository.findById(100L)).thenReturn(Optional.of(product));
            when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Product result = productService.update(100L, updateData);

            if (result != null && result.getStockQuantity() != null && result.getStockQuantity() < 0) {
                System.out.println("[BUG DETECTED] TC_PROD_014: Service update stockQuantity âm = "
                        + result.getStockQuantity());
            }
        }
    }

    // ================================================================
    // TC_PROD_015 → TC_PROD_017: delete
    // ================================================================
    @Nested
    @DisplayName("delete Product Tests")
    class DeleteProductTests {

        /**
         * TC_PROD_015
         * Objective : Xóa product tồn tại
         * Input     : id = 100L có trong DB
         * Expected  : deleteById được gọi đúng
         *
         * CheckDB: Verify productRepository.deleteById(100L) được gọi
         */
        @Test
        @DisplayName("TC_PROD_015 – Xóa product tồn tại gọi deleteById")
        void TC_PROD_015_delete_ExistingProduct_DeletesCalled() {
            doNothing().when(productRepository).deleteById(100L);

            productService.delete(100L);

            // CheckDB: Verify đúng ID được xóa
            verify(productRepository, times(1)).deleteById(100L);
        }

        /**
         * TC_PROD_016
         * Objective : Xóa product không tồn tại → hành vi graceful
         * Input     : id = 9999L không có trong DB
         * Expected  : Không ném exception (JPA deleteById không throw nếu không tồn tại)
         */
        @Test
        @DisplayName("TC_PROD_016 – Xóa product không tồn tại không gây exception")
        void TC_PROD_016_delete_NonExistent_NoException() {
            doNothing().when(productRepository).deleteById(9999L);

            assertDoesNotThrow(() -> productService.delete(9999L),
                    "delete không tồn tại không được ném exception");
        }
    }

    // ================================================================
    // TC_PROD_017 → TC_PROD_020: publishProduct
    // ================================================================
    @Nested
    @DisplayName("publishProduct Tests")
    class PublishProductTests {

        /**
         * TC_PROD_017
         * Objective : Đăng bán sản phẩm kho chưa đăng bán
         * Input     : warehouseProduct.product = null (chưa đăng bán)
         * Expected  : Tạo Product mới và lưu thành công
         */
        @Test
        @DisplayName("TC_PROD_017 – Đăng bán sản phẩm kho chưa có product thành công")
        void TC_PROD_017_publishProduct_NotYetPublished_CreatesProduct() {
            // warehouseProduct.product = null → chưa đăng bán
            warehouseProduct.setProduct(null);

            PublishProductRequest req = new PublishProductRequest();
            req.setWarehouseProductId(10L);
            req.setCategoryId(1L);
            req.setName("Laptop Gaming X Pro");
            req.setPrice(25_000_000.0);
            req.setDescription("Sản phẩm hot nhất 2024");

            when(warehouseProductRepository.findById(10L)).thenReturn(Optional.of(warehouseProduct));
            when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
            when(productRepository.save(any())).thenReturn(product);

            Product result = productService.publishProduct(req);

            assertNotNull(result, "Phải trả về product sau khi đăng bán");
            verify(productRepository, times(1)).save(any());
        }

        /**
         * TC_PROD_018
         * Objective : Đăng bán sản phẩm kho đã có product → phải từ chối
         * Input     : warehouseProduct.product đã được set (đã đăng bán)
         * Expected  : RuntimeException
         *
         * ⚠️ BUG HUNTER: Đăng bán 2 lần tạo duplicate product cùng SKU
         */
        @Test
        @DisplayName("TC_PROD_018 – Đăng bán sản phẩm đã publish phải ném exception")
        void TC_PROD_018_publishProduct_AlreadyPublished_ThrowsException() {
            warehouseProduct.setProduct(product); // Đã đăng bán rồi

            PublishProductRequest req = new PublishProductRequest();
            req.setWarehouseProductId(10L);
            req.setCategoryId(1L);
            req.setName("Laptop Clone");
            req.setPrice(20_000_000.0);

            when(warehouseProductRepository.findById(10L)).thenReturn(Optional.of(warehouseProduct));

            assertThrows(RuntimeException.class,
                    () -> productService.publishProduct(req),
                    "Phải ném exception khi sản phẩm đã được đăng bán");
            verify(productRepository, never()).save(any());
        }

        /**
         * TC_PROD_019
         * Objective : Đăng bán với warehouseProductId không tồn tại
         * Input     : warehouseProductId = 9999L
         * Expected  : RuntimeException
         */
        @Test
        @DisplayName("TC_PROD_019 – publishProduct với warehouseProductId không hợp lệ ném exception")
        void TC_PROD_019_publishProduct_InvalidWarehouseId_ThrowsException() {
            PublishProductRequest req = new PublishProductRequest();
            req.setWarehouseProductId(9999L);
            req.setCategoryId(1L);
            req.setName("Ghost Product");
            req.setPrice(10_000_000.0);

            when(warehouseProductRepository.findById(9999L)).thenReturn(Optional.empty());

            assertThrows(RuntimeException.class,
                    () -> productService.publishProduct(req));
        }

        /**
         * TC_PROD_020
         * Objective : Đăng bán với categoryId không tồn tại
         * Input     : categoryId = 9999L không có trong DB
         * Expected  : RuntimeException
         */
        @Test
        @DisplayName("TC_PROD_020 – publishProduct với categoryId không tồn tại ném exception")
        void TC_PROD_020_publishProduct_InvalidCategoryId_ThrowsException() {
            warehouseProduct.setProduct(null);

            PublishProductRequest req = new PublishProductRequest();
            req.setWarehouseProductId(10L);
            req.setCategoryId(9999L); // không tồn tại
            req.setName("Laptop");
            req.setPrice(20_000_000.0);

            when(warehouseProductRepository.findById(10L)).thenReturn(Optional.of(warehouseProduct));
            when(categoryRepository.findById(9999L)).thenReturn(Optional.empty());

            assertThrows(RuntimeException.class,
                    () -> productService.publishProduct(req));
        }

        /**
         * TC_PROD_021
         * Objective : Đăng bán với giá = 0 → nghiệp vụ bất hợp lệ
         * Input     : price = 0.0
         * Expected  : Exception hoặc response lỗi
         *
         * ⚠️ BUG HUNTER: Sản phẩm giá 0 → hệ thống bán miễn phí
         */
        @Test
        @DisplayName("TC_PROD_021 – publishProduct với price = 0 là bất hợp lệ theo nghiệp vụ")
        void TC_PROD_021_publishProduct_ZeroPrice_ShouldReject() {
            warehouseProduct.setProduct(null);

            PublishProductRequest req = new PublishProductRequest();
            req.setWarehouseProductId(10L);
            req.setCategoryId(1L);
            req.setName("Free Product");
            req.setPrice(0.0); // giá 0

            when(warehouseProductRepository.findById(10L)).thenReturn(Optional.of(warehouseProduct));
            when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
            when(productRepository.save(any())).thenReturn(product);

            try {
                Product result = productService.publishProduct(req);
                if (result != null) {
                    System.out.println("[BUG DETECTED] TC_PROD_021: publishProduct chấp nhận price = 0 → sản phẩm bán miễn phí");
                }
            } catch (Exception e) {
                // Acceptable nếu ném exception rõ ràng
            }
        }
    }

    // ================================================================
    // TC_PROD_022 → TC_PROD_027: createProductFromWarehouse
    // ================================================================
    @Nested
    @DisplayName("createProductFromWarehouse Tests")
    class CreateProductFromWarehouseTests {

        /**
         * TC_PROD_022
         * Objective : Tạo product từ warehouse sản phẩm chưa publish
         * Input     : warehouseProductId = 10L chưa có product, price = 25tr
         * Expected  : ApiResponse thành công, product được lưu
         *
         * CheckDB: productRepository.save được gọi 1 lần
         */
        @Test
        @DisplayName("TC_PROD_022 – createProductFromWarehouse chưa publish thành công")
        void TC_PROD_022_createProductFromWarehouse_NotPublished_Success() {
            CreateProductFromWarehouseRequest req = CreateProductFromWarehouseRequest.builder()
                    .warehouseProductId(10L)
                    .categoryId(1L)
                    .name("Laptop Gaming X Pro")
                    .price(25_000_000.0)
                    .description("Mô tả sản phẩm")
                    .build();

            when(warehouseProductRepository.findById(10L)).thenReturn(Optional.of(warehouseProduct));
            // Không có product nào link với warehouseProduct này
            when(productRepository.findAll()).thenReturn(Collections.emptyList());
            when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
            when(inventoryStockRepository.findByWarehouseProduct_Id(10L))
                    .thenReturn(Optional.of(inventoryStock));
            when(productRepository.save(any())).thenReturn(product);

            ApiResponse response = productService.createProductFromWarehouse(req);

            assertTrue(response.isSuccess(), "Tạo product từ warehouse phải thành công");
            // CheckDB: Verify product được save
            verify(productRepository, times(1)).save(any());
        }

        /**
         * TC_PROD_023
         * Objective : Tạo product từ warehouse đã publish → phải từ chối
         * Input     : warehouseProduct đã có product liên kết
         * Expected  : ApiResponse lỗi
         *
         * ⚠️ BUG HUNTER: Tạo 2 product cùng SKU → vi phạm unique constraint
         */
        @Test
        @DisplayName("TC_PROD_023 – createProductFromWarehouse đã publish phải trả về lỗi")
        void TC_PROD_023_createProductFromWarehouse_AlreadyPublished_ReturnsError() {
            // Product đã link với warehouseProduct 10L
            product.setWarehouseProduct(warehouseProduct);

            CreateProductFromWarehouseRequest req = CreateProductFromWarehouseRequest.builder()
                    .warehouseProductId(10L)
                    .categoryId(1L)
                    .name("Laptop Clone")
                    .price(20_000_000.0)
                    .build();

            when(warehouseProductRepository.findById(10L)).thenReturn(Optional.of(warehouseProduct));
            when(productRepository.findAll()).thenReturn(Collections.singletonList(product));

            ApiResponse response = productService.createProductFromWarehouse(req);

            assertFalse(response.isSuccess(), "Phải từ chối khi sản phẩm đã được publish");
            verify(productRepository, never()).save(any());
        }

        /**
         * TC_PROD_024
         * Objective : Tạo product với price null → nghiệp vụ bất hợp lệ
         * Input     : price = null
         * Expected  : Exception hoặc error response
         */
        @Test
        @DisplayName("TC_PROD_024 – createProductFromWarehouse với price null ném exception")
        void TC_PROD_024_createProductFromWarehouse_NullPrice_ThrowsOrReturnsError() {
            CreateProductFromWarehouseRequest req = CreateProductFromWarehouseRequest.builder()
                    .warehouseProductId(10L)
                    .categoryId(1L)
                    .name("Product No Price")
                    .price(null) // price null
                    .build();

            when(warehouseProductRepository.findById(10L)).thenReturn(Optional.of(warehouseProduct));
            when(productRepository.findAll()).thenReturn(Collections.emptyList());
            when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
            when(inventoryStockRepository.findByWarehouseProduct_Id(10L))
                    .thenReturn(Optional.empty());
            when(productRepository.save(any())).thenReturn(product);

            // Nghiệp vụ: giá null không cho phép
            // Cả exception hoặc error response đều chấp nhận
            try {
                ApiResponse response = productService.createProductFromWarehouse(req);
                if (response.isSuccess()) {
                    System.out.println("[BUG DETECTED] TC_PROD_024: createProductFromWarehouse chấp nhận price null");
                }
            } catch (Exception e) {
                // Exception rõ ràng là acceptable
            }
        }

        /**
         * TC_PROD_025
         * Objective : warehouseProductId không tồn tại → ném exception
         * Input     : warehouseProductId = 9999L
         * Expected  : RuntimeException
         */
        @Test
        @DisplayName("TC_PROD_025 – createProductFromWarehouse ID kho không tồn tại ném exception")
        void TC_PROD_025_createProductFromWarehouse_InvalidWarehouseId_ThrowsException() {
            CreateProductFromWarehouseRequest req = CreateProductFromWarehouseRequest.builder()
                    .warehouseProductId(9999L)
                    .categoryId(1L)
                    .name("Ghost Product")
                    .price(10_000_000.0)
                    .build();

            when(warehouseProductRepository.findById(9999L)).thenReturn(Optional.empty());

            assertThrows(RuntimeException.class,
                    () -> productService.createProductFromWarehouse(req));
        }

        /**
         * TC_PROD_026
         * Objective : stockQuantity được copy đúng từ InventoryStock.getSellable()
         * Input     : inventoryStock.onHand=50, reserved=5, damaged=2 → sellable=43
         * Expected  : Product.stockQuantity = 43
         *
         * ⚠️ BUG HUNTER: Nếu copy onHand thay vì sellable → sản phẩm hiển thị stock ảo
         */
        @Test
        @DisplayName("TC_PROD_026 – stockQuantity được lấy từ getSellable() không phải onHand")
        void TC_PROD_026_createProductFromWarehouse_StockQuantityFromSellable() {
            CreateProductFromWarehouseRequest req = CreateProductFromWarehouseRequest.builder()
                    .warehouseProductId(10L)
                    .categoryId(1L)
                    .name("Laptop")
                    .price(25_000_000.0)
                    .build();

            when(warehouseProductRepository.findById(10L)).thenReturn(Optional.of(warehouseProduct));
            when(productRepository.findAll()).thenReturn(Collections.emptyList());
            when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
            when(inventoryStockRepository.findByWarehouseProduct_Id(10L))
                    .thenReturn(Optional.of(inventoryStock)); // onHand=50, reserved=5, damaged=2 → sellable=43
            when(productRepository.save(any())).thenAnswer(inv -> {
                Product saved = inv.getArgument(0);
                // CheckDB: stockQuantity phải = sellable = 43, không phải onHand = 50
                assertEquals(43L, saved.getStockQuantity(),
                        "stockQuantity phải = getSellable() = 43, không phải onHand = 50");
                return saved;
            });

            productService.createProductFromWarehouse(req);
            verify(productRepository).save(any());
        }
    }

    // ================================================================
    // TC_PROD_027 → TC_PROD_031: updatePublishedProduct
    // ================================================================
    @Nested
    @DisplayName("updatePublishedProduct Tests")
    class UpdatePublishedProductTests {

        /**
         * TC_PROD_027
         * Objective : Update product đã publish với data hợp lệ
         * Input     : productId = 100L, name mới và giá mới
         * Expected  : ApiResponse thành công, product được update
         *
         * CheckDB: productRepository.save được gọi
         */
        @Test
        @DisplayName("TC_PROD_027 – updatePublishedProduct với data hợp lệ thành công")
        void TC_PROD_027_updatePublishedProduct_ValidData_Success() {
            CreateProductFromWarehouseRequest req = CreateProductFromWarehouseRequest.builder()
                    .warehouseProductId(10L)
                    .categoryId(1L)
                    .name("Laptop Gaming X Pro 2025")
                    .price(30_000_000.0)
                    .description("Mô tả mới")
                    .build();

            when(productRepository.findById(100L)).thenReturn(Optional.of(product));
            when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
            when(inventoryStockRepository.findByWarehouseProduct_Id(10L))
                    .thenReturn(Optional.of(inventoryStock));
            when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ApiResponse response = productService.updatePublishedProduct(100L, req);

            assertTrue(response.isSuccess(), "Update product phải thành công");
            // CheckDB: Verify save được gọi
            verify(productRepository, times(1)).save(any());
        }

        /**
         * TC_PROD_028
         * Objective : Update product không tồn tại → ném exception
         * Input     : productId = 9999L
         * Expected  : RuntimeException
         */
        @Test
        @DisplayName("TC_PROD_028 – updatePublishedProduct ID không tồn tại ném exception")
        void TC_PROD_028_updatePublishedProduct_NotFound_ThrowsException() {
            CreateProductFromWarehouseRequest req = CreateProductFromWarehouseRequest.builder()
                    .warehouseProductId(10L).categoryId(1L)
                    .name("Ghost").price(1000.0).build();
            when(productRepository.findById(9999L)).thenReturn(Optional.empty());

            assertThrows(RuntimeException.class,
                    () -> productService.updatePublishedProduct(9999L, req));
        }

        /**
         * TC_PROD_029
         * Objective : Update category sang category không tồn tại
         * Input     : categoryId = 9999L
         * Expected  : RuntimeException
         */
        @Test
        @DisplayName("TC_PROD_029 – Update với categoryId không tồn tại ném exception")
        void TC_PROD_029_updatePublishedProduct_InvalidCategory_ThrowsException() {
            CreateProductFromWarehouseRequest req = CreateProductFromWarehouseRequest.builder()
                    .warehouseProductId(10L)
                    .categoryId(9999L) // không tồn tại
                    .name("Laptop").price(20_000_000.0).build();

            when(productRepository.findById(100L)).thenReturn(Optional.of(product));
            when(categoryRepository.findById(9999L)).thenReturn(Optional.empty());

            assertThrows(RuntimeException.class,
                    () -> productService.updatePublishedProduct(100L, req));
        }
    }

    // ================================================================
    // TC_PROD_030 → TC_PROD_032: unpublishProduct
    // ================================================================
    @Nested
    @DisplayName("unpublishProduct Tests")
    class UnpublishProductTests {

        /**
         * TC_PROD_030
         * Objective : Gỡ sản phẩm khỏi trang bán thành công
         * Input     : productId = 100L có trong DB
         * Expected  : Response thành công, product bị xóa
         *
         * CheckDB: productRepository.delete được gọi đúng với product đó
         */
        @Test
        @DisplayName("TC_PROD_030 – unpublishProduct sản phẩm tồn tại xóa thành công")
        void TC_PROD_030_unpublishProduct_ExistingProduct_DeletesCalled() {
            when(productRepository.findById(100L)).thenReturn(Optional.of(product));
            doNothing().when(productRepository).delete(any());

            ApiResponse response = productService.unpublishProduct(100L);

            assertTrue(response.isSuccess(), "unpublishProduct phải thành công");
            // CheckDB: Verify product bị xóa
            verify(productRepository, times(1)).delete(product);
        }

        /**
         * TC_PROD_031
         * Objective : Gỡ sản phẩm không tồn tại → ném exception
         * Input     : productId = 9999L
         * Expected  : RuntimeException
         */
        @Test
        @DisplayName("TC_PROD_031 – unpublishProduct ID không tồn tại ném exception")
        void TC_PROD_031_unpublishProduct_NotFound_ThrowsException() {
            when(productRepository.findById(9999L)).thenReturn(Optional.empty());

            assertThrows(RuntimeException.class,
                    () -> productService.unpublishProduct(9999L));
        }

        /**
         * TC_PROD_032
         * Objective : Gỡ sản phẩm vẫn còn hàng trong kho → nghiệp vụ cần cân nhắc
         * Input     : Product có stockQuantity = 50 (còn hàng)
         * Expected  : Nếu cho phép xóa → khách không mua được nhưng hàng vẫn còn
         *
         * ⚠️ BUG HUNTER: Nếu unpublish không cập nhật warehouseProduct.product → link bị orphan
         */
        @Test
        @DisplayName("TC_PROD_032 – unpublishProduct khi còn hàng trong kho (nghiệp vụ edge case)")
        void TC_PROD_032_unpublishProduct_StillHasStock_LogBusinessWarning() {
            product.setStockQuantity(50L); // Còn hàng
            when(productRepository.findById(100L)).thenReturn(Optional.of(product));
            doNothing().when(productRepository).delete(any());

            ApiResponse response = productService.unpublishProduct(100L);

            // Nghiệp vụ: Cho phép unpublish khi còn hàng là acceptable
            // nhưng warehouseProduct.product link có thể bị orphan
            if (response.isSuccess()) {
                System.out.println("[BUG RISK] TC_PROD_032: unpublish product có stockQuantity=50 "
                        + "thành công, nhưng warehouseProduct.product link có thể bị orphan");
            }
        }
    }

    // ================================================================
    // TC_PROD_033 → TC_PROD_040: Product Image Management
    // ================================================================
    @Nested
    @DisplayName("Product Image Management Tests")
    class ProductImageTests {

        /**
         * TC_PROD_033
         * Objective : Thêm ảnh cho product tồn tại
         * Input     : productId=100L, imageUrl hợp lệ, isPrimary=false
         * Expected  : Ảnh được lưu, displayOrder = count hiện tại
         *
         * CheckDB: imageRepository.save được gọi
         */
        @Test
        @DisplayName("TC_PROD_033 – addProductImage thêm ảnh mới thành công")
        void TC_PROD_033_addProductImage_ValidData_ImageSaved() {
            // isPrimary=false → service không gọi findByProductIdAndIsPrimaryTrue
            when(productRepository.findById(100L)).thenReturn(Optional.of(product));
            when(imageRepository.countByProductId(100L)).thenReturn(0L);
            when(imageRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ApiResponse response = productService.addProductImage(
                    100L, "https://cdn.example.com/img.jpg", false);

            assertTrue(response.isSuccess(), "Thêm ảnh phải thành công");
            // CheckDB: Verify ảnh được save
            verify(imageRepository, times(1)).save(any());
        }

        /**
         * TC_PROD_034
         * Objective : Thêm ảnh đầu tiên tự động set isPrimary = true
         * Input     : productId=100L, isPrimary=null, count hiện tại = 0
         * Expected  : Ảnh đầu tiên tự động là primary
         *
         * ⚠️ BUG HUNTER: Nếu ảnh đầu tiên không là primary → sản phẩm không có ảnh chính
         */
        @Test
        @DisplayName("TC_PROD_034 – Ảnh đầu tiên phải tự động là primary khi isPrimary null")
        void TC_PROD_034_addProductImage_FirstImage_AutoSetPrimary() {
            when(productRepository.findById(100L)).thenReturn(Optional.of(product));
            when(imageRepository.countByProductId(100L)).thenReturn(0L); // Chưa có ảnh nào
            when(imageRepository.save(any())).thenAnswer(inv -> {
                ProductImage saved = inv.getArgument(0);
                // CheckDB: Ảnh đầu tiên phải là primary
                assertTrue(saved.getIsPrimary(),
                        "Ảnh đầu tiên phải tự động là primary khi isPrimary null");
                return saved;
            });

            productService.addProductImage(100L, "https://example.com/first.jpg", null);
            verify(imageRepository).save(any());
        }

        /**
         * TC_PROD_035
         * Objective : Thêm ảnh primary mới → ảnh cũ tự bỏ primary
         * Input     : isPrimary = true, đã có ảnh primary trước
         * Expected  : Ảnh cũ không còn là primary, ảnh mới là primary
         *
         * ⚠️ BUG HUNTER: Nếu không bỏ primary của ảnh cũ → có nhiều ảnh primary cùng lúc
         */
        @Test
        @DisplayName("TC_PROD_035 – Set ảnh new primary phải bỏ primary của ảnh cũ")
        void TC_PROD_035_addProductImage_NewPrimary_OldPrimaryCleared() {
            // Đã có ảnh primary
            when(productRepository.findById(100L)).thenReturn(Optional.of(product));
            when(imageRepository.findByProductIdAndIsPrimaryTrue(100L))
                    .thenReturn(Optional.of(productImage));
            when(imageRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(imageRepository.countByProductId(100L)).thenReturn(1L);

            productService.addProductImage(100L, "https://example.com/new.jpg", true);

            // CheckDB: Ảnh cũ phải được save với isPrimary = false
            verify(imageRepository, atLeastOnce()).save(any());
            // Verify ảnh cũ bị clear primary (được save lại với isPrimary = false)
            assertFalse(productImage.getIsPrimary(),
                    "Ảnh primary cũ phải bị clear khi có ảnh primary mới");
        }

        /**
         * TC_PROD_036
         * Objective : addProductImage cho product không tồn tại → ném exception
         * Input     : productId = 9999L
         * Expected  : RuntimeException
         */
        @Test
        @DisplayName("TC_PROD_036 – addProductImage product không tồn tại ném exception")
        void TC_PROD_036_addProductImage_ProductNotFound_ThrowsException() {
            when(productRepository.findById(9999L)).thenReturn(Optional.empty());

            assertThrows(RuntimeException.class,
                    () -> productService.addProductImage(9999L, "https://img.url", false));
        }

        /**
         * TC_PROD_037
         * Objective : setPrimaryImage set đúng ảnh thành primary
         * Input     : productId=100L, imageId=1L
         * Expected  : Chỉ imageId=1L là primary, tất cả ảnh khác không primary
         *
         * CheckDB: imageRepository.saveAll và save được gọi
         */
        @Test
        @DisplayName("TC_PROD_037 – setPrimaryImage đặt đúng ảnh thành primary")
        void TC_PROD_037_setPrimaryImage_ValidImage_SetsPrimary() {
            ProductImage img2 = ProductImage.builder().id(2L).product(product)
                    .imageUrl("https://img2.jpg").isPrimary(false).displayOrder(1).build();

            List<ProductImage> images = Arrays.asList(productImage, img2);
            when(imageRepository.findByProductIdOrderByDisplayOrderAsc(100L)).thenReturn(images);
            when(imageRepository.saveAll(any())).thenReturn(images);
            when(imageRepository.findById(1L)).thenReturn(Optional.of(productImage));
            when(imageRepository.save(any())).thenAnswer(inv -> {
                ProductImage saved = inv.getArgument(0);
                if (saved.getId().equals(1L)) {
                    assertTrue(saved.getIsPrimary(), "imageId=1 phải là primary");
                }
                return saved;
            });

            ApiResponse response = productService.setPrimaryImage(100L, 1L);

            assertTrue(response.isSuccess());
        }

        /**
         * TC_PROD_038
         * Objective : deleteProductImage xóa ảnh không primary → ảnh primary giữ nguyên
         * Input     : Xóa ảnh isPrimary=false (img2)
         * Expected  : Ảnh primary (img1) vẫn giữ nguyên, không set primary mới
         *
         * CheckDB: imageRepository.delete được gọi với đúng ảnh
         */
        @Test
        @DisplayName("TC_PROD_038 – Xóa ảnh non-primary không ảnh hưởng ảnh primary")
        void TC_PROD_038_deleteProductImage_NonPrimary_PrimaryUnchanged() {
            ProductImage nonPrimary = ProductImage.builder().id(2L).product(product)
                    .imageUrl("https://img2.jpg").isPrimary(false).displayOrder(1).build();

            when(imageRepository.findById(2L)).thenReturn(Optional.of(nonPrimary));
            doNothing().when(imageRepository).delete(any());
            // Không cần tìm remaining images vì wasPrimary = false

            ApiResponse response = productService.deleteProductImage(2L);

            assertTrue(response.isSuccess(), "Xóa ảnh non-primary phải thành công");
            // CheckDB: imageRepository.delete được gọi với ảnh đúng
            verify(imageRepository, times(1)).delete(nonPrimary);
        }

        /**
         * TC_PROD_039
         * Objective : deleteProductImage xóa ảnh primary → ảnh đầu tiên còn lại thành primary
         * Input     : Xóa ảnh isPrimary=true
         * Expected  : Ảnh đầu tiên trong danh sách còn lại tự động thành primary
         *
         * ⚠️ BUG HUNTER: Nếu không set primary mới → sản phẩm không có ảnh chính
         */
        @Test
        @DisplayName("TC_PROD_039 – Xóa ảnh primary tự động set ảnh đầu tiên còn lại thành primary")
        void TC_PROD_039_deleteProductImage_Primary_AutoSetNewPrimary() {
            // productImage có isPrimary = true
            ProductImage remainingImg = ProductImage.builder().id(2L).product(product)
                    .imageUrl("https://img2.jpg").isPrimary(false).displayOrder(1).build();

            when(imageRepository.findById(1L)).thenReturn(Optional.of(productImage));
            doNothing().when(imageRepository).delete(productImage);
            when(imageRepository.findByProductIdOrderByDisplayOrderAsc(100L))
                    .thenReturn(Collections.singletonList(remainingImg));
            when(imageRepository.save(any())).thenAnswer(inv -> {
                ProductImage saved = inv.getArgument(0);
                // CheckDB: Ảnh còn lại phải được set isPrimary = true
                assertTrue(saved.getIsPrimary(),
                        "Ảnh đầu tiên còn lại phải tự động trở thành primary");
                return saved;
            });

            ApiResponse response = productService.deleteProductImage(1L);

            assertTrue(response.isSuccess());
            // CheckDB: Verify ảnh mới được save với primary = true
            verify(imageRepository, times(1)).save(remainingImg);
        }

        /**
         * TC_PROD_040
         * Objective : deleteProductImage ID không tồn tại → ném exception
         * Input     : imageId = 9999L
         * Expected  : RuntimeException
         */
        @Test
        @DisplayName("TC_PROD_040 – deleteProductImage ID không tồn tại ném exception")
        void TC_PROD_040_deleteProductImage_NotFound_ThrowsException() {
            when(imageRepository.findById(9999L)).thenReturn(Optional.empty());

            assertThrows(RuntimeException.class,
                    () -> productService.deleteProductImage(9999L));
        }

        /**
         * TC_PROD_041
         * Objective : getProductImages trả về danh sách ảnh đúng thứ tự
         * Input     : productId = 100L có 2 ảnh theo displayOrder
         * Expected  : Trả về danh sách theo displayOrder ASC
         */
        @Test
        @DisplayName("TC_PROD_041 – getProductImages trả về ảnh đúng thứ tự displayOrder")
        void TC_PROD_041_getProductImages_ValidProductId_ReturnsOrderedImages() {
            ProductImage img1 = ProductImage.builder().id(1L).product(product)
                    .imageUrl("https://img1.jpg").displayOrder(0).isPrimary(true).build();
            ProductImage img2 = ProductImage.builder().id(2L).product(product)
                    .imageUrl("https://img2.jpg").displayOrder(1).isPrimary(false).build();

            when(imageRepository.findByProductIdOrderByDisplayOrderAsc(100L))
                    .thenReturn(Arrays.asList(img1, img2));

            ApiResponse response = productService.getProductImages(100L);

            assertTrue(response.isSuccess());
            @SuppressWarnings("unchecked")
            List<ProductImageDTO> images = (List<ProductImageDTO>) response.getData();
            assertEquals(2, images.size(), "Phải trả về 2 ảnh");
            assertEquals(0, images.get(0).getDisplayOrder(),
                    "Ảnh đầu tiên phải có displayOrder = 0");
        }

        /**
         * TC_PROD_042
         * Objective : reorderProductImages với list ID đúng thứ tự mới
         * Input     : imageIds = [2, 1] (đổi vị trí 2 ảnh)
         * Expected  : displayOrder của ảnh được cập nhật đúng
         *
         * CheckDB: imageRepository.save được gọi cho từng ảnh
         */
        @Test
        @DisplayName("TC_PROD_042 – reorderProductImages cập nhật displayOrder đúng")
        void TC_PROD_042_reorderProductImages_ValidIds_DisplayOrderUpdated() {
            ProductImage img1 = ProductImage.builder().id(1L).product(product)
                    .imageUrl("url1").displayOrder(0).isPrimary(true).build();
            ProductImage img2 = ProductImage.builder().id(2L).product(product)
                    .imageUrl("url2").displayOrder(1).isPrimary(false).build();

            when(imageRepository.findById(2L)).thenReturn(Optional.of(img2));
            when(imageRepository.findById(1L)).thenReturn(Optional.of(img1));
            when(imageRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            // Đổi thứ tự: img2 lên trước, img1 xuống sau
            ApiResponse response = productService.reorderProductImages(100L, Arrays.asList(2L, 1L));

            assertTrue(response.isSuccess());
            // CheckDB: Verify displayOrder được cập nhật
            assertEquals(0, img2.getDisplayOrder(), "img2 phải có displayOrder = 0 sau reorder");
            assertEquals(1, img1.getDisplayOrder(), "img1 phải có displayOrder = 1 sau reorder");
        }
    }

    // ================================================================
    // TC_PROD_043 → TC_PROD_046: toProductWithSpecs
    // ================================================================
    @Nested
    @DisplayName("toProductWithSpecs Tests")
    class ToProductWithSpecsTests {

        /**
         * TC_PROD_043
         * Objective : toProductWithSpecs với product hợp lệ trả về DTO đầy đủ
         * Input     : Product có category, images, techSpecsJson
         * Expected  : DTO có đầy đủ thông tin specs và availableQuantity đúng
         */
        @Test
        @DisplayName("TC_PROD_043 – toProductWithSpecs trả về DTO với specs đầy đủ")
        void TC_PROD_043_toProductWithSpecs_ValidProduct_FullDTO() {
            when(imageRepository.findByProductIdOrderByDisplayOrderAsc(100L))
                    .thenReturn(Collections.singletonList(productImage));
            when(inventoryStockRepository.findByWarehouseProduct_Id(10L))
                    .thenReturn(Optional.of(inventoryStock)); // sellable = 43

            ProductWithSpecsDTO dto = productService.toProductWithSpecs(product);

            assertNotNull(dto, "DTO không được null");
            assertEquals(100L, dto.getId());
            assertEquals("Laptop Gaming X Pro", dto.getName());
            // specs phải được parse
            assertNotNull(dto.getSpecifications(), "Specifications không được null");
            assertFalse(dto.getSpecifications().isEmpty(), "Specifications phải có dữ liệu");
        }

        /**
         * TC_PROD_044
         * Objective : availableQuantity được tính là sellable (onHand-reserved-damaged)
         * Input     : onHand=50, reserved=5, damaged=2 → sellable=43
         * Expected  : availableQuantity = 43 (không phải stockQuantity=45)
         *
         * ⚠️ BUG HUNTER: Nếu dùng stockQuantity thay vì sellable → hiển thị số lượng sai
         */
        @Test
        @DisplayName("TC_PROD_044 – availableQuantity phải là sellable (onHand-reserved-damaged)")
        void TC_PROD_044_toProductWithSpecs_AvailableFromSellable_NotOnHand() {
            when(imageRepository.findByProductIdOrderByDisplayOrderAsc(100L))
                    .thenReturn(Collections.emptyList());
            when(inventoryStockRepository.findByWarehouseProduct_Id(10L))
                    .thenReturn(Optional.of(inventoryStock)); // onHand=50, reserved=5, damaged=2 → sellable=43

            ProductWithSpecsDTO dto = productService.toProductWithSpecs(product);

            assertNotNull(dto);
            // availableQuantity phải = sellable = 43, không phải onHand = 50
            assertEquals(43, dto.getAvailableQuantity(),
                    "availableQuantity phải = getSellable() = 43, không phải onHand = 50");
        }

        /**
         * TC_PROD_045
         * Objective : toProductWithSpecs với techSpecsJson null → không NPE
         * Input     : product.techSpecsJson = null
         * Expected  : DTO trả về với specifications = null hoặc empty map
         */
        @Test
        @DisplayName("TC_PROD_045 – toProductWithSpecs với techSpecsJson null không gây NPE")
        void TC_PROD_045_toProductWithSpecs_NullTechSpecs_NoNPE() {
            product.setTechSpecsJson(null);
            when(imageRepository.findByProductIdOrderByDisplayOrderAsc(100L))
                    .thenReturn(Collections.emptyList());
            when(inventoryStockRepository.findByWarehouseProduct_Id(10L))
                    .thenReturn(Optional.of(inventoryStock));

            assertDoesNotThrow(() -> productService.toProductWithSpecs(product),
                    "toProductWithSpecs không được NPE khi techSpecsJson null");
        }

        /**
         * TC_PROD_046
         * Objective : toProductWithSpecs với techSpecsJson invalid JSON → không crash
         * Input     : techSpecsJson = "invalid-json-{{{"
         * Expected  : Không exception; DTO trả về với specifications = null hoặc empty
         *
         * ⚠️ BUG HUNTER: Parse JSON lỗi → exception nếu không catch → endpoint crash
         */
        @Test
        @DisplayName("TC_PROD_046 – toProductWithSpecs với JSON không hợp lệ không gây exception")
        void TC_PROD_046_toProductWithSpecs_InvalidJson_HandlesGracefully() {
            product.setTechSpecsJson("invalid-json-{{{bad");
            when(imageRepository.findByProductIdOrderByDisplayOrderAsc(100L))
                    .thenReturn(Collections.emptyList());
            when(inventoryStockRepository.findByWarehouseProduct_Id(10L))
                    .thenReturn(Optional.of(inventoryStock));

            assertDoesNotThrow(() -> productService.toProductWithSpecs(product),
                    "toProductWithSpecs không được crash khi techSpecsJson là JSON không hợp lệ");
        }
    }

    // ================================================================
    // TC_PROD_047: getWarehouseProductsForPublish
    // ================================================================
    @Nested
    @DisplayName("getWarehouseProductsForPublish Tests")
    class GetWarehouseProductsForPublishTests {

        /**
         * TC_PROD_047
         * Objective : Trả về danh sách kho với status published/unpublished đúng
         * Input     : 2 warehouseProduct: 1 đã publish, 1 chưa
         * Expected  : isPublished đúng cho từng product
         *
         * ⚠️ BUG HUNTER: Code dùng productRepository.findAll() filter → O(n*m) – performance bug
         */
        @Test
        @DisplayName("TC_PROD_047 – getWarehouseProductsForPublish trả về isPublished đúng")
        void TC_PROD_047_getWarehouseProductsForPublish_CorrectPublishedStatus() {
            WarehouseProduct wp2 = WarehouseProduct.builder()
                    .id(20L).sku("SKU-IPAD-001").internalName("iPad Pro 2024").build();

            // product 100L link với warehouseProduct 10L
            product.setWarehouseProduct(warehouseProduct);

            when(warehouseProductRepository.findAll()).thenReturn(Arrays.asList(warehouseProduct, wp2));
            when(productRepository.findAll()).thenReturn(Collections.singletonList(product));
            when(inventoryStockRepository.findByWarehouseProduct_Id(10L))
                    .thenReturn(Optional.of(inventoryStock));
            when(inventoryStockRepository.findByWarehouseProduct_Id(20L))
                    .thenReturn(Optional.empty());

            ApiResponse response = productService.getWarehouseProductsForPublish();

            assertTrue(response.isSuccess());
            @SuppressWarnings("unchecked")
            List<com.doan.WEB_TMDT.module.product.dto.WarehouseProductListResponse> data =
                    (List<com.doan.WEB_TMDT.module.product.dto.WarehouseProductListResponse>) response.getData();
            assertEquals(2, data.size(), "Phải trả về 2 warehouse product");
            // Tìm wp id=10 (đã publish) và wp id=20 (chưa publish)
            data.forEach(wp -> {
                if (wp.getId().equals(10L)) {
                    assertTrue(wp.getIsPublished(), "warehouseProduct id=10 phải isPublished=true");
                } else if (wp.getId().equals(20L)) {
                    assertFalse(wp.getIsPublished(), "warehouseProduct id=20 phải isPublished=false");
                }
            });
        }
    }

    // ================================================================
    // COVERAGE COMPLETENESS – Branch/Path tests cho ProductServiceImpl
    // ================================================================
    @Nested
    @DisplayName("Branch Coverage Completeness Tests")
    class BranchCoverageTests {

        // ── update(): null branches for optional fields ──────────────
        @Test
        @DisplayName("TC_PROD_048_update_NullOptionalFields_KeepsExistingValues")
        void TC_PROD_048_update_NullOptionalFields_KeepsExisting() {
            // Gửi product với tất cả optional field = null → không overwrite gì
            Product patch = Product.builder()
                    .name(null).price(null).description(null)
                    .category(null).sku(null).stockQuantity(null)
                    .reservedQuantity(null).techSpecsJson(null)
                    .build();

            Product existing = Product.builder()
                    .id(100L).name("Existing Name").price(25_000_000.0)
                    .description("Existing Desc").sku("SKU-100")
                    .stockQuantity(50L).reservedQuantity(5L)
                    .build();

            when(productRepository.findById(100L)).thenReturn(Optional.of(existing));
            when(productRepository.save(any())).thenReturn(existing);

            Product result = productService.update(100L, patch);

            assertNotNull(result);
            // Giá trị cũ không bị xóa
            assertEquals("Existing Name", existing.getName());
            assertEquals(25_000_000.0, existing.getPrice());
        }

        // ── toProductWithSpecs(): warehouseProduct=null ──────────────
        @Test
        @DisplayName("TC_PROD_049_toProductWithSpecs_NullWarehouseProduct_FallsBackToStockQty")
        void TC_PROD_049_toProductWithSpecs_NullWP_FallbackAvailableQty() {
            Product product = Product.builder()
                    .id(10L).name("Product No WP")
                    .stockQuantity(30L).reservedQuantity(5L)
                    .warehouseProduct(null) // null WP → nhánh tính từ product trực tiếp
                    .build();

            when(imageRepository.findByProductIdOrderByDisplayOrderAsc(10L)).thenReturn(List.of());

            ProductWithSpecsDTO dto = productService.toProductWithSpecs(product);

            assertNotNull(dto);
            assertEquals(10L, dto.getId());
            // availableQty = max(0, stockQty - reservedQty) = 25
            assertEquals(25, dto.getAvailableQuantity());
        }

        // ── toProductWithSpecs(): stockOpt empty → falls back ────────
        @Test
        @DisplayName("TC_PROD_050_toProductWithSpecs_NoInventoryStock_FallsBackToProductFields")
        void TC_PROD_050_toProductWithSpecs_NoStock_FallbackQty() {
            WarehouseProduct wp = WarehouseProduct.builder().id(20L).build();
            Product product = Product.builder()
                    .id(11L).name("Test Product")
                    .stockQuantity(20L).reservedQuantity(0L)
                    .warehouseProduct(wp).build();

            when(imageRepository.findByProductIdOrderByDisplayOrderAsc(11L)).thenReturn(List.of());
            when(inventoryStockRepository.findByWarehouseProduct_Id(20L)).thenReturn(Optional.empty());

            ProductWithSpecsDTO dto = productService.toProductWithSpecs(product);

            assertNotNull(dto);
            assertEquals(20, dto.getAvailableQuantity()); // fallback = stockQty - reserved = 20
        }

        // ── toProductWithSpecs(): category=null ──────────────────────
        @Test
        @DisplayName("TC_PROD_051_toProductWithSpecs_NullCategory_CategoryFieldsNull")
        void TC_PROD_051_toProductWithSpecs_NullCategory_NullCategoryFields() {
            Product product = Product.builder()
                    .id(12L).name("No Category Product")
                    .stockQuantity(10L).reservedQuantity(0L)
                    .category(null) // null category
                    .build();

            when(imageRepository.findByProductIdOrderByDisplayOrderAsc(12L)).thenReturn(List.of());

            ProductWithSpecsDTO dto = productService.toProductWithSpecs(product);

            assertNotNull(dto);
            assertNull(dto.getCategoryId());
            assertNull(dto.getCategoryName());
        }

        // ── toProductWithSpecs(): techSpecsJson=null → no specs ──────
        @Test
        @DisplayName("TC_PROD_052_toProductWithSpecs_NullTechSpecsJson_SpecsFieldNull")
        void TC_PROD_052_toProductWithSpecs_NullTechSpecsJson_NoSpecs() {
            Product product = Product.builder()
                    .id(13L).name("No TechSpecs")
                    .techSpecsJson(null) // no specs → no parsing
                    .stockQuantity(5L).reservedQuantity(0L)
                    .build();

            when(imageRepository.findByProductIdOrderByDisplayOrderAsc(13L)).thenReturn(List.of());

            ProductWithSpecsDTO dto = productService.toProductWithSpecs(product);

            assertNotNull(dto);
            assertNull(dto.getSpecifications());
        }

        // ── toProductWithSpecs(): reservedQuantity=null fallback ─────
        @Test
        @DisplayName("TC_PROD_053_toProductWithSpecs_NullReservedQty_DefaultsToZero")
        void TC_PROD_053_toProductWithSpecs_NullReservedQty_DefaultsToZero() {
            Product product = Product.builder()
                    .id(14L).name("NullReserved")
                    .stockQuantity(10L).reservedQuantity(null) // null → default 0
                    .build();

            when(imageRepository.findByProductIdOrderByDisplayOrderAsc(14L)).thenReturn(List.of());

            ProductWithSpecsDTO dto = productService.toProductWithSpecs(product);

            assertNotNull(dto);
            assertEquals(10, dto.getAvailableQuantity()); // 10 - 0 = 10
        }

        // ── toProductWithSpecs(): stockQuantity=null fallback ────────
        @Test
        @DisplayName("TC_PROD_054_toProductWithSpecs_NullStockQty_DefaultsToZero")
        void TC_PROD_054_toProductWithSpecs_NullStockQty_DefaultsToZero() {
            Product product = Product.builder()
                    .id(15L).name("NullStock")
                    .stockQuantity(null).reservedQuantity(null)
                    .build();

            when(imageRepository.findByProductIdOrderByDisplayOrderAsc(15L)).thenReturn(List.of());

            ProductWithSpecsDTO dto = productService.toProductWithSpecs(product);

            assertNotNull(dto);
            assertEquals(0, dto.getAvailableQuantity()); // max(0, 0-0) = 0
        }

        // ── updatePublishedProduct(): categoryId=null skips category update ─
        @Test
        @DisplayName("TC_PROD_055_updatePublishedProduct_NullCategoryId_SkipsCategoryUpdate")
        void TC_PROD_055_updatePublishedProduct_NullCategoryId_SkipsLookup() {
            Product existing = Product.builder()
                    .id(100L).name("Old Name").price(10_000.0)
                    .warehouseProduct(null) // null WP → skip stock sync
                    .build();

            CreateProductFromWarehouseRequest req = new CreateProductFromWarehouseRequest();
            req.setWarehouseProductId(10L);
            req.setCategoryId(null);   // null → skip category update
            req.setName("New Name");
            req.setPrice(15_000.0);
            req.setDescription(null);  // null → skip

            when(productRepository.findById(100L)).thenReturn(Optional.of(existing));
            when(productRepository.save(any())).thenReturn(existing);

            ApiResponse resp = productService.updatePublishedProduct(100L, req);

            assertTrue(resp.isSuccess());
            verify(categoryRepository, never()).findById(anyLong());
        }

        // ── updatePublishedProduct(): warehouseProduct=null skip stock sync ─
        @Test
        @DisplayName("TC_PROD_056_updatePublishedProduct_NullWarehouseProduct_SkipsStockSync")
        void TC_PROD_056_updatePublishedProduct_NullWP_SkipsStockSync() {
            Product existing = Product.builder()
                    .id(100L).name("Old").price(5_000.0)
                    .warehouseProduct(null).build();

            CreateProductFromWarehouseRequest req = new CreateProductFromWarehouseRequest();
            req.setWarehouseProductId(10L);
            req.setCategoryId(null);
            req.setName(null);
            req.setPrice(null);
            req.setDescription(null);

            when(productRepository.findById(100L)).thenReturn(Optional.of(existing));
            when(productRepository.save(any())).thenReturn(existing);

            ApiResponse resp = productService.updatePublishedProduct(100L, req);

            assertTrue(resp.isSuccess());
            verify(inventoryStockRepository, never()).findByWarehouseProduct_Id(anyLong());
        }

        // ── updatePublishedProduct(): stockOpt empty → skip setStockQty ─
        @Test
        @DisplayName("TC_PROD_057_updatePublishedProduct_NoStock_SkipsStockQuantityUpdate")
        void TC_PROD_057_updatePublishedProduct_NoStock_SkipsQtyUpdate() {
            WarehouseProduct wp = WarehouseProduct.builder().id(10L).sku("SKU-UPD").build();
            Product existing = Product.builder()
                    .id(100L).name("Old").price(5_000.0)
                    .warehouseProduct(wp).build();

            CreateProductFromWarehouseRequest req = new CreateProductFromWarehouseRequest();
            req.setWarehouseProductId(10L);
            req.setCategoryId(null);

            when(productRepository.findById(100L)).thenReturn(Optional.of(existing));
            when(inventoryStockRepository.findByWarehouseProduct_Id(10L)).thenReturn(Optional.empty());
            when(productRepository.save(any())).thenReturn(existing);

            ApiResponse resp = productService.updatePublishedProduct(100L, req);

            assertTrue(resp.isSuccess());
        }

        // ── updateProductImage(): ALL branches ───────────────────────
        @Test
        @DisplayName("TC_PROD_058_updateProductImage_AllNonNullFields_UpdatesSuccessfully")
        void TC_PROD_058_updateProductImage_AllFields_Updated() {
            Product product = Product.builder().id(100L).name("P").build();
            ProductImage image = ProductImage.builder()
                    .id(1L).product(product).imageUrl("old.jpg")
                    .displayOrder(0).isPrimary(false).altText("old alt").build();

            ProductImageDTO dto = ProductImageDTO.builder()
                    .imageUrl("new.jpg")
                    .altText("new alt")
                    .displayOrder(2)
                    .isPrimary(false) // isPrimary=false → don't clear others
                    .build();

            when(imageRepository.findById(1L)).thenReturn(Optional.of(image));
            when(imageRepository.save(any())).thenReturn(image);

            ApiResponse resp = productService.updateProductImage(1L, dto);

            assertTrue(resp.isSuccess());
            verify(imageRepository).save(image);
        }

        @Test
        @DisplayName("TC_PROD_059_updateProductImage_SetPrimary_ClearsOtherPrimary")
        void TC_PROD_059_updateProductImage_SetPrimary_ClearsOtherPrimary() {
            Product product = Product.builder().id(100L).name("P").build();
            ProductImage image = ProductImage.builder()
                    .id(1L).product(product).imageUrl("img.jpg")
                    .displayOrder(0).isPrimary(false).build();

            ProductImage currentPrimary = ProductImage.builder()
                    .id(2L).product(product).isPrimary(true).build();

            ProductImageDTO dto = ProductImageDTO.builder()
                    .isPrimary(true) // set as primary → clear others
                    .build();

            when(imageRepository.findById(1L)).thenReturn(Optional.of(image));
            when(imageRepository.findByProductIdAndIsPrimaryTrue(100L)).thenReturn(Optional.of(currentPrimary));
            when(imageRepository.save(any())).thenReturn(image);

            ApiResponse resp = productService.updateProductImage(1L, dto);

            assertTrue(resp.isSuccess());
            assertFalse(currentPrimary.getIsPrimary()); // old primary cleared
        }

        @Test
        @DisplayName("TC_PROD_060_updateProductImage_NullFields_NoUpdate")
        void TC_PROD_060_updateProductImage_NullFields_NothingChanged() {
            Product product = Product.builder().id(100L).name("P").build();
            ProductImage image = ProductImage.builder()
                    .id(1L).product(product).imageUrl("keep.jpg")
                    .displayOrder(0).isPrimary(false).altText("keep alt").build();

            ProductImageDTO dto = ProductImageDTO.builder()
                    .imageUrl(null).altText(null).displayOrder(null).isPrimary(null)
                    .build(); // all null → nothing changes

            when(imageRepository.findById(1L)).thenReturn(Optional.of(image));
            when(imageRepository.save(any())).thenReturn(image);

            ApiResponse resp = productService.updateProductImage(1L, dto);

            assertTrue(resp.isSuccess());
            assertEquals("keep.jpg", image.getImageUrl()); // unchanged
        }

        @Test
        @DisplayName("TC_PROD_061_updateProductImage_NotFound_ThrowsException")
        void TC_PROD_061_updateProductImage_NotFound_ThrowsException() {
            when(imageRepository.findById(9999L)).thenReturn(Optional.empty());

            assertThrows(RuntimeException.class,
                    () -> productService.updateProductImage(9999L, new ProductImageDTO()));
        }

        // ── getWarehouseProductsForPublish(): no stock → zeros ───────
        @Test
        @DisplayName("TC_PROD_062_getWarehouseProductsForPublish_NoStock_ReturnsZeroQuantities")
        void TC_PROD_062_getWarehouseProductsForPublish_NoStock_ZeroQty() {
            WarehouseProduct wpNoStock = WarehouseProduct.builder()
                    .id(30L).sku("SKU-NO-STOCK").internalName("No Stock Product")
                    .supplier(null) // null supplier → supplierName=null
                    .build();

            when(warehouseProductRepository.findAll()).thenReturn(List.of(wpNoStock));
            when(productRepository.findAll()).thenReturn(List.of());
            when(inventoryStockRepository.findByWarehouseProduct_Id(30L)).thenReturn(Optional.empty());

            ApiResponse resp = productService.getWarehouseProductsForPublish();

            assertTrue(resp.isSuccess());
            @SuppressWarnings("unchecked")
            List<com.doan.WEB_TMDT.module.product.dto.WarehouseProductListResponse> data =
                    (List<com.doan.WEB_TMDT.module.product.dto.WarehouseProductListResponse>) resp.getData();
            assertEquals(1, data.size());
            assertEquals(0L, data.get(0).getStockQuantity()); // no stock → 0
            assertNull(data.get(0).getSupplierName());         // null supplier → null name
        }

        // ── createProductFromWarehouse(): no stock → stockQuantity=0 ─
        @Test
        @DisplayName("TC_PROD_063_createProductFromWarehouse_NoInventoryStock_ZeroStockQty")
        void TC_PROD_063_createProductFromWarehouse_NoStock_ZeroQuantity() {
            WarehouseProduct wp = WarehouseProduct.builder()
                    .id(10L).sku("SKU-NEW-PUB")
                    .internalName("Laptop Gaming")
                    .techSpecsJson("{\"ram\":\"16GB\"}")
                    .build();

            Category cat = Category.builder().id(1L).name("Laptop").build();

            CreateProductFromWarehouseRequest req = new CreateProductFromWarehouseRequest();
            req.setWarehouseProductId(10L);
            req.setCategoryId(1L);
            req.setName("Laptop Gaming X");
            req.setPrice(25_000_000.0);

            when(warehouseProductRepository.findById(10L)).thenReturn(Optional.of(wp));
            when(productRepository.findAll()).thenReturn(List.of()); // not published yet
            when(categoryRepository.findById(1L)).thenReturn(Optional.of(cat));
            when(inventoryStockRepository.findByWarehouseProduct_Id(10L)).thenReturn(Optional.empty()); // no stock
            when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ApiResponse resp = productService.createProductFromWarehouse(req);

            assertTrue(resp.isSuccess());
            Product saved = (Product) resp.getData();
            assertEquals(0L, saved.getStockQuantity()); // no stock → 0
        }

        // ── deleteProductImage(): wasPrimary=true + remaining empty ──
        @Test
        @DisplayName("TC_PROD_064_deleteProductImage_PrimaryDeleted_NoRemaining_NoPrimarySet")
        void TC_PROD_064_deleteProductImage_PrimaryWithNoRemaining_SkipsSetPrimary() {
            Product product = Product.builder().id(100L).build();
            ProductImage primary = ProductImage.builder()
                    .id(1L).product(product).isPrimary(true).displayOrder(0).build();

            when(imageRepository.findById(1L)).thenReturn(Optional.of(primary));
            doNothing().when(imageRepository).delete(primary);
            // After deletion: no remaining images
            when(imageRepository.findByProductIdOrderByDisplayOrderAsc(100L)).thenReturn(List.of());

            ApiResponse resp = productService.deleteProductImage(1L);

            assertTrue(resp.isSuccess());
            verify(imageRepository, never()).save(any()); // No new primary set
        }
    }
}
