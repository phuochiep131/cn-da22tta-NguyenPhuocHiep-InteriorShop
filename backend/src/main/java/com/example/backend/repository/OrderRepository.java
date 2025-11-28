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
	List<Order> findByUserId(String userId);

	List<Order> findByUserIdAndIsOrderFalse(String userId);

	Integer countByUserIdAndIsOrderFalse(String userId);

	long countByIsOrderTrue();
	long countByIsOrderTrueAndOrderDateBefore(LocalDateTime date);

	@Query("SELECT o.orderStatus, COUNT(o) FROM Order o WHERE o.isOrder = true GROUP BY o.orderStatus")
	List<Object[]> countOrdersByStatus();

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
}
