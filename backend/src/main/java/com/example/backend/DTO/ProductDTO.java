package com.example.backend.DTO;

import com.example.backend.model.Category;
import com.example.backend.model.Product;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class ProductDTO {
    private String productId;
    private String productName;
    private BigDecimal price;
    private String description;
    private String imageUrl;
    private int quantity;
    private BigDecimal discount;
    private String categoryId;
    private String size;
    private String color;
    private String material;
    private String warranty;
    private String origin;
    private LocalDateTime createdAt;
    private Category category;

    public ProductDTO(Product product) {
        this.productId = product.getProductId();
        this.productName = product.getProductName();
        this.price = product.getPrice();
        this.description = product.getDescription();
        this.imageUrl = product.getImageUrl();
        this.quantity = product.getQuantity();
        this.discount = product.getDiscount();
        this.categoryId = product.getCategoryId();
        this.size = product.getSize();
        this.color = product.getColor();
        this.material = product.getMaterial();
        this.warranty = product.getWarranty();
        this.origin = product.getOrigin();
        this.createdAt = product.getCreatedAt();
        this.category = product.getCategory();
    }
}
