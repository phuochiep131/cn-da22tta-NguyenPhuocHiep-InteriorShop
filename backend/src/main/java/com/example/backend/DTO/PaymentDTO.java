package com.example.backend.DTO;

import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentDTO {
    private String paymentId;
    private String orderId;
    private String paymentMethodId;
    private String transactionId;
    private BigDecimal amount;
    private String paymentStatus;
}
