package com.example.backend.service.impl;

import com.example.backend.DTO.PaymentDTO;
import com.example.backend.model.Payment;
import com.example.backend.model.Order;
import com.example.backend.model.PaymentStatus;
import com.example.backend.repository.PaymentRepository;
import com.example.backend.repository.OrderRepository;
import com.example.backend.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;

    @Override
    public PaymentDTO createPayment(PaymentDTO dto) {
        Order order = orderRepository.findById(dto.getOrderId())
                .orElseThrow(() -> new RuntimeException("Order not found"));

        Payment payment = Payment.builder()
                .paymentId(UUID.randomUUID().toString())
                .order(order)
                .paymentMethodId(dto.getPaymentMethodId())
                .transactionId(dto.getTransactionId())
                .amount(dto.getAmount())
                .paymentDate(LocalDateTime.now())
                .paymentStatus(PaymentStatus.valueOf(dto.getPaymentStatus()))
                .build();

        paymentRepository.save(payment);

        return convertToDTO(payment);
    }

    @Override
    public PaymentDTO updatePayment(String id, PaymentDTO dto) {

        Payment payment = paymentRepository.findById(id).orElseThrow(() -> new RuntimeException("Payment not found"));

        payment.setTransactionId(dto.getTransactionId());
        payment.setAmount(dto.getAmount());
        payment.setPaymentMethodId(dto.getPaymentMethodId());
        payment.setPaymentStatus(PaymentStatus.valueOf(dto.getPaymentStatus()));

        paymentRepository.save(payment);

        return convertToDTO(payment);
    }

    @Override
    public PaymentDTO updatePaymentStatus(String paymentId, String newStatus) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        payment.setPaymentStatus(PaymentStatus.valueOf(newStatus)); // PaymentStatus là enum
        paymentRepository.save(payment);

        return convertToDTO(payment);
    }


    @Override
    public PaymentDTO getPaymentById(String id) {
        Payment payment = paymentRepository.findById(id).orElseThrow(() -> new RuntimeException("Payment not found"));
        return convertToDTO(payment);
    }

    @Override
    public List<PaymentDTO> getAllPayments() {
        return paymentRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public void deletePayment(String id) {
        paymentRepository.deleteById(id);
    }

    private PaymentDTO convertToDTO(Payment p) {
        return PaymentDTO.builder()
                .paymentId(p.getPaymentId())
                .orderId(p.getOrder().getOrderId())
                .paymentMethodId(p.getPaymentMethodId())
                .transactionId(p.getTransactionId())
                .amount(p.getAmount())
                .paymentStatus(p.getPaymentStatus().name())
                .build();
    }
}
