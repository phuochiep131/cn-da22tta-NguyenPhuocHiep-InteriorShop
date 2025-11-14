package com.example.backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.List;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @Column(name = "order_id", length = 50)
    private String orderId;

    @Column(name = "user_id", nullable = false, length = 50)
    private String userId;

    @Column(name = "payment_method_id", length = 50)
    private String paymentMethodId;

    @Column(name = "shipping_address", length = 255)
    private String shippingAddress;

    @Column(name = "customer_note")
    private String customerNote;

    @Column(name = "order_status")
    private String orderStatus;

    @Column(name = "coupon_id")
    private Integer couponId;

    @Column(name = "total_amount")
    private BigDecimal totalAmount;

    @Transient
    private List<OrderDetail> orderDetails;

    // Getters & Setters
    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public String getOrderStatus() {
        return orderStatus;
    }

    public void setOrderStatus(String orderStatus) {
        this.orderStatus = orderStatus;
    }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getPaymentMethodId() { return paymentMethodId; }
    public void setPaymentMethodId(String paymentMethodId) { this.paymentMethodId = paymentMethodId; }

    public String getShippingAddress() { return shippingAddress; }
    public void setShippingAddress(String shippingAddress) { this.shippingAddress = shippingAddress; }

    public String getCustomerNote() { return customerNote; }
    public void setCustomerNote(String customerNote) { this.customerNote = customerNote; }

    public Integer getCouponId() { return couponId; }
    public void setCouponId(Integer couponId) { this.couponId = couponId; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public List<OrderDetail> getOrderDetails() { return orderDetails; }
    public void setOrderDetails(List<OrderDetail> orderDetails) { this.orderDetails = orderDetails; }
}
