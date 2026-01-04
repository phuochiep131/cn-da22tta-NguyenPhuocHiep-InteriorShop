package com.example.backend.DTO;

import com.example.backend.model.OrderDetail;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
public class OrderDetailDTO {
    private String orderDetailId;
    private ProductDTO product;  // dùng ProductDTO
    private int quantity;
    private BigDecimal unitPrice;
    private BigDecimal originalUnitPrice;
    private BigDecimal subtotal;
    private Integer isFlashSaleFlag;

    public OrderDetailDTO(OrderDetail detail) {
        this.orderDetailId = detail.getOrderDetailId();
        this.product = new ProductDTO(detail.getProduct());
        this.quantity = detail.getQuantity();
        this.unitPrice = detail.getUnitPrice();
        this.originalUnitPrice = detail.getOriginalUnitPrice();
        this.subtotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
        this.isFlashSaleFlag = detail.getIsFlashSale();
    }
}
