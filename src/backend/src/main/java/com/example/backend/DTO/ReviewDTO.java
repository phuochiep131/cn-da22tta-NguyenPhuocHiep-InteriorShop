package com.example.backend.DTO;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ReviewDTO {
    private Integer reviewId;
    private String userId;      // Nhận ID user từ FE
    private String productId;   // Nhận ID product từ FE
    private String userName;    // Trả về tên user (tùy chọn, để hiển thị cho đẹp)
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
}