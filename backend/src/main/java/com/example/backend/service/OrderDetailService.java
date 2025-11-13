package com.example.backend.service;

import com.example.backend.model.OrderDetail;
import java.util.List;
import java.util.Optional;

public interface OrderDetailService {
    List<OrderDetail> getAllOrderDetails();
    Optional<OrderDetail> getOrderDetailById(String id);
    OrderDetail createOrderDetail(OrderDetail orderDetail);
    OrderDetail updateOrderDetail(String id, OrderDetail orderDetail);
    void deleteOrderDetail(String id);
    List<OrderDetail> getOrderDetailsByOrderId(String orderId);
}
