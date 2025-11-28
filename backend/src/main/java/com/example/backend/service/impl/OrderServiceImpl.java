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
import java.util.Optional;

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
        // Nếu là đơn hàng mới (không phải giỏ hàng), tạo ID và ngày
        if (order.getIsOrder()) {
            order.setOrderId(generateOrderId());
            order.setOrderDate(LocalDateTime.now());
        }
        // Nếu là thêm vào giỏ hàng, ta có thể không cần sinh OrderId mới ngay
        // nếu logic của bạn cho phép lưu OrderId null hoặc tự generate @GeneratedValue.
        // Nhưng để an toàn với code cũ, cứ giữ nguyên hoặc tùy chỉnh.
        else {
            order.setOrderId(generateOrderId());
            order.setOrderDate(LocalDateTime.now());
        }

        if (order.getOrderDetails() != null) {
            for (OrderDetail detail : order.getOrderDetails()) {
                Product product = productRepository.findById(detail.getProduct().getProductId())
                        .orElseThrow(() -> new RuntimeException("Product not found"));

                if (!order.getIsOrder()) {
                    Optional<OrderDetail> existingDetailOpt = orderDetailRepository.findExistingCartItem(
                            order.getUserId(),
                            product.getProductId()
                    );

                    if (existingDetailOpt.isPresent()) {

                        OrderDetail existingDetail = existingDetailOpt.get();

                        int newQuantity = existingDetail.getQuantity() + detail.getQuantity();

                        if (product.getQuantity() < newQuantity) {
                            throw new RuntimeException("Số lượng sản phẩm " + product.getProductName() + " trong kho không đủ để cộng thêm");
                        }

                        existingDetail.setQuantity(newQuantity);

                        // existingDetail.setUnitPrice(product.getPrice());
                        orderDetailRepository.save(existingDetail);

                        return existingDetail.getOrder();
                    }
                }

                if (order.getIsOrder()) {
                    if (product.getQuantity() < detail.getQuantity()) {
                        throw new RuntimeException("Số lượng sản phẩm " + product.getProductName() + " không đủ");
                    }
                    product.setQuantity(product.getQuantity() - detail.getQuantity());
                    productRepository.save(product);
                }

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

                    if (product.getQuantity() < d.getQuantity()) {
                        throw new RuntimeException("Sản phẩm " + product.getProductName() + " không đủ số lượng");
                    }
                    product.setQuantity(product.getQuantity() - d.getQuantity());
                    productRepository.save(product);

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
    @Transactional
    public Order checkoutOrder(Order order) {
        String userId = order.getUserId();

        List<Order> userOrders = orderRepository.findByUserIdAndIsOrderFalse(userId);
        List<OrderDetail> allDetails = order.getOrderDetails();

        if (!userOrders.isEmpty()) {
            for (Order o : userOrders) {
                orderRepository.delete(o);
            }
        }

        Order newOrder = new Order();
        newOrder.setOrderId(generateOrderId());
        newOrder.setUserId(userId);
        newOrder.setPaymentMethodId(order.getPaymentMethodId());
        newOrder.setShippingAddress(order.getShippingAddress());
        newOrder.setCustomerNote(order.getCustomerNote());
        newOrder.setTotalAmount(order.getTotalAmount());
        newOrder.setOrderStatus("pending");
        newOrder.setOrderDate(LocalDateTime.now());

        List<OrderDetail> newDetails = allDetails.stream()
                .map(od -> {
                    OrderDetail detail = new OrderDetail();
                    Product product = productRepository.findById(od.getProduct().getProductId())
                            .orElseThrow(() -> new RuntimeException("Product not found"));

                    if (product.getQuantity() < od.getQuantity()) {
                        throw new RuntimeException("Sản phẩm " + product.getProductName() + " không đủ số lượng");
                    }

                    product.setQuantity(product.getQuantity() - od.getQuantity());
                    productRepository.save(product);

                    detail.setProduct(product);
                    detail.setQuantity(od.getQuantity());
                    detail.setUnitPrice(od.getUnitPrice());
                    detail.setOrder(newOrder);
                    return detail;
                })
                .collect(Collectors.toList());

        newOrder.setOrderDetails(newDetails);

        return orderRepository.save(newOrder);
    }


    private String generateOrderId() {
        return "OR" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
    }
}
