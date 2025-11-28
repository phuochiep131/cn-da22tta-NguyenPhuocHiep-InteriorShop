package com.example.backend.service;

import java.util.Map;
import java.util.List;

public interface AdminDashboardService {

    //Lay tong quan
    Map<String, Object> getDashboardOverview();

    //Top
    List<Map<String, Object>> getOrderStatusStats();
    List<Map<String, Object>> getTopSellingCategories();
    List<Map<String, Object>> getTopSellingProducts();

    //Uoc tinh doanh thu vs thuc te
    List<Map<String, Object>> getRevenueComparison();
}