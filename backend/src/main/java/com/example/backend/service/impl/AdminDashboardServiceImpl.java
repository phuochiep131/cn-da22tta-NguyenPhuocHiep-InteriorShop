package com.example.backend.service.impl;

import com.example.backend.repository.OrderDetailRepository;
import com.example.backend.repository.OrderRepository;
import com.example.backend.repository.ProductRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.projection.RevenueComparisonProjection;
import com.example.backend.service.AdminDashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.List;

@Service
public class AdminDashboardServiceImpl implements AdminDashboardService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderDetailRepository orderDetailRepository;

    @Autowired
    private ProductRepository productRepository;

    @Override
    public Map<String, Object> getDashboardOverview() {
        Map<String, Object> stats = new HashMap<>();
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);

        long totalUsersNow = userRepository.count();
        long totalUsersLastWeek = userRepository.countByCreatedAtBefore(sevenDaysAgo);
        double userGrowth = calculateGrowth(totalUsersNow, totalUsersLastWeek);

        stats.put("totalUsers", totalUsersNow);
        stats.put("userGrowth", userGrowth);

        long totalOrdersNow = orderRepository.countByIsOrderTrue();
        long totalOrdersLastWeek = orderRepository.countByIsOrderTrueAndOrderDateBefore(sevenDaysAgo);
        double orderGrowth = calculateGrowth(totalOrdersNow, totalOrdersLastWeek);

        stats.put("newOrders", totalOrdersNow);
        stats.put("orderGrowth", orderGrowth);

        YearMonth currentMonth = YearMonth.now();
        LocalDateTime startOfThisMonth = currentMonth.atDay(1).atStartOfDay();
        LocalDateTime endOfThisMonth = currentMonth.atEndOfMonth().atTime(23, 59, 59);

        YearMonth lastMonth = currentMonth.minusMonths(1);
        LocalDateTime startOfLastMonth = lastMonth.atDay(1).atStartOfDay();
        LocalDateTime endOfLastMonth = lastMonth.atEndOfMonth().atTime(23, 59, 59);

        BigDecimal revenueThisMonth = orderRepository.sumRevenueByDateRange(startOfThisMonth, endOfThisMonth);
        BigDecimal revenueLastMonth = orderRepository.sumRevenueByDateRange(startOfLastMonth, endOfLastMonth);

        revenueThisMonth = (revenueThisMonth == null) ? BigDecimal.ZERO : revenueThisMonth;
        revenueLastMonth = (revenueLastMonth == null) ? BigDecimal.ZERO : revenueLastMonth;

        double revenueGrowth = 0.0;
        if (revenueLastMonth.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal diff = revenueThisMonth.subtract(revenueLastMonth);
            revenueGrowth = diff.divide(revenueLastMonth, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100)).doubleValue();
        } else if (revenueThisMonth.compareTo(BigDecimal.ZERO) > 0) {
            revenueGrowth = 100.0;
        }

        stats.put("monthlyRevenue", revenueThisMonth);
        stats.put("revenueGrowth", Math.round(revenueGrowth * 10.0) / 10.0);

        Long totalStock = productRepository.sumTotalStock();
        stats.put("totalStock", totalStock != null ? totalStock : 0L);

        return stats;
    }

    private double calculateGrowth(long current, long previous) {
        if (previous > 0) {
            double growth = ((double)(current - previous) / previous) * 100;
            return Math.round(growth * 10.0) / 10.0;
        }
        return current > 0 ? 100.0 : 0.0;
    }

    @Override
    public List<Map<String, Object>> getOrderStatusStats() {

        List<Object[]> results = orderRepository.countOrdersByStatus();

        List<Map<String, Object>> stats = new ArrayList<>();

        for (Object[] result : results) {
            Map<String, Object> item = new HashMap<>();
            item.put("name", result[0].toString());
            item.put("value", result[1]);

            stats.add(item);
        }

        return stats;
    }

    @Override
    public List<Map<String, Object>> getTopSellingCategories() {
        // Lấy Top 5 danh mục
        Pageable topFive = PageRequest.of(0, 5);
        List<Object[]> results = orderDetailRepository.findTopSellingCategories(topFive);

        List<Map<String, Object>> stats = new ArrayList<>();
        for (Object[] result : results) {
            Map<String, Object> item = new HashMap<>();
            item.put("name", result[0].toString());      // Tên danh mục
            item.put("value", result[1]);                // Tổng số lượng bán
            stats.add(item);
        }
        return stats;
    }

    @Override
    public List<Map<String, Object>> getTopSellingProducts() {
        // Lấy Top 5 sản phẩm
        Pageable topFive = PageRequest.of(0, 5);
        List<Object[]> results = orderDetailRepository.findTopSellingProducts(topFive);

        List<Map<String, Object>> stats = new ArrayList<>();
        for (Object[] result : results) {
            Map<String, Object> item = new HashMap<>();
            item.put("name", result[0]);                 // Tên SP
            item.put("image", result[1]);                // Ảnh
            item.put("price", result[2]);                // Giá
            item.put("sold", result[3]);                 // Tổng bán
            stats.add(item);
        }
        return stats;
    }

    @Override
    public List<Map<String, Object>> getRevenueComparison() {
        List<RevenueComparisonProjection> rawData = orderRepository.getRevenueComparison();

        List<Map<String, Object>> result = new ArrayList<>();
        for (RevenueComparisonProjection p : rawData) {
            Map<String, Object> item = new HashMap<>();
            item.put("label", p.getLabel());
            item.put("actual", p.getActual());
            item.put("estimated", p.getEstimated());
            result.add(item);
        }
        return result;
    }

}