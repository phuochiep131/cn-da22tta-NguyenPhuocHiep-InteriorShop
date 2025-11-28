package com.example.backend.controller;

import com.example.backend.service.AdminDashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/dashboard")
@CrossOrigin(origins = "*")
public class AdminDashboardController {

    @Autowired
    private AdminDashboardService dashboardService;

    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> getDashboardOverview() {
        return ResponseEntity.ok(dashboardService.getDashboardOverview());
    }

    @GetMapping("/orders/status")
    public ResponseEntity<List<Map<String, Object>>> getOrderStatusStats() {
        return ResponseEntity.ok(dashboardService.getOrderStatusStats());
    }

    @GetMapping("/categories/top")
    public ResponseEntity<List<Map<String, Object>>> getTopSellingCategories() {
        return ResponseEntity.ok(dashboardService.getTopSellingCategories());
    }

    @GetMapping("/products/top")
    public ResponseEntity<List<Map<String, Object>>> getTopSellingProducts() {
        return ResponseEntity.ok(dashboardService.getTopSellingProducts());
    }

    @GetMapping("/chart/revenue-comparison")
    public ResponseEntity<List<Map<String, Object>>> getRevenueComparison() {
        return ResponseEntity.ok(dashboardService.getRevenueComparison());
    }

}