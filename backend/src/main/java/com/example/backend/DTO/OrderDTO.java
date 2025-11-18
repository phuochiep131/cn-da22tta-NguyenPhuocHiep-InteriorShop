package com.example.backend.DTO;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import com.example.backend.model.Order;

@Data
public class OrderDTO {
    private String orderId;
    private String userId;
    private String paymentMethodId;
    private String shippingAddress;
    private String customerNote;
    private String orderStatus;
    private LocalDateTime orderDate;
    private Integer couponId;
    private BigDecimal totalAmount;
    private Boolean isOrder;
    private List<OrderDetailDTO> orderDetails;
    
    public OrderDTO(Order order) {
    this.orderId = order.getOrderId();
    this.userId = order.getUserId();
    this.paymentMethodId = order.getPaymentMethodId();
    this.shippingAddress = order.getShippingAddress();
    this.customerNote = order.getCustomerNote();
    this.orderStatus = order.getOrderStatus();
    this.orderDate = order.getOrderDate();
    this.couponId = order.getCouponId();
    this.totalAmount = order.getTotalAmount();
    this.isOrder = order.getIsOrder();
    this.orderDetails = order.getOrderDetails()
            .stream()
            .map(OrderDetailDTO::new)
            .toList();
}

}
