package com.example.backend.repository;

import com.example.backend.model.OrderDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.domain.Pageable;
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

    @Query("SELECT p.category.categoryName, SUM(od.quantity) " +
            "FROM OrderDetail od " +
            "JOIN od.product p " +
            "JOIN od.order o " +
            "WHERE o.isOrder = true " +
            "GROUP BY p.category.categoryName " +
            "ORDER BY SUM(od.quantity) DESC")
    List<Object[]> findTopSellingCategories(Pageable pageable);

    @Query("SELECT p.productName, p.imageUrl, p.price, SUM(od.quantity) " +
            "FROM OrderDetail od " +
            "JOIN od.product p " +
            "JOIN od.order o " +
            "WHERE o.isOrder = true " +
            "GROUP BY p.productName, p.imageUrl, p.price " +
            "ORDER BY SUM(od.quantity) DESC")
    List<Object[]> findTopSellingProducts(Pageable pageable);
}
