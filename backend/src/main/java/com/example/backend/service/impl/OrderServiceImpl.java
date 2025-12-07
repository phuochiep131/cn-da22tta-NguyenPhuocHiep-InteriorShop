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
        // Chỉ lấy các đơn hàng thực tế (đã đặt), bỏ qua giỏ hàng
        return orderRepository.findByIsOrderTrue();
    }

    @Override
    public Order getOrderById(String orderId) {
        return orderRepository.findById(orderId).orElse(null);
    }

    @Override
    @Transactional
    public Order createOrder(Order order) {
        // Sinh ID và thời gian
        order.setOrderId(generateOrderId());
        order.setOrderDate(LocalDateTime.now());

        // --- XỬ LÝ NẾU LÀ ĐƠN HÀNG THẬT (MUA NGAY) ---
        if (Boolean.TRUE.equals(order.getIsOrder())) {
            // [LOGIC COUPON] Tăng số lần sử dụng nếu có mã giảm giá
            if (order.getCouponId() != null) {
                processCouponUsage(order.getCouponId());
            }
        }

        if (order.getOrderDetails() != null) {
            for (OrderDetail detail : order.getOrderDetails()) {
                Product product = productRepository.findById(detail.getProduct().getProductId())
                        .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại"));

                // --- LOGIC GIỎ HÀNG (isOrder = false hoặc null) ---
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
                        // Lưu ý: Logic cũ của bạn return ngay tại đây, nghĩa là chỉ thêm được 1 sản phẩm nếu trùng.
                        // Nếu muốn thêm nhiều sp, hãy bỏ return và để vòng lặp chạy tiếp.
                        return existingDetail.getOrder();
                    }
                }

                // --- LOGIC ĐƠN HÀNG THẬT (isOrder = true) ---
                if (Boolean.TRUE.equals(order.getIsOrder())) {
                    if (product.getQuantity() < detail.getQuantity()) {
                        throw new RuntimeException("Số lượng sản phẩm " + product.getProductName() + " không đủ");
                    }
                    // Trừ tồn kho
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
        orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        updatedOrder.setOrderId(orderId);

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
        orderRepository.save(order);
    }

    @Override
    public List<OrderDTO> getOrdersByUserId(String userId) {
        List<Order> orders = orderRepository.findByUserId(userId);
        return orders.stream()
                .map(OrderDTO::new)
                .collect(Collectors.toList());
    }

    // --- TÍNH NĂNG HỦY ĐƠN & HOÀN TIỀN ---
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

        // 1. Hoàn trả số lượng sản phẩm vào kho
        if (order.getOrderDetails() != null) {
            for (OrderDetail detail : order.getOrderDetails()) {
                Product product = detail.getProduct();
                product.setQuantity(product.getQuantity() + detail.getQuantity());
                productRepository.save(product);
            }
        }

        // 2. Xử lý trạng thái thanh toán (Payment)
        Optional<Payment> paymentOpt = paymentRepository.findByOrderOrderId(orderId);

        if (paymentOpt.isPresent()) {
            Payment payment = paymentOpt.get();

            // Nếu đã thanh toán (VNPay Completed) -> Chuyển sang Chờ hoàn tiền
            if (PaymentStatus.Completed.equals(payment.getPaymentStatus())) {
                payment.setPaymentStatus(PaymentStatus.Refund_Pending);
                paymentRepository.save(payment);
            }
            // Nếu đang chờ thanh toán (VNPay Pending) -> Hủy luôn
            else if (PaymentStatus.Pending.equals(payment.getPaymentStatus())) {
                payment.setPaymentStatus(PaymentStatus.Failed);
                paymentRepository.save(payment);
            }
        }

        // 3. Cập nhật trạng thái đơn hàng
        order.setOrderStatus("Cancelled");
        String note = (order.getCustomerNote() != null ? order.getCustomerNote() : "")
                + " | Đã hủy: " + reason;
        order.setCustomerNote(note);

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
        order.setPaymentMethodId(req.getPaymentMethodId());
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

        // 1. Xóa các mục trong giỏ hàng cũ (isOrder = false)
        List<Order> userOrders = orderRepository.findByUserIdAndIsOrderFalse(userId);
        if (!userOrders.isEmpty()) {
            for (Order o : userOrders) {
                orderRepository.delete(o);
            }
        }

        // 2. Tạo đơn hàng mới
        Order newOrder = new Order();
        newOrder.setOrderId(generateOrderId());
        newOrder.setUserId(userId);
        newOrder.setPaymentMethodId(order.getPaymentMethodId());
        newOrder.setShippingAddress(order.getShippingAddress());
        newOrder.setCustomerNote(order.getCustomerNote());
        newOrder.setTotalAmount(order.getTotalAmount());
        newOrder.setOrderStatus("Pending");
        newOrder.setOrderDate(LocalDateTime.now());
        newOrder.setIsOrder(true); // Đánh dấu là đơn hàng thật

        // [LOGIC COUPON] Tăng số lần sử dụng nếu có mã giảm giá
        if (order.getCouponId() != null) {
            newOrder.setCouponId(order.getCouponId()); // Lưu lại coupon vào đơn mới
            processCouponUsage(order.getCouponId());   // Tăng count trong bảng coupons
        }

        // 4. Xử lý chi tiết đơn hàng & Trừ tồn kho
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

        // 1. Kiểm tra hạn sử dụng
        LocalDateTime now = LocalDateTime.now();
        if (coupon.getEndDate() != null && now.isAfter(coupon.getEndDate())) {
            throw new RuntimeException("Mã giảm giá đã hết hạn");
        }

        // 2. Kiểm tra giới hạn số lần dùng
        if (coupon.getUsageLimit() != null && coupon.getUsedCount() >= coupon.getUsageLimit()) {
            throw new RuntimeException("Mã giảm giá đã hết lượt sử dụng");
        }

        // 3. Tăng số lần sử dụng
        int currentCount = coupon.getUsedCount() == null ? 0 : coupon.getUsedCount();
        coupon.setUsedCount(currentCount + 1);

        couponRepository.save(coupon);
    }

    private String generateOrderId() {
        return "OR" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
    }
}