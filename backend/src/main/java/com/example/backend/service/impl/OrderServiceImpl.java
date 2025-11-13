package com.example.backend.service.impl;

import com.example.backend.model.Order;
import com.example.backend.repository.OrderRepository;
import com.example.backend.service.OrderService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;

    public OrderServiceImpl(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @Override
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @Override
    public Order getOrderById(String orderId) {
        return orderRepository.findById(orderId).orElse(null);
    }

    @Override
    public Order createOrder(Order order) {
        String orderId;
        do {
            orderId = "OR" + String.format("%05d", ThreadLocalRandom.current().nextInt(100000));
        } while (orderRepository.existsById(orderId));

        order.setOrderId(orderId);
        return orderRepository.save(order);
    }

    @Override
    public Order updateOrder(String orderId, Order updatedOrder) {
        return orderRepository.findById(orderId)
                .map(existing -> {
                    updatedOrder.setOrderId(orderId);
                    return orderRepository.save(updatedOrder);
                })
                .orElse(null);
    }

    @Override
    public void deleteOrder(String orderId) {
        orderRepository.deleteById(orderId);
    }
}
