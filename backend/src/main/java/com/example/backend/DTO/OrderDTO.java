package com.example.backend.DTO;

import com.example.backend.model.Order;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class OrderDTO {

    private String orderId;
    private String userId;
    private String shippingAddress;
    private String customerNote;
    private String orderStatus;
    private LocalDateTime orderDate;
    private LocalDateTime updatedAt;
    private Integer couponId;
    private BigDecimal totalAmount;
    private Boolean isOrder;
    private List<String> oldOrderIds;
    private List<OrderDetailDTO> orderDetails;

    private PaymentDTO payment;

    public OrderDTO() {}

    public OrderDTO(Order order) {
        this.orderId = order.getOrderId();
        this.userId = order.getUserId();
        this.shippingAddress = order.getShippingAddress();
        this.customerNote = order.getCustomerNote();
        this.orderStatus = order.getOrderStatus();
        this.orderDate = order.getOrderDate();
        this.updatedAt = order.getUpdatedAt();
        this.couponId = order.getCouponId();
        this.totalAmount = order.getTotalAmount();
        this.isOrder = order.getIsOrder();

        if (order.getOrderDetails() != null) {
            this.orderDetails = order.getOrderDetails().stream()
                    .map(OrderDetailDTO::new)
                    .toList();
        }

        if (order.getPayment() != null) {
            this.payment = PaymentDTO.builder()
                    .paymentId(order.getPayment().getPaymentId())
                    .orderId(order.getOrderId())
                    .paymentMethodId(order.getPayment().getPaymentMethodId())
                    .transactionId(order.getPayment().getTransactionId())
                    .amount(order.getPayment().getAmount())
                    .paymentStatus(order.getPayment().getPaymentStatus().name())
                    .build();
        }
    }
}