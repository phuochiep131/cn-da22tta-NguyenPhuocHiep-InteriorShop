package com.example.backend.service.impl;

import com.example.backend.model.Order;
import com.example.backend.model.OrderDetail;
import com.example.backend.model.Product;
import com.example.backend.repository.OrderRepository;
import com.example.backend.repository.ProductRepository;
import com.example.backend.repository.OrderDetailRepository;
import com.example.backend.service.OrderService;
import com.example.backend.DTO.OrderDTO;
import com.example.backend.DTO.OrderReplaceRequest;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final OrderDetailRepository orderDetailRepository;

    @Autowired
    public OrderServiceImpl(OrderRepository orderRepository,
            ProductRepository productRepository,
            OrderDetailRepository orderDetailRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.orderDetailRepository = orderDetailRepository;
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
    @Transactional
    public Order createOrder(Order order) {
        order.setOrderId(generateOrderId());
        order.setOrderDate(LocalDateTime.now());

        if (order.getOrderDetails() != null) {
            for (OrderDetail detail : order.getOrderDetails()) {
                Product product = productRepository.findById(detail.getProduct().getProductId())
                        .orElseThrow(() -> new RuntimeException("Product not found"));
                detail.setProduct(product);
                detail.setOrder(order);
            }
        }

        return orderRepository.save(order);
    }

    @Override
    @Transactional
    public Order updateOrder(String orderId, Order updatedOrder) {
        Order existing = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        updatedOrder.setOrderId(orderId);

        if (updatedOrder.getOrderDetails() != null) {
            for (OrderDetail detail : updatedOrder.getOrderDetails()) {
                detail.setOrder(updatedOrder);

                if (detail.getProduct() != null) {
                    Product product = productRepository.findById(detail.getProduct().getProductId())
                            .orElseThrow(() -> new RuntimeException("Product not found"));
                    detail.setProduct(product);
                }
            }
        }

        return orderRepository.save(updatedOrder);
    }

    @Override
    public void deleteOrder(String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        orderRepository.delete(order);
    }

    @Override
    public List<Order> getOrdersByUser(String userId) {
        return orderRepository.findByUserId(userId);
    }

    @Override
    @Transactional
    public void updateOrderStatus(String orderId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        order.setOrderStatus(status);
        orderRepository.save(order);
    }

    @Override
    public List<OrderDTO> getOrdersByUserId(String userId) {
        List<Order> orders = orderRepository.findByUserId(userId);
        return orders.stream()
                .map(OrderDTO::new)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public Order replaceOrder(OrderReplaceRequest req) {
        if (req.getOldOrderIds() != null) {
            for (String oldId : req.getOldOrderIds()) {
                orderRepository.deleteById(oldId);
            }
            orderRepository.flush();
        }

        Order order = new Order();
        order.setOrderId(generateOrderId());
        order.setOrderDate(LocalDateTime.now());
        order.setOrderStatus("pending");
        order.setUserId(req.getUserId());
        order.setPaymentMethodId(req.getPaymentMethodId());
        order.setShippingAddress(req.getShippingAddress());
        order.setCustomerNote(req.getCustomerNote());
        order.setTotalAmount(req.getTotalAmount());
        order.setIsOrder(true);

        List<OrderDetail> details = req.getOrderDetails().stream()
                .map(d -> {
                    OrderDetail od = new OrderDetail(); // ID để Hibernate tự generate

                    String productId = d.getProduct().getProductId();
                    Product product = productRepository.findById(productId)
                            .orElseThrow(() -> new RuntimeException("Product not found"));

                    od.setProduct(product);
                    od.setQuantity(d.getQuantity());
                    od.setUnitPrice(d.getUnitPrice());
                    od.setOriginalUnitPrice(d.getOriginalUnitPrice());
                    od.setOrder(order);

                    return od;
                })
                .collect(Collectors.toList());

        order.setOrderDetails(details);

        return orderRepository.save(order);
    }


    @Override
    public Order checkoutOrder(Order order) {
        String userId = order.getUserId();

        List<Order> userOrders = orderRepository.findByUserIdAndIsOrderFalse(userId);

        List<OrderDetail> allDetails = order.getOrderDetails();

        if (allDetails.size() > 1 || userOrders.size() > 1) {
            for (Order o : userOrders) {
                orderRepository.delete(o);
            }

            Order newOrder = new Order();
            newOrder.setUserId(userId);
            newOrder.setPaymentMethodId(order.getPaymentMethodId());
            newOrder.setShippingAddress(order.getShippingAddress());
            newOrder.setCustomerNote(order.getCustomerNote());
            newOrder.setTotalAmount(order.getTotalAmount());
            newOrder.setOrderStatus("pending");

            List<OrderDetail> newDetails = allDetails.stream()
                    .map(od -> {
                        OrderDetail detail = new OrderDetail();
                        detail.setProduct(od.getProduct());
                        detail.setQuantity(od.getQuantity());
                        detail.setUnitPrice(od.getUnitPrice());
                        return detail;
                    }).toList();

            newOrder.setOrderDetails(newDetails);

            return orderRepository.save(newOrder);

        } else if (allDetails.size() == 1 && userOrders.size() <= 1) {
            Order existingOrder = userOrders.isEmpty() ? new Order() : userOrders.get(0);

            existingOrder.setUserId(userId);
            existingOrder.setPaymentMethodId(order.getPaymentMethodId());
            existingOrder.setShippingAddress(order.getShippingAddress());
            existingOrder.setCustomerNote(order.getCustomerNote());
            existingOrder.setTotalAmount(order.getTotalAmount());
            existingOrder.setOrderStatus("pending");

            List<OrderDetail> updatedDetails = allDetails.stream()
                    .map(od -> {
                        OrderDetail detail = new OrderDetail();
                        detail.setProduct(od.getProduct());
                        detail.setQuantity(od.getQuantity());
                        detail.setUnitPrice(od.getUnitPrice());
                        return detail;
                    }).toList();

            existingOrder.setOrderDetails(updatedDetails);

            return orderRepository.save(existingOrder);
        }

        throw new RuntimeException("Không thể tạo đơn hàng");
    }


    private String generateOrderId() {
        return "OR" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
    }
}
