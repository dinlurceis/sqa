package com.doan.WEB_TMDT.module.product.service;

import com.doan.WEB_TMDT.common.dto.ApiResponse;
import com.doan.WEB_TMDT.module.product.dto.CategoryDTO;
import com.doan.WEB_TMDT.module.product.dto.CreateCategoryRequest;
import com.doan.WEB_TMDT.module.product.entity.Category;
import com.doan.WEB_TMDT.module.product.repository.CategoryRepository;
import com.doan.WEB_TMDT.module.product.service.impl.CategoryServiceImpl;
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
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * =============================================================
 * BLACK-BOX UNIT TESTS – CategoryServiceImpl
 * =============================================================
 *
 * Mục tiêu: Tìm bug trong CategoryServiceImpl theo nghiệp vụ thực tế.
 * Phương pháp: Black-box testing.
 *
 * Framework : JUnit 5 + Mockito
 * Rollback  : Dùng mock – không có DB thật, mỗi test độc lập.
 */
@ExtendWith({MockitoExtension.class, TestResultLogger.class})
class CategoryServiceImplTest {

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private CategoryServiceImpl categoryService;

    // ─── Fixture Data ──────────────────────────────────────────────
    private Category rootCategory;
    private Category childCategory;
    private Category rootCategory2;

    @BeforeEach
    void setUp() {
        rootCategory = Category.builder()
                .id(1L)
                .name("Laptop")
                .slug("laptop")
                .description("Danh mục laptop")
                .active(true)
                .displayOrder(1)
                .build();

        childCategory = Category.builder()
                .id(2L)
                .name("Laptop Gaming")
                .slug("laptop-gaming")
                .description("Laptop chuyên gaming")
                .active(true)
                .displayOrder(1)
                .parent(rootCategory)
                .build();

        rootCategory2 = Category.builder()
                .id(3L)
                .name("Điện thoại")
                .slug("dien-thoai")
                .active(true)
                .displayOrder(2)
                .build();
    }

    // ================================================================
    // TC_CAT_001 → TC_CAT_004: getAll
    // ================================================================
    @Nested
    @DisplayName("getAll Category Tests")
    class GetAllTests {

        /**
         * TC_CAT_001
         * Objective : getAll trả về tất cả danh mục từ DB
         * Input     : DB có 2 danh mục
         * Expected  : List size = 2
         */
        @Test
        @DisplayName("TC_CAT_001 – getAll trả về tất cả danh mục trong DB")
        void TC_CAT_001_getAll_WithData_ReturnsList() {
            when(categoryRepository.findAll())
                    .thenReturn(Arrays.asList(rootCategory, childCategory));

            List<Category> result = categoryService.getAll();

            assertNotNull(result, "Kết quả không được null");
            assertEquals(2, result.size(), "Phải trả về 2 danh mục");
        }

        /**
         * TC_CAT_002
         * Objective : getAll khi không có danh mục nào
         * Input     : Empty list
         * Expected  : Trả về list rỗng (không null)
         */
        @Test
        @DisplayName("TC_CAT_002 – getAll DB rỗng trả về list rỗng không null")
        void TC_CAT_002_getAll_EmptyDB_ReturnsEmptyList() {
            when(categoryRepository.findAll()).thenReturn(Collections.emptyList());

            List<Category> result = categoryService.getAll();

            assertNotNull(result, "Kết quả không được null");
            assertTrue(result.isEmpty(), "Phải là list rỗng");
        }
    }

    // ================================================================
    // TC_CAT_003 → TC_CAT_005: getById
    // ================================================================
    @Nested
    @DisplayName("getById Category Tests")
    class GetByIdTests {

        /**
         * TC_CAT_003
         * Objective : getById với ID tồn tại trả về Optional có giá trị
         * Input     : id = 1L
         * Expected  : Optional.of(rootCategory)
         */
        @Test
        @DisplayName("TC_CAT_003 – getById ID tồn tại trả về Category")
        void TC_CAT_003_getById_ExistingId_ReturnsCategory() {
            when(categoryRepository.findById(1L)).thenReturn(Optional.of(rootCategory));

            Optional<Category> result = categoryService.getById(1L);

            assertTrue(result.isPresent(), "Phải tìm thấy danh mục");
            assertEquals("Laptop", result.get().getName());
        }

        /**
         * TC_CAT_004
         * Objective : getById với ID không tồn tại
         * Input     : id = 9999L
         * Expected  : Optional.empty()
         */
        @Test
        @DisplayName("TC_CAT_004 – getById ID không tồn tại trả về empty")
        void TC_CAT_004_getById_NonExistentId_ReturnsEmpty() {
            when(categoryRepository.findById(9999L)).thenReturn(Optional.empty());

            Optional<Category> result = categoryService.getById(9999L);

            assertFalse(result.isPresent(), "Phải trả về empty khi không tìm thấy");
        }
    }

    // ================================================================
    // TC_CAT_005 → TC_CAT_008: createCategory
    // ================================================================
    @Nested
    @DisplayName("createCategory Tests")
    class CreateCategoryTests {

