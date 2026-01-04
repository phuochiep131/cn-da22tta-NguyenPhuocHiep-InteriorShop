package com.example.backend.service;

import com.example.backend.model.User;
import java.util.List;
import java.util.Optional;

public interface UserService {
    List<User> getAllUsers();
    Optional<User> getUserById(String id);
    User updateUser(String id, User userDetails);
    boolean deleteUser(String id);
}
