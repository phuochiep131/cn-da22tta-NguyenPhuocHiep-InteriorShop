package com.example.backend.service.impl;

import com.example.backend.DTO.ChatRequest;
import com.example.backend.DTO.ChatResponse;
import com.example.backend.model.Product;
import com.example.backend.repository.ProductRepository;
import com.example.backend.service.ChatbotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ChatbotServiceImpl implements ChatbotService {

    @Value("${openai.api.key}")
    private String apiKey;

    @Value("${openai.model}")
    private String model;

    @Value("${openai.api.url}")
    private String apiUrl;

    private final RestTemplate restTemplate;
    private final ProductRepository productRepository;

    private final String FRONTEND_URL = "http://localhost:5173";

    @Autowired
    public ChatbotServiceImpl(RestTemplate restTemplate, ProductRepository productRepository) {
        this.restTemplate = restTemplate;
        this.productRepository = productRepository;
    }

    @Override
    public ChatResponse getChatbotResponse(ChatRequest request) {
        try {
            // 1. Lấy dữ liệu
            String productContext = getProductContextFromDB();

            // 2. Headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + apiKey);

            // 3. Body
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model);
            List<Map<String, String>> messages = new ArrayList<>();

            // --- SYSTEM PROMPT (QUAN TRỌNG: Yêu cầu format Link) ---
            String promptContent = "Bạn là nhân viên tư vấn của InteriorShop. " +
                    "Dưới đây là danh sách sản phẩm:\n" +
                    "--- KHO HÀNG ---\n" +
                    productContext +
                    "\n----------------\n" +
                    "QUY TẮC TRẢ LỜI QUAN TRỌNG:\n" +
                    "1. KHÔNG sử dụng dấu ** (dấu sao) hoặc markdown in đậm trong câu trả lời. Chỉ viết text thường.\n" +
                    "2. Format bắt buộc để hiển thị ảnh: [Tên sản phẩm](URL_Chi_Tiết) ![Ảnh](URL_Anh)\n" +
                    "3. Giữa các sản phẩm phải CÁCH NHAU 1 DÒNG TRỐNG (xuống dòng kép) để dễ nhìn.\n" +
                    "4. Giọng điệu tự nhiên, không cần đánh số 1. 2. 3. nếu không cần thiết."+
                    "5. Với mỗi sản phẩm, trả về đúng định dạng sau:\n" +
                    "   [Tên sản phẩm](Link_Chi_Tiết) ![Giá_Gốc|Giá_Giảm](Link_Ảnh)\n" +
                    "   (Lưu ý: Trong dấu [] của ảnh, hãy điền Giá Gốc và Giá Giảm ngăn cách bởi dấu gạch đứng | )\n" +
                    "   Ví dụ: [Sofa Da](...) ![10.000.000đ|7.500.000đ](...)\n";

            messages.add(Map.of("role", "system", "content", promptContent));
            messages.add(Map.of("role", "user", "content", request.getMessage()));

            requestBody.put("messages", messages);

            // 4. Call API
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(apiUrl, entity, Map.class);

            Map<String, Object> responseBody = response.getBody();
            List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
            Map<String, Object> messageObj = (Map<String, Object>) choices.get(0).get("message");
            String content = (String) messageObj.get("content");

            return new ChatResponse(content);

        } catch (Exception e) {
            e.printStackTrace();
            return new ChatResponse("Hệ thống đang bảo trì.");
        }
    }

    private String getProductContextFromDB() {
        List<Product> products = productRepository.findProductsForChatbot();
        if (products.isEmpty()) return "Kho đang cập nhật.";

        return products.stream()
                .map(p -> {
                    String productLink = FRONTEND_URL + "/product/" + p.getProductId();

                    String imgUrl = (p.getImageUrl() != null) ? p.getImageUrl() : "";
                    BigDecimal currentPrice = p.getPrice();
                    BigDecimal originalPrice = currentPrice.multiply(new BigDecimal("1.2"));

                    String priceTxt = String.format("%.0f", currentPrice);
                    String originalPriceTxt = String.format("%.0f", originalPrice);

                    return String.format("- Tên: %s | Giá: %s | Link: %s | Ảnh: %s | Màu: %s",
                            p.getProductName(),
                            originalPriceTxt + " VNĐ",
                            priceTxt + " VNĐ",
                            productLink,
                            imgUrl,
                            p.getColor());
                })
                .collect(Collectors.joining("\n"));
    }
}