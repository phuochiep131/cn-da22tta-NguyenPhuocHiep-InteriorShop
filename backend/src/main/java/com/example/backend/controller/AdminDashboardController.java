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

    @GetMapping("/customers/top")
    public ResponseEntity<List<Map<String, Object>>> getTopCustomers() {
        return ResponseEntity.ok(dashboardService.getTopCustomers());
    }

    @GetMapping("/chart/revenue-comparison")
    public ResponseEntity<List<Map<String, Object>>> getRevenueComparison() {
        return ResponseEntity.ok(dashboardService.getRevenueComparison());
    }

    @GetMapping("/chart/revenue")
    public ResponseEntity<List<Map<String, Object>>> getRevenueStats(
            @RequestParam(defaultValue = "7_DAYS") String range) {
        return ResponseEntity.ok(dashboardService.getRevenueStatistics(range));
    }

    @GetMapping("/chart/revenue/custom")
    public ResponseEntity<?> getRevenueChartCustom(
            @RequestParam String from,
            @RequestParam String to) {
        return ResponseEntity.ok(dashboardService.getRevenueStatisticsByDateRange(from, to));
    }

    @GetMapping("/orders/peak-hours")
    public ResponseEntity<List<Map<String, Object>>> getPeakHours() {
        return ResponseEntity.ok(dashboardService.getPeakHoursStats());
    }

    @GetMapping("/products/low-stock")
    public ResponseEntity<List<Map<String, Object>>> getLowStock() {
        return ResponseEntity.ok(dashboardService.getLowStockProducts());
    }

}