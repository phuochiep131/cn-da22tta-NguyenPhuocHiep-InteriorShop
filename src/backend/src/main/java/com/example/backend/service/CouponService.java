package com.example.backend.service;

import com.example.backend.model.Coupon;
import java.util.List;
import java.util.Optional;

public interface CouponService {
    List<Coupon> getAllCoupons();
    List<Coupon> getActiveCoupons();
    Optional<Coupon> getCouponById(Integer id);
    Coupon createCoupon(Coupon coupon);
    Coupon updateCoupon(Integer id, Coupon coupon);
    void deleteCoupon(Integer id);
    Coupon updateStatus(Integer id, Boolean status);
}
 