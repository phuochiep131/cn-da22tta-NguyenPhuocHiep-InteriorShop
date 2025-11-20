package com.example.backend.service.impl;

import com.example.backend.repository.OrderRepository;
import com.example.backend.service.CartService;
import org.springframework.stereotype.Service;

@Service
public class CartServiceImpl implements CartService {

    private final OrderRepository orderRepository;

    public CartServiceImpl(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @Override
    public int getCartCount(String userId) {
        Integer count = orderRepository.countCartItemsByUserId(userId);
        return count != null ? count : 0;
    }
}
