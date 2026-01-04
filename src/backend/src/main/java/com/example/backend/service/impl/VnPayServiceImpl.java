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
        params.put("vnp_Amount", String.valueOf(amount * 100)); // gửi nguyên số tiền *100
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
    public Map<String, Object> processReturn(HttpServletRequest req) {
        Map<String, Object> result = new HashMap<>();
        try {
            String queryString = req.getQueryString();
            if (queryString == null || queryString.isEmpty()) {
                result.put("success", false);
                result.put("message", "Invalid request");
                return result;
            }

            Map<String, String> fields = new HashMap<>();
            String vnp_SecureHash = null;
            for (String part : queryString.split("&")) {
                String[] kv = part.split("=", 2);
                if (kv[0].equals("vnp_SecureHash")) vnp_SecureHash = kv[1];
                else fields.put(kv[0], kv.length > 1 ? kv[1] : "");
            }

            Map<String, String> sorted = new TreeMap<>(fields);
            StringBuilder hashData = new StringBuilder();
            Iterator<Map.Entry<String, String>> it = sorted.entrySet().iterator();
            while (it.hasNext()) {
                Map.Entry<String, String> e = it.next();
                hashData.append(e.getKey()).append("=").append(e.getValue());
                if (it.hasNext()) hashData.append("&");
            }

            String calculatedHash = VnPayUtil.hmacSHA512(vnPayConfig.getHashSecret(), hashData.toString());
            if (!calculatedHash.equalsIgnoreCase(vnp_SecureHash)) {
                result.put("success", false);
                result.put("message", "Invalid signature");
                return result;
            }

            String vnp_ResponseCode = sorted.get("vnp_ResponseCode");
            String vnp_TransactionStatus = sorted.get("vnp_TransactionStatus");
            String vnp_TxnRef = sorted.get("vnp_TxnRef");
            String vnp_Amount = sorted.get("vnp_Amount");

            boolean success = "00".equals(vnp_ResponseCode) && "00".equals(vnp_TransactionStatus);
            result.put("success", success);
            result.put("txnRef", vnp_TxnRef);
            result.put("amount", Long.parseLong(vnp_Amount) / 100); // hiển thị đúng VND
            result.put("message", success ? "Thanh toán thành công!" : "Thanh toán thất bại!");
            return result;
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Lỗi xử lý thanh toán: " + e.getMessage());
            return result;
        }
    }
}

