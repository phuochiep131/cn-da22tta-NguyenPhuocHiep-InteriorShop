package com.example.backend.controller;


import com.example.backend.model.Order;
import com.example.backend.service.OrderService;
import org.springframework.web.bind.annotation.*;
import java.util.List;


@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {


    private final OrderService orderService;


    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }


    @GetMapping
    public List<Order> getAllOrders() {
        return orderService.getAllOrders();
    }


    @GetMapping("/{id}")
    public Order getOrderById(@PathVariable("id") String id) {
        return orderService.getOrderById(id);
    }


    @PostMapping
    public Order createOrder(@RequestBody Order order) {
        return orderService.createOrder(order);
    }


    @PutMapping("/{id}")
    public Order updateOrder(@PathVariable("id") String id, @RequestBody Order order) {
        return orderService.updateOrder(id, order);
    }


    @DeleteMapping("/{id}")
    public void deleteOrder(@PathVariable("id") String id) {
        orderService.deleteOrder(id);
    }
}