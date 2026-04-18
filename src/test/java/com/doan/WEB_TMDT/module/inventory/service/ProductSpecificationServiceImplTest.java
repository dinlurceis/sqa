package com.doan.WEB_TMDT.module.inventory.service;

import com.doan.WEB_TMDT.TestResultLogger;
import com.doan.WEB_TMDT.module.inventory.entity.WarehouseProduct;
import com.doan.WEB_TMDT.module.inventory.repository.ProductSpecificationRepository;
import com.doan.WEB_TMDT.module.inventory.service.impl.ProductSpecificationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * BLACK-BOX UNIT TESTS – ProductSpecificationServiceImpl
 * Framework: JUnit 5 + Mockito
 */
@ExtendWith({MockitoExtension.class, TestResultLogger.class})
class ProductSpecificationServiceImplTest {

    @Mock
    private ProductSpecificationRepository specRepository;

    @InjectMocks
    private ProductSpecificationServiceImpl specService;

    private WarehouseProduct wp;

    @BeforeEach
    void setUp() {
        wp = WarehouseProduct.builder()
                .id(1L)
                .sku("SKU-TEST-001")
                .internalName("Laptop Test")
                .build();
    }

    // ================================================================
    // parseAndSaveSpecs
    // ================================================================
    @Nested
    @DisplayName("parseAndSaveSpecs Tests")
    class ParseAndSaveSpecsTests {

        @Test
        @DisplayName("TC_SPEC_001 – parseAndSaveSpecs với techSpecsJson null không làm gì")
        void TC_SPEC_001_parseAndSaveSpecs_NullJson_EarlyReturn() {
            WarehouseProduct product = WarehouseProduct.builder()
                    .id(1L).sku("SKU-NULL").techSpecsJson(null).build();

            specService.parseAndSaveSpecs(product);

            verify(specRepository, never()).deleteByWarehouseProduct(any());
            verify(specRepository, never()).saveAll(any());
        }

        @Test
        @DisplayName("TC_SPEC_002 – parseAndSaveSpecs với techSpecsJson rỗng không làm gì")
        void TC_SPEC_002_parseAndSaveSpecs_EmptyJson_EarlyReturn() {
            WarehouseProduct product = WarehouseProduct.builder()
                    .id(1L).sku("SKU-EMPTY").techSpecsJson("   ").build();

            specService.parseAndSaveSpecs(product);

            verify(specRepository, never()).deleteByWarehouseProduct(any());
        }

        @Test
        @DisplayName("TC_SPEC_003 – parseAndSaveSpecs JSON hợp lệ xóa cũ và lưu spec mới")
        void TC_SPEC_003_parseAndSaveSpecs_ValidJson_DeletesOldAndSavesNew() {
            WarehouseProduct product = WarehouseProduct.builder()
                    .id(1L).sku("SKU-VALID")
                    .techSpecsJson("{\"ram\":\"16GB\",\"cpu\":\"i7\"}")
                    .build();

            doNothing().when(specRepository).deleteByWarehouseProduct(product);
            when(specRepository.saveAll(any())).thenReturn(List.of());

            specService.parseAndSaveSpecs(product);

            verify(specRepository).deleteByWarehouseProduct(product);
            verify(specRepository).saveAll(any());
        }

        @Test
        @DisplayName("TC_SPEC_004 – parseAndSaveSpecs JSON toàn giá trị rỗng không gọi saveAll")
        void TC_SPEC_004_parseAndSaveSpecs_AllEmptyValues_SkipsSave() {
            // Tất cả value rỗng → specs.isEmpty() = true → không saveAll
            WarehouseProduct product = WarehouseProduct.builder()
                    .id(1L).sku("SKU-EMPTY-VAL")
                    .techSpecsJson("{\"ram\":\"\",\"cpu\":\"   \"}")
                    .build();

            doNothing().when(specRepository).deleteByWarehouseProduct(product);

            specService.parseAndSaveSpecs(product);

            verify(specRepository).deleteByWarehouseProduct(product);
            verify(specRepository, never()).saveAll(any());
        }

        @Test
        @DisplayName("TC_SPEC_005 – parseAndSaveSpecs JSON không hợp lệ không crash")
        void TC_SPEC_005_parseAndSaveSpecs_InvalidJson_HandlesGracefully() {
            WarehouseProduct product = WarehouseProduct.builder()
                    .id(1L).sku("SKU-BAD-JSON")
                    .techSpecsJson("not-valid-{{{json")
                    .build();

            doNothing().when(specRepository).deleteByWarehouseProduct(product);

            // Không được ném exception ra ngoài
            assertDoesNotThrow(() -> specService.parseAndSaveSpecs(product));
        }
    }

    // ================================================================
    // searchBySpecValue & searchBySpecKeyAndValue
    // ================================================================
    @Nested
    @DisplayName("searchBySpec Tests")
    class SearchBySpecTests {

        @Test
        @DisplayName("TC_SPEC_006 – searchBySpecValue trả về danh sách sản phẩm từ repository")
        void TC_SPEC_006_searchBySpecValue_ReturnsResults() {
            when(specRepository.findProductsBySpecValue("16GB")).thenReturn(List.of(wp));

            List<WarehouseProduct> result = specService.searchBySpecValue("16GB");

            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals("SKU-TEST-001", result.get(0).getSku());
        }

        @Test
        @DisplayName("TC_SPEC_007 – searchBySpecValue không tìm thấy trả về list rỗng")
        void TC_SPEC_007_searchBySpecValue_NoResults_ReturnsEmptyList() {
            when(specRepository.findProductsBySpecValue("128GB")).thenReturn(List.of());

            List<WarehouseProduct> result = specService.searchBySpecValue("128GB");

            assertNotNull(result);
            assertTrue(result.isEmpty());
        }

        @Test
        @DisplayName("TC_SPEC_008 – searchBySpecKeyAndValue trả về đúng sản phẩm")
        void TC_SPEC_008_searchBySpecKeyAndValue_ReturnsMatchingProducts() {
            when(specRepository.findProductsBySpecKeyAndValue("ram", "16GB")).thenReturn(List.of(wp));

            List<WarehouseProduct> result = specService.searchBySpecKeyAndValue("ram", "16GB");

            assertNotNull(result);
            assertEquals(1, result.size());
        }

        @Test
        @DisplayName("TC_SPEC_009 – searchBySpecKeyAndValue không tìm thấy trả về list rỗng")
        void TC_SPEC_009_searchBySpecKeyAndValue_NoMatch_ReturnsEmpty() {
            when(specRepository.findProductsBySpecKeyAndValue("storage", "4TB")).thenReturn(List.of());

            List<WarehouseProduct> result = specService.searchBySpecKeyAndValue("storage", "4TB");

            assertTrue(result.isEmpty());
        }
    }
}
