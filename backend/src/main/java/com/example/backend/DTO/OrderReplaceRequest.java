package com.example.backend.DTO;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class OrderReplaceRequest {
    private String userId;
    private String paymentMethodId;
    private String shippingAddress;
    private String customerNote;
    private Integer couponId;
    private BigDecimal totalAmount;

    private List<String> oldOrderIds;
    private List<OrderDetailCreateDTO> orderDetails;
}
