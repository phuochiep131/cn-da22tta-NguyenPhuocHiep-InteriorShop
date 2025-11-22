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

	@Query("SELECT CASE WHEN COUNT(o) > 0 THEN true ELSE false END FROM Order o JOIN o.orderDetails d " +
			"WHERE o.userId = :userId AND d.product.productId = :productId AND o.isOrder = false")
	boolean existsByUserIdAndProductIdAndIsOrderFalse(@Param("userId") String userId,
													  @Param("productId") String productId);

}
