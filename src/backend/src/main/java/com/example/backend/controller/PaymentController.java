package com.example.backend.controller;

import com.example.backend.DTO.PaymentDTO;
import com.example.backend.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService service;

    @PostMapping
    public PaymentDTO create(@RequestBody PaymentDTO dto) {
        return service.createPayment(dto);
    }

    @PutMapping("/{id}")
    public PaymentDTO update(@PathVariable String id, @RequestBody PaymentDTO dto) {
        return service.updatePayment(id, dto);
    }

    @PutMapping("/{id}/status")
    public PaymentDTO updatePaymentStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {

        String newStatus = body.get("paymentStatus");
        return service.updatePaymentStatus(id, newStatus);
    }


    @GetMapping("/{id}")
    public PaymentDTO get(@PathVariable String id) {
        return service.getPaymentById(id);
    }

    @GetMapping
    public List<PaymentDTO> getAll() {
        return service.getAllPayments();
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable String id) {
        service.deletePayment(id);
        return "Deleted payment: " + id;
    }
}
