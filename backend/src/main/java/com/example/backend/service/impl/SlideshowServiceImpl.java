package com.example.backend.service.impl;

import com.example.backend.model.Slideshow;
import com.example.backend.repository.SlideshowRepository;
import com.example.backend.service.SlideshowService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class SlideshowServiceImpl implements SlideshowService {

    @Autowired
    private SlideshowRepository slideshowRepository;

    @Override
    public List<Slideshow> getAllSlideshowsForAdmin() {
        return slideshowRepository.findAllByOrderBySortOrderAsc();
    }

    @Override
    public List<Slideshow> getActiveSlideshowsForUser() {
        return slideshowRepository.findByActiveTrueOrderBySortOrderAsc();
    }

    @Override
    public Slideshow getSlideshowById(Long id) {
        return slideshowRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Slideshow với ID: " + id));
    }

    @Override
    public Slideshow createSlideshow(Slideshow slideshow) {
        // Có thể thêm logic validate tại đây nếu cần
        if (slideshow.getSortOrder() == null) {
            slideshow.setSortOrder(0); // Mặc định thứ tự là 0
        }
        return slideshowRepository.save(slideshow);
    }

    @Override
    public Slideshow updateSlideshow(Long id, Slideshow slideshowDetails) {
        Slideshow existingSlide = getSlideshowById(id);

        // Cập nhật thông tin
        existingSlide.setTitle(slideshowDetails.getTitle());
        existingSlide.setDescription(slideshowDetails.getDescription());
        existingSlide.setImageUrl(slideshowDetails.getImageUrl());
        existingSlide.setTargetUrl(slideshowDetails.getTargetUrl());
        existingSlide.setSortOrder(slideshowDetails.getSortOrder());
        existingSlide.setActive(slideshowDetails.getActive());

        return slideshowRepository.save(existingSlide);
    }

    @Override
    public void deleteSlideshow(Long id) {
        Slideshow slide = getSlideshowById(id);
        slideshowRepository.delete(slide);
    }
}