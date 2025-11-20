package com.example.backend.repository;

import com.example.backend.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, String> {
	List<Order> findByUserId(String userId);

	@Query("SELECT COALESCE(SUM(od.quantity), 0) " +
			"FROM Order o JOIN o.orderDetails od " +
			"WHERE o.userId = :userId AND o.isOrder = false")
	Integer countCartItemsByUserId(@Param("userId") String userId);
}
