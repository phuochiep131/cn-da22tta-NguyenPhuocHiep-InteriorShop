package com.example.backend.service;

import com.example.backend.model.Account;
import com.example.backend.repository.AccountRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private final AccountRepository accountRepo;
    private final JwtService jwtService;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthService(AccountRepository accountRepo, JwtService jwtService) {
        this.accountRepo = accountRepo;
        this.jwtService = jwtService;
    }

    public String register(Account acc) {
        if (accountRepo.existsByUsername(acc.getUsername()))
            return "Username already exists";
        if (accountRepo.existsByEmail(acc.getEmail()))
            return "Email already exists";

        acc.setAccount_id(UUID.randomUUID().toString());
        acc.setPassword(encoder.encode(acc.getPassword()));
        acc.setRole(acc.getRole() == null ? "USER" : acc.getRole());
        accountRepo.save(acc);
        return "Register successful";
    }

    public String login(String username, String password) {
        Optional<Account> userOpt = accountRepo.findByUsername(username);
        if (userOpt.isPresent() && encoder.matches(password, userOpt.get().getPassword())) {
            return jwtService.generateToken(username);
        }
        return null;
    }

    public String logout(String token) {
        // Có thể thêm cơ chế blacklist token nếu cần
        return "Logout successful";
    }
}
