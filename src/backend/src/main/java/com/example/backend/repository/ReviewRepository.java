package com.example.backend.repository;

import com.example.backend.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Integer> {
    // Tìm review theo sản phẩm để hiển thị chi tiết sản phẩm
    List<Review> findByProduct_ProductId(String productId);

    // Tìm review theo user (lịch sử đánh giá)
    List<Review> findByUser_UserId(String userId);
}