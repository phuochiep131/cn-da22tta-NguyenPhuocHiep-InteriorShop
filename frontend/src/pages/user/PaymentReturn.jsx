import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { message, Spin } from "antd";
import Cookies from "js-cookie";

const generateTransactionId = () => "TM" + Math.random().toString(36).substring(2, 12).toUpperCase();

export default function PaymentReturn() {
  const location = useLocation();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const hasFetched = useRef(false);
  const [loadingMessage, setLoadingMessage] = useState("Đang xử lý giao dịch...");
  const token = Cookies.get("jwt");

  const pendingOrder = JSON.parse(sessionStorage.getItem("pendingOrder") || "{}");

  const buildOrderPayload = () => {
    const { singleProduct, items, oldOrderIds, note, paymentMethod, couponId, quantity, shippingAddress } = pendingOrder;

    const productsToPay = [
      ...(items || []),
      ...(singleProduct ? [{ ...singleProduct, quantity: quantity || 1 }] : []),
    ];

    const totalPrice = productsToPay.reduce(
      (sum, item) =>
        sum +
        (item.subtotal || (item.product?.price || item.price) * (item.quantity || 1)),
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
        originalUnitPrice: item.originalUnitPrice || item.product?.price || item.price,
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
          setTimeout(() => navigate("/checkout", { state: pendingOrder }), 3000);
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

  return (
    <div className="w-full min-h-screen flex flex-col justify-center items-center bg-gray-100">
      {contextHolder}
      <Spin size="large" className="mb-4" />
      <h2 className="text-lg text-gray-700">{loadingMessage}</h2>
    </div>
  );
}
