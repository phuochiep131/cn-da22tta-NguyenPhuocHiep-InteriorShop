package com.example.backend.repository.projection;

public interface RevenueComparisonProjection {
    String getLabel();      // Ví dụ: "T11"
    Double getActual();     // Doanh thu thực tế
    Double getEstimated();  // Doanh thu ước tính
}