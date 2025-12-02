package com.example.backend.DTO;

import lombok.Data;

@Data
public class ChatResponse {
    private String reply;

    public ChatResponse(String reply) {
        this.reply = reply;
    }
}