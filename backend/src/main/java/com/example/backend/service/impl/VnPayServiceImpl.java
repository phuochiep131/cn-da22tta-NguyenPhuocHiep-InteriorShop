package com.example.backend.service.impl;

import com.example.backend.config.VnPayConfig;
import com.example.backend.service.VnPayService;
import com.example.backend.util.VnPayUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import jakarta.servlet.http.HttpServletRequest;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
@RequiredArgsConstructor
public class VnPayServiceImpl implements VnPayService {

    private final VnPayConfig vnPayConfig;

    @Override
    public String createPayment(int amount, String language, HttpServletRequest req) {
        String vnp_Version = "2.1.0";
        String vnp_Command = "pay";
        String orderType = "other";
        String vnp_TxnRef = UUID.randomUUID().toString().replace("-", ""); // tự sinh
        String vnp_IpAddr = req.getRemoteAddr();
        String vnp_TmnCode = vnPayConfig.getTmnCode();

        Map<String, String> params = new TreeMap<>();
        params.put("vnp_Version", vnp_Version);
        params.put("vnp_Command", vnp_Command);
        params.put("vnp_TmnCode", vnp_TmnCode);
        params.put("vnp_Amount", String.valueOf(amount * 100));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", vnp_TxnRef);
        params.put("vnp_OrderInfo", "Thanh toán đơn hàng " + vnp_TxnRef);
        params.put("vnp_OrderType", orderType);
        params.put("vnp_ReturnUrl", vnPayConfig.getReturnUrl());
        params.put("vnp_IpAddr", vnp_IpAddr);

        if (language != null && !language.isEmpty()) {
            params.put("vnp_Locale", language);
        } else {
            params.put("vnp_Locale", "vn");
        }

        Calendar cal = Calendar.getInstance(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        SimpleDateFormat fmt = new SimpleDateFormat("yyyyMMddHHmmss");
        params.put("vnp_CreateDate", fmt.format(cal.getTime()));
        cal.add(Calendar.MINUTE, 15);
        params.put("vnp_ExpireDate", fmt.format(cal.getTime()));

        try {
            String queryUrl = VnPayUtil.buildQuery(params);
            String vnp_SecureHash = VnPayUtil.hmacSHA512(vnPayConfig.getHashSecret(), queryUrl);
            return vnPayConfig.getPayUrl() + "?" + queryUrl + "&vnp_SecureHash=" + vnp_SecureHash;
        } catch (Exception e) {
            throw new RuntimeException("Error creating VNPAY URL", e);
        }
    }

    @Override
    public String processReturn(HttpServletRequest req) {
        try {
            // 1️⃣ Lấy query string nguyên bản
            String queryString = req.getQueryString(); // ví dụ: vnp_Amount=1000000&vnp_BankCode=NCB&...
            if (queryString == null) return "Invalid request";

            // 2️⃣ Tách params ra Map
            Map<String, String> params = new HashMap<>();
            String vnp_SecureHash = null;

            for (String param : queryString.split("&")) {
                String[] pair = param.split("=", 2);
                String key = pair[0];
                String value = pair.length > 1 ? pair[1] : "";
                if ("vnp_SecureHash".equals(key)) {
                    vnp_SecureHash = value;
                } else {
                    params.put(key, value);
                }
            }

            // 3️⃣ Sắp xếp alphabet
            Map<String, String> sortedFields = new TreeMap<>(params);

            // 4️⃣ Build hash string (giữ nguyên URL-encoded)
            StringBuilder hashData = new StringBuilder();
            Iterator<Map.Entry<String, String>> itr = sortedFields.entrySet().iterator();
            while (itr.hasNext()) {
                Map.Entry<String, String> e = itr.next();
                hashData.append(e.getKey());
                hashData.append('=');
                hashData.append(e.getValue());
                if (itr.hasNext()) {
                    hashData.append('&');
                }
            }

            // 5️⃣ Tính HMAC SHA512
            String expectedHash = VnPayUtil.hmacSHA512(vnPayConfig.getHashSecret(), hashData.toString());

            // 6️⃣ So sánh
            if (!expectedHash.equals(vnp_SecureHash)) {
                return "Invalid signature";
            }

            // 7️⃣ Kiểm tra kết quả
            String responseCode = sortedFields.get("vnp_ResponseCode");
            String transactionStatus = sortedFields.get("vnp_TransactionStatus");
            String txnRef = sortedFields.get("vnp_TxnRef");
            String amount = sortedFields.get("vnp_Amount");

            if ("00".equals(responseCode) && "00".equals(transactionStatus)) {
                return "Thanh toán thành công. Mã đơn hàng: " + txnRef + ", Số tiền: " + amount;
            } else {
                return "Thanh toán thất bại. Mã đơn hàng: " + txnRef;
            }

        } catch (Exception e) {
            e.printStackTrace();
            return "Lỗi xử lý thanh toán: " + e.getMessage();
        }
    }

}
