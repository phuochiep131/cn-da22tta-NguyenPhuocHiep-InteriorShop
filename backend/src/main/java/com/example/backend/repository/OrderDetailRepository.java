package com.example.backend.repository;

import com.example.backend.model.OrderDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OrderDetailRepository extends JpaRepository<OrderDetail, String> {

    List<OrderDetail> findByOrderOrderId(String orderId);

    @Query("SELECT od FROM OrderDetail od " +
            "JOIN FETCH od.order o " +
            "JOIN FETCH od.product p " +
            "WHERE o.userId = :userId")
    List<OrderDetail> findByUserIdWithOrderAndProduct(@Param("userId") String userId);

    @Query("SELECT od FROM OrderDetail od " +
            "JOIN od.order o " +
            "WHERE o.userId = :userId " +
            "AND od.product.productId = :productId " +
            "AND o.isOrder = false")
    Optional<OrderDetail> findExistingCartItem(@Param("userId") String userId,
                                               @Param("productId") String productId);
}
