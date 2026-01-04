package com.example.backend.service;

import jakarta.servlet.http.HttpServletRequest;

import java.util.Map;

public interface VnPayService {
    String createPayment(int amount, String language, HttpServletRequest req);

    Map<String, Object> processReturn(HttpServletRequest req);
}
