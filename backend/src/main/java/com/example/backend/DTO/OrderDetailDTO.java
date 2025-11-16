package com.example.backend.DTO;

import com.example.backend.model.OrderDetail;
import com.example.backend.model.Product;

import java.math.BigDecimal;

public class OrderDetailDTO {
    private String orderDetailId;
    private Product product;
    private int quantity;
    private BigDecimal unitPrice;
    private BigDecimal originalUnitPrice;
    private BigDecimal subtotal;

    public OrderDetailDTO(OrderDetail detail) {
        this.orderDetailId = detail.getOrderDetailId();
        this.product = detail.getProduct();
        this.quantity = detail.getQuantity();
        this.unitPrice = detail.getUnitPrice();
        this.originalUnitPrice = detail.getOriginalUnitPrice();
        this.subtotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
    }

    // Getters
    public String getOrderDetailId() { return orderDetailId; }
    public Product getProduct() { return product; }
    public int getQuantity() { return quantity; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public BigDecimal getOriginalUnitPrice() { return originalUnitPrice; }
    public BigDecimal getSubtotal() { return subtotal; }
}
