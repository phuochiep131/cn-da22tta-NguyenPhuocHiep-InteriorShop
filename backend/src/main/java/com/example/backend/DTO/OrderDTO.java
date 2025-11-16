package com.example.backend.DTO;

import com.example.backend.model.Order;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

public class OrderDTO {
    private String orderId;
    private String userId;
    private String paymentMethodId;
    private String shippingAddress;
    private String customerNote;
    private String orderStatus;
    private BigDecimal totalAmount;
    private List<OrderDetailDTO> orderDetails;

    public OrderDTO(Order order) {
        this.orderId = order.getOrderId();
        this.userId = order.getUserId();
        this.paymentMethodId = order.getPaymentMethodId();
        this.shippingAddress = order.getShippingAddress();
        this.customerNote = order.getCustomerNote();
        this.orderStatus = order.getOrderStatus();
        this.totalAmount = order.getTotalAmount();
        this.orderDetails = order.getOrderDetails().stream()
                .map(OrderDetailDTO::new)
                .collect(Collectors.toList());
    }

    // Getters
    public String getOrderId() { return orderId; }
    public String getUserId() { return userId; }
    public String getPaymentMethodId() { return paymentMethodId; }
    public String getShippingAddress() { return shippingAddress; }
    public String getCustomerNote() { return customerNote; }
    public String getOrderStatus() { return orderStatus; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public List<OrderDetailDTO> getOrderDetails() { return orderDetails; }
}
