package com.example.backend.DTO;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class ChatRequest {
    private String message;

    private List<Map<String, String>> history;
}