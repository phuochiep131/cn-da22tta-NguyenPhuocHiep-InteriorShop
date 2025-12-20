package com.example.backend.service;

public interface EmailService {
    void sendInvoiceEmail(String orderId, String toEmail);
}