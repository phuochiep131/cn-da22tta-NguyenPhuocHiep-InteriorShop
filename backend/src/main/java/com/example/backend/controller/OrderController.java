package com.example.backend.controller;

import com.example.backend.model.Order;
import com.example.backend.model.OrderDetail;
import com.example.backend.service.OrderService;
import com.example.backend.service.OrderDetailService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    private final OrderService orderService;
    private final OrderDetailService orderDetailService;

    public OrderController(OrderService orderService, OrderDetailService orderDetailService) {
        this.orderService = orderService;
        this.orderDetailService = orderDetailService;
    }

    @PostMapping
    public Order createOrder(@RequestBody Order order) {
        Order savedOrder = orderService.createOrder(order);

        List<OrderDetail> orderDetails = order.getOrderDetails();
        if (orderDetails != null && !orderDetails.isEmpty()) {
            for (OrderDetail detail : orderDetails) {
                detail.setOrderId(savedOrder.getOrderId());
                orderDetailService.createOrderDetail(detail);
            }
        }

        return savedOrder;
    }

    @GetMapping
    public List<Order> getAllOrders() {
        return orderService.getAllOrders();
    }

    @GetMapping("/{orderId}")
    public Order getOrderById(@PathVariable String orderId) {
        return orderService.getOrderById(orderId);
    }
}
