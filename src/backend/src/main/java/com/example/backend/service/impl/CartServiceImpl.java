package com.example.backend.service.impl;

import com.example.backend.repository.OrderRepository;
import com.example.backend.service.CartService;
import org.springframework.stereotype.Service;

import com.example.backend.DTO.OrderDTO;
import com.example.backend.model.Order;
import java.util.List;

@Service
public class CartServiceImpl implements CartService {

    private final OrderRepository orderRepository;

    public CartServiceImpl(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @Override
    public int getCartCount(String userId) {
        Integer count = orderRepository.countByUserIdAndIsOrderFalse(userId);
        return count != null ? count : 0;
    }

    @Override
    public List<OrderDTO> getCartOrders(String userId) {
        List<OrderDTO> orders = orderRepository.findByUserIdAndIsOrderFalse(userId)
                .stream()
                .map(OrderDTO::new)
                .toList();
        return orders;
    }

}
