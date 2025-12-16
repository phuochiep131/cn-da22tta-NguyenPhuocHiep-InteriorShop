package com.example.backend.service;

import com.example.backend.DTO.ReviewDTO;
import java.util.List;

public interface ReviewService {
    List<ReviewDTO> getAllReviews();
    List<ReviewDTO> getReviewsByProductId(String productId);
    ReviewDTO createReview(ReviewDTO reviewDTO);
    ReviewDTO updateReview(Integer reviewId, ReviewDTO reviewDTO);
    void deleteReview(Integer reviewId);
}