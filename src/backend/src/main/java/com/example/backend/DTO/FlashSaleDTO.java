package com.example.backend.DTO;

import com.example.backend.model.FlashSale;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class FlashSaleDTO {
    private Integer flashSaleId;
    private String name;
    private String description;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private FlashSale.Status status;
    private List<FlashSaleItemDTO> items; // Danh sách sản phẩm trong đợt sale
}