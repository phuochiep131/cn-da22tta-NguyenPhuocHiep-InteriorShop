package com.example.backend.service.impl;

import com.example.backend.model.Order;
import com.example.backend.model.OrderDetail;
import com.example.backend.repository.OrderRepository;
import com.example.backend.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailServiceImpl implements EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private OrderRepository orderRepository;

    @Override
    @Async // Gửi email bất đồng bộ để không làm chậm phản hồi API
    public void sendInvoiceEmail(String orderId, String toEmail) {
        try {
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found"));

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("Hóa đơn đơn hàng #" + orderId + " - Shopper Store");

            // Tạo nội dung HTML
            StringBuilder content = new StringBuilder();
            content.append("<h1>Cảm ơn bạn đã mua hàng!</h1>");
            content.append("<p>Mã đơn hàng: <b>").append(orderId).append("</b></p>");
            content.append("<p>Địa chỉ nhận hàng: ").append(order.getShippingAddress()).append("</p>");

            content.append("<table border='1' style='border-collapse: collapse; width: 100%;'>");
            content.append("<tr><th>Sản phẩm</th><th>Số lượng</th><th>Đơn giá</th></tr>");

            for (OrderDetail detail : order.getOrderDetails()) {
                content.append("<tr>")
                        .append("<td style='padding: 8px;'>").append(detail.getProduct().getProductName()).append("</td>")
                        .append("<td style='padding: 8px;'>").append(detail.getQuantity()).append("</td>")
                        .append("<td style='padding: 8px;'>").append(String.format("%,.0f", detail.getUnitPrice())).append(" ₫</td>")
                        .append("</tr>");
            }
            content.append("</table>");
            content.append("<h3>Tổng cộng: ").append(String.format("%,.0f", order.getTotalAmount())).append(" ₫</h3>");

            helper.setText(content.toString(), true);
            mailSender.send(message);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}