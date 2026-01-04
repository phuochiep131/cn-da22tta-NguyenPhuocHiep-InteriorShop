package com.example.backend.repository;

import com.example.backend.model.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface CouponRepository extends JpaRepository<Coupon, Integer> {
    Optional<Coupon> findByCode(String code);

    List<Coupon> findByEndDateAfterAndIsActiveTrue(LocalDateTime endDate);
}
