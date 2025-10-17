package com.example.backend.service;

import com.example.backend.model.Product;
import java.util.List;
import java.util.Optional;

public interface ProductService {
    List<Product> getAllProducts();
    Optional<Product> getProductById(String id);
    Product createProduct(Product product);
    Product updateProduct(String id, Product product);
    void deleteProduct(String id);

    List<Product> getProductsByCategoryId(String categoryId);

}
