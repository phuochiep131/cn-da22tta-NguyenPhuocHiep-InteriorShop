package com.example.backend.repository;

import com.example.backend.model.FlashSale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface FlashSaleRepository extends JpaRepository<FlashSale, Integer> {

    // Tìm Flash Sale đang diễn ra (Active và trong khung giờ)
    @Query("SELECT f FROM FlashSale f WHERE f.status = 'Active' AND f.startDate <= :now AND f.endDate >= :now")
    Optional<FlashSale> findCurrentActiveFlashSale(LocalDateTime now);
}