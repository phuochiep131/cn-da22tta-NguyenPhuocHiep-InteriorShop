package com.example.backend.service;

import jakarta.servlet.http.HttpServletRequest;

public interface VnPayService {
    String createPayment(int amount, String language, HttpServletRequest req);

    String processReturn(HttpServletRequest req);
}
