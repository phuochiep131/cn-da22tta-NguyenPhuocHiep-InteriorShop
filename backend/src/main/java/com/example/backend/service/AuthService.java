package com.example.backend.service;

import com.example.backend.model.User;
import com.example.backend.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthService(UserRepository userRepository, JwtService jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    public String register(User user) {
        // Kiểm tra email tồn tại
        if (userRepository.existsByEmail(user.getEmail())) {
            return "Email already exists";
        }

        // Tạo ID ngẫu nhiên và mã hóa mật khẩu
        user.setUserId(UUID.randomUUID().toString());
        user.setPassword(encoder.encode(user.getPassword()));
        user.setRole(user.getRole() == null ? "USER" : user.getRole());

        userRepository.save(user);
        return "Register successful";
    }

    public String login(String email, String password) {
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isPresent() && encoder.matches(password, userOpt.get().getPassword())) {
            return jwtService.generateToken(email);
        }

        return null; // Sai email hoặc mật khẩu
    }

    public String logout(String token) {
        // Có thể bổ sung cơ chế blacklist JWT nếu cần
        return "Logout successful";
    }
}
