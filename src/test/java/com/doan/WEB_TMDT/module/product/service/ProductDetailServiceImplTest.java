package com.doan.WEB_TMDT.module.product.service;

import com.doan.WEB_TMDT.TestResultLogger;
import com.doan.WEB_TMDT.module.inventory.entity.ProductDetail;
import com.doan.WEB_TMDT.module.inventory.entity.ProductStatus;
import com.doan.WEB_TMDT.module.inventory.repository.ProductDetailRepository;
import com.doan.WEB_TMDT.module.product.service.impl.ProductDetailServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * BLACK-BOX UNIT TESTS – ProductDetailServiceImpl
 * Framework: JUnit 5 + Mockito
 */
@ExtendWith({MockitoExtension.class, TestResultLogger.class})
class ProductDetailServiceImplTest {

    @Mock
    private ProductDetailRepository productDetailRepository;

    @InjectMocks
    private ProductDetailServiceImpl productDetailService;

    private ProductDetail detail;
    private ProductDetail detail2;

    @BeforeEach
    void setUp() {
        detail = ProductDetail.builder()
                .id(1L)
                .serialNumber("SN-001")
                .importPrice(15_000_000.0)
                .importDate(LocalDateTime.now().minusDays(5))
                .status(ProductStatus.IN_STOCK)
                .warrantyMonths(12)
                .build();

        detail2 = ProductDetail.builder()
                .id(2L)
                .serialNumber("SN-002")
                .importPrice(20_000_000.0)
                .status(ProductStatus.SOLD)
                .warrantyMonths(24)
                .build();
    }

    // ================================================================
    // getAll
    // ================================================================
    @Nested
    @DisplayName("getAll ProductDetail Tests")
    class GetAllTests {

        @Test
        @DisplayName("TC_PD_001 – getAll trả về tất cả ProductDetail khi DB có dữ liệu")
        void TC_PD_001_getAll_WithData_ReturnsAllDetails() {
            when(productDetailRepository.findAll()).thenReturn(List.of(detail, detail2));

            List<ProductDetail> result = productDetailService.getAll();

            assertNotNull(result);
            assertEquals(2, result.size());
        }

        @Test
        @DisplayName("TC_PD_002 – getAll DB rỗng trả về list rỗng không null")
        void TC_PD_002_getAll_EmptyDB_ReturnsEmptyList() {
            when(productDetailRepository.findAll()).thenReturn(List.of());

            List<ProductDetail> result = productDetailService.getAll();

            assertNotNull(result);
            assertTrue(result.isEmpty());
        }
    }

    // ================================================================
    // getById
    // ================================================================
    @Nested
    @DisplayName("getById ProductDetail Tests")
    class GetByIdTests {

        @Test
        @DisplayName("TC_PD_003 – getById ID tồn tại trả về Optional có giá trị")
        void TC_PD_003_getById_ExistingId_ReturnsDetail() {
            when(productDetailRepository.findById(1L)).thenReturn(Optional.of(detail));

            Optional<ProductDetail> result = productDetailService.getById(1L);

            assertTrue(result.isPresent());
            assertEquals("SN-001", result.get().getSerialNumber());
        }

        @Test
        @DisplayName("TC_PD_004 – getById ID không tồn tại trả về Optional rỗng")
        void TC_PD_004_getById_NotFound_ReturnsEmpty() {
            when(productDetailRepository.findById(9999L)).thenReturn(Optional.empty());

            Optional<ProductDetail> result = productDetailService.getById(9999L);

            assertFalse(result.isPresent());
        }
    }

    // ================================================================
    // create
    // ================================================================
    @Nested
    @DisplayName("create ProductDetail Tests")
    class CreateTests {

        @Test
        @DisplayName("TC_PD_005 – create lưu ProductDetail thành công vào DB")
        void TC_PD_005_create_ValidDetail_SavesSuccessfully() {
            when(productDetailRepository.save(detail)).thenReturn(detail);

            ProductDetail result = productDetailService.create(detail);

            assertNotNull(result);
            assertEquals("SN-001", result.getSerialNumber());
            verify(productDetailRepository, times(1)).save(detail);
        }
    }

    // ================================================================
    // update
    // ================================================================
    @Nested
    @DisplayName("update ProductDetail Tests")
    class UpdateTests {

        @Test
        @DisplayName("TC_PD_006 – update ID tồn tại cập nhật thành công và set đúng ID")
        void TC_PD_006_update_ExistingId_UpdatesAndReturnsDetail() {
            when(productDetailRepository.existsById(1L)).thenReturn(true);
            when(productDetailRepository.save(detail)).thenReturn(detail);

            ProductDetail result = productDetailService.update(1L, detail);

            assertNotNull(result, "Kết quả không được null khi ID tồn tại");
            assertEquals(1L, detail.getId(), "ID phải được set trước khi save");
            verify(productDetailRepository, times(1)).save(detail);
        }

        @Test
        @DisplayName("TC_PD_007 – update ID không tồn tại trả về null không save")
        void TC_PD_007_update_NotFound_ReturnsNull() {
            when(productDetailRepository.existsById(9999L)).thenReturn(false);

            ProductDetail result = productDetailService.update(9999L, detail);

            assertNull(result, "Phải trả về null khi ID không tồn tại");
            verify(productDetailRepository, never()).save(any());
        }
    }

    // ================================================================
    // delete
    // ================================================================
    @Nested
    @DisplayName("delete ProductDetail Tests")
    class DeleteTests {

        @Test
        @DisplayName("TC_PD_008 – delete gọi deleteById đúng ID")
        void TC_PD_008_delete_ValidId_CallsDeleteById() {
            doNothing().when(productDetailRepository).deleteById(1L);

            productDetailService.delete(1L);

            verify(productDetailRepository, times(1)).deleteById(1L);
        }

        @Test
        @DisplayName("TC_PD_009 – delete ID không tồn tại không gây exception")
        void TC_PD_009_delete_NonExistentId_NoException() {
            doNothing().when(productDetailRepository).deleteById(9999L);

            assertDoesNotThrow(() -> productDetailService.delete(9999L));
            verify(productDetailRepository).deleteById(9999L);
        }
    }
}
