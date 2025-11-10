package com.example.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @Column(name = "order_id", length = 50)
    private String orderId;

    @Column(name = "user_id", length = 50, nullable = false)
    private String userId;

    @Column(name = "order_date", columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime orderDate;

    @Column(name = "total_amount", precision = 18, scale = 2, nullable = false)
    private BigDecimal totalAmount;

    @Column(name = "shipping_address", length = 255, nullable = false)
    private String shippingAddress;

    @Column(name = "customer_note", columnDefinition = "TEXT")
    private String customerNote;

    @Column(name = "payment_method_id", length = 50)
    private String paymentMethodId;

    @Column(name = "shipping_fee", precision = 18, scale = 2, columnDefinition = "DECIMAL(18,2) DEFAULT 0")
    private BigDecimal shippingFee;

    @Column(name = "tax_amount", precision = 18, scale = 2, columnDefinition = "DECIMAL(18,2) DEFAULT 0")
    private BigDecimal taxAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_status", columnDefinition = "ENUM('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled') DEFAULT 'Pending'")
    private OrderStatus orderStatus;

    @Column(name = "coupon_id")
    private Integer couponId;

    @Column(name = "discount_amount", precision = 18, scale = 2, columnDefinition = "DECIMAL(18,2) DEFAULT 0")
    private BigDecimal discountAmount;

    @Column(name = "updated_at", columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
    private LocalDateTime updatedAt;

    public enum OrderStatus {
        Pending, Processing, Shipped, Delivered, Cancelled
    }
}
