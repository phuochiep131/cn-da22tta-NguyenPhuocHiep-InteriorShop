package com.example.backend.DTO;

import lombok.Data;

@Data
public class VnPayRequest {
    private int amount;
    private String language;
}
