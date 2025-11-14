package com.example.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "order_details")
public class OrderDetail {

    @Id
    @Column(name = "order_detail_id", length = 50)
    private String orderDetailId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "order_id", insertable = false, updatable = false)
    @JsonIgnoreProperties({"orderDetails"})
    private Order order;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", insertable = false, updatable = false)
    @JsonIgnoreProperties({"orderDetails"})
    private Product product;

    @Column(name = "order_id", nullable = false, length = 50)
    private String orderId;

    @Column(name = "product_id", nullable = false, length = 50)
    private String productId;

    @Column(name = "quantity", nullable = false)
    private int quantity;

    @Column(name = "unit_price", nullable = false)
    private BigDecimal unitPrice;

    @Column(name = "original_unit_price", nullable = false)
    private BigDecimal originalUnitPrice;

    // Xóa cột subtotal database, tính động
    public BigDecimal getSubtotal() {
        return unitPrice.multiply(BigDecimal.valueOf(quantity));
    }

    // Getters và Setters
    public String getOrderDetailId() { return orderDetailId; }
    public void setOrderDetailId(String orderDetailId) { this.orderDetailId = orderDetailId; }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

    public BigDecimal getOriginalUnitPrice() { return originalUnitPrice; }
    public void setOriginalUnitPrice(BigDecimal originalUnitPrice) { this.originalUnitPrice = originalUnitPrice; }

    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }

    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }
}
