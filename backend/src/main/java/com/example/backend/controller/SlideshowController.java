package com.example.backend.controller;

import com.example.backend.model.Slideshow;
import com.example.backend.service.SlideshowService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/slideshows")
@CrossOrigin(origins = "*")
public class SlideshowController {

    @Autowired
    private SlideshowService slideshowService;

    @GetMapping("/public")
    public ResponseEntity<List<Slideshow>> getPublicSlides() {
        return ResponseEntity.ok(slideshowService.getActiveSlideshowsForUser());
    }

    @GetMapping("/admin")
    public ResponseEntity<List<Slideshow>> getAllSlides() {
        return ResponseEntity.ok(slideshowService.getAllSlideshowsForAdmin());
    }

    @PostMapping("/admin")
    public ResponseEntity<Slideshow> createSlide(@RequestBody Slideshow slideshow) {
        return ResponseEntity.ok(slideshowService.createSlideshow(slideshow));
    }

    @PutMapping("/admin/{id}")
    public ResponseEntity<Slideshow> updateSlide(@PathVariable Long id, @RequestBody Slideshow slideshow) {
        return ResponseEntity.ok(slideshowService.updateSlideshow(id, slideshow));
    }

    @DeleteMapping("/admin/{id}")
    public ResponseEntity<String> deleteSlide(@PathVariable Long id) {
        slideshowService.deleteSlideshow(id);
        return ResponseEntity.ok("Đã xóa slide thành công.");
    }
}