import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { message, Spin } from "antd";
import Cookies from "js-cookie";

export default function PaymentReturn() {
  const location = useLocation();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const hasFetched = useRef(false);
  const [loadingMessage, setLoadingMessage] = useState(
    "Đang xử lý giao dịch..."
  );

  const token = Cookies.get("jwt");

  const pendingOrder = JSON.parse(
    sessionStorage.getItem("pendingOrder") || "{}"
  );

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const query = location.search.substring(1);
    if (!query) {
      messageApi.error("Không tìm thấy dữ liệu giao dịch!");
      setTimeout(() => navigate("/checkout", { state: pendingOrder }), 3000);
      return;
    }

    const fetchPaymentResult = async () => {
      try {
        const res = await fetch(
          `http://localhost:8080/api/vnpay/return?${query}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!res.ok) throw new Error("Không thể kết nối đến VNPAY");
        const data = await res.json();

        if (data.success) {
          sessionStorage.removeItem("pendingOrder");
          messageApi.success(`Thanh toán thành công! Mã đơn: ${data.txnRef}`);
          setLoadingMessage("Thanh toán thành công! Chuyển hướng...");
          setTimeout(() => navigate("/purchase"), 3000);
        } else {
          messageApi.error(`Thanh toán thất bại! Mã đơn: ${data.txnRef}`);
          setLoadingMessage("Thanh toán thất bại! Quay về checkout...");
          setTimeout(() => navigate("/checkout", { state: pendingOrder }), 3000);
        }
      } catch (err) {
        console.error(err);
        messageApi.error("Lỗi kết nối đến máy chủ!");
        setLoadingMessage("Có lỗi xảy ra! Quay về checkout...");
        setTimeout(() => navigate("/checkout", { state: pendingOrder }), 3000);
      }
    };

    fetchPaymentResult();
  }, []);

  return (
    <div className="w-full min-h-screen flex flex-col justify-center items-center bg-gray-100">
      {contextHolder}
      <Spin size="large" className="mb-4" />
      <h2 className="text-lg text-gray-700">{loadingMessage}</h2>
    </div>
  );
}
