package com.example.backend.service;

import com.example.backend.DTO.ChatRequest;
import com.example.backend.DTO.ChatResponse;

public interface ChatbotService {
    ChatResponse getChatbotResponse(ChatRequest request);
}