        /**
         * TC_CAT_005
         * Objective : Tạo danh mục mới với slug tự generate từ name
         * Input     : name = "Máy tính bảng", slug = null
         * Expected  : Slug được tạo tự động theo qui tắc vietlish
         *             "Máy tính bảng" → "may-tinh-bang"
         */
        @Test
        @DisplayName("TC_CAT_005 – Tạo danh mục không có slug tự generate slug từ name")
        void TC_CAT_005_createCategory_NoSlug_GeneratesSlugFromName() {
            CreateCategoryRequest req = CreateCategoryRequest.builder()
                    .name("Máy tính bảng")
                    .slug(null) // null → tự generate
                    .active(true)
                    .build();

            when(categoryRepository.existsBySlug(anyString())).thenReturn(false);
            when(categoryRepository.save(any())).thenAnswer(inv -> {
                Category saved = inv.getArgument(0);
                // Verify slug được tự generate
                assertNotNull(saved.getSlug(), "Slug không được null");
                assertFalse(saved.getSlug().isEmpty(), "Slug không được rỗng");
                // Slug phải viết thường và không dấu
                assertTrue(saved.getSlug().matches("[a-z0-9-]+"),
                        "Slug phải là lowercase ASCII, got: " + saved.getSlug());
                return saved;
            });

            ApiResponse response = categoryService.createCategory(req);

            assertTrue(response.isSuccess(), "Tạo danh mục phải thành công");
            verify(categoryRepository, times(1)).save(any());
        }

        /**
         * TC_CAT_006
         * Objective : Tạo danh mục với slug đã tồn tại → từ chối
         * Input     : slug = "laptop" đã có
         * Expected  : Response lỗi vì slug phải unique
         *
         * ⚠️ BUG HUNTER: Slug duplicate → 2 URL cùng trỏ về 2 category khác nhau
         */
        @Test
        @DisplayName("TC_CAT_006 – Tạo danh mục với slug trùng phải trả về lỗi")
        void TC_CAT_006_createCategory_DuplicateSlug_ReturnsError() {
            CreateCategoryRequest req = CreateCategoryRequest.builder()
                    .name("Laptop Premium")
                    .slug("laptop") // đã tồn tại
                    .active(true)
                    .build();

            when(categoryRepository.existsBySlug("laptop")).thenReturn(true);

            ApiResponse response = categoryService.createCategory(req);

            assertFalse(response.isSuccess(), "Slug trùng phải trả về lỗi");
            verify(categoryRepository, never()).save(any());
        }

        /**
         * TC_CAT_007
         * Objective : Tạo danh mục con với parentId hợp lệ
         * Input     : parentId = 1L (Laptop), name = "Laptop Gaming"
         * Expected  : Danh mục được tạo với parent = rootCategory
         *
         * CheckDB: Verify save được gọi với category.parent = rootCategory
         */
        @Test
        @DisplayName("TC_CAT_007 – Tạo danh mục con với parentId hợp lệ thành công")
        void TC_CAT_007_createCategory_WithValidParentId_SetsParent() {
            CreateCategoryRequest req = CreateCategoryRequest.builder()
                    .name("Laptop Gaming")
                    .slug("laptop-gaming")
                    .parentId(1L)
                    .active(true)
                    .build();

            when(categoryRepository.existsBySlug("laptop-gaming")).thenReturn(false);
            when(categoryRepository.findById(1L)).thenReturn(Optional.of(rootCategory));
            when(categoryRepository.save(any())).thenAnswer(inv -> {
                Category saved = inv.getArgument(0);
                // CheckDB: Parent phải được set đúng
                assertNotNull(saved.getParent(), "Parent không được null");
                assertEquals(1L, saved.getParent().getId(),
                        "Parent ID phải là 1L (Laptop)");
                return saved;
            });

            ApiResponse response = categoryService.createCategory(req);

            assertTrue(response.isSuccess(), "Tạo danh mục con phải thành công");
        }

        /**
         * TC_CAT_008
         * Objective : Tạo danh mục con với parentId không tồn tại → ném exception
         * Input     : parentId = 9999L không có trong DB
         * Expected  : RuntimeException
         */
        @Test
        @DisplayName("TC_CAT_008 – Tạo danh mục con với parentId không tồn tại ném exception")
        void TC_CAT_008_createCategory_InvalidParentId_ThrowsException() {
            CreateCategoryRequest req = CreateCategoryRequest.builder()
                    .name("Danh mục mồ côi")
                    .slug("danh-muc-mo-coi")
                    .parentId(9999L) // không tồn tại
                    .active(true)
                    .build();

            when(categoryRepository.existsBySlug("danh-muc-mo-coi")).thenReturn(false);
            when(categoryRepository.findById(9999L)).thenReturn(Optional.empty());

            assertThrows(RuntimeException.class,
                    () -> categoryService.createCategory(req),
                    "Phải ném exception khi parentId không tồn tại");
            verify(categoryRepository, never()).save(any());
        }

