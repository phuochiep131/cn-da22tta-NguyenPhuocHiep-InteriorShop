package com.example.backend.controller;

import com.example.backend.DTO.VnPayRequest;
import com.example.backend.service.VnPayService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/vnpay")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class VnPayController {

    private final VnPayService vnPayService;

    @PostMapping("/create-payment")
    public ResponseEntity<Map<String, Object>> createPayment(
            @RequestBody VnPayRequest request,
            HttpServletRequest httpServletRequest
    ) {
        String paymentUrl = vnPayService.createPayment(request.getAmount(), request.getLanguage(), httpServletRequest);

        Map<String, Object> response = new HashMap<>();
        response.put("code", "00");
        response.put("message", "success");
        response.put("data", paymentUrl);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/return")
    public Map<String, Object> vnpayReturn(HttpServletRequest req) {
        return vnPayService.processReturn(req);
    }

}
