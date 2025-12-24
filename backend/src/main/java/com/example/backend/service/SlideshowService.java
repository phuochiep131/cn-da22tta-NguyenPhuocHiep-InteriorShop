package com.example.backend.service;

import com.example.backend.model.Slideshow;
import java.util.List;

public interface SlideshowService {
    List<Slideshow> getAllSlideshowsForAdmin();
    List<Slideshow> getActiveSlideshowsForUser();
    Slideshow getSlideshowById(Long id);
    Slideshow createSlideshow(Slideshow slideshow);
    Slideshow updateSlideshow(Long id, Slideshow slideshowDetails);
    void deleteSlideshow(Long id);
}