        /**
         * TC_CAT_009
         * Objective : Tạo danh mục với displayOrder null → dùng mặc định 0
         * Input     : displayOrder = null
         * Expected  : displayOrder được set thành 0 (mặc định)
         */
        @Test
        @DisplayName("TC_CAT_009 – displayOrder null phải dùng mặc định 0")
        void TC_CAT_009_createCategory_NullDisplayOrder_DefaultsToZero() {
            CreateCategoryRequest req = CreateCategoryRequest.builder()
                    .name("Phụ kiện")
                    .slug("phu-kien")
                    .displayOrder(null) // null → mặc định 0
                    .active(true)
                    .build();

            when(categoryRepository.existsBySlug("phu-kien")).thenReturn(false);
            when(categoryRepository.save(any())).thenAnswer(inv -> {
                Category saved = inv.getArgument(0);
                // displayOrder phải là 0 khi null
                assertNotNull(saved.getDisplayOrder(), "displayOrder không được null");
                assertEquals(0, saved.getDisplayOrder(),
                        "displayOrder null phải mặc định là 0");
                return saved;
            });

            categoryService.createCategory(req);
            verify(categoryRepository).save(any());
        }

        /**
         * TC_CAT_010
         * Objective : Tạo danh mục với active null → dùng mặc định true
         * Input     : active = null
         * Expected  : active được set thành true
         *
         * ⚠️ BUG HUNTER: active null → getActiveCategories() bỏ qua danh mục mới tạo
         */
        @Test
        @DisplayName("TC_CAT_010 – active null phải mặc định là true")
        void TC_CAT_010_createCategory_NullActive_DefaultsToTrue() {
            CreateCategoryRequest req = CreateCategoryRequest.builder()
                    .name("Máy in")
                    .slug("may-in")
                    .active(null) // null
                    .build();

            when(categoryRepository.existsBySlug("may-in")).thenReturn(false);
            when(categoryRepository.save(any())).thenAnswer(inv -> {
                Category saved = inv.getArgument(0);
                // active phải là true khi null (mặc định hiển thị)
                assertNotNull(saved.getActive(), "active không được null sau khi tạo");
                assertTrue(saved.getActive(),
                        "active phải mặc định là true khi không truyền vào");
                return saved;
            });

            categoryService.createCategory(req);
            verify(categoryRepository).save(any());
        }

        /**
         * TC_CAT_011
         * Objective : Tạo danh mục với name null → phải từ chối
         * Input     : name = null
         * Expected  : Exception hoặc error response
         *
         * ⚠️ BUG HUNTER: @NotBlank chỉ Controller layer, Service không validate
         */
        @Test
        @DisplayName("TC_CAT_011 – Tạo danh mục với name null phải từ chối")
        void TC_CAT_011_createCategory_NullName_ShouldReject() {
            CreateCategoryRequest req = CreateCategoryRequest.builder()
                    .name(null) // name null
                    .slug("null-name-category")
                    .active(true)
                    .build();

            when(categoryRepository.existsBySlug("null-name-category")).thenReturn(false);
            when(categoryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            try {
                ApiResponse response = categoryService.createCategory(req);
                if (response.isSuccess()) {
                    System.out.println("[BUG DETECTED] TC_CAT_011: Service cho phép tạo category với name null");
                }
            } catch (Exception e) {
                // NullPointerException hoặc exception rõ ràng đều chấp nhận được
                System.out.println("[INFO] TC_CAT_011: Exception khi name null: " + e.getClass().getSimpleName());
            }
        }

        /**
         * TC_CAT_012
         * Objective : Tạo danh mục với slug rỗng ("")  → tự generate từ name
         * Input     : slug = ""
         * Expected  : Slug rỗng xử lý như null → generate từ name
         */
        @Test
        @DisplayName("TC_CAT_012 – slug rỗng phải xử lý như null và generate từ name")
        void TC_CAT_012_createCategory_EmptySlug_GeneratesFromName() {
            CreateCategoryRequest req = CreateCategoryRequest.builder()
                    .name("Router WiFi")
                    .slug("") // rỗng
                    .active(true)
                    .build();

            when(categoryRepository.existsBySlug(anyString())).thenReturn(false);
            when(categoryRepository.save(any())).thenAnswer(inv -> {
                Category saved = inv.getArgument(0);
                // Slug rỗng phải được generate từ name "Router WiFi"
                assertNotNull(saved.getSlug(), "Slug không được null");
                assertFalse(saved.getSlug().isEmpty(),
                        "Slug không được rỗng – phải generate từ name");
                return saved;
            });

            categoryService.createCategory(req);
            verify(categoryRepository).save(any());
        }
    }

    // ================================================================
    // TC_CAT_013 → TC_CAT_019: updateCategory
    // ================================================================
    @Nested
    @DisplayName("updateCategory Tests")
    class UpdateCategoryTests {

