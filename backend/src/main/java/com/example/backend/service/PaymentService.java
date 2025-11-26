package com.example.backend.service;

import com.example.backend.DTO.PaymentDTO;
import java.util.List;

public interface PaymentService {

    PaymentDTO createPayment(PaymentDTO dto);

    PaymentDTO updatePayment(String id, PaymentDTO dto);

    PaymentDTO updatePaymentStatus(String paymentId, String newStatus);

    PaymentDTO getPaymentById(String id);

    List<PaymentDTO> getAllPayments();

    void deletePayment(String id);
}
