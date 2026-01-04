package com.example.backend.controller;

import com.example.backend.DTO.FlashSaleDTO;
import com.example.backend.DTO.FlashSaleItemDTO;
import com.example.backend.model.FlashSale;
import com.example.backend.service.FlashSaleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/flash-sales")
@CrossOrigin(origins = "*")
public class FlashSaleController {

    @Autowired
    private FlashSaleService flashSaleService;

    @GetMapping("/all-admin")
    public ResponseEntity<List<FlashSaleDTO>> getAllFlashSales() {
        return ResponseEntity.ok(flashSaleService.getAllFlashSales());
    }

    @GetMapping("/current")
    public ResponseEntity<FlashSaleDTO> getCurrentFlashSale() {
        return ResponseEntity.ok(flashSaleService.getCurrentFlashSale());
    }

    @PostMapping
    public ResponseEntity<FlashSaleDTO> createFlashSale(@RequestBody FlashSaleDTO dto) {
        return ResponseEntity.ok(flashSaleService.createFlashSale(dto));
    }

    @PostMapping("/{id}/items")
    public ResponseEntity<FlashSaleDTO> addProductToFlashSale(
            @PathVariable Integer id,
            @RequestBody FlashSaleItemDTO itemDTO) {
        return ResponseEntity.ok(flashSaleService.addProductToFlashSale(id, itemDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FlashSaleDTO> updateFlashSale(@PathVariable Integer id, @RequestBody FlashSaleDTO dto) {
        return ResponseEntity.ok(flashSaleService.updateFlashSale(id, dto));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateFlashSaleStatus(@PathVariable Integer id, @RequestBody Map<String, String> body) {
        String newStatus = body.get("status");
        flashSaleService.updateStatus(id, FlashSale.Status.valueOf(newStatus));
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<FlashSaleDTO> getFlashSaleById(@PathVariable Integer id) {
        return ResponseEntity.ok(flashSaleService.getFlashSaleById(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteFlashSale(@PathVariable Integer id) {
        flashSaleService.deleteFlashSale(id);
        return ResponseEntity.ok("Deleted Flash Sale ID: " + id);
    }
}