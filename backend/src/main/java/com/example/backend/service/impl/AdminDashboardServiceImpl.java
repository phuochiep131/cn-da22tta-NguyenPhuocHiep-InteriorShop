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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
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

    @Override
    public List<Map<String, Object>> getTopCustomers() {
        List<Object[]> results = orderRepository.findTopSpendingCustomers();
        List<Map<String, Object>> list = new ArrayList<>();

        for (Object[] row : results) {
            Map<String, Object> item = new HashMap<>();
            item.put("name", row[0]);
            item.put("email", row[1]);
            item.put("avatar", row[2]);
            item.put("totalSpent", row[3]);
            list.add(item);
        }
        return list;
    }

    @Override
    public List<Map<String, Object>> getRevenueStatistics(String timeRange) {
        LocalDateTime endDate = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);
        LocalDateTime startDate;

        switch (timeRange) {
            case "TODAY":
                startDate = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
                break;
            case "3_DAYS": startDate = endDate.minusDays(2); break;
            case "7_DAYS": startDate = endDate.minusDays(6); break;
            case "1_MONTH": startDate = endDate.minusMonths(1); break;
            case "3_MONTHS": startDate = endDate.minusMonths(3); break;
            default: startDate = endDate.minusDays(6);
        }

        return processChartData(startDate, endDate);
    }

    // 2. [MỚI] Method xử lý Custom Date Range (cho Export)
    @Override
    public List<Map<String, Object>> getRevenueStatisticsByDateRange(String fromDateStr, String toDateStr) {
        try {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

            // Parse String (yyyy-MM-dd) thành LocalDateTime
            // Ngày bắt đầu: 00:00:00
            LocalDateTime startDate = LocalDate.parse(fromDateStr, formatter).atStartOfDay();

            // Ngày kết thúc: 23:59:59
            LocalDateTime endDate = LocalDate.parse(toDateStr, formatter).atTime(LocalTime.MAX);

            return processChartData(startDate, endDate);
        } catch (DateTimeParseException e) {
            throw new RuntimeException("Lỗi định dạng ngày tháng (yyyy-MM-dd): " + e.getMessage());
        }
    }

    // 3. [HELPER] Hàm chung để Query và Map dữ liệu (Tách từ code cũ của bạn ra)
    private List<Map<String, Object>> processChartData(LocalDateTime startDate, LocalDateTime endDate) {
        // Lấy dữ liệu thô từ DB
        List<Object[]> rawData = orderRepository.findRevenueChartData(startDate, endDate);

        // Map dữ liệu vào HashMap (Key: LocalDate -> Value: Data)
        Map<LocalDate, Map<String, Object>> dataMap = new HashMap<>();
        for (Object[] row : rawData) {
            LocalDate date;
            if (row[0] instanceof java.sql.Date) {
                date = ((java.sql.Date) row[0]).toLocalDate();
            } else {
                date = LocalDate.parse(row[0].toString());
            }

            BigDecimal amount = (BigDecimal) row[1];
            Long count = (Long) row[2];

            Map<String, Object> values = new HashMap<>();
            values.put("revenue", amount);
            values.put("count", count);

            dataMap.put(date, values);
        }

        // Loop để fill data đầy đủ các ngày (kể cả ngày không có đơn)
        List<Map<String, Object>> result = new ArrayList<>();
        LocalDate current = startDate.toLocalDate();
        LocalDate end = endDate.toLocalDate();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy"); // Format đẹp cho báo cáo

        while (!current.isAfter(end)) {
            Map<String, Object> item = new HashMap<>();
            item.put("label", current.format(formatter)); // VD: 10/12/2025

            if (dataMap.containsKey(current)) {
                item.put("revenue", dataMap.get(current).get("revenue"));
                item.put("orderCount", dataMap.get(current).get("count"));
            } else {
                item.put("revenue", BigDecimal.ZERO);
                item.put("orderCount", 0L);
            }
            result.add(item);
            current = current.plusDays(1);
        }
        return result;
    }

    @Override
    public List<Map<String, Object>> getPeakHoursStats() {
        List<Object[]> results = orderRepository.findOrdersByHour();
        // Tạo map mặc định 0-23h đều bằng 0
        Map<Integer, Long> hourMap = new HashMap<>();
        for (int i = 0; i < 24; i++) hourMap.put(i, 0L);

        for (Object[] row : results) {
            hourMap.put((Integer) row[0], (Long) row[1]);
        }

        List<Map<String, Object>> list = new ArrayList<>();
        for (int i = 0; i < 24; i++) {
            Map<String, Object> item = new HashMap<>();
            item.put("hour", i + "h"); // Label: 1h, 2h...
            item.put("value", hourMap.get(i));
            list.add(item);
        }
        return list;
    }

    @Override
    public List<Map<String, Object>> getLowStockProducts() {
        // Lấy 10 sản phẩm thấp nhất
        List<Object[]> results = productRepository.findLowStockProducts(PageRequest.of(0, 10));
        List<Map<String, Object>> list = new ArrayList<>();
        for (Object[] row : results) {
            Map<String, Object> item = new HashMap<>();
            item.put("name", row[0]);
            item.put("stock", row[1]);
            list.add(item);
        }
        return list;
    }
}