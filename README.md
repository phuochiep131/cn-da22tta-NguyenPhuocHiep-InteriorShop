# Xây dựng website bán nội thất tích hợp AI chatbot tư vấn khách hàng
## Tác giả: Nguyễn Phước Hiệp - 110122005 - DA22TTA
## Email: nphhiep1301@gmail.com

## 🛠️ Cấu hình & Cài đặt (Configuration & Installation)

## 2. Cấu hình Backend# 🛋️ Xây dựng website bán nội thất tích hợp AI chatbot tư vấn khách hàng

> Đồ án chuyên ngành: Xây dựng hệ thống thương mại điện tử nội thất với sự hỗ trợ của AI Chatbot.

## 👨‍💻 Thông tin tác giả
- **Họ và tên:** Nguyễn Phước Hiệp
- **MSSV:** 110122005
- **Lớp:** DA22TTA
- **Email:** [nphhiep1301@gmail.com](mailto:nphhiep1301@gmail.com)

---

## 🚀 Giới thiệu
Dự án là một website bán hàng nội thất trực tuyến đầy đủ tính năng, tích hợp:
1.  **AI Chatbot:** Hỗ trợ tư vấn khách hàng tự động.
2.  **Thanh toán Online:** Tích hợp cổng thanh toán VNPAY.
3.  **Quản lý:** Hệ thống Admin quản lý sản phẩm, đơn hàng và người dùng.

## 🛠️ Công nghệ sử dụng (Tech Stack)
- **Backend:** Java (Spring Boot), Hibernate, JPA.
- **Frontend:** ReactJS.
- **Database:** MySQL.
- **AI Integration:** OpenAI API.
- **Payment:** VNPAY Sandbox.

---

## ⚙️ Cấu hình (Configuration)

Trước khi chạy dự án, vui lòng thực hiện cấu hình các bước sau:

### 1. Cấu hình Backend (`/backend`)

**Bước 1: Setup Database**
1.  Mở **MySQL Workbench**.
2.  Tạo database mới tên là: `interior_shop`.

**Bước 2: Cập nhật `application.properties`**
Mở file `backend/src/main/resources/application.properties` và cập nhật:

```properties
# --- 1. CẤU HÌNH DATABASE ---
spring.datasource.url=jdbc:mysql://localhost:3306/interior_shop?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=YOUR_DB_PASSWORD

# --- 2. CẤU HÌNH MAIL (Gửi OTP/Thông báo) ---
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=YOUR_EMAIL@gmail.com
spring.mail.password=YOUR_APP_PASSWORD

# --- 3. CẤU HÌNH AI CHATBOT
openai.api.key=YOUR_OPENAI_API_KEY

# --- 4. CẤU HÌNH VNPAY PAYMENT ---
vnpay.tmn_code=YOUR_TMN_CODE
vnpay.hash_secret=YOUR_HASH_SECRET
vnpay.url=[https://sandbox.vnpayment.vn/paymentv2/vpcpay.html](https://sandbox.vnpayment.vn/paymentv2/vpcpay.html)
vnpay.return_url=http://localhost:3000/payment/result

### Bước 1: Setup Database
1. Mở hệ quản trị cơ sở dữ liệu (MySQL Workbench/phpMyAdmin).
2. Tạo một database mới (ví dụ tên là `interior_shop_db`).
3. (Tùy chọn) Nếu có file script SQL trong thư mục `database` hoặc `sql`, hãy import vào để có dữ liệu mẫu.

### Bước 2: Cấu hình `application.properties`
Mở file cấu hình tại: `backend/src/main/resources/application.properties` và cập nhật thông tin:

```properties
# Cấu hình Database
spring.datasource.url=jdbc:mysql://localhost:3306/TEN_DATABASE_CUA_BAN?useSSL=false&serverTimezone=UTC
spring.datasource.username=YOUR_DB_USERNAME (thường là root)
spring.datasource.password=YOUR_DB_PASSWORD

# Cấu hình JPA
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

# Cấu hình Mail
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=YOUR_EMAIL@gmail.com
spring.mail.password=YOUR_APP_PASSWORD

# Cấu hình API Key cho AI Chatbot
openai.api.key=YOUR_OPENAI_API_KEY
# hoặc
gemini.api.key=YOUR_GEMINI_API_KEY

# Cấu hình VNPAY
vnpay.tmn_code=YOUR_TMN_CODE
vnpay.hash_secret=YOUR_HASH_SECRET

