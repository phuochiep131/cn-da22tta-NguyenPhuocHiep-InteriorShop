package com.example.backend.service.impl;

import com.example.backend.model.OrderDetail;
import com.example.backend.repository.OrderDetailRepository;
import com.example.backend.service.OrderDetailService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class OrderDetailServiceImpl implements OrderDetailService {

    private final OrderDetailRepository orderDetailRepository;

    public OrderDetailServiceImpl(OrderDetailRepository orderDetailRepository) {
        this.orderDetailRepository = orderDetailRepository;
    }

    @Override
    public List<OrderDetail> getAllOrderDetails() {
        return orderDetailRepository.findAll();
    }

    @Override
    public Optional<OrderDetail> getOrderDetailById(Integer id) {
        return orderDetailRepository.findById(id);
    }

    @Override
    public OrderDetail createOrderDetail(OrderDetail orderDetail) {
        return orderDetailRepository.save(orderDetail);
    }

    @Override
    public OrderDetail updateOrderDetail(Integer id, OrderDetail orderDetail) {
        return orderDetailRepository.findById(id).map(existing -> {
            existing.setOrderId(orderDetail.getOrderId());
            existing.setProductId(orderDetail.getProductId());
            existing.setQuantity(orderDetail.getQuantity());
            existing.setUnitPrice(orderDetail.getUnitPrice());
            existing.setOriginalUnitPrice(orderDetail.getOriginalUnitPrice());
            return orderDetailRepository.save(existing);
        }).orElseThrow(() -> new RuntimeException("OrderDetail not found with id " + id));
    }

    @Override
    public void deleteOrderDetail(Integer id) {
        orderDetailRepository.deleteById(id);
    }

    @Override
    public List<OrderDetail> getOrderDetailsByOrderId(String orderId) {
        return orderDetailRepository.findByOrderId(orderId);
    }
}
