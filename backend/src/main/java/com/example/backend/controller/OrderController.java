package com.example.backend.controller;

import com.example.backend.model.Order;
import com.example.backend.service.OrderService;
import com.example.backend.DTO.OrderDTO;
import com.example.backend.DTO.OrderReplaceRequest;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping("/checkout")
    public ResponseEntity<Order> checkoutOrder(@RequestBody Order order) {
        try {
            Order savedOrder = orderService.checkoutOrder(order);
            return ResponseEntity.ok(savedOrder);
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(null);
        }
    }

    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody Order order) {
        try {
            Order savedOrder = orderService.createOrder(order);
            return ResponseEntity.ok(savedOrder);
        } catch (RuntimeException ex) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("message", ex.getMessage()));
        }
    }


    @PostMapping("/replace")
    public ResponseEntity<?> replaceOrder(@RequestBody OrderReplaceRequest request) {
        try {
            Order newOrder = orderService.replaceOrder(request);
            return ResponseEntity.ok(new OrderDTO(newOrder));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<OrderDTO>> getOrdersByUser(@PathVariable String userId) {
        List<OrderDTO> orders = orderService.getOrdersByUserId(userId);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<Order> getOrderById(@PathVariable String orderId) {
        Order order = orderService.getOrderById(orderId);
        if (order != null)
            return ResponseEntity.ok(order);
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{orderId}")
    public ResponseEntity<Order> updateOrder(
            @PathVariable String orderId,
            @RequestBody Order updatedOrder
    ) {
        try {
            Order savedOrder = orderService.updateOrder(orderId, updatedOrder);
            return ResponseEntity.ok(savedOrder);
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(null);
        }
    }


    @PutMapping("/{orderId}/status")
    public ResponseEntity<String> updateOrderStatus(@PathVariable String orderId, @RequestBody String status) {
        try {
            orderService.updateOrderStatus(orderId, status);
            return ResponseEntity.ok("Cập nhật trạng thái đơn hàng thành công");
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body("Không tìm thấy đơn hàng");
        }
    }

    @DeleteMapping("/{orderId}")
    public ResponseEntity<String> deleteOrder(@PathVariable String orderId) {
        try {
            orderService.deleteOrder(orderId);
            return ResponseEntity.ok("Xóa đơn hàng thành công");
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body("Không tìm thấy đơn hàng");
        }
    }

}
