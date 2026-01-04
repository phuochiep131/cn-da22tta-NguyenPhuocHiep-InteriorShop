package com.example.backend.service.impl;

import com.example.backend.model.Coupon;
import com.example.backend.repository.CouponRepository;
import com.example.backend.service.CouponService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class CouponServiceImpl implements CouponService {

    @Autowired
    private CouponRepository couponRepository;

    @Override
    public List<Coupon> getAllCoupons() {
        return couponRepository.findAll();
    }

    @Override
    public List<Coupon> getActiveCoupons() {
        return couponRepository.findByEndDateAfterAndIsActiveTrue(LocalDateTime.now());
    }

    @Override
    public Optional<Coupon> getCouponById(Integer id) {
        return couponRepository.findById(id);
    }

    @Override
    public Coupon createCoupon(Coupon coupon) {
        return couponRepository.save(coupon);
    }

    @Override
    public Coupon updateCoupon(Integer id, Coupon coupon) {
        return couponRepository.findById(id).map(existingCoupon -> {
            existingCoupon.setCode(coupon.getCode());
            existingCoupon.setDescription(coupon.getDescription());
            existingCoupon.setDiscountType(coupon.getDiscountType());
            existingCoupon.setDiscountValue(coupon.getDiscountValue());
            existingCoupon.setMinOrderAmount(coupon.getMinOrderAmount());
            existingCoupon.setMaxDiscount(coupon.getMaxDiscount());
            existingCoupon.setStartDate(coupon.getStartDate());
            existingCoupon.setEndDate(coupon.getEndDate());
            existingCoupon.setUsageLimit(coupon.getUsageLimit());
            existingCoupon.setUsedCount(coupon.getUsedCount());
            existingCoupon.setIsActive(coupon.getIsActive());
            return couponRepository.save(existingCoupon);
        }).orElseThrow(() -> new RuntimeException("Coupon not found with id " + id));
    }

    @Override
    public Coupon updateStatus(Integer id, Boolean status) {
        Coupon coupon = couponRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Coupon not found"));

        coupon.setIsActive(status);
        return couponRepository.save(coupon);
    }

    @Override
    public void deleteCoupon(Integer id) {
        couponRepository.deleteById(id);
    }
}
