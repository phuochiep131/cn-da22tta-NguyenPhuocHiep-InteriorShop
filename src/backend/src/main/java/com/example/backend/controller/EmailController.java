package com.example.backend.controller;

import com.example.backend.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/emails")
@CrossOrigin(origins = "*")
public class EmailController {

    @Autowired
    private EmailService emailService;

    @PostMapping("/send-invoice")
    public ResponseEntity<?> sendInvoice(@RequestBody Map<String, String> request) {
        String orderId = request.get("orderId");
        String email = request.get("email");
        emailService.sendInvoiceEmail(orderId, email);
        return ResponseEntity.ok(Map.of("message", "Email sent to " + email));
    }
}