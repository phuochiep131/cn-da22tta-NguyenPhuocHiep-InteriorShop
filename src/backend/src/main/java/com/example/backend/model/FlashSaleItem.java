package com.example.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "flash_sale_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FlashSaleItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "flash_sale_item_id")
    private Integer flashSaleItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flash_sale_id", nullable = false)
    private FlashSale flashSale;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "flash_sale_price", nullable = false)
    private BigDecimal flashSalePrice;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "sold_count")
    private Integer soldCount = 0;
}