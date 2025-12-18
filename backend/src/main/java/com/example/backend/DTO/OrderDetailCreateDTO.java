package com.example.backend.DTO;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class OrderDetailCreateDTO {

    private ProductIdWrapper product;
    private int quantity;
    private BigDecimal unitPrice;
    private BigDecimal originalUnitPrice;
    private Integer isFlashSale;

    @Data
    public static class ProductIdWrapper {
        private String productId;
    }
}
