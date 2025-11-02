package com.example.backend.service.impl;

import com.example.backend.model.PaymentMethod;
import com.example.backend.repository.PaymentMethodRepository;
import com.example.backend.service.PaymentMethodService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PaymentMethodServiceImpl implements PaymentMethodService {

    @Autowired
    private PaymentMethodRepository repository;

    @Override
    public List<PaymentMethod> getAll() {
        return repository.findAll();
    }

    @Override
    public Optional<PaymentMethod> getById(String id) {
        return repository.findById(id);
    }

    @Override
    public PaymentMethod create(PaymentMethod paymentMethod) {
        long count = repository.count() + 1;
        String newId = String.format("PM%03d", count);
        paymentMethod.setId(newId);
        return repository.save(paymentMethod);
    }

    @Override
    public PaymentMethod update(String id, PaymentMethod paymentMethod) {
        Optional<PaymentMethod> existing = repository.findById(id);
        if (existing.isPresent()) {
            PaymentMethod updated = existing.get();
            updated.setName(paymentMethod.getName());
            return repository.save(updated);
        }
        return null;
    }

    @Override
    public void delete(String id) {
        repository.deleteById(id);
    }
}
