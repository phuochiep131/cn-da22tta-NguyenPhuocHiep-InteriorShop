package com.example.backend.repository;

import com.example.backend.model.FlashSale;
import com.example.backend.model.FlashSaleItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FlashSaleItemRepository extends JpaRepository<FlashSaleItem, Integer> {
    List<FlashSaleItem> findByFlashSale_FlashSaleId(Integer flashSaleId);

    // Tìm item cụ thể để check kho khi đặt hàng
    Optional<FlashSaleItem> findByFlashSale_FlashSaleIdAndProduct_ProductId(Integer flashSaleId, String productId);
    Optional<FlashSaleItem> findByFlashSaleAndProduct_ProductId(FlashSale flashSale, String productId);
}