package com.example.backend.service.impl;

import com.example.backend.DTO.FlashSaleDTO;
import com.example.backend.DTO.FlashSaleItemDTO;
import com.example.backend.model.FlashSale;
import com.example.backend.model.FlashSaleItem;
import com.example.backend.model.Product;
import com.example.backend.repository.FlashSaleItemRepository;
import com.example.backend.repository.FlashSaleRepository;
import com.example.backend.repository.ProductRepository;
import com.example.backend.service.FlashSaleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FlashSaleServiceImpl implements FlashSaleService {

    @Autowired
    private FlashSaleRepository flashSaleRepository;
    @Autowired
    private FlashSaleItemRepository flashSaleItemRepository;
    @Autowired
    private ProductRepository productRepository;

    @Override
    public List<FlashSaleDTO> getAllFlashSales() {
        return flashSaleRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public FlashSaleDTO createFlashSale(FlashSaleDTO dto) {
        FlashSale flashSale = new FlashSale();
        flashSale.setName(dto.getName());
        flashSale.setDescription(dto.getDescription());
        flashSale.setStartDate(dto.getStartDate());
        flashSale.setEndDate(dto.getEndDate());
        flashSale.setStatus(FlashSale.Status.Inactive); // Mặc định tạo xong để Inactive

        FlashSale saved = flashSaleRepository.save(flashSale);
        return mapToDTO(saved);
    }

    @Override
    public FlashSaleDTO getFlashSaleById(Integer id) {
        FlashSale flashSale = flashSaleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Flash Sale not found"));
        return mapToDTO(flashSale);
    }

    @Override
    public FlashSaleDTO getCurrentFlashSale() {
        // Tìm đợt sale đang active theo thời gian thực
        return flashSaleRepository.findCurrentActiveFlashSale(LocalDateTime.now())
                .map(this::mapToDTO)
                .orElse(null);
    }

    @Override
    public FlashSaleDTO addProductToFlashSale(Integer flashSaleId, FlashSaleItemDTO itemDTO) {
        FlashSale flashSale = flashSaleRepository.findById(flashSaleId)
                .orElseThrow(() -> new RuntimeException("Flash Sale not found"));
        Product product = productRepository.findById(itemDTO.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        FlashSaleItem item = new FlashSaleItem();
        item.setFlashSale(flashSale);
        item.setProduct(product);
        item.setFlashSalePrice(itemDTO.getFlashSalePrice());
        item.setQuantity(itemDTO.getQuantity());
        item.setSoldCount(0);

        flashSaleItemRepository.save(item);

        // Refresh entity to return full data
        return getFlashSaleById(flashSaleId);
    }

    @Override
    @Transactional
    public void updateFlashSaleStatus() {
        LocalDateTime now = LocalDateTime.now();
        List<FlashSale> allSales = flashSaleRepository.findAll();

        for (FlashSale sale : allSales) {
            if (sale.getStatus() == FlashSale.Status.Finished) continue;

            // Nếu đến giờ bắt đầu -> Active
            if (now.isAfter(sale.getStartDate()) && now.isBefore(sale.getEndDate())) {
                if (sale.getStatus() != FlashSale.Status.Active) {
                    sale.setStatus(FlashSale.Status.Active);
                    flashSaleRepository.save(sale);
                }
            }
            // Nếu hết giờ -> Finished
            else if (now.isAfter(sale.getEndDate())) {
                if (sale.getStatus() != FlashSale.Status.Finished) {
                    sale.setStatus(FlashSale.Status.Finished);
                    flashSaleRepository.save(sale);
                }
            }
        }
    }

    @Override
    public void deleteFlashSale(Integer id) {
        flashSaleRepository.deleteById(id);
    }

    // --- Mapper ---
    private FlashSaleDTO mapToDTO(FlashSale entity) {
        FlashSaleDTO dto = new FlashSaleDTO();
        dto.setFlashSaleId(entity.getFlashSaleId());
        dto.setName(entity.getName());
        dto.setDescription(entity.getDescription());
        dto.setStartDate(entity.getStartDate());
        dto.setEndDate(entity.getEndDate());
        dto.setStatus(entity.getStatus());

        if (entity.getFlashSaleItems() != null) {
            dto.setItems(entity.getFlashSaleItems().stream().map(item -> {
                FlashSaleItemDTO itemDTO = new FlashSaleItemDTO();
                itemDTO.setFlashSaleItemId(item.getFlashSaleItemId());
                itemDTO.setProductId(item.getProduct().getProductId());
                itemDTO.setProductName(item.getProduct().getProductName());
                itemDTO.setProductImageUrl(item.getProduct().getImageUrl());
                itemDTO.setOriginalPrice(item.getProduct().getPrice());
                itemDTO.setFlashSalePrice(item.getFlashSalePrice());
                itemDTO.setQuantity(item.getQuantity());
                itemDTO.setSoldCount(item.getSoldCount());
                return itemDTO;
            }).collect(Collectors.toList()));
        } else {
            dto.setItems(new ArrayList<>());
        }
        return dto;
    }

    @Override
    public void updateStatus(Integer id, FlashSale.Status status) {
        FlashSale flashSale = flashSaleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Flash Sale not found"));

        flashSale.setStatus(status);
        flashSaleRepository.save(flashSale);
    }

    @Override
    public FlashSaleDTO updateFlashSale(Integer id, FlashSaleDTO dto) {
        FlashSale flashSale = flashSaleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Flash Sale not found"));

        flashSale.setName(dto.getName());
        flashSale.setDescription(dto.getDescription());
        flashSale.setStartDate(dto.getStartDate());
        flashSale.setEndDate(dto.getEndDate());
        FlashSale updatedFlashSale = flashSaleRepository.save(flashSale);

        return mapToDTO(updatedFlashSale);
    }
}