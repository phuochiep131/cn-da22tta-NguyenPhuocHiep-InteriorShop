package com.example.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class VnPayConfig {

    @Value("${vnpay.url:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}")
    private String payUrl;

    @Value("${vnpay.returnUrl:http://localhost:8080/api/vnpay/return}")
    private String returnUrl;

    @Value("${vnpay.tmnCode:}")
    private String tmnCode;

    @Value("${vnpay.hashSecret:}")
    private String hashSecret;

    public String getPayUrl() { return payUrl; }
    public String getReturnUrl() { return returnUrl; }
    public String getTmnCode() { return tmnCode; }
    public String getHashSecret() { return hashSecret; }
}
