package com.example.backend.service.impl;

import com.example.backend.model.Product;
import com.example.backend.repository.ProductRepository;
import com.example.backend.service.ProductService;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;

    public ProductServiceImpl(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Override
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @Override
    public Optional<Product> getProductById(String id) {
        return productRepository.findById(id);
    }

    @Override
    public Product createProduct(Product product) {
        return productRepository.save(product);
    }

    @Override
    public Product updateProduct(String id, Product product) {
        return productRepository.findById(id).map(existing -> {
            existing.setProductName(product.getProductName());
            existing.setPrice(product.getPrice());
            existing.setDescription(product.getDescription());
            existing.setImageUrl(product.getImageUrl());
            existing.setQuantity(product.getQuantity());
            existing.setDiscount(product.getDiscount());
            existing.setCategoryId(product.getCategoryId());
            existing.setSize(product.getSize());
            existing.setColor(product.getColor());
            existing.setMaterial(product.getMaterial());
            existing.setWarranty(product.getWarranty());
            existing.setOrigin(product.getOrigin());
            return productRepository.save(existing);
        }).orElseThrow(() -> new RuntimeException("Product not found"));
    }

    @Override
    public void deleteProduct(String id) {
        productRepository.deleteById(id);
    }

    @Override
        public List<Product> getProductsByCategoryId(String categoryId) {
            return productRepository.findByCategoryId(categoryId);
        }

}
