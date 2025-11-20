package com.example.backend.service;

import com.example.backend.model.Order;
import com.example.backend.DTO.OrderDTO;

import java.util.List;

public interface OrderService {
    List<Order> getAllOrders();
    Order getOrderById(String orderId);
    Order createOrder(Order order);
    Order updateOrder(String orderId, Order order);
    List<Order> getOrdersByUser(String userId);
    void updateOrderStatus(String orderId, String status);
    void deleteOrder(String orderId);

    // Method DTO
    List<OrderDTO> getOrdersByUserId(String userId);
}
