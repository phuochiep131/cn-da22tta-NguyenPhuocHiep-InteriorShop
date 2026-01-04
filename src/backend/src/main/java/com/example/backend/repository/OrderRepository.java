package com.example.backend.repository;

import com.example.backend.model.Order;
import com.example.backend.repository.projection.RevenueComparisonProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.time.LocalDateTime;

public interface OrderRepository extends JpaRepository<Order, String> {
	List<Order> findByIsOrderTrue();

	List<Order> findByUserId(String userId);

	List<Order> findByUserIdAndIsOrderFalse(String userId);

	Integer countByUserIdAndIsOrderFalse(String userId);

	long countByIsOrderTrue();
	long countByIsOrderTrueAndOrderDateBefore(LocalDateTime date);

	@Query("SELECT o.orderStatus, COUNT(o) FROM Order o " +
			"WHERE o.isOrder = true " +
			"AND o.orderDate BETWEEN :startDate AND :endDate " +
			"GROUP BY o.orderStatus")
	List<Object[]> countOrdersByStatus(@Param("startDate") LocalDateTime startDate,
									   @Param("endDate") LocalDateTime endDate);

	@Query("SELECT SUM(o.totalAmount) " +
			"FROM Order o " +
			"JOIN Payment p ON p.order = o " +
			"WHERE o.isOrder = true " +
			"AND p.paymentStatus = 'Completed' " +
			"AND o.orderDate BETWEEN :startDate AND :endDate")
	BigDecimal sumRevenueByDateRange(@Param("startDate") LocalDateTime startDate,
									 @Param("endDate") LocalDateTime endDate);

	@Query(value = "SELECT " +
			"   DATE_FORMAT(o.order_date, 'T%m') as label, " +

			"   SUM(CASE " +
			"       WHEN EXISTS (SELECT 1 FROM payments p WHERE p.order_id = o.order_id AND p.payment_status = 'Completed') " +
			"       THEN o.total_amount " +
			"       ELSE 0 " +
			"   END) as actual, " +

			"   SUM(CASE WHEN o.order_status NOT IN ('Cancelled', 'Refunded') THEN o.total_amount ELSE 0 END) as estimated " +

			"FROM orders o " +
			"WHERE o.is_order = true " +
			"AND YEAR(o.order_date) = YEAR(CURDATE()) " +
			"GROUP BY DATE_FORMAT(o.order_date, 'T%m'), YEAR(o.order_date), MONTH(o.order_date) " +
			"ORDER BY YEAR(o.order_date), MONTH(o.order_date)", nativeQuery = true)
	List<RevenueComparisonProjection> getRevenueComparison();

	@Query(value = "SELECT u.full_name, u.email, u.avatar, SUM(o.total_amount) as total_spent " +
			"FROM orders o " +
			"JOIN users u ON o.user_id = u.user_id " +
			"WHERE o.is_order = 1 " +
			"AND EXISTS (SELECT 1 FROM payments p WHERE p.order_id = o.order_id " +
			"AND p.payment_status = 'Completed') " +
			"GROUP BY u.user_id, u.full_name, u.email, u.avatar " +
			"ORDER BY total_spent DESC " +
			"LIMIT 5", nativeQuery = true)
	List<Object[]> findTopSpendingCustomers();

	@Query("SELECT DATE(o.orderDate), SUM(o.totalAmount), COUNT(o) " +
			"FROM Order o " +
			"JOIN Payment p ON p.order = o " +
			"WHERE o.isOrder = true " +
			"AND p.paymentStatus = 'Completed' " +
			"AND o.orderDate BETWEEN :startDate AND :endDate " +
			"GROUP BY DATE(o.orderDate) " +
			"ORDER BY DATE(o.orderDate) ASC")
	List<Object[]> findRevenueChartData(@Param("startDate") LocalDateTime startDate,
										@Param("endDate") LocalDateTime endDate);

	// Lấy số lượng đơn hàng theo từng khung giờ trong ngày (0-23h)
	@Query("SELECT HOUR(o.orderDate) as hour, COUNT(o) as count " +
			"FROM Order o " +
			"WHERE o.isOrder = true " +
			"GROUP BY HOUR(o.orderDate) " +
			"ORDER BY HOUR(o.orderDate) ASC")
	List<Object[]> findOrdersByHour();
}
