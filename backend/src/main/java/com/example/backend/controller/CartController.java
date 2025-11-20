package com.example.backend.controller;

import com.example.backend.DTO.CartCountDTO;
import com.example.backend.service.CartService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@CrossOrigin(origins = "*")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping("/count/user/{userId}")
    public CartCountDTO getCartCount(@PathVariable String userId) {
        int count = cartService.getCartCount(userId);
        return new CartCountDTO(userId, count);
    }

}
