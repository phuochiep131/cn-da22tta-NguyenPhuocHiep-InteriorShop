package com.example.backend.controller;

import com.example.backend.DTO.ChatRequest;
import com.example.backend.DTO.ChatResponse;
import com.example.backend.service.ChatbotService; // Import Interface
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chatbot")
@CrossOrigin(origins = "*")
public class ChatbotController {

    private final ChatbotService chatbotService;

    @Autowired
    public ChatbotController(ChatbotService chatbotService) {
        this.chatbotService = chatbotService;
    }

    @PostMapping("/ask")
    public ResponseEntity<ChatResponse> askChatbot(@RequestBody ChatRequest request) {
        ChatResponse response = chatbotService.getChatbotResponse(request);
        return ResponseEntity.ok(response);
    }
}