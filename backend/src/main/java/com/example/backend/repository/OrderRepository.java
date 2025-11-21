package com.example.backend.repository;

import com.example.backend.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, String> {
	List<Order> findByUserId(String userId);

	List<Order> findByUserIdAndIsOrderFalse(String userId);

	Integer countByUserIdAndIsOrderFalse(String userId);
}
