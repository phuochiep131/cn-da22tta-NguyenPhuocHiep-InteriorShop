package com.example.backend.controller;

import com.example.backend.DTO.OrderDTO;
import com.example.backend.service.CartService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/cart")
@CrossOrigin(origins = "*")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping("/count/user/{userId}")
    public int getCartCount(@PathVariable String userId) {
        return cartService.getCartCount(userId);
    }

    @GetMapping("/items/{userId}")
    public List<OrderDTO> getCartOrders(@PathVariable String userId) {
        return cartService.getCartOrders(userId);
    }

}
