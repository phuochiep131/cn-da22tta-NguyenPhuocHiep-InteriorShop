package com.example.backend.service.impl;

import com.example.backend.DTO.OrderDTO;
import com.example.backend.DTO.OrderReplaceRequest;
import com.example.backend.model.*;
import com.example.backend.repository.*;
import com.example.backend.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final PaymentRepository paymentRepository;
    private final CouponRepository couponRepository;

    @Autowired
    public OrderServiceImpl(OrderRepository orderRepository,
                            ProductRepository productRepository,
                            OrderDetailRepository orderDetailRepository,
                            PaymentRepository paymentRepository,
                            CouponRepository couponRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.orderDetailRepository = orderDetailRepository;
        this.paymentRepository = paymentRepository;
        this.couponRepository = couponRepository;
    }

    @Override
    public List<Order> getAllOrders() {
        return orderRepository.findByIsOrderTrue();
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
        // Default status if null
        if (order.getOrderStatus() == null) {
            order.setOrderStatus("Pending");
        }

        if (Boolean.TRUE.equals(order.getIsOrder())) {
            if (order.getCouponId() != null) {
                processCouponUsage(order.getCouponId());
            }
        }

        if (order.getOrderDetails() != null) {
            for (OrderDetail detail : order.getOrderDetails()) {
                Product product = productRepository.findById(detail.getProduct().getProductId())
                        .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại"));

                // Logic giỏ hàng
                if (!Boolean.TRUE.equals(order.getIsOrder())) {
                    Optional<OrderDetail> existingDetailOpt = orderDetailRepository.findExistingCartItem(
                            order.getUserId(),
                            product.getProductId()
                    );

                    if (existingDetailOpt.isPresent()) {
                        OrderDetail existingDetail = existingDetailOpt.get();
                        int newQuantity = existingDetail.getQuantity() + detail.getQuantity();

                        if (product.getQuantity() < newQuantity) {
                            throw new RuntimeException("Số lượng sản phẩm " + product.getProductName() + " trong kho không đủ");
                        }

                        existingDetail.setQuantity(newQuantity);
                        orderDetailRepository.save(existingDetail);
                        return existingDetail.getOrder();
                    }
                }

                // Logic đơn hàng thật
                if (Boolean.TRUE.equals(order.getIsOrder())) {
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
        Order existingOrder = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        updatedOrder.setOrderId(orderId);
        // Giữ lại ngày tạo cũ nếu không muốn override
        updatedOrder.setOrderDate(existingOrder.getOrderDate());
        updatedOrder.setUpdatedAt(LocalDateTime.now()); // Set Updated At

        if (updatedOrder.getOrderDetails() != null) {
            for (OrderDetail detail : updatedOrder.getOrderDetails()) {
                detail.setOrder(updatedOrder);
                if (detail.getProduct() != null) {
                    Product product = productRepository.findById(detail.getProduct().getProductId())
                            .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại"));
                    detail.setProduct(product);
                }
            }
        }
        return orderRepository.save(updatedOrder);
    }

    @Override
    public void deleteOrder(String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));
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
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));
        order.setOrderStatus(status);
        order.setUpdatedAt(LocalDateTime.now()); // Update time
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
    public void cancelOrder(String orderId, String reason) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Đơn hàng không tồn tại"));

        String currentStatus = order.getOrderStatus();
        if ("Shipped".equalsIgnoreCase(currentStatus) ||
                "Delivered".equalsIgnoreCase(currentStatus) ||
                "Cancelled".equalsIgnoreCase(currentStatus)) {
            throw new RuntimeException("Không thể hủy đơn hàng ở trạng thái: " + currentStatus);
        }

        if (order.getOrderDetails() != null) {
            for (OrderDetail detail : order.getOrderDetails()) {
                Product product = detail.getProduct();
                product.setQuantity(product.getQuantity() + detail.getQuantity());
                productRepository.save(product);
            }
        }

        Optional<Payment> paymentOpt = paymentRepository.findByOrderOrderId(orderId);
        if (paymentOpt.isPresent()) {
            Payment payment = paymentOpt.get();
            if (PaymentStatus.Completed.equals(payment.getPaymentStatus())) {
                payment.setPaymentStatus(PaymentStatus.Refund_Pending);
                paymentRepository.save(payment);
            } else if (PaymentStatus.Pending.equals(payment.getPaymentStatus())) {
                payment.setPaymentStatus(PaymentStatus.Failed);
                paymentRepository.save(payment);
            }
        }

        order.setOrderStatus("Cancelled");
        String note = (order.getCustomerNote() != null ? order.getCustomerNote() : "")
                + " | Đã hủy: " + reason;
        order.setCustomerNote(note);
        order.setUpdatedAt(LocalDateTime.now());

        orderRepository.save(order);
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
        order.setOrderStatus("Pending");
        order.setUserId(req.getUserId());
        // order.setPaymentMethodId(req.getPaymentMethodId()); // XÓA: Bảng Order không còn cột này
        order.setShippingAddress(req.getShippingAddress());
        order.setCustomerNote(req.getCustomerNote());
        order.setTotalAmount(req.getTotalAmount());
        order.setIsOrder(true);

        List<OrderDetail> details = req.getOrderDetails().stream()
                .map(d -> {
                    OrderDetail od = new OrderDetail();
                    String productId = d.getProduct().getProductId();
                    Product product = productRepository.findById(productId)
                            .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại"));

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
        if (!userOrders.isEmpty()) {
            for (Order o : userOrders) {
                orderRepository.delete(o);
            }
        }

        Order newOrder = new Order();
        newOrder.setOrderId(generateOrderId());
        newOrder.setUserId(userId);
        // newOrder.setPaymentMethodId(order.getPaymentMethodId()); // XÓA: Bảng Order không còn cột này
        newOrder.setShippingAddress(order.getShippingAddress());
        newOrder.setCustomerNote(order.getCustomerNote());
        newOrder.setTotalAmount(order.getTotalAmount());
        newOrder.setOrderStatus("Pending");
        newOrder.setOrderDate(LocalDateTime.now());
        newOrder.setIsOrder(true);

        if (order.getCouponId() != null) {
            newOrder.setCouponId(order.getCouponId());
            processCouponUsage(order.getCouponId());
        }

        List<OrderDetail> allDetails = order.getOrderDetails();
        List<OrderDetail> newDetails = allDetails.stream()
                .map(od -> {
                    OrderDetail detail = new OrderDetail();
                    Product product = productRepository.findById(od.getProduct().getProductId())
                            .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại"));

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

    private void processCouponUsage(Integer couponId) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new RuntimeException("Mã giảm giá không tồn tại"));

        LocalDateTime now = LocalDateTime.now();
        if (coupon.getEndDate() != null && now.isAfter(coupon.getEndDate())) {
            throw new RuntimeException("Mã giảm giá đã hết hạn");
        }

        if (coupon.getUsageLimit() != null && coupon.getUsedCount() >= coupon.getUsageLimit()) {
            throw new RuntimeException("Mã giảm giá đã hết lượt sử dụng");
        }

        int currentCount = coupon.getUsedCount() == null ? 0 : coupon.getUsedCount();
        coupon.setUsedCount(currentCount + 1);

        couponRepository.save(coupon);
    }

    private String generateOrderId() {
        return "OR" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
    }
}