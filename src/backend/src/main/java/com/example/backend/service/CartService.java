package com.example.backend.service;

import com.example.backend.DTO.OrderDTO;
import java.util.List;

public interface CartService {
    int getCartCount(String userId);
    List<OrderDTO> getCartOrders(String userId);

}
