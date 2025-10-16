package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "Products")
public class Product {

    @Id
    @Column(name = "product_id", length = 50)
    private String productId;

    @Column(name = "product_name", nullable = false, length = 100)
    private String productName;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal price;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url", length = 255)
    private String imageUrl;

    @Column(columnDefinition = "INT DEFAULT 0")
    private int quantity = 0;

    @Column(precision = 5, scale = 2)
    private BigDecimal discount = BigDecimal.ZERO;

    @Column(name = "category_id", length = 50)
    private String categoryId;

    @Column(length = 50)
    private String size;

    @Column(length = 50)
    private String color;

    @Column(length = 100)
    private String material;

    @Column(length = 50)
    private String warranty;

    @Column(length = 100)
    private String origin;

    @Column(name = "created_at", updatable = false, insertable = false)
    private LocalDateTime createdAt;
}
