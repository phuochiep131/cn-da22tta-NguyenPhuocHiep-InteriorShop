package com.example.backend.service;

import com.example.backend.model.Category;

import java.util.List;
import java.util.Optional;

public interface CategoryService {
    List<Category> getAllCategories();
    Optional<Category> getCategoryById(String id);
    Category createCategory(Category category);
    Category updateCategory(String id, Category category);
    boolean deleteCategory(String id);
}
