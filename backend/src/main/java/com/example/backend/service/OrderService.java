package com.example.backend.service;


import com.example.backend.model.Order;
import java.util.List;


public interface OrderService {
    List<Order> getAllOrders();
    Order getOrderById(String orderId);
    Order createOrder(Order order);
    Order updateOrder(String orderId, Order order);
    void deleteOrder(String orderId);
}