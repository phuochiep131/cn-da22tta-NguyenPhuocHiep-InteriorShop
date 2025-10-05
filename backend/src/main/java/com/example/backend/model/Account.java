package com.example.backend.model;

import jakarta.persistence.*;
import java.sql.Timestamp;

@Entity
@Table(name = "ACCOUNT")
public class Account {

    @Id
    @Column(name = "account_id", length = 20)
    private String account_id;

    @Column(name = "username", nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "avatar", length = 255)
    private String avatar;

    @Column(name = "password", nullable = false, length = 100)
    private String password;

    @Column(name = "email", unique = true, length = 100)
    private String email;

    @Column(name = "role", length = 20)
    private String role = "USER";

    @Column(name = "created_at", insertable = false, updatable = false)
    private Timestamp created_at;

    // Getters & Setters
    public String getAccount_id() { return account_id; }
    public void setAccount_id(String account_id) { this.account_id = account_id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public Timestamp getCreated_at() { return created_at; }
    public void setCreated_at(Timestamp created_at) { this.created_at = created_at; }
}
