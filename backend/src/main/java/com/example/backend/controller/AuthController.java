package com.example.backend.controller;

import com.example.backend.model.Account;
import com.example.backend.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Account acc) {
        String result = authService.register(acc);
        return ResponseEntity.ok(Map.of("message", result));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> req) {
        String token = authService.login(req.get("username"), req.get("password"));
        if (token != null)
            return ResponseEntity.ok(Map.of("token", token));
        return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader("Authorization") String token) {
        return ResponseEntity.ok(Map.of("message", authService.logout(token)));
    }
}
