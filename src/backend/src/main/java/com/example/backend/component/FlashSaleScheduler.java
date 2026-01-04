package com.example.backend.component;

import com.example.backend.service.FlashSaleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class FlashSaleScheduler {

    @Autowired
    private FlashSaleService flashSaleService;

    // Chạy mỗi phút 1 lần (60000ms) để cập nhật trạng thái Flash Sale
    @Scheduled(fixedRate = 60000)
    public void checkFlashSaleStatus() {
        // System.out.println("Checking flash sale status...");
        flashSaleService.updateFlashSaleStatus();
    }
}