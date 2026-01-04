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
import java.util.Optional;
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
        flashSale.setStatus(FlashSale.Status.Inactive);
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
        return flashSaleRepository.findCurrentActiveFlashSale(LocalDateTime.now())
                .map(this::mapToDTO)
                .orElse(null);
    }

    @Override
    @Transactional
    public boolean deductFlashSaleQuantity(String productId, int quantity) {
        // 1. Tìm Flash Sale đang chạy
        FlashSale currentFlashSale = flashSaleRepository.findCurrentActiveFlashSale(LocalDateTime.now())
                .orElseThrow(() -> new RuntimeException("Không có Flash Sale nào đang diễn ra!"));

        // 2. Tìm sản phẩm trong đợt Sale đó
        FlashSaleItem item = flashSaleItemRepository.findByFlashSaleAndProduct_ProductId(currentFlashSale, productId)
                .orElseThrow(() -> new RuntimeException("Sản phẩm không thuộc Flash Sale hiện tại!"));

        // 3. Kiểm tra số lượng còn lại (Tổng suất - Đã bán)
        int remainingFlashSaleStock = item.getQuantity() - item.getSoldCount();

        if (remainingFlashSaleStock < quantity) {
            throw new RuntimeException("Sản phẩm này đã hết suất Flash Sale! (Còn lại: " + remainingFlashSaleStock + ")");
        }

        // 4. CẬP NHẬT: Tăng số lượng đã bán (soldCount)
        item.setSoldCount(item.getSoldCount() + quantity);

        // 5. Lưu ngay lập tức
        flashSaleItemRepository.save(item);
        return true;
    }

    @Override
    @Transactional
    public void restoreFlashSaleQuantity(String productId, int quantity) {
        flashSaleRepository.findCurrentActiveFlashSale(LocalDateTime.now()).ifPresent(sale -> {
            flashSaleItemRepository.findByFlashSaleAndProduct_ProductId(sale, productId).ifPresent(item -> {
                item.setSoldCount(Math.max(0, item.getSoldCount() - quantity));
                flashSaleItemRepository.save(item);
            });
        });
    }

    @Override
    @Transactional
    public void updateFlashSaleStatus() {
        LocalDateTime now = LocalDateTime.now();
        List<FlashSale> allSales = flashSaleRepository.findAll();
        for (FlashSale sale : allSales) {
            if (sale.getStatus() == FlashSale.Status.Finished) continue;
            if (now.isAfter(sale.getStartDate()) && now.isBefore(sale.getEndDate())) {
                sale.setStatus(FlashSale.Status.Active);
            } else if (now.isAfter(sale.getEndDate())) {
                sale.setStatus(FlashSale.Status.Finished);
            }
            flashSaleRepository.save(sale);
        }
    }

    private FlashSaleDTO mapToDTO(FlashSale entity) {
        FlashSaleDTO dto = new FlashSaleDTO();
        dto.setFlashSaleId(entity.getFlashSaleId());
        dto.setName(entity.getName());
        dto.setStartDate(entity.getStartDate());
        dto.setEndDate(entity.getEndDate());
        dto.setStatus(entity.getStatus());
        if (entity.getFlashSaleItems() != null) {
            dto.setItems(entity.getFlashSaleItems().stream().map(item -> {
                FlashSaleItemDTO idto = new FlashSaleItemDTO();
                idto.setProductId(item.getProduct().getProductId());
                idto.setFlashSalePrice(item.getFlashSalePrice());
                idto.setQuantity(item.getQuantity());
                idto.setSoldCount(item.getSoldCount());
                return idto;
            }).collect(Collectors.toList()));
        }
        return dto;
    }

    @Override public void deleteFlashSale(Integer id) { flashSaleRepository.deleteById(id); }
    @Override public void updateStatus(Integer id, FlashSale.Status status) {
        FlashSale fs = flashSaleRepository.findById(id).orElseThrow();
        fs.setStatus(status); flashSaleRepository.save(fs);
    }
    @Override public FlashSaleDTO updateFlashSale(Integer id, FlashSaleDTO dto) {
        FlashSale fs = flashSaleRepository.findById(id).orElseThrow();
        fs.setName(dto.getName()); fs.setStartDate(dto.getStartDate()); fs.setEndDate(dto.getEndDate());
        return mapToDTO(flashSaleRepository.save(fs));
    }
    @Override public FlashSaleDTO addProductToFlashSale(Integer flashSaleId, FlashSaleItemDTO itemDTO) {
        FlashSale fs = flashSaleRepository.findById(flashSaleId).orElseThrow();
        Product p = productRepository.findById(itemDTO.getProductId()).orElseThrow();
        FlashSaleItem item = new FlashSaleItem();
        item.setFlashSale(fs); item.setProduct(p);
        item.setFlashSalePrice(itemDTO.getFlashSalePrice());
        item.setQuantity(itemDTO.getQuantity()); item.setSoldCount(0);
        flashSaleItemRepository.save(item);
        return getFlashSaleById(flashSaleId);
    }
}