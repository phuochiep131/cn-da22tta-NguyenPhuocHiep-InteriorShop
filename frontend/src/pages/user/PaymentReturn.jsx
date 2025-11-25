import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { message, Spin } from "antd";
import Cookies from "js-cookie";

export default function PaymentReturn() {
  const location = useLocation();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const hasFetched = useRef(false);
  const [loadingMessage, setLoadingMessage] = useState("Đang xử lý giao dịch...");

  const token = Cookies.get("jwt");

  const pendingOrder = JSON.parse(
    sessionStorage.getItem("pendingOrder") || "{}"
  );

  // --- Build lại orderPayload ---
  const buildOrderPayload = () => {
    const {
      singleProduct,
      items,
      oldOrderIds,
      note,
      paymentMethod,
      couponId,
      quantity,
      shippingAddress
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
        product: {
          productId: item.product?.productId || item.productId,
        },
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || item.product?.price || item.price,
        originalUnitPrice:
          item.originalUnitPrice ||
          item.product?.price ||
          item.price,
      })),
      oldOrderIds: oldOrderIds || [],
    };
  };

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

        // === Thành công ===
        if (data.success) {
          setLoadingMessage("Thanh toán thành công! Đang lưu đơn hàng...");

          try {
            const payload = buildOrderPayload();

            let orderRes;

            if (pendingOrder.oldOrderIds?.length) {
              orderRes = await fetch("http://localhost:8080/api/orders/replace", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
              });
            } else {
              orderRes = await fetch("http://localhost:8080/api/orders", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
              });
            }

            if (!orderRes.ok) {
              throw new Error("Không thể lưu đơn hàng vào DB");
            }

            // xoá pendingOrder
            sessionStorage.removeItem("pendingOrder");

            messageApi.success("Thanh toán thành công!");
            messageApi.success("Đặt hàng thành công!");
            setTimeout(() => navigate("/purchase"), 2000);
          } catch (err) {
            console.error(err);
            messageApi.error("Thanh toán thành công nhưng lưu đơn thất bại!");
            setLoadingMessage("Lỗi khi lưu đơn! Quay về checkout...");
            setTimeout(() => navigate("/checkout", { state: pendingOrder }), 3000);
          }

          return;
        }

        // === Thất bại ===
        messageApi.error(`Thanh toán thất bại!`);
        setLoadingMessage("Thanh toán thất bại! Quay về checkout...");
        setTimeout(() => navigate("/checkout", { state: pendingOrder }), 3000);
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
