package com.example.backend.service;

import com.example.backend.DTO.FlashSaleDTO;
import com.example.backend.DTO.FlashSaleItemDTO;
import com.example.backend.model.FlashSale;

import java.util.List;

public interface FlashSaleService {
    List<FlashSaleDTO> getAllFlashSales();
    FlashSaleDTO createFlashSale(FlashSaleDTO flashSaleDTO);
    FlashSaleDTO getFlashSaleById(Integer id);
    FlashSaleDTO getCurrentFlashSale(); // Lấy đợt sale đang chạy để hiển thị Home/ProductDetail
    FlashSaleDTO addProductToFlashSale(Integer flashSaleId, FlashSaleItemDTO itemDTO);
    void updateFlashSaleStatus(); // Hàm cho Scheduler
    void deleteFlashSale(Integer id);
    void updateStatus(Integer id, FlashSale.Status status);
    FlashSaleDTO updateFlashSale(Integer id, FlashSaleDTO dto);
}