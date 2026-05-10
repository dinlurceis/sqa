package com.doan.WEB_TMDT.module.product.repository;

import com.doan.WEB_TMDT.module.product.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    // Nó cho phép tìm tất cả Product dựa trên ID của nhà cung cấp liên kết qua WarehouseProduct.
    List<Product> findAllByWarehouseProduct_Supplier_Id(Long supplierId);
    
    // Đếm số sản phẩm theo category
    long countByCategory_Id(Long categoryId);
    
    // Tìm sản phẩm theo category
    List<Product> findByCategory_Id(Long categoryId);
    
    /**
     * Lấy product với PESSIMISTIC_WRITE lock để tránh race condition khi đặt hàng đồng thời.
     * Khi 100 người đặt cùng lúc, chỉ 1 người được xử lý tại 1 thời điểm cho mỗi product.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdWithLock(@Param("id") Long id);

    Optional<Product> findBySku(String sku);

}