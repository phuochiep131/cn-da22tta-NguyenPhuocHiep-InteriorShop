package com.example.backend.service.impl;

import com.example.backend.model.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.UserService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Override
    public Optional<User> getUserById(String id) {
        return userRepository.findById(id);
    }

    @Override
    public User updateUser(String id, User userDetails) {
        return userRepository.findById(id).map(u -> {
            u.setFullName(userDetails.getFullName());
            u.setAvatar(userDetails.getAvatar());
            // u.setEmail(userDetails.getEmail());
            u.setAddress(userDetails.getAddress());
            u.setGender(userDetails.getGender());
            u.setBirthDate(userDetails.getBirthDate());
            u.setPhoneNumber(userDetails.getPhoneNumber());
            u.setRole(userDetails.getRole());

            if (userDetails.getPassword() != null && !userDetails.getPassword().isEmpty()) {
                u.setPassword(passwordEncoder.encode(userDetails.getPassword()));
            }

            return userRepository.save(u);
        }).orElse(null);
    }

    @Override
    public boolean deleteUser(String id) {
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