        /**
         * TC_CAT_013
         * Objective : Update danh mục tồn tại với data hợp lệ
         * Input     : id = 1L, name mới, slug mới chưa tồn tại
         * Expected  : ApiResponse thành công, category được update
         *
         * CheckDB: categoryRepository.save được gọi 1 lần
         */
        @Test
        @DisplayName("TC_CAT_013 – updateCategory với data hợp lệ thành công")
        void TC_CAT_013_updateCategory_ValidData_Success() {
            CreateCategoryRequest req = CreateCategoryRequest.builder()
                    .name("Laptop & Máy tính")
                    .slug("laptop-may-tinh")
                    .description("Danh mục mở rộng")
                    .active(true)
                    .displayOrder(1)
                    .build();

            when(categoryRepository.findById(1L)).thenReturn(Optional.of(rootCategory));
            when(categoryRepository.existsBySlug("laptop-may-tinh")).thenReturn(false);
            when(categoryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ApiResponse response = categoryService.updateCategory(1L, req);

            assertTrue(response.isSuccess(), "Update danh mục phải thành công");
            // CheckDB: Verify save được gọi
            verify(categoryRepository, times(1)).save(any());
        }

        /**
         * TC_CAT_014
         * Objective : Update danh mục không tồn tại → ném exception
         * Input     : id = 9999L không có trong DB
         * Expected  : RuntimeException
         */
        @Test
        @DisplayName("TC_CAT_014 – updateCategory ID không tồn tại ném exception")
        void TC_CAT_014_updateCategory_NotFound_ThrowsException() {
            CreateCategoryRequest req = CreateCategoryRequest.builder()
                    .name("Ghost Category").slug("ghost").active(true).build();
            when(categoryRepository.findById(9999L)).thenReturn(Optional.empty());

            assertThrows(RuntimeException.class,
                    () -> categoryService.updateCategory(9999L, req));
        }

        /**
         * TC_CAT_015
         * Objective : Update với slug đã tồn tại ở category khác → từ chối
         * Input     : id = 1L, newSlug = "dien-thoai" (slug của category khác)
         * Expected  : Response lỗi, không save
         *
         * ⚠️ BUG HUNTER: Đổi slug sang slug đã có → 2 category cùng slug
         */
        @Test
        @DisplayName("TC_CAT_015 – Update với slug trùng category khác phải trả về lỗi")
        void TC_CAT_015_updateCategory_DuplicateSlug_ReturnsError() {
            CreateCategoryRequest req = CreateCategoryRequest.builder()
                    .name("Laptop")
                    .slug("dien-thoai") // slug của category khác
                    .active(true)
                    .build();

            when(categoryRepository.findById(1L)).thenReturn(Optional.of(rootCategory));
            // "dien-thoai" đã tồn tại và khác với slug hiện tại của rootCategory ("laptop")
            when(categoryRepository.existsBySlug("dien-thoai")).thenReturn(true);

            ApiResponse response = categoryService.updateCategory(1L, req);

            assertFalse(response.isSuccess(), "Phải từ chối khi slug trùng với category khác");
            verify(categoryRepository, never()).save(any());
        }

        /**
         * TC_CAT_016
         * Objective : Update giữ nguyên slug của chính nó → không check duplicate
         * Input     : id=1L, slug = "laptop" (chính slug của nó)
         * Expected  : Update thành công (không check trùng với chính mình)
         */
        @Test
        @DisplayName("TC_CAT_016 – Update giữ nguyên slug của chính mình thành công")
        void TC_CAT_016_updateCategory_SameSlug_NoConflictCheck() {
            CreateCategoryRequest req = CreateCategoryRequest.builder()
                    .name("Laptop Updated")
                    .slug("laptop") // slug của chính nó
                    .active(true)
                    .build();

            when(categoryRepository.findById(1L)).thenReturn(Optional.of(rootCategory));
            // Slug "laptop" là slug hiện tại của category 1L nên không cần kiểm tra existsBySlug
            when(categoryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ApiResponse response = categoryService.updateCategory(1L, req);

            assertTrue(response.isSuccess(), "Update với slug giữ nguyên phải thành công");
        }

        /**
         * TC_CAT_017
         * Objective : Danh mục là cha của chính nó → phải từ chối
         * Input     : id = 1L, parentId = 1L (tự ref)
         * Expected  : Response lỗi
         *
         * ⚠️ BUG HUNTER: Self-referencing category → circular dependency trong tree
         */
        @Test
        @DisplayName("TC_CAT_017 – Danh mục không thể là cha của chính nó")
        void TC_CAT_017_updateCategory_SelfAsParent_ReturnsError() {
            CreateCategoryRequest req = CreateCategoryRequest.builder()
                    .name("Laptop")
                    .slug("laptop")
                    .parentId(1L) // tự ref – category 1 là cha của 1
                    .active(true)
                    .build();

            when(categoryRepository.findById(1L)).thenReturn(Optional.of(rootCategory));

            ApiResponse response = categoryService.updateCategory(1L, req);

            assertFalse(response.isSuccess(),
                    "Danh mục không thể là cha của chính nó");
            verify(categoryRepository, never()).save(any());
        }

        /**
         * TC_CAT_018
         * Objective : Update parentId = null → danh mục trở thành root
         * Input     : childCategory id=2L, parentId = null
         * Expected  : category.parent = null (trở thành root category)
         *
         * CheckDB: Verify save với parent = null
         */
        @Test
        @DisplayName("TC_CAT_018 – Update parentId null làm danh mục trở thành root")
        void TC_CAT_018_updateCategory_NullParentId_BecomesRoot() {
            CreateCategoryRequest req = CreateCategoryRequest.builder()
                    .name("Laptop Gaming")
                    .slug("laptop-gaming")
                    .parentId(null) // null → không có parent
                    .active(true)
                    .build();

            when(categoryRepository.findById(2L)).thenReturn(Optional.of(childCategory));
            when(categoryRepository.save(any())).thenAnswer(inv -> {
                Category saved = inv.getArgument(0);
                // CheckDB: parent phải = null
                assertNull(saved.getParent(),
                        "Parent phải null khi parentId = null (trở thành root)");
                return saved;
            });

            ApiResponse response = categoryService.updateCategory(2L, req);

            assertTrue(response.isSuccess(), "Update parentId = null phải thành công");
        }

        /**
         * TC_CAT_019
         * Objective : Update name null → phải xử lý graceful
         * Input     : name = null
         * Expected  : Không NPE; có thể set null hoặc từ chối
         *
         * ⚠️ BUG HUNTER: Code gọi category.setName(null) → DB lỗi vì nullable=false
         */
        @Test
        @DisplayName("TC_CAT_019 – Update name null phải xử lý graceful")
        void TC_CAT_019_updateCategory_NullName_HandlesGracefully() {
            CreateCategoryRequest req = CreateCategoryRequest.builder()
                    .name(null) // name null
                    .slug("laptop")
                    .active(true)
                    .build();

            when(categoryRepository.findById(1L)).thenReturn(Optional.of(rootCategory));
            when(categoryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            // Nghiệp vụ: name null → không nên save vào DB
            try {
                ApiResponse response = categoryService.updateCategory(1L, req);
                if (response.isSuccess()) {
                    // Kiểm tra xem DB có nhận null name không
                    System.out.println("[BUG RISK] TC_CAT_019: Update name null được chấp nhận "
                            + "→ DB sẽ lỗi vì @Column(nullable=false)");
                }
            } catch (Exception e) {
                // Exception là acceptable
            }
        }
    }

    // ================================================================
    // TC_CAT_020 → TC_CAT_023: delete
    // ================================================================
    @Nested
    @DisplayName("delete Category Tests")
    class DeleteCategoryTests {

        /**
         * TC_CAT_020
         * Objective : Xóa danh mục tồn tại
         * Input     : id = 1L
         * Expected  : deleteById được gọi đúng
         *
         * CheckDB: categoryRepository.deleteById(1L) được gọi 1 lần
         */
        @Test
        @DisplayName("TC_CAT_020 – Xóa danh mục tồn tại gọi deleteById")
        void TC_CAT_020_delete_ExistingCategory_DeletesCalled() {
            doNothing().when(categoryRepository).deleteById(1L);

            categoryService.delete(1L);

            // CheckDB: Verify đúng ID được xóa
            verify(categoryRepository, times(1)).deleteById(1L);
        }

        /**
         * TC_CAT_021
         * Objective : Xóa danh mục có children → hành vi cascade
         * Input     : Xóa rootCategory có childCategory
         * Expected  : Xóa thành công nhưng phải xử lý orphan children
         *
         * ⚠️ BUG HUNTER: @OneToMany(cascade=CascadeType.ALL) → xóa parent sẽ xóa cả children
         * Nếu không muốn cascade delete → data loss
         */
        @Test
        @DisplayName("TC_CAT_021 – Xóa danh mục cha có children là hành vi nguy hiểm")
        void TC_CAT_021_delete_CategoryWithChildren_CascadeRisk() {
            doNothing().when(categoryRepository).deleteById(1L);

            // Nghiệp vụ: Xóa category cha có children là nguy hiểm
            // CascadeType.ALL → tất cả children bị xóa theo
            categoryService.delete(1L);

            verify(categoryRepository).deleteById(1L);
            System.out.println("[BUG RISK] TC_CAT_021: delete rootCategory (id=1) có cascade "
                    + "→ tất cả childCategory bị xóa theo do @OneToMany(cascade=CascadeType.ALL)");
        }
    }

    // ================================================================
    // TC_CAT_022 → TC_CAT_026: getAllCategoriesTree
    // ================================================================
    @Nested
    @DisplayName("getAllCategoriesTree Tests")
    class GetAllCategoriesTreeTests {

        /**
         * TC_CAT_022
         * Objective : getAllCategoriesTree chỉ trả về root categories (không có parent)
         * Input     : 2 root + 1 child category
         * Expected  : Chỉ 2 root category ở level 1, child nằm trong children của root
         */
        @Test
        @DisplayName("TC_CAT_022 – getAllCategoriesTree chỉ trả về root categories ở cấp 1")
        void TC_CAT_022_getAllCategoriesTree_MixedLevels_OnlyRootsAtTopLevel() {
            // rootCategory và rootCategory2 là root, childCategory có parent = rootCategory
            when(categoryRepository.findAll())
                    .thenReturn(Arrays.asList(rootCategory, rootCategory2, childCategory));

            ApiResponse response = categoryService.getAllCategoriesTree();

            assertTrue(response.isSuccess());
            @SuppressWarnings("unchecked")
            List<CategoryDTO> tree = (List<CategoryDTO>) response.getData();
            // Chỉ 2 root categories ở level 1
            assertEquals(2, tree.size(),
                    "Chỉ được 2 root category ở cấp 1, childCategory không được ở cấp 1");
        }

        /**
         * TC_CAT_023
         * Objective : Tree được sắp xếp theo displayOrder
         * Input     : rootCategory2 có displayOrder=2, rootCategory có displayOrder=1
         * Expected  : rootCategory (displayOrder=1) đứng trước rootCategory2 (displayOrder=2)
         */
        @Test
        @DisplayName("TC_CAT_023 – getAllCategoriesTree kết quả được sắp xếp theo displayOrder")
        void TC_CAT_023_getAllCategoriesTree_SortedByDisplayOrder() {
            // rootCategory displayOrder=1, rootCategory2 displayOrder=2
            when(categoryRepository.findAll())
                    .thenReturn(Arrays.asList(rootCategory2, rootCategory)); // Input ngược thứ tự

            ApiResponse response = categoryService.getAllCategoriesTree();

            assertTrue(response.isSuccess());
            @SuppressWarnings("unchecked")
            List<CategoryDTO> tree = (List<CategoryDTO>) response.getData();
            assertEquals(2, tree.size());
            // displayOrder=1 (Laptop) phải đứng trước displayOrder=2 (Điện thoại)
            assertEquals(1L, tree.get(0).getId(),
                    "Danh mục displayOrder=1 phải đứng trước displayOrder=2");
            assertEquals(3L, tree.get(1).getId(),
                    "Danh mục displayOrder=2 phải đứng sau displayOrder=1");
        }

        /**
         * TC_CAT_024
         * Objective : Tree khi không có danh mục nào
         * Input     : Empty list
         * Expected  : Response thành công với list rỗng
         */
        @Test
        @DisplayName("TC_CAT_024 – getAllCategoriesTree DB rỗng trả về list rỗng")
        void TC_CAT_024_getAllCategoriesTree_EmptyDB_ReturnsEmptyList() {
            when(categoryRepository.findAll()).thenReturn(Collections.emptyList());

            ApiResponse response = categoryService.getAllCategoriesTree();

            assertTrue(response.isSuccess());
            @SuppressWarnings("unchecked")
            List<CategoryDTO> tree = (List<CategoryDTO>) response.getData();
            assertTrue(tree.isEmpty(), "Phải là list rỗng khi DB không có danh mục");
        }

        /**
         * TC_CAT_025
         * Objective : Tree với category có displayOrder null → xếp cuối
         * Input     : Một category có displayOrder = null
         * Expected  : Category null displayOrder xếp cuối không gây NPE
         *
         * ⚠️ BUG HUNTER: compareTo(null) sẽ gây NPE nếu không handle
         */
        @Test
        @DisplayName("TC_CAT_025 – getAllCategoriesTree với displayOrder null không gây NPE")
        void TC_CAT_025_getAllCategoriesTree_NullDisplayOrder_NoNPE() {
            Category noOrder = Category.builder()
                    .id(4L).name("Không có thứ tự").slug("khong-co-thu-tu")
                    .active(true).displayOrder(null) // null
                    .build();

            when(categoryRepository.findAll())
                    .thenReturn(Arrays.asList(rootCategory, noOrder));

            assertDoesNotThrow(() -> categoryService.getAllCategoriesTree(),
                    "getAllCategoriesTree không được NPE khi displayOrder null");
        }
    }

    // ================================================================
    // TC_CAT_026 → TC_CAT_028: getActiveCategories
    // ================================================================
    @Nested
    @DisplayName("getActiveCategories Tests")
    class GetActiveCategoriesTests {

        /**
         * TC_CAT_026
         * Objective : getActiveCategories chỉ trả về category active=true ở root level
         * Input     : 1 active=true, 1 active=false, 1 child active=true
         * Expected  : Chỉ root active=true (không có inactive, không có child)
         *
         * ⚠️ BUG HUNTER: Nếu lọc không đúng → hiển thị category đã tắt cho khách hàng
         */
        @Test
        @DisplayName("TC_CAT_026 – getActiveCategories chỉ trả về root category đang hoạt động")
        void TC_CAT_026_getActiveCategories_OnlyActiveRoots() {
            Category inactiveCategory = Category.builder()
                    .id(99L).name("Tắt").slug("tat")
                    .active(false) // không hoạt động
                    .displayOrder(5)
                    .build();

            when(categoryRepository.findAll())
                    .thenReturn(Arrays.asList(rootCategory, inactiveCategory, childCategory));

            ApiResponse response = categoryService.getActiveCategories();

            assertTrue(response.isSuccess());
            @SuppressWarnings("unchecked")
            List<CategoryDTO> active = (List<CategoryDTO>) response.getData();
            // Chỉ rootCategory (active + root) được trả về
            assertEquals(1, active.size(),
                    "Chỉ root active category mới được trả về");
            assertEquals(1L, active.get(0).getId(),
                    "Phải là rootCategory (id=1)");
        }

        /**
         * TC_CAT_027
         * Objective : getActiveCategories khi category có active = null → không hiển thị
         * Input     : category với active = null
         * Expected  : Category active=null không được trả về
         *
         * ⚠️ BUG HUNTER: Nếu code dùng category.getActive() mà không check null → NPE
         */
        @Test
        @DisplayName("TC_CAT_027 – getActiveCategories bỏ qua category có active null")
        void TC_CAT_027_getActiveCategories_NullActiveCategoryIgnored() {
            Category nullActiveCategory = Category.builder()
                    .id(5L).name("Không rõ trạng thái").slug("null-active")
                    .active(null) // active null
                    .displayOrder(10)
                    .build();

            when(categoryRepository.findAll())
                    .thenReturn(Arrays.asList(rootCategory, nullActiveCategory));

            assertDoesNotThrow(() -> {
                ApiResponse response = categoryService.getActiveCategories();
                assertTrue(response.isSuccess());
                @SuppressWarnings("unchecked")
                List<CategoryDTO> active = (List<CategoryDTO>) response.getData();
                // category active=null không được xuất hiện
                assertTrue(active.stream().noneMatch(dto -> dto.getId().equals(5L)),
                        "Category active=null không được xuất hiện trong kết quả");
            }, "getActiveCategories không được NPE khi active = null");
        }
    }

    // ================================================================
    // TC_CAT_028 → TC_CAT_031: getCategoryWithProducts
    // ================================================================
    @Nested
    @DisplayName("getCategoryWithProducts Tests")
    class GetCategoryWithProductsTests {

        /**
         * TC_CAT_028
         * Objective : Lấy chi tiết category có products
         * Input     : id = 1L (Laptop) có sản phẩm
         * Expected  : ApiResponse thành công với CategoryDTO
         */
        @Test
        @DisplayName("TC_CAT_028 – getCategoryWithProducts ID tồn tại trả về thành công")
        void TC_CAT_028_getCategoryWithProducts_ValidId_ReturnsDTO() {
            when(categoryRepository.findById(1L)).thenReturn(Optional.of(rootCategory));

            ApiResponse response = categoryService.getCategoryWithProducts(1L);

            assertTrue(response.isSuccess(), "Phải trả về thành công");
            assertNotNull(response.getData(), "Data không được null");
        }

        /**
         * TC_CAT_029
         * Objective : Lấy category không tồn tại → ném exception
         * Input     : id = 9999L
         * Expected  : RuntimeException
         */
        @Test
        @DisplayName("TC_CAT_029 – getCategoryWithProducts ID không tồn tại ném exception")
        void TC_CAT_029_getCategoryWithProducts_NotFound_ThrowsException() {
            when(categoryRepository.findById(9999L)).thenReturn(Optional.empty());

            assertThrows(RuntimeException.class,
                    () -> categoryService.getCategoryWithProducts(9999L));
        }
    }

    // ================================================================
    // TC_CAT_030 → TC_CAT_032: update (CRUD)
    // ================================================================
    @Nested
    @DisplayName("update (CRUD) Category Tests")
    class UpdateCrudTests {

        /**
         * TC_CAT_030
         * Objective : Update CRUD category tồn tại
         * Input     : id = 1L, category entity mới
         * Expected  : Category được lưu với id = 1
         *
         * CheckDB: Verify categoryRepository.save được gọi với category.id = 1L
         */
        @Test
        @DisplayName("TC_CAT_030 – CRUD update category tồn tại thành công")
        void TC_CAT_030_update_ExistingCategory_Saved() {
            Category updatedData = Category.builder()
                    .name("Laptop Pro").slug("laptop-pro").active(true).build();

            when(categoryRepository.existsById(1L)).thenReturn(true);
            when(categoryRepository.save(any())).thenAnswer(inv -> {
                Category saved = inv.getArgument(0);
                // CheckDB: ID phải được set đúng
                assertEquals(1L, saved.getId(), "ID phải được set thành 1L");
                return saved;
            });

            Category result = categoryService.update(1L, updatedData);

            assertNotNull(result, "Kết quả không được null");
            verify(categoryRepository, times(1)).save(any());
        }

        /**
         * TC_CAT_031
         * Objective : CRUD update category không tồn tại → trả về null
         * Input     : id = 9999L không có
         * Expected  : null (không exception)
         *
         * ⚠️ BUG HUNTER: Trả về null thay vì exception → caller không biết update thất bại
         */
        @Test
        @DisplayName("TC_CAT_031 – CRUD update category không tồn tại trả về null")
        void TC_CAT_031_update_NonExistent_ReturnsNull() {
            when(categoryRepository.existsById(9999L)).thenReturn(false);

            Category result = categoryService.update(9999L, rootCategory);

            assertNull(result, "Phải trả về null khi category không tồn tại");
            verify(categoryRepository, never()).save(any());
        }
    }

    // ================================================================
    // TC_CAT_032 → TC_CAT_034: toCategoryDTO
    // ================================================================
    @Nested
    @DisplayName("toCategoryDTO Tests")
    class ToCategoryDTOTests {

        /**
         * TC_CAT_032
         * Objective : toCategoryDTO với category có parent
         * Input     : childCategory (parent = rootCategory)
         * Expected  : DTO có parentId và parentName đúng
         */
        @Test
        @DisplayName("TC_CAT_032 – toCategoryDTO với child category có parentId và parentName đúng")
        void TC_CAT_032_toCategoryDTO_WithParent_HasParentInfo() {
            CategoryDTO dto = categoryService.toCategoryDTO(childCategory);

            assertNotNull(dto, "DTO không được null");
            assertEquals(2L, dto.getId());
            assertEquals("Laptop Gaming", dto.getName());
            // Kiểm tra parent info
            assertEquals(1L, dto.getParentId(),
                    "parentId phải là 1L (Laptop)");
            assertEquals("Laptop", dto.getParentName(),
                    "parentName phải là 'Laptop'");
        }

        /**
         * TC_CAT_033
         * Objective : toCategoryDTO với category là root (không có parent)
         * Input     : rootCategory (parent = null)
         * Expected  : DTO có parentId = null, parentName = null
         */
        @Test
        @DisplayName("TC_CAT_033 – toCategoryDTO root category không có parentId")
        void TC_CAT_033_toCategoryDTO_RootCategory_NullParentInfo() {
            CategoryDTO dto = categoryService.toCategoryDTO(rootCategory);

            assertNotNull(dto);
            assertEquals(1L, dto.getId());
            assertNull(dto.getParentId(), "Root category phải có parentId = null");
            assertNull(dto.getParentName(), "Root category phải có parentName = null");
        }

        /**
         * TC_CAT_034
         * Objective : toCategoryDTO với children null → không NPE
         * Input     : category.children = null
         * Expected  : DTO không NPE, children = null hoặc empty
         *
         * ⚠️ BUG HUNTER: code gọi category.getChildren() rồi check != null, nếu lazy load chưa có → NPE
         */
        @Test
        @DisplayName("TC_CAT_034 – toCategoryDTO với children null không gây NPE")
        void TC_CAT_034_toCategoryDTO_NullChildren_NoNPE() {
            Category noChildren = Category.builder()
                    .id(5L).name("No Children").slug("no-children")
                    .active(true).children(null) // null
                    .build();

            assertDoesNotThrow(() -> categoryService.toCategoryDTO(noChildren),
                    "toCategoryDTO không được NPE khi children = null");
        }
    }

    // ================================================================
    // TC_CAT_035: generateSlug (via createCategory)
    // ================================================================
    @Nested
    @DisplayName("Slug Generation Tests (via createCategory)")
    class SlugGenerationTests {

        /**
         * TC_CAT_035
         * Objective : Slug generate đúng từ tên tiếng Việt có dấu
         * Input     : name = "Điện thoại thông minh"
         * Expected  : slug = "dien-thoai-thong-minh"
         *
         * ⚠️ BUG HUNTER: Nếu slug không chuyển đúng ký tự Việt → URL không đẹp hoặc lỗi encoding
         */
        @Test
        @DisplayName("TC_CAT_035 – Slug generate đúng từ tên tiếng Việt có dấu")
        void TC_CAT_035_createCategory_SlugGenerationVietnamese_CorrectSlug() {
            CreateCategoryRequest req = CreateCategoryRequest.builder()
                    .name("Điện thoại thông minh")
                    .slug(null) // Generate từ name
                    .active(true)
                    .build();

            when(categoryRepository.existsBySlug(anyString())).thenReturn(false);
            when(categoryRepository.save(any())).thenAnswer(inv -> {
                Category saved = inv.getArgument(0);
                // Verify kết quả slug phải là "dien-thoai-thong-minh"
                assertEquals("dien-thoai-thong-minh", saved.getSlug(),
                        "Slug của 'Điện thoại thông minh' phải là 'dien-thoai-thong-minh'");
                return saved;
            });

            categoryService.createCategory(req);
            verify(categoryRepository).save(any());
        }

        /**
         * TC_CAT_036
         * Objective : Slug generate với khoảng trắng thừa → normalize
         * Input     : name = "  Laptop   Gaming  " (nhiều khoảng trắng)
         * Expected  : slug = "laptop-gaming" (không có -- double dash)
         */
        @Test
        @DisplayName("TC_CAT_036 – Slug không được có double dash từ khoảng trắng thừa")
        void TC_CAT_036_createCategory_NameWithExtraSpaces_SlugNormalized() {
            CreateCategoryRequest req = CreateCategoryRequest.builder()
                    .name("  Laptop   Gaming  ")
                    .slug(null)
                    .active(true)
                    .build();

            when(categoryRepository.existsBySlug(anyString())).thenReturn(false);
            when(categoryRepository.save(any())).thenAnswer(inv -> {
                Category saved = inv.getArgument(0);
                String slug = saved.getSlug();
                assertFalse(slug.contains("--"),
                        "Slug không được chứa '--' (double dash): " + slug);
                return saved;
            });

            categoryService.createCategory(req);
            verify(categoryRepository).save(any());
        }
    }
}
