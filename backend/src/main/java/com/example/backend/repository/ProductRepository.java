package com.example.backend.repository;

import com.example.backend.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, String> {
	List<Product> findByCategoryId(String categoryId);

	@Query("SELECT p FROM Product p WHERE p.categoryId = :categoryId AND p.productId <> :productId")
	List<Product> findRelatedProducts(@Param("categoryId") String categoryId, @Param("productId") String productId);

	@Query("SELECT SUM(p.quantity) FROM Product p")
	Long sumTotalStock();
}
