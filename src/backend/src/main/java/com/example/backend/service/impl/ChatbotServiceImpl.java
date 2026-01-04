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
import java.math.RoundingMode;
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
            // 1. Lấy dữ liệu kho hàng (Context)
            String productContext = getProductContextFromDB();

            // 2. Headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + apiKey);

            // 3. Chuẩn bị Body
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model);
            List<Map<String, Object>> messages = new ArrayList<>();


            // === BƯỚC 1: SYSTEM PROMPT (LOGIC CHẶT CHẼ) ===
            String promptContent =
                    "=== 1. ĐỊNH DANH & PHẠM VI TƯ VẤN (QUAN TRỌNG) ===\n" +
                            "- Bạn là: CHUYÊN VIÊN TƯ VẤN NỘI THẤT của NPH Store.\n" +
                            "- PHẠM VI ĐƯỢC PHÉP TRẢ LỜI:\n" +
                            "  + Tất cả sản phẩm nội thất cho: Phòng Khách, Phòng Ngủ, Phòng Bếp (Bàn ăn, Ghế ăn), Phòng Làm Việc.\n" +
                            "  + Đồ trang trí, Decor, Đèn, Thảm...\n" +
                            "  + Tư vấn chất liệu, kích thước, cách bài trí.\n\n" +

                            "- CHỦ ĐỀ CẤM (CHỈ TỪ CHỐI KHI GẶP CÁC CHỦ ĐỀ SAU):\n" +
                            "  + Viết Code, Lập trình (IT)\n" +
                            "  + Giải Toán, Lý, Hóa, Bài tập về nhà\n" +
                            "  + Chính trị, Tôn giáo, Y tế, Pháp luật\n" +
                            "  + Các vấn đề đời sống cá nhân không liên quan mua sắm.\n\n" +

                            "- CÂU TỪ CHỐI (Chỉ dùng cho chủ đề CẤM):\n" +
                            "  \"Dạ em chỉ là nhân viên tư vấn nội thất nên không hỗ trợ được nội dung này ạ. Mình quay lại chọn bàn ghế, sofa hay đồ trang trí cho nhà mình nhé!\"\n\n" +

                            "=== 2. DỮ LIỆU KHO HÀNG (CONTEXT) ===\n" +
                            "--- KHO HÀNG BẮT ĐẦU ---\n" +
                            productContext + "\n" +
                            "--- KHO HÀNG KẾT THÚC ---\n\n" +

                            "=== 3. QUY TRÌNH XỬ LÝ THÔNG MINH (LOGIC) ===\n" +
                            "BƯỚC 1: SUY LUẬN TỪ KHÓA (KEYWORD MAPPING)\n" +
                            "  - Khách hỏi 'Phòng Bếp' -> Tìm: 'Bàn ăn', 'Ghế ăn', 'Bộ bàn ghế', 'Tủ bếp'.\n" +
                            "  - Khách hỏi 'Phòng Khách' -> Tìm: 'Sofa', 'Bàn trà', 'Kệ Tivi'.\n" +
                            "  - Khách hỏi 'Phòng Ngủ' -> Tìm: 'Giường', 'Tủ quần áo', 'Tab đầu giường'.\n" +
                            "  - Khách hỏi 'Đau lưng' -> Tìm: 'Sofa êm', 'Ghế thư giãn', 'Nệm'.\n\n" +

                            "BƯỚC 2: KIỂM TRA & LỌC SẢN PHẨM\n" +
                            "  - Duyệt kho hàng tìm sản phẩm khớp với từ khóa đã suy luận.\n" +
                            "  - So sánh GIÁ: Chỉ lấy sản phẩm có [Giá Bán] <= [Ngân Sách Khách].\n" +
                            "  - LOẠI BỎ NGAY các sản phẩm vượt ngân sách.\n" +
                            "  - Nếu không tìm thấy sản phẩm nào trong kho (hoặc hết hàng): Phải trả lời thật thà 'Hiện shop chưa có mẫu cho phòng bếp' hoặc gợi ý sang món khác. KHÔNG ĐƯỢC dùng câu từ chối của phần chủ đề cấm.\n\n" +

                            "BƯỚC 3: XỬ LÝ CẢM XÚC\n" +
                            "  - Nếu khách phàn nàn -> Xin lỗi chân thành trước khi bán tiếp.\n\n" +

                            "=== 4. QUY TẮC HIỂN THỊ (MARKDOWN ẢNH) ===\n" +
                            "- Chỉ hiển thị danh sách kết quả đã lọc (Tối đa 3 món).\n" +
                            "- Định dạng:\n" +
                            "1. [Tên Sản Phẩm](Link) ![GiáGốc|GiáGiảm](LinkẢnh)\n" +
                            "2. [Tên Sản Phẩm](Link) ![GiáGốc|GiáGiảm](LinkẢnh)\n\n" +
                            "- Yêu cầu giá trong ![]: Chỉ điền SỐ NGUYÊN (VD: 5000000), không điền chữ.\n" +
                            "- KHÔNG viết mô tả thừa bên dưới ảnh.\n\n" +

                            "=== 5. VÍ DỤ MẪU (HÃY HỌC THEO) ===\n" +
                            "User: 'Gợi ý nội thất phòng bếp'\n" +
                            "Bot (Suy luận: Bếp -> Tìm Bàn ăn):\n" +
                            "\"Dạ cho không gian phòng bếp ấm cúng, em xin gợi ý các mẫu Bộ Bàn Ăn đang bán chạy bên em ạ:\n" +
                            "1. [Bộ Bàn Ăn Mango](Link) ![4000000|3500000](Ảnh)\n" +
                            "2. [Bàn Ăn Gỗ Sồi](Link) ![5000000|5000000](Ảnh)\n" +
                            "Anh/chị thấy mẫu nào hợp mắt không ạ?\"";

            // Add System Prompt
            messages.add(Map.of("role", "system", "content", promptContent));

            if (request.getHistory() != null && !request.getHistory().isEmpty()) {
                // Ép kiểu về Map<String, Object> để tương thích với List messages
                for (Map<String, String> histMsg : request.getHistory()) {
                    messages.add(new HashMap<>(histMsg));
                }
            }

            // === BƯỚC 3: CÂU HỎI MỚI CỦA USER (LUÔN CUỐI CÙNG) ===
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
            return new ChatResponse("Hệ thống đang bảo trì, vui lòng thử lại sau.");
        }
    }

    private String getProductContextFromDB() {
        List<Product> products = productRepository.findAll();
        if (products.isEmpty()) return "Kho đang cập nhật.";

        // !!! QUAN TRỌNG: Thay đổi domain này thành domain thật của server chứa ảnh
        String IMAGE_BASE_URL = "http://localhost:8080";

        return products.stream()
                .map(p -> {
                    String productLink = FRONTEND_URL + "/product/" + p.getProductId();

                    // Xử lý ảnh (Tạo link tuyệt đối)
                    String rawImg = p.getImageUrl();
                    String finalImgUrl;
                    if (rawImg == null || rawImg.isEmpty()) {
                        finalImgUrl = "https://via.placeholder.com/300x200.png?text=No+Image";
                    } else if (rawImg.startsWith("http")) {
                        finalImgUrl = rawImg;
                    } else {
                        // Đảm bảo không bị trùng dấu gạch chéo
                        String path = rawImg.startsWith("/") ? rawImg : "/" + rawImg;
                        finalImgUrl = IMAGE_BASE_URL + path;
                    }

                    // Xử lý Giá & Giảm giá
                    BigDecimal currentPrice = p.getPrice(); // Giá bán hiện tại
                    BigDecimal originalPrice = currentPrice;
                    BigDecimal discountVal = p.getDiscount(); // Ví dụ: 15.00

                    // Tính giá gốc nếu có discount
                    if (discountVal != null && discountVal.compareTo(BigDecimal.ZERO) > 0) {
                        BigDecimal factor = BigDecimal.valueOf(100).subtract(discountVal);
                        if (factor.compareTo(BigDecimal.ZERO) > 0) {
                            originalPrice = currentPrice.multiply(BigDecimal.valueOf(100))
                                    .divide(factor, 0, RoundingMode.HALF_UP);
                        }
                    }

                    String priceTxt = String.format("%.0f", currentPrice);
                    String originalPriceTxt = String.format("%.0f", originalPrice);

                    int quantity = p.getQuantity();
                    String status = (quantity > 0) ? "CÒN HÀNG" : "HẾT HÀNG";

                    // Data gửi cho AI
                    return String.format("- Tên: %s | Trạng thái: %s | Giá Gốc: %s | Giá Giảm: %s | Link: %s | Ảnh: %s | Mô tả: %s",
                            p.getProductName(),
                            status,
                            originalPriceTxt,
                            priceTxt,
                            productLink,
                            finalImgUrl,
                            p.getDescription()
                    );
                })
                .collect(Collectors.joining("\n"));
    }
}