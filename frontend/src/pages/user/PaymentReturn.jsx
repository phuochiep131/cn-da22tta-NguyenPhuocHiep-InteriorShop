import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { message } from "antd";
import { CheckCircle, XCircle, Loader2, ShieldCheck } from "lucide-react";
import Cookies from "js-cookie";
import { AuthContext } from "../../context/AuthContext";
import { sendInvoiceEmail } from "../EmailService"; 

const generateTransactionId = () =>
  "TM" + Math.random().toString(36).substring(2, 12).toUpperCase();

export default function PaymentReturn() {
  const location = useLocation();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const hasFetched = useRef(false);
  const [loadingMessage, setLoadingMessage] = useState(
    "Đang xử lý giao dịch..."
  );
  const token = Cookies.get("jwt");

  // Lấy mã giao dịch từ URL
  const queryParams = new URLSearchParams(location.search);
  const vnpTransactionNo = queryParams.get("vnp_TransactionNo");

  // [QUAN TRỌNG] Lấy dữ liệu đã được build sẵn từ Checkout
  const pendingOrder = JSON.parse(
    sessionStorage.getItem("pendingOrder") || "{}"
  );

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const queryParams = new URLSearchParams(location.search);
    const transactionIdFromVNPAY = queryParams.get("vnp_TransactionNo");
    const responseCode = queryParams.get("vnp_ResponseCode");

    if (!responseCode) {
      messageApi.error("Không tìm thấy dữ liệu giao dịch!");
      setTimeout(() => navigate("/checkout"), 3000); // Quay về checkout nếu lỗi
      return;
    }

    const fetchPaymentResult = async () => {
      try {
        if (responseCode !== "00") {
          messageApi.error("Thanh toán thất bại!");
          setLoadingMessage("Thanh toán thất bại! Quay về checkout...");
          setTimeout(() => navigate("/checkout"), 3000);
          return;
        }

        // Kiểm tra xem dữ liệu trong Session có hợp lệ không
        if (!pendingOrder || !pendingOrder.orderDetails) {
          throw new Error("Mất dữ liệu đơn hàng (Session expired).");
        }

        setLoadingMessage("Thanh toán thành công! Đang lưu đơn hàng...");

        // [SỬA ĐỔI] Sử dụng trực tiếp pendingOrder từ Checkout, không build lại
        const orderPayload = {
          ...pendingOrder,
          transactionId: transactionIdFromVNPAY || generateTransactionId(),
          // Đảm bảo status là pending khi lưu
          orderStatus: "pending",
        };

        // Gọi API tạo đơn hàng
        let orderRes;
        const apiEndpoint = pendingOrder.oldOrderIds?.length
          ? "http://localhost:8080/api/orders/replace"
          : "http://localhost:8080/api/orders";

        orderRes = await fetch(apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(orderPayload),
        });

        if (!orderRes.ok) {
          const errText = await orderRes.text();
          console.error("Order error:", errText);
          throw new Error("Không thể lưu đơn hàng vào DB");
        }

        const orderData = await orderRes.json();
        const createdOrderId = orderData.orderId;

        // Gọi API lưu thanh toán
        // [SỬA ĐỔI] Lấy totalAmount từ pendingOrder (đã trừ voucher ở Checkout)
        const paymentPayload = {
          orderId: createdOrderId,
          paymentMethodId: "PM002",
          transactionId: transactionIdFromVNPAY,
          amount: pendingOrder.totalAmount,
          paymentStatus: "Completed",
        };

        const payRes = await fetch("http://localhost:8080/api/payments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(paymentPayload),
        });

        if (!payRes.ok) {
          const errText = await payRes.text();
          console.error("Payment error:", errText);
          throw new Error("Không thể lưu giao dịch Payment!");
        }

        // Xóa session sau khi thành công
        sessionStorage.removeItem("pendingOrder");

        messageApi.success("Thanh toán thành công!");
        messageApi.success("Đặt hàng thành công!");        
        await sendInvoiceEmail(createdOrderId);
        setTimeout(() => navigate("/purchase"), 2000);
      } catch (err) {
        console.error(err);
        messageApi.error(`Lỗi: ${err.message}`);
        setLoadingMessage("Lỗi xử lý! Vui lòng liên hệ CSKH hoặc thử lại.");
        // Không navigate về checkout ngay để user đọc lỗi, hoặc tùy logic của bạn
      }
    };

    fetchPaymentResult();
  }, []);

  // UI Helper
  const getStatusUI = () => {
    const msg = loadingMessage.toLowerCase();
    if (msg.includes("thất bại") || msg.includes("lỗi")) {
      return {
        icon: <XCircle className="w-16 h-16 text-red-500 mb-4" />,
        color: "text-red-600",
        subText: "Vui lòng kiểm tra lại thông tin hoặc liên hệ hỗ trợ.",
      };
    }
    if (msg.includes("thành công")) {
      return {
        icon: <CheckCircle className="w-16 h-16 text-green-500 mb-4" />,
        color: "text-green-600",
        subText: "Giao dịch đã được ghi nhận.",
      };
    }
    return {
      icon: <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-4" />,
      color: "text-blue-600",
      subText: "Vui lòng không tắt trình duyệt...",
    };
  };

  const statusUI = getStatusUI();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {contextHolder}

      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-gray-100">
        <div className="flex justify-center">{statusUI.icon}</div>

        <h2 className={`text-xl font-bold mb-2 ${statusUI.color}`}>
          {loadingMessage}
        </h2>

        <p className="text-gray-500 mb-6 text-sm">{statusUI.subText}</p>

        {vnpTransactionNo && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
              Mã giao dịch VNPAY
            </p>
            <p className="font-mono font-medium text-gray-700 break-all">
              {vnpTransactionNo}
            </p>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <ShieldCheck className="w-4 h-4" />
          <span>Giao dịch được bảo mật an toàn</span>
        </div>
      </div>
    </div>
  );
}
