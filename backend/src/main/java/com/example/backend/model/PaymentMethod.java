package com.example.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "payment_methods")
public class PaymentMethod {

    @Id
    @Column(name = "payment_method_id", length = 50)
    private String id;

    @Column(name = "payment_method_name", nullable = false)
    private String name;

    public PaymentMethod() {}

    public PaymentMethod(String id, String name) {
        this.id = id;
        this.name = name;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
