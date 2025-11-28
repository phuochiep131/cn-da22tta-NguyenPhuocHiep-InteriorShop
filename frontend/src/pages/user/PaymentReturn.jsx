import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { message } from "antd";
import { CheckCircle, XCircle, Loader2, ShieldCheck } from "lucide-react"; // Import thêm icons
import Cookies from "js-cookie";

const generateTransactionId = () =>
  "TM" + Math.random().toString(36).substring(2, 12).toUpperCase();

export default function PaymentReturn() {
  const location = useLocation();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const hasFetched = useRef(false);
  const [loadingMessage, setLoadingMessage] = useState("Đang xử lý giao dịch...");
  const token = Cookies.get("jwt");

  // Lấy mã giao dịch từ URL để hiển thị cho đẹp (Logic UI only)
  const queryParams = new URLSearchParams(location.search);
  const vnpTransactionNo = queryParams.get("vnp_TransactionNo");

  const pendingOrder = JSON.parse(
    sessionStorage.getItem("pendingOrder") || "{}"
  );

  const buildOrderPayload = () => {
    const {
      singleProduct,
      items,
      oldOrderIds,
      note,
      paymentMethod,
      couponId,
      quantity,
      shippingAddress,
    } = pendingOrder;

    const productsToPay = [
      ...(items || []),
      ...(singleProduct
        ? [{ ...singleProduct, quantity: quantity || 1 }]
        : []),
    ];

    const totalPrice = productsToPay.reduce(
      (sum, item) =>
        sum +
        (item.subtotal ||
          (item.product?.price || item.price) * (item.quantity || 1)),
      0
    );

    return {
      userId: Cookies.get("user_id"),
      paymentMethodId: paymentMethod,
      shippingAddress: shippingAddress || "",
      customerNote: note || "",
      orderDate: new Date().toISOString(),
      couponId: couponId ? parseInt(couponId) : null,
      totalAmount: totalPrice,
      isOrder: true,
      orderStatus: "pending",
      orderDetails: productsToPay.map((item) => ({
        product: { productId: item.product?.productId || item.productId },
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || item.product?.price || item.price,
        originalUnitPrice:
          item.originalUnitPrice || item.product?.price || item.price,
      })),
      oldOrderIds: oldOrderIds || [],
    };
  };

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const queryParams = new URLSearchParams(location.search);
    const transactionIdFromVNPAY = queryParams.get("vnp_TransactionNo");
    const responseCode = queryParams.get("vnp_ResponseCode");

    if (!responseCode) {
      messageApi.error("Không tìm thấy dữ liệu giao dịch!");
      setTimeout(() => navigate("/checkout", { state: pendingOrder }), 3000);
      return;
    }

    const fetchPaymentResult = async () => {
      try {
        if (responseCode !== "00") {
          messageApi.error("Thanh toán thất bại!");
          setLoadingMessage("Thanh toán thất bại! Quay về checkout...");
          setTimeout(
            () => navigate("/checkout", { state: pendingOrder }),
            3000
          );
          return;
        }

        setLoadingMessage("Thanh toán thành công! Đang lưu đơn hàng...");
        const payload = buildOrderPayload();

        const orderPayload = {
          ...payload,
          transactionId: transactionIdFromVNPAY || generateTransactionId(),
        };

        let orderRes;
        if (pendingOrder.oldOrderIds?.length) {
          orderRes = await fetch("http://localhost:8080/api/orders/replace", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(orderPayload),
          });
        } else {
          orderRes = await fetch("http://localhost:8080/api/orders", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(orderPayload),
          });
        }

        if (!orderRes.ok) {
          const errText = await orderRes.text();
          console.error("Order error:", errText);
          throw new Error("Không thể lưu đơn hàng vào DB");
        }

        const orderData = await orderRes.json();
        const createdOrderId = orderData.orderId;

        const paymentPayload = {
          orderId: createdOrderId,
          paymentMethodId: "PM002",
          transactionId: transactionIdFromVNPAY,
          amount: payload.totalAmount,
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

        sessionStorage.removeItem("pendingOrder");

        messageApi.success("Thanh toán thành công!");
        messageApi.success("Đặt hàng thành công!");
        setTimeout(() => navigate("/purchase"), 2000);
      } catch (err) {
        console.error(err);
        messageApi.error("Thanh toán thành công nhưng lưu dữ liệu thất bại!");
        setLoadingMessage("Lỗi khi lưu đơn! Quay về checkout...");
        setTimeout(() => navigate("/checkout", { state: pendingOrder }), 3000);
      }
    };

    fetchPaymentResult();
  }, []);

  // Helper xác định trạng thái UI dựa trên text loadingMessage
  const getStatusUI = () => {
    const msg = loadingMessage.toLowerCase();
    if (msg.includes("thất bại") || msg.includes("lỗi")) {
      return {
        icon: <XCircle className="w-16 h-16 text-red-500 mb-4" />,
        color: "text-red-600",
        subText: "Vui lòng kiểm tra lại thông tin thanh toán.",
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
        <div className="flex justify-center">
          {statusUI.icon}
        </div>

        <h2 className={`text-xl font-bold mb-2 ${statusUI.color}`}>
          {loadingMessage}
        </h2>

        <p className="text-gray-500 mb-6 text-sm">
          {statusUI.subText}
        </p>

        {vnpTransactionNo && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Mã giao dịch VNPAY</p>
            <p className="font-mono font-medium text-gray-700 break-all">{vnpTransactionNo}</p>
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