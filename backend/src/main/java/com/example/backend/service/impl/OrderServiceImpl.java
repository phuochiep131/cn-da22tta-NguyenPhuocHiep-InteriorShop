package com.example.backend.service.impl;

import com.example.backend.DTO.OrderDTO;
import com.example.backend.DTO.OrderReplaceRequest;
import com.example.backend.model.*;
import com.example.backend.repository.*;
import com.example.backend.service.FlashSaleService;
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
    private final FlashSaleService flashSaleService;

    @Autowired
    public OrderServiceImpl(OrderRepository orderRepository,
                            ProductRepository productRepository,
                            OrderDetailRepository orderDetailRepository,
                            PaymentRepository paymentRepository,
                            CouponRepository couponRepository,
                            FlashSaleService flashSaleService) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.orderDetailRepository = orderDetailRepository;
        this.paymentRepository = paymentRepository;
        this.couponRepository = couponRepository;
        this.flashSaleService = flashSaleService;
    }



    @Override
    public List<Order> getAllOrders() {
        return orderRepository.findByIsOrderTrue();
    }

    @Override
    @Transactional
    public void deleteOrder(String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng để xóa"));

        // Optional: Remove related payment data if necessary
        // paymentRepository.deleteByOrderId(orderId);

        orderRepository.delete(order);
    }

    private void handleStockUpdate(Product product, int quantity, Integer isFlashSaleFlag) {
        // A. Xử lý Flash Sale (Dựa vào cờ transient từ Frontend)
        if (isFlashSaleFlag != null && isFlashSaleFlag == 1) {
            boolean success = flashSaleService.deductFlashSaleQuantity(product.getProductId(), quantity);
            if (!success) {
                throw new RuntimeException("Lỗi cập nhật suất Flash Sale cho sản phẩm: " + product.getProductName());
            }
        }

        // B. Xử lý Kho Tổng (Product)
        if (product.getQuantity() < quantity) {
            throw new RuntimeException("Kho tổng không đủ hàng cho: " + product.getProductName());
        }
        product.setQuantity(product.getQuantity() - quantity);
        productRepository.save(product);
    }

    @Override
    public List<OrderDTO> getOrdersByUserId(String userId) {
        List<Order> orders = orderRepository.findByUserId(userId);
        return orders.stream()
                .map(OrderDTO::new)
                .collect(Collectors.toList());
    }

    @Override
    public Order getOrderById(String orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng với mã: " + orderId));
    }

    @Override
    @Transactional
    public Order createOrder(Order order) {
        order.setOrderId(generateOrderId());
        order.setOrderDate(LocalDateTime.now());
        if (order.getOrderStatus() == null) order.setOrderStatus("Pending");

        if (Boolean.TRUE.equals(order.getIsOrder()) && order.getCouponId() != null) {
            processCouponUsage(order.getCouponId());
        }

        if (order.getOrderDetails() != null) {
            for (OrderDetail detail : order.getOrderDetails()) {
                Product product = productRepository.findById(detail.getProduct().getProductId())
                        .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại"));

                // CASE 1: MUA NGAY (IsOrder = true) -> TRỪ KHO
                if (Boolean.TRUE.equals(order.getIsOrder())) {
                    handleStockUpdate(product, detail.getQuantity(), detail.getIsFlashSale());
                }
                // CASE 2: THÊM GIỎ HÀNG (IsOrder = false) -> KHÔNG TRỪ KHO, CHỈ CHECK
                else {
                    Optional<OrderDetail> existingDetailOpt = orderDetailRepository.findExistingCartItem(
                            order.getUserId(), product.getProductId());

                    if (existingDetailOpt.isPresent()) {
                        OrderDetail existingDetail = existingDetailOpt.get();
                        int newQty = existingDetail.getQuantity() + detail.getQuantity();
                        if (product.getQuantity() < newQty) throw new RuntimeException("Kho không đủ hàng");
                        existingDetail.setQuantity(newQty);
                        orderDetailRepository.save(existingDetail);
                        return existingDetail.getOrder();
                    }
                }

                detail.setProduct(product);
                detail.setOrder(order);
            }
        }
        return orderRepository.save(order);
    }

    @Override
    @Transactional
    public Order replaceOrder(OrderReplaceRequest req) {
        // 1. Xóa các item trong giỏ hàng cũ (để chuyển thành đơn mới)
        if (req.getOldOrderIds() != null && !req.getOldOrderIds().isEmpty()) {
            orderRepository.deleteAllById(req.getOldOrderIds());
            orderRepository.flush();
        }

        // 2. Tạo đơn hàng mới
        Order order = new Order();
        order.setOrderId(generateOrderId());
        order.setOrderDate(LocalDateTime.now());
        order.setOrderStatus("Pending");
        order.setUserId(req.getUserId());
        order.setShippingAddress(req.getShippingAddress());
        order.setCustomerNote(req.getCustomerNote());
        order.setTotalAmount(req.getTotalAmount());
        order.setIsOrder(true); // Đây là đơn thật
        order.setCouponId(req.getCouponId());

        if (req.getCouponId() != null) {
            processCouponUsage(req.getCouponId());
        }

        // 3. Xử lý chi tiết đơn hàng & Trừ kho
        List<OrderDetail> details = req.getOrderDetails().stream().map(d -> {
            OrderDetail od = new OrderDetail();
            Product product = productRepository.findById(d.getProduct().getProductId())
                    .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại"));

            // [QUAN TRỌNG] GỌI HÀM TRỪ KHO TẠI ĐÂY
            // d.getIsFlashSale() sẽ lấy giá trị từ JSON Frontend
            handleStockUpdate(product, d.getQuantity(), d.getIsFlashSale());

            od.setProduct(product);
            od.setQuantity(d.getQuantity());
            od.setUnitPrice(d.getUnitPrice());
            od.setOriginalUnitPrice(d.getOriginalUnitPrice());
            od.setOrder(order);
            return od;
        }).collect(Collectors.toList());

        order.setOrderDetails(details);
        return orderRepository.save(order);
    }

    @Override
    @Transactional
    public Order checkoutOrder(Order order) {
        String userId = order.getUserId();
        // Xóa giỏ hàng cũ
        List<Order> userOrders = orderRepository.findByUserIdAndIsOrderFalse(userId);
        if (!userOrders.isEmpty()) {
            orderRepository.deleteAll(userOrders);
        }

        Order newOrder = new Order();
        newOrder.setOrderId(generateOrderId());
        newOrder.setUserId(userId);
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

        List<OrderDetail> newDetails = order.getOrderDetails().stream().map(od -> {
            OrderDetail detail = new OrderDetail();
            Product product = productRepository.findById(od.getProduct().getProductId())
                    .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại"));

            // Xử lý kho
            handleStockUpdate(product, od.getQuantity(), od.getIsFlashSale());

            detail.setProduct(product);
            detail.setQuantity(od.getQuantity());
            detail.setUnitPrice(od.getUnitPrice());
            detail.setOrder(newOrder);
            return detail;
        }).collect(Collectors.toList());

        newOrder.setOrderDetails(newDetails);
        return orderRepository.save(newOrder);
    }

    @Override
    @Transactional
    public void cancelOrder(String orderId, String reason) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Đơn hàng không tồn tại"));

        String currentStatus = order.getOrderStatus();
        if (List.of("Shipped", "Delivered", "Cancelled").stream().anyMatch(s -> s.equalsIgnoreCase(currentStatus))) {
            throw new RuntimeException("Không thể hủy đơn ở trạng thái: " + currentStatus);
        }

        // --- HOÀN KHO TỔNG (Product) ---
        if (order.getOrderDetails() != null) {
            for (OrderDetail detail : order.getOrderDetails()) {
                Product product = detail.getProduct();
                product.setQuantity(product.getQuantity() + detail.getQuantity());
                productRepository.save(product);
            }
        }
        // Lưu ý: Chưa hoàn được soldCount Flash Sale do DB chưa lưu flag isFlashSale
        // Nếu muốn hoàn chuẩn xác, cần thêm cột is_flash_sale vào bảng order_details trong DB.

        // Xử lý hoàn tiền
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
        order.setCustomerNote((order.getCustomerNote() != null ? order.getCustomerNote() : "") + " | Đã hủy: " + reason);
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);
    }

    // ... (Giữ nguyên updateOrder, updateOrderStatus)
    @Override @Transactional
    public Order updateOrder(String orderId, Order updatedOrder) {
        Order existingOrder = orderRepository.findById(orderId).orElseThrow();
        updatedOrder.setOrderId(orderId);
        updatedOrder.setOrderDate(existingOrder.getOrderDate());
        updatedOrder.setUpdatedAt(LocalDateTime.now());
        if (updatedOrder.getOrderDetails() != null) {
            for (OrderDetail detail : updatedOrder.getOrderDetails()) {
                detail.setOrder(updatedOrder);
                if (detail.getProduct() != null) {
                    detail.setProduct(productRepository.findById(detail.getProduct().getProductId()).orElse(null));
                }
            }
        }
        return orderRepository.save(updatedOrder);
    }

    @Override @Transactional
    public void updateOrderStatus(String orderId, String status) {
        Order order = orderRepository.findById(orderId).orElseThrow();
        order.setOrderStatus(status); order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);
    }

    // --- Helpers ---
    private void processCouponUsage(Integer couponId) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new RuntimeException("Mã giảm giá không tồn tại"));
        LocalDateTime now = LocalDateTime.now();
        if (coupon.getEndDate() != null && now.isAfter(coupon.getEndDate())) throw new RuntimeException("Mã hết hạn");
        if (coupon.getUsageLimit() != null && coupon.getUsedCount() >= coupon.getUsageLimit()) throw new RuntimeException("Mã hết lượt");
        coupon.setUsedCount((coupon.getUsedCount() == null ? 0 : coupon.getUsedCount()) + 1);
        couponRepository.save(coupon);
    }

    private String generateOrderId() {
        return "OR" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
    }
}