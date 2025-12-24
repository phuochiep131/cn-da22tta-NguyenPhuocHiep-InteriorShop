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

            // --- SYSTEM PROMPT ---
            String promptContent = "Bạn là nhân viên tư vấn của NPH Store, một website bán đồ nội thất. " +
                    "Dưới đây là danh sách sản phẩm:\n" +
                    "--- KHO HÀNG ---\n" +
                    productContext +
                    "\n----------------\n" +
                    "QUY TẮC TRẢ LỜI QUAN TRỌNG:\n" +
                    "1. Format sản phẩm: [Tên sản phẩm](URL_Chi_Tiết) ![Giá_Gốc|Giá_Giảm](URL_Anh)\n" +
                    "2. Giữa các sản phẩm phải CÁCH NHAU 1 DÒNG TRỐNG.\n" +
                    "3. QUY TẮC KẾT HỢP KHO HÀNG (BẮT BUỘC):\n" +
                    "   - Khi khách hỏi tư vấn (ví dụ: 'nên mua A hay B?'), bạn hãy đưa ra lời khuyên ngắn gọn.\n" +
                    "   - NGAY SAU ĐÓ, bạn phải đối chiếu với [KHO HÀNG] ở trên:\n" +
                    "     + Nếu CÓ sản phẩm phù hợp: Hãy giới thiệu ngay (kèm link và ảnh).\n" +
                    "     + Nếu KHÔNG CÓ sản phẩm phù hợp trong kho: Bạn phải trả lời thật thà là 'Hiện tại shop chưa kinh doanh mặt hàng này' hoặc 'Hiện shop chưa có mẫu này'.\n" +
                    "   - TUYỆT ĐỐI KHÔNG đưa ra lời khuyên chung chung mà không thông báo tình trạng hàng hóa.\n" +
                    "4. Giọng điệu tự nhiên, không cần đánh số 1. 2. 3. nếu không cần thiết."+
                    "5. Với mỗi sản phẩm, trả về đúng định dạng sau:\n" +
                    "   [Tên sản phẩm](Link_Chi_Tiết) ![Giá_Gốc|Giá_Giảm](Link_Ảnh)\n" +
                    "   (Lưu ý: Trong dấu [] của ảnh, hãy điền Giá Gốc và Giá Giảm ngăn cách bởi dấu gạch đứng | )\n" +
                    "   Ví dụ: [Sofa Da](...) ![10.000.000đ|7.500.000đ](...)\n" +
                    "6. PHẠM VI KIẾN THỨC (CẦN PHÂN BIỆT RÕ):\n" +
                    "   - ĐƯỢC PHÉP: Bạn là chuyên gia nội thất. Hãy tự tin trả lời các câu hỏi về: so sánh chất liệu (gỗ, da, nỉ), cách vệ sinh, phong thủy cơ bản, cách bài trí...\n" +
                    "   - CẤM: Tuyệt đối KHÔNG trả lời các vấn đề: Viết code lập trình, giải toán học, chính trị, y tế, hoặc các vấn đề xã hội không liên quan nội thất.\n" +
                    "   - Nếu khách hỏi vấn đề BỊ CẤM -> Từ chối khéo.\n" +
                    "   - Nếu khách hỏi kiến thức nội thất -> Trả lời nhiệt tình + Gợi ý sản phẩm.\n" +
                    "7. XỬ LÝ CÂU HỎI CHUNG CHUNG / CỘC LỐC:\n" +
                    "   - Nếu khách nói ngắn gọn như 'Tư vấn đi', 'Alo', 'Cần giúp', 'Shop ơi'...\n" +
                    "   - KHÔNG ĐƯỢC từ chối. Hãy mặc định là khách muốn mua nội thất.\n" +
                    "   - HÃY CHỦ ĐỘNG hỏi ngược lại để khơi gợi nhu cầu.\n" +
                    "   - Ví dụ: 'Dạ chào anh/chị, mình đang muốn decor cho phòng khách, phòng ngủ hay phòng bếp ạ? Để em tìm mẫu phù hợp nhé!'\n"+
                    "8. QUY TẮC VỀ GIÁ & KHUYẾN MÃI (QUAN TRỌNG):\n" +
                    "   - Nếu khách hỏi 'có mã giảm giá', 'có sale không', 'bớt giá không', 'khuyến mãi':\n" +
                    "   - TUYỆT ĐỐI KHÔNG trả lời là 'không biết' hoặc 'không rành'. Điều này làm mất khách.\n" +
                    "   - HÃY KIỂM TRA KHO HÀNG: \n" +
                    "     + Nếu thấy sản phẩm có 2 mức giá (Giá Gốc | Giá Giảm): Hãy trả lời 'Dạ hiện bên em đang có giảm giá trực tiếp trên sản phẩm đấy ạ' và liệt kê ra.\n" +
                    "     + Nếu không có giảm giá: Hãy trả lời khéo léo: 'Dạ hiện tại bên em đang bán giá niêm yết tốt nhất thị trường rồi ạ, nhưng em có thể tư vấn mẫu phù hợp túi tiền cho mình nhé!'.\n";

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