package com.example.backend.DTO;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class FlashSaleItemDTO {
    private Integer flashSaleItemId;
    private String productId;
    private String productName;
    private String productImageUrl;
    private BigDecimal originalPrice;
    private BigDecimal flashSalePrice;
    private Integer quantity;
    private Integer soldCount;
}