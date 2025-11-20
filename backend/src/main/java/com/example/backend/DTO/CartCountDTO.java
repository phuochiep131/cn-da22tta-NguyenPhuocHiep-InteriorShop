package com.example.backend.DTO;

public class CartCountDTO {
    private String userId;
    private int count;

    public CartCountDTO() {}

    public CartCountDTO(String userId, int count) {
        this.userId = userId;
        this.count = count;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public int getCount() {
        return count;
    }

    public void setCount(int count) {
        this.count = count;
    }
}
