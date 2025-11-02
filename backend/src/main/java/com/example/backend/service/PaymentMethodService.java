package com.example.backend.service;

import com.example.backend.model.PaymentMethod;
import java.util.List;
import java.util.Optional;

public interface PaymentMethodService {
    List<PaymentMethod> getAll();
    Optional<PaymentMethod> getById(String id);
    PaymentMethod create(PaymentMethod paymentMethod);
    PaymentMethod update(String id, PaymentMethod paymentMethod);
    void delete(String id);
}
