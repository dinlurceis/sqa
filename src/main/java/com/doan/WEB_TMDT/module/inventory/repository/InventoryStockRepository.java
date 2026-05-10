package com.doan.WEB_TMDT.module.inventory.repository;

import com.doan.WEB_TMDT.module.inventory.entity.InventoryStock;
import com.doan.WEB_TMDT.module.inventory.entity.WarehouseProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InventoryStockRepository extends JpaRepository<InventoryStock, Long> {

    Optional<InventoryStock> findByWarehouseProduct_Id(Long id);

    @Query("SELECT s FROM InventoryStock s WHERE s.warehouseProduct.sku = :sku")
    Optional<InventoryStock> findByWarehouseProductSku(@Param("sku") String sku);

    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END " +
            "FROM InventoryStock s WHERE s.warehouseProduct.sku = :sku")
    boolean existsByWarehouseProductSku(@Param("sku") String sku);

    List<InventoryStock> findAllByWarehouseProduct_Supplier_Id(Long supplierId);

    @Query("SELECT s FROM InventoryStock s WHERE s.warehouseProduct.product.id = :productId")
    Optional<InventoryStock> findByProductId(@Param("productId") Long productId);

    @Query("SELECT s FROM InventoryStock s WHERE s.onHand > 0 AND s.onHand <= :threshold")
    List<InventoryStock> findLowStockItems(@Param("threshold") long threshold);
}


