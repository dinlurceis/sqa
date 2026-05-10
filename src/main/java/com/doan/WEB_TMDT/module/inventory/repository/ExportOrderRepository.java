package com.doan.WEB_TMDT.module.inventory.repository;

import com.doan.WEB_TMDT.module.inventory.entity.ExportOrder;
import com.doan.WEB_TMDT.module.inventory.entity.ExportStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExportOrderRepository extends JpaRepository<ExportOrder, Long> {
    boolean existsByOrderId(Long orderId);
    boolean existsByExportCode(String exportCode);
    List<ExportOrder> findByStatus(ExportStatus status);
    Optional<ExportOrder> findByExportCode(String exportCode);
}
