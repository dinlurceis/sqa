package com.doan.WEB_TMDT.module.accounting;

import com.doan.WEB_TMDT.common.dto.ApiResponse;
import com.doan.WEB_TMDT.module.accounting.dto.CreatePaymentRequest;
import com.doan.WEB_TMDT.module.accounting.dto.SupplierPayableResponse;
import com.doan.WEB_TMDT.module.accounting.entity.PaymentMethod;
import com.doan.WEB_TMDT.module.accounting.entity.SupplierPayable;
import com.doan.WEB_TMDT.module.accounting.entity.SupplierPayment;
import com.doan.WEB_TMDT.module.accounting.repository.FinancialTransactionRepository;
import com.doan.WEB_TMDT.module.accounting.repository.SupplierPayableRepository;
import com.doan.WEB_TMDT.module.accounting.repository.SupplierPaymentRepository;
import com.doan.WEB_TMDT.module.accounting.service.impl.SupplierPayableServiceImpl;
import com.doan.WEB_TMDT.module.inventory.entity.PurchaseOrder;
import com.doan.WEB_TMDT.module.inventory.entity.PurchaseOrderItem;
import com.doan.WEB_TMDT.module.inventory.entity.Supplier;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.AfterAllCallback;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.extension.TestWatcher;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class PaymentModuleTest {

    @RegisterExtension
    static final TestCaseStatusLogger testCaseStatusLogger = new TestCaseStatusLogger();

    @Mock
    private SupplierPayableRepository payableRepository;

    @Mock
    private SupplierPaymentRepository paymentRepository;

    @Mock
    private FinancialTransactionRepository financialTransactionRepository;

    @InjectMocks
    private SupplierPayableServiceImpl payableService;

    @BeforeEach
    void setUpAuthenticationContext() {
        TestingAuthenticationToken auth = new TestingAuthenticationToken("tester@example.com", "password", "ADMIN");
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void clearAuthenticationContext() {
        SecurityContextHolder.clearContext();
    }

    // PAY_001: Thanh toán toàn bộ đúng số tiền chuyển trạng thái về PAID
    @Order(1)
    @Test
    @DisplayName("PAY_001: Thanh toán toàn bộ đúng số tiền chuyển trạng thái về PAID")
    void payFullRemainingMarksAsPaid() {
        CreatePaymentRequest request = buildPaymentRequest(1L, BigDecimal.valueOf(100), PaymentMethod.CASH);
        SupplierPayable payable = buildSupplierPayable(BigDecimal.valueOf(100), BigDecimal.ZERO);

        when(payableRepository.findById(1L)).thenReturn(Optional.of(payable));
        when(paymentRepository.save(any(SupplierPayment.class))).thenAnswer(i -> i.getArgument(0));
        when(financialTransactionRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(payableRepository.save(any(SupplierPayable.class))).thenAnswer(i -> i.getArgument(0));

        ApiResponse response = payableService.makePayment(request);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getMessage()).isEqualTo("Thanh toán thành công");

        ArgumentCaptor<SupplierPayable> captor = ArgumentCaptor.forClass(SupplierPayable.class);
        verify(payableRepository).save(captor.capture());
        SupplierPayable updated = captor.getValue();

        assertThat(updated.getRemainingAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(updated.getPaidAmount()).isEqualByComparingTo(BigDecimal.valueOf(100));
        assertThat(updated.getStatus().name()).isEqualTo("PAID");
    }

    // PAY_002: Thanh toán sai số tiền vượt quá remaining phải bị block
    @Order(2)
    @Test
    @DisplayName("PAY_002: Thanh toán sai số tiền vượt quá remaining bị block")
    void payAmountGreaterThanRemainingBlocksTransaction() {
        CreatePaymentRequest request = buildPaymentRequest(1L, BigDecimal.valueOf(150), PaymentMethod.CASH);
        SupplierPayable payable = buildSupplierPayable(BigDecimal.valueOf(100), BigDecimal.ZERO);

        when(payableRepository.findById(1L)).thenReturn(Optional.of(payable));

        ApiResponse response = payableService.makePayment(request);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).contains("Số tiền thanh toán vượt quá số tiền còn nợ");
        verify(paymentRepository, never()).save(any());
        verify(financialTransactionRepository, never()).save(any());
        verify(payableRepository, never()).save(any());
    }

    // PAY_003: Thanh toán với payable không tồn tại trả về lỗi
    @Order(3)
    @Test
    @DisplayName("PAY_003: Thanh toán với payable không tồn tại trả về lỗi")
    void payForMissingPayableReturnsError() {
        CreatePaymentRequest request = buildPaymentRequest(999L, BigDecimal.valueOf(50), PaymentMethod.CASH);

        when(payableRepository.findById(999L)).thenReturn(Optional.empty());

        ApiResponse response = payableService.makePayment(request);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).contains("Không tìm thấy công nợ");
        verify(paymentRepository, never()).save(any());
        verify(financialTransactionRepository, never()).save(any());
        verify(payableRepository, never()).save(any());
    }

    // PAY_004: Thanh toán số tiền bằng 0 chưa được xử lý đúng
    @Order(4)
    @Test
    @DisplayName("PAY_004: Thanh toán số tiền bằng 0 chưa được xử lý đúng")
    void payWithZeroAmountShouldBeRejected() {
        CreatePaymentRequest request = buildPaymentRequest(1L, BigDecimal.ZERO, PaymentMethod.CASH);
        SupplierPayable payable = buildSupplierPayable(BigDecimal.valueOf(100), BigDecimal.ZERO);

        when(payableRepository.findById(1L)).thenReturn(Optional.of(payable));

        ApiResponse response = payableService.makePayment(request);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).contains("Số tiền thanh toán phải lớn hơn 0");
        verify(paymentRepository, never()).save(any());
        verify(financialTransactionRepository, never()).save(any());
        verify(payableRepository, never()).save(any());
    }

    // PAY_005: Thanh toán số tiền âm chưa được xử lý đúng
    @Order(5)
    @Test
    @DisplayName("PAY_005: Thanh toán số tiền âm chưa được xử lý đúng")
    void payWithNegativeAmountShouldBeRejected() {
        CreatePaymentRequest request = buildPaymentRequest(1L, BigDecimal.valueOf(-10), PaymentMethod.CASH);
        SupplierPayable payable = buildSupplierPayable(BigDecimal.valueOf(100), BigDecimal.ZERO);

        when(payableRepository.findById(1L)).thenReturn(Optional.of(payable));

        ApiResponse response = payableService.makePayment(request);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).contains("Số tiền thanh toán phải lớn hơn 0");
        verify(paymentRepository, never()).save(any());
        verify(financialTransactionRepository, never()).save(any());
        verify(payableRepository, never()).save(any());
    }

    // PAY_006: Tạo công nợ từ PO khi chưa tồn tại công nợ cho PO đó
    @Order(6)
    @Test
    @DisplayName("PAY_006: Tạo công nợ từ PO khi chưa tồn tại công nợ cho PO đó")
    void createPayableFromPurchaseOrderCreatesNewPayable() {
        PurchaseOrder purchaseOrder = buildPurchaseOrder(BigDecimal.valueOf(10), BigDecimal.valueOf(2));
        when(payableRepository.findByPurchaseOrderId(1L)).thenReturn(Optional.empty());
        when(payableRepository.save(any(SupplierPayable.class))).thenAnswer(i -> i.getArgument(0));

        ApiResponse response = payableService.createPayableFromPurchaseOrder(purchaseOrder);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getMessage()).isEqualTo("Đã tạo công nợ");
        verify(payableRepository).save(any(SupplierPayable.class));
    }

    // PAY_007: Tạo công nợ từ PO trả về lỗi khi đã tồn tại công nợ cho PO đó
    @Order(7)
    @Test
    @DisplayName("PAY_007: Tạo công nợ từ PO trả về lỗi khi đã tồn tại công nợ cho PO đó")
    void createPayableFromPurchaseOrderReturnsErrorIfAlreadyExists() {
        PurchaseOrder purchaseOrder = buildPurchaseOrder(BigDecimal.valueOf(10), BigDecimal.valueOf(2));
        when(payableRepository.findByPurchaseOrderId(1L)).thenReturn(Optional.of(buildSupplierPayable(BigDecimal.valueOf(100), BigDecimal.ZERO)));

        ApiResponse response = payableService.createPayableFromPurchaseOrder(purchaseOrder);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).contains("Công nợ cho đơn nhập hàng này đã tồn tại");
    }

    // PAY_008: Tạo công nợ từ PO khi supplier không có paymentTermDays và dùng mặc định 30 ngày
    @Order(8)
    @Test
    @DisplayName("PAY_008: Tạo công nợ từ PO khi supplier không có paymentTermDays và dùng mặc định 30 ngày")
    void createPayableFromPurchaseOrderUsesDefaultPaymentTermDays() {
        PurchaseOrder purchaseOrder = buildPurchaseOrder(BigDecimal.valueOf(10), BigDecimal.valueOf(3));
        purchaseOrder.getSupplier().setPaymentTermDays(null);
        when(payableRepository.findByPurchaseOrderId(1L)).thenReturn(Optional.empty());
        when(payableRepository.save(any(SupplierPayable.class))).thenAnswer(i -> i.getArgument(0));

        ApiResponse response = payableService.createPayableFromPurchaseOrder(purchaseOrder);

        assertThat(response.isSuccess()).isTrue();
        SupplierPayableResponse saved = (SupplierPayableResponse) response.getData();
        assertThat(saved.getPaymentTermDays()).isEqualTo(30);
        assertThat(saved.getDueDate()).isEqualTo(saved.getInvoiceDate().plusDays(30));
    }

    // PAY_009: Lấy thông tin công nợ theo ID thành công
    @Order(9)
    @Test
    @DisplayName("PAY_009: Lấy thông tin công nợ theo ID thành công")
    void getPayableByIdReturnsSuccessWhenFound() {
        SupplierPayable payable = buildSupplierPayable(BigDecimal.valueOf(200), BigDecimal.valueOf(50));
        when(payableRepository.findById(1L)).thenReturn(Optional.of(payable));

        ApiResponse response = payableService.getPayableById(1L);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getMessage()).isEqualTo("Thông tin công nợ");
        assertThat(response.getData()).isNotNull();
        verify(payableRepository).findById(1L);
    }

    // PAY_010: Lấy lịch sử thanh toán trả về danh sách payment
    @Order(10)
    @Test
    @DisplayName("PAY_010: Lấy lịch sử thanh toán trả về danh sách payment")
    void getPaymentHistoryReturnsPaymentList() {
        when(paymentRepository.findByPayableId(1L)).thenReturn(List.of(buildSupplierPayment(BigDecimal.valueOf(25))));

        ApiResponse response = payableService.getPaymentHistory(1L);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getMessage()).isEqualTo("Lịch sử thanh toán");
        assertThat(((List<?>) response.getData()).size()).isEqualTo(1);
        verify(paymentRepository).findByPayableId(1L);
    }

    // PAY_011: Lấy công nợ theo nhà cung cấp trả về tổng outstanding đúng
    @Order(11)
    @Test
    @DisplayName("PAY_011: Lấy công nợ theo nhà cung cấp trả về tổng outstanding đúng")
    void getPayablesBySupplierReturnsTotalOutstanding() {
        SupplierPayable payable = buildSupplierPayable(BigDecimal.valueOf(80), BigDecimal.valueOf(20));
        when(payableRepository.findBySupplierId(100L)).thenReturn(List.of(payable));
        when(payableRepository.getTotalPayableBySupplier(100L)).thenReturn(BigDecimal.valueOf(60));

        ApiResponse response = payableService.getPayablesBySupplier(100L);

        assertThat(response.isSuccess()).isTrue();
        assertThat(((java.util.Map<?, ?>) response.getData()).get("totalOutstanding")).isEqualTo(BigDecimal.valueOf(60));
        verify(payableRepository).findBySupplierId(100L);
        verify(payableRepository).getTotalPayableBySupplier(100L);
    }

    // PAY_012: Lấy công nợ quá hạn trả về danh sách
    @Order(12)
    @Test
    @DisplayName("PAY_012: Lấy công nợ quá hạn trả về danh sách")
    void getOverduePayablesReturnsList() {
        SupplierPayable overduePayable = buildSupplierPayable(BigDecimal.valueOf(90), BigDecimal.ZERO);
        when(payableRepository.findOverduePayables(any())).thenReturn(List.of(overduePayable));

        ApiResponse response = payableService.getOverduePayables();

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getMessage()).isEqualTo("Công nợ quá hạn");
        verify(payableRepository).findOverduePayables(any());
    }

    // PAY_013: Lấy công nợ sắp đến hạn trả về danh sách theo ngày
    @Order(13)
    @Test
    @DisplayName("PAY_013: Lấy công nợ sắp đến hạn trả về danh sách theo ngày")
    void getUpcomingPayablesReturnsList() {
        SupplierPayable upcoming = buildSupplierPayable(BigDecimal.valueOf(120), BigDecimal.ZERO);
        when(payableRepository.findUpcomingPayables(any(), any())).thenReturn(List.of(upcoming));

        ApiResponse response = payableService.getUpcomingPayables(7);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getMessage()).isEqualTo("Công nợ sắp đến hạn");
        verify(payableRepository).findUpcomingPayables(any(), any());
    }

    // PAY_014: Lấy thống kê công nợ trả về tổng, overdueCount và upcomingCount
    @Order(14)
    @Test
    @DisplayName("PAY_014: Lấy thống kê công nợ trả về tổng, overdueCount và upcomingCount")
    void getPayableStatsReturnsAggregatedStats() {
        SupplierPayable overdue = buildSupplierPayable(BigDecimal.valueOf(100), BigDecimal.ZERO);
        when(payableRepository.getTotalOutstandingPayables()).thenReturn(BigDecimal.valueOf(100));
        when(payableRepository.findOverduePayables(any())).thenReturn(List.of(overdue));
        when(payableRepository.findUpcomingPayables(any(), any())).thenReturn(List.of(overdue));

        ApiResponse response = payableService.getPayableStats();

        assertThat(response.isSuccess()).isTrue();
        assertThat(((java.util.Map<?, ?>) response.getData()).get("totalOutstanding")).isEqualTo(BigDecimal.valueOf(100));
        assertThat(((java.util.Map<?, ?>) response.getData()).get("overdueCount")).isEqualTo(1);
        assertThat(((java.util.Map<?, ?>) response.getData()).get("upcomingCount")).isEqualTo(1);
    }

    // PAY_015: Lấy báo cáo công nợ trả về tổng tiền, tổng paid và tổng remaining
    @Order(15)
    @Test
    @DisplayName("PAY_015: Lấy báo cáo công nợ trả về tổng tiền, tổng paid và tổng remaining")
    void getPayableReportReturnsAggregatedReport() {
        SupplierPayable payable1 = buildSupplierPayable(BigDecimal.valueOf(80), BigDecimal.valueOf(30));
        SupplierPayable payable2 = buildSupplierPayable(BigDecimal.valueOf(50), BigDecimal.valueOf(20));
        when(payableRepository.findByInvoiceDateBetween(any(), any())).thenReturn(List.of(payable1, payable2));

        ApiResponse response = payableService.getPayableReport(LocalDate.now().minusDays(7), LocalDate.now());

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getData()).isInstanceOf(java.util.Map.class);
        assertThat(((java.util.Map<?, ?>) response.getData()).get("totalAmount")).isEqualTo(BigDecimal.valueOf(130));
        assertThat(((java.util.Map<?, ?>) response.getData()).get("totalPaid")).isEqualTo(BigDecimal.valueOf(50));
        assertThat(((java.util.Map<?, ?>) response.getData()).get("totalRemaining")).isEqualTo(BigDecimal.valueOf(80));
        verify(payableRepository).findByInvoiceDateBetween(any(), any());
    }

    private CreatePaymentRequest buildPaymentRequest(Long payableId, BigDecimal amount, PaymentMethod method) {
        CreatePaymentRequest request = new CreatePaymentRequest();
        request.setPayableId(payableId);
        request.setAmount(amount);
        request.setPaymentDate(LocalDate.now());
        request.setPaymentMethod(method);
        request.setReferenceNumber("REF-" + payableId);
        request.setNote("Test payment");
        return request;
    }

    private SupplierPayable buildSupplierPayable(BigDecimal total, BigDecimal paidAmount) {
        Supplier supplier = Supplier.builder()
                .id(100L)
                .name("Supplier Test")
                .paymentTermDays(30)
                .taxCode("TAX-123")
                .build();

        PurchaseOrder purchaseOrder = PurchaseOrder.builder()
                .id(1L)
                .poCode("PO-001")
                .supplier(supplier)
                .receivedDate(LocalDateTime.now())
                .status(null)
                .items(Collections.emptyList())
                .build();

        BigDecimal remaining = total.subtract(paidAmount);
        SupplierPayable payable = SupplierPayable.builder()
                .id(1L)
                .payableCode("AP-20260417-0001")
                .supplier(supplier)
                .purchaseOrder(purchaseOrder)
                .totalAmount(total)
                .paidAmount(paidAmount)
                .remainingAmount(remaining)
                .status(null)
                .invoiceDate(LocalDate.now())
                .dueDate(LocalDate.now().plusDays(30))
                .paymentTermDays(30)
                .createdAt(LocalDateTime.now())
                .build();
        payable.updateStatus();
        return payable;
    }

    private SupplierPayment buildSupplierPayment(BigDecimal amount) {
        SupplierPayable payable = buildSupplierPayable(BigDecimal.valueOf(100), BigDecimal.valueOf(50));
        return SupplierPayment.builder()
                .id(1L)
                .paymentCode("PAY-20260417-0001")
                .payable(payable)
                .amount(amount)
                .paymentDate(LocalDate.now())
                .paymentMethod(PaymentMethod.CASH)
                .referenceNumber("REF-0001")
                .note("Thanh toán thử")
                .createdBy("tester@example.com")
                .build();
    }

    private PurchaseOrder buildPurchaseOrder(BigDecimal unitCost, BigDecimal quantity) {
        Supplier supplier = Supplier.builder()
                .id(100L)
                .name("Supplier Test")
                .paymentTermDays(30)
                .taxCode("TAX-123")
                .build();

        PurchaseOrderItem item = PurchaseOrderItem.builder()
                .id(1L)
                .sku("SKU-001")
                .quantity(quantity.longValue())
                .unitCost(unitCost.doubleValue())
                .build();

        PurchaseOrder order = PurchaseOrder.builder()
                .id(1L)
                .poCode("PO-001")
                .supplier(supplier)
                .receivedDate(LocalDateTime.now())
                .status(null)
                .items(new ArrayList<>(List.of(item)))
                .build();
        item.setPurchaseOrder(order);
        return order;
    }

    private static class TestCaseStatusLogger implements TestWatcher, AfterAllCallback {
        private final List<String> results = new ArrayList<>();

        private String extractTestId(ExtensionContext context) {
            String displayName = context.getDisplayName();
            int separatorIndex = displayName.indexOf(":");
            return separatorIndex > 0 ? displayName.substring(0, separatorIndex).trim() : displayName.trim();
        }

        @Override
        public void testSuccessful(ExtensionContext context) {
            results.add(extractTestId(context) + ": Kết quả PASS");
        }

        @Override
        public void testFailed(ExtensionContext context, Throwable cause) {
            results.add(extractTestId(context) + ": Kết quả FAIL");
        }

        @Override
        public void afterAll(ExtensionContext context) {
            System.out.println("=== PAYMENT TESTS SUMMARY ===");
            results.forEach(System.out::println);
        }
    }
}