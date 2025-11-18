package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Order {

    @Id
    @Column(name = "order_id", length = 50)
    private String orderId;

    @Column(name = "user_id", length = 50)
    private String userId;

    @Column(name = "payment_method_id", length = 50)
    private String paymentMethodId;

    @Column(name = "shipping_address")
    private String shippingAddress;

    @Column(name = "customer_note")
    private String customerNote;

    @Column(name = "order_status")
    private String orderStatus;

    @Column(name = "order_date")
    private LocalDateTime orderDate;

    @Column(name = "coupon_id")
    private Integer couponId;

    @Column(name = "total_amount")
    private BigDecimal totalAmount;

    @Column(name = "is_order")
    private Boolean isOrder;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderDetail> orderDetails;
}
