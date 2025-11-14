package com.example.backend.service.impl;

import com.example.backend.model.OrderDetail;
import com.example.backend.repository.OrderDetailRepository;
import com.example.backend.repository.OrderRepository;
import com.example.backend.service.OrderDetailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class OrderDetailServiceImpl implements OrderDetailService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderDetailRepository orderDetailRepository;

    public OrderDetailServiceImpl(OrderDetailRepository orderDetailRepository) {
        this.orderDetailRepository = orderDetailRepository;
    }

    @Override
    public List<OrderDetail> getAllOrderDetails() {
        return orderDetailRepository.findAll();
    }

    @Override
    public Optional<OrderDetail> getOrderDetailById(String id) {
        return orderDetailRepository.findById(id);
    }

    @Override
    public OrderDetail createOrderDetail(OrderDetail orderDetail) {
        orderDetail.setOrderDetailId(generateOrderDetailId());
        return orderDetailRepository.save(orderDetail);
    }

    private String generateOrderDetailId() {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS");
        return "DH" + LocalDateTime.now().format(formatter);
    }

    @Override
    public OrderDetail updateOrderDetail(String id, OrderDetail orderDetail) {
        return orderDetailRepository.findById(id)
                .map(existing -> {
                    existing.setOrderId(orderDetail.getOrderId());
                    existing.setProductId(orderDetail.getProductId());
                    existing.setQuantity(orderDetail.getQuantity());
                    existing.setUnitPrice(orderDetail.getUnitPrice());
                    existing.setOriginalUnitPrice(orderDetail.getOriginalUnitPrice());
                    return orderDetailRepository.save(existing);
                })
                .orElseThrow(() -> new RuntimeException("OrderDetail not found with id " + id));
    }

    @Override
    public void deleteOrderDetail(String id) {
        orderDetailRepository.deleteById(id);
    }

    @Override
    public List<OrderDetail> getOrderDetailsByOrderId(String orderId) {
        return orderDetailRepository.findByOrderId(orderId);
    }

    @Override
    public List<OrderDetail> getOrderDetailsWithOrderAndProduct(String userId) {
        return orderDetailRepository.findByUserIdWithOrderAndProduct(userId);
    }
}
