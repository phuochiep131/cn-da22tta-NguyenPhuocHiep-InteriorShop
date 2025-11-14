package com.example.backend.repository;

import com.example.backend.model.OrderDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface OrderDetailRepository extends JpaRepository<OrderDetail, String> {
    List<OrderDetail> findByOrderId(String orderId);
    List<OrderDetail> findByOrderIdIn(List<String> orderIds);

    // Query join Order + Product
    @Query("SELECT od FROM OrderDetail od " +
           "JOIN FETCH od.order o " +
           "JOIN FETCH od.product p " +
           "WHERE o.userId = :userId")
    List<OrderDetail> findByUserIdWithOrderAndProduct(@Param("userId") String userId);
}
