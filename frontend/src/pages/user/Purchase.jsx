import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { message } from "antd";
import nothingImg from "../../assets/nothing.png";

export default function Purchase() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");

  const tabs = [
    { key: "all", label: "Tất cả" },
    { key: "pending", label: "Chờ xác nhận" },
    { key: "processing", label: "Vận chuyển" },
    { key: "shipping", label: "Chờ giao hàng" },
    { key: "delivered", label: "Đã vận chuyển" },
    { key: "cancelled", label: "Đã hủy" },
  ];

  const statusLabels = {
    pending: "Chờ xác nhận",
    processing: "Vận chuyển",
    shipping: "Chờ giao hàng",
    delivered: "Đã vận chuyển",
    cancelled: "Đã hủy",
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = Cookies.get("jwt");
        const userId = Cookies.get("user_id");

        if (!token || !userId) {
          message.error("Bạn cần đăng nhập lại.");
          return;
        }

        const res = await fetch(
          `http://localhost:8080/api/orders/user/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!res.ok) throw new Error("Không thể tải danh sách đơn hàng");

        const data = await res.json();
        setOrders(data); // backend đã trả về sẵn list OrderDTO
      } catch (err) {
        message.error(err.message);
      }
    };

    fetchData();
  }, []);

  const filteredOrders =
    filter === "all"
      ? orders
      : orders.filter(
          (o) =>
            (o.orderStatus || "pending").toLowerCase() === filter.toLowerCase()
        );

  return (
    <div className="max-w-4xl mx-auto mt-6 pb-6">
      {/* Tabs */}
      <div className="flex border-b mb-4 text-[15px] font-medium">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`flex-1 text-center px-6 py-3 border-b-2 whitespace-nowrap ${
              filter === t.key
                ? "border-red-500 text-red-500"
                : "border-transparent text-gray-600 hover:text-black"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Empty */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-10">
          <img src={nothingImg} className="w-32 h-32 mb-4" alt="empty" />
          <p className="text-gray-500">Không có đơn hàng nào.</p>
        </div>
      ) : (
        filteredOrders.map((order) => (
          <div
            key={order.orderId}
            className="bg-white rounded-lg shadow-sm border mb-6"
          >
            {/* Header */}
            <div className="flex items-center justify-end px-5 py-3 border-b bg-[#fafafa]">
              <div className="flex items-center gap-2 text-green-600 text-[14px] font-medium">
                🚚 {statusLabels[order.orderStatus] || "Đang xử lý"}
              </div>
            </div>

            {/* Products */}
            {order.orderDetails.map((item) => (
              <div
                key={item.orderDetailId}
                className="flex items-center gap-4 px-5 py-4 border-b"
              >
                <img
                  src={item.product.imageUrl}
                  alt={item.product.productName}
                  className="w-20 h-20 rounded-lg border object-cover"
                />
                <div className="flex flex-col">
                  <p className="font-medium text-[15px]">
                    {item.product.productName}
                  </p>
                  <p className="text-sm text-gray-500">
                    Số lượng: {item.quantity}
                  </p>
                </div>
              </div>
            ))}

            {/* Tổng tiền */}
            <div className="flex justify-end items-center px-3 py-3 text-[15px]">
              Thành tiền:
              <span className="ml-2 text-red-600 font-bold text-[22px]">
                {order.totalAmount.toLocaleString()}₫
              </span>
            </div>

            {/* Nút */}
            <div className="flex justify-end gap-3 px-5 py-4">
              {/* Nút hủy đơn — chỉ cho phép nếu đang chờ xử lý */}
              <button
                disabled={order.orderStatus !== "pending"}
                className={`px-6 py-2 rounded-lg text-sm border ${
                  order.orderStatus === "pending"
                    ? "border-red-500 text-red-500 hover:bg-red-50"
                    : "border-gray-300 text-gray-400 cursor-not-allowed"
                }`}
              >
                Hủy Đơn
              </button>

              {order.orderStatus === "delivered" && (
                <button className="px-8 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm">
                  Mua Lại
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
