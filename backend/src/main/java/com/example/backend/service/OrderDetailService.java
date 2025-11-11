package com.example.backend.service;

import com.example.backend.model.OrderDetail;
import java.util.List;
import java.util.Optional;

public interface OrderDetailService {
    List<OrderDetail> getAllOrderDetails();
    Optional<OrderDetail> getOrderDetailById(Integer id);
    OrderDetail createOrderDetail(OrderDetail orderDetail);
    OrderDetail updateOrderDetail(Integer id, OrderDetail orderDetail);
    void deleteOrderDetail(Integer id);
    List<OrderDetail> getOrderDetailsByOrderId(String orderId);
}
