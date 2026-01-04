package com.example.backend.service;

import com.example.backend.model.Order;
import com.example.backend.DTO.OrderDTO;
import com.example.backend.DTO.OrderReplaceRequest;
import java.util.List;

public interface OrderService {
    List<Order> getAllOrders();
    Order getOrderById(String orderId);
    //List<Order> getOrdersByUser(String userId);
    List<OrderDTO> getOrdersByUserId(String userId);

    void deleteOrder(String orderId);
    // ---------------------------------------------------

    Order createOrder(Order order);
    Order checkoutOrder(Order order);
    Order replaceOrder(OrderReplaceRequest req);
    void cancelOrder(String orderId, String reason);
    Order updateOrder(String orderId, Order updatedOrder);
    void updateOrderStatus(String orderId, String status);
}