package com.example.backend.repository;

import com.example.backend.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, String> {
	List<Product> findByCategoryId(String categoryId);

	@Query("SELECT p FROM Product p WHERE p.categoryId = :categoryId AND p.productId <> :productId")
	List<Product> findRelatedProducts(@Param("categoryId") String categoryId, @Param("productId") String productId);

	@Query("SELECT SUM(p.quantity) FROM Product p")
	Long sumTotalStock();

	@Query("SELECT p.productName, p.quantity FROM Product p " +
			"WHERE p.quantity < 10 " +
			"ORDER BY p.quantity ASC")
	List<Object[]> findLowStockProducts(Pageable pageable);

	@Query("SELECT p.productName, p.quantity, p.imageUrl FROM Product p " +
			"WHERE p.productId NOT IN (" +
			"    SELECT od.product.productId FROM OrderDetail od " +
			"    JOIN od.order o " +
			"    WHERE o.orderDate >= :startDate" +
			") " +
			"ORDER BY p.quantity DESC")
	List<Object[]> findStagnantProducts(@Param("startDate") LocalDateTime startDate, Pageable pageable);

	@Query(value = "SELECT * FROM products WHERE quantity > 0 LIMIT 20", nativeQuery = true)
	List<Product> findProductsForChatbot();
}
