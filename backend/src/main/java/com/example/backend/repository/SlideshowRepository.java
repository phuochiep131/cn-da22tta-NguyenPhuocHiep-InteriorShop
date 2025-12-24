package com.example.backend.repository;

import com.example.backend.model.Slideshow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SlideshowRepository extends JpaRepository<Slideshow, Long> {
    // Lấy tất cả slide đang hoạt động và sắp xếp theo thứ tự
    List<Slideshow> findByActiveTrueOrderBySortOrderAsc();

    // Lấy tất cả (kể cả ẩn) để admin quản lý, sắp xếp theo thứ tự
    List<Slideshow> findAllByOrderBySortOrderAsc();
}