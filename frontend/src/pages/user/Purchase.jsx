import { useEffect, useState, useContext, useRef } from "react";
import Cookies from "js-cookie";
import { message, Modal, Input, Divider, Tag } from "antd"; // Import thêm Divider, Tag cho Modal đẹp
import { CartContext } from "../../context/CartContext";
import nothingImg from "../../assets/nothing.png";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  ShoppingBag,
  RefreshCw,
  MapPin, // Icon địa chỉ
  CreditCard, // Icon thanh toán
} from "lucide-react";

export default function Purchase() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const { refreshCartCount } = useContext(CartContext);
  const [loading, setLoading] = useState(true);

  // --- STATE CHO MODAL CHI TIẾT ---
  const [detailOrder, setDetailOrder] = useState(null); // Lưu đơn hàng đang xem
  const [isDetailOpen, setIsDetailOpen] = useState(false); // Bật/tắt modal

  // Hook Antd
  const [modal, modalContextHolder] = Modal.useModal();
  const [messageApi, messageContextHolder] = message.useMessage();

  const cancelReasonRef = useRef("");

  const tabs = [
    { key: "all", label: "Tất cả" },
    { key: "pending", label: "Chờ xác nhận" },
    { key: "processing", label: "Đang xử lý" },
    { key: "shipping", label: "Đang giao" },
    { key: "delivered", label: "Hoàn thành" },
    { key: "cancelled", label: "Đã hủy" },
  ];

  const getStatusConfig = (status) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "pending":
        return {
          color: "text-orange-600 bg-orange-50 border-orange-200",
          icon: <Clock size={16} />,
          label: "Chờ xác nhận",
        };
      case "processing":
        return {
          color: "text-blue-600 bg-blue-50 border-blue-200",
          icon: <Package size={16} />,
          label: "Đang xử lý",
        };
      case "shipping":
        return {
          color: "text-indigo-600 bg-indigo-50 border-indigo-200",
          icon: <Truck size={16} />,
          label: "Đang giao hàng",
        };
      case "delivered":
        return {
          color: "text-green-600 bg-green-50 border-green-200",
          icon: <CheckCircle size={16} />,
          label: "Giao thành công",
        };
      case "cancelled":
        return {
          color: "text-red-600 bg-red-50 border-red-200",
          icon: <XCircle size={16} />,
          label: "Đã hủy",
        };
      default:
        return {
          color: "text-gray-600 bg-gray-50 border-gray-200",
          icon: <Clock size={16} />,
          label: "Chờ xác nhận",
        };
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = Cookies.get("jwt");
      const userId = Cookies.get("user_id");

      if (!token || !userId) return;

      const res = await fetch(
        `http://localhost:8080/api/orders/user/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) throw new Error("Không thể tải danh sách đơn hàng");

      const data = await res.json();
      const sortedData = data.sort((a, b) =>
        b.orderId.localeCompare(a.orderId)
      );

      setOrders(sortedData);
      await refreshCartCount(userId, token);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- HÀM MỞ MODAL CHI TIẾT ---
  const handleOpenDetail = (order) => {
    setDetailOrder(order);
    setIsDetailOpen(true);
  };

  const handleCancelOrder = (order) => {
    const isPrepaid =
      order.payment && order.payment.paymentStatus === "Completed";
    cancelReasonRef.current = "";

    const contentNode = (
      <div>
        <p className="mb-2">
          {isPrepaid
            ? "Đơn hàng này đã được thanh toán. Sau khi hủy, hệ thống sẽ gửi yêu cầu hoàn tiền cho Admin (3-5 ngày làm việc). Bạn có chắc chắn?"
            : "Bạn có chắc chắn muốn hủy đơn hàng này không?"}
        </p>
        <Input
          placeholder="Nhập lý do hủy (tùy chọn)..."
          onChange={(e) => {
            cancelReasonRef.current = e.target.value;
          }}
        />
      </div>
    );

    modal.confirm({
      title: (
        <span className="text-red-600 font-bold">Xác nhận hủy đơn hàng</span>
      ),
      content: contentNode,
      okText: "Đồng ý hủy",
      okType: "danger",
      cancelText: "Đóng",
      onOk: async () => {
        try {
          const token = Cookies.get("jwt");
          const res = await fetch(
            `http://localhost:8080/api/orders/${order.orderId}/cancel`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                reason: cancelReasonRef.current || "Khách hàng hủy",
              }),
            }
          );

          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.message || "Hủy đơn thất bại");
          }

          messageApi.success(
            isPrepaid
              ? "Đã gửi yêu cầu hoàn tiền thành công!"
              : "Hủy đơn hàng thành công!"
          );
          fetchData();
        } catch (err) {
          messageApi.error(err.message);
        }
      },
    });
  };

  const filteredOrders =
    filter === "all"
      ? orders
      : orders.filter(
          (o) =>
            (o.orderStatus || "Pending").toLowerCase() === filter.toLowerCase()
        );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      {modalContextHolder}
      {messageContextHolder}

      <div className="max-w-5xl mx-auto">
        {/* Page Title */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-red-100 text-red-600 rounded-full">
            <ShoppingBag size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Lịch sử đơn hàng</h1>
        </div>

        {/* Tabs */}
        <div className="sticky top-0 z-10 bg-gray-50 pt-2 pb-6">
          <div className="flex overflow-x-auto pb-2 scrollbar-hide gap-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border ${
                  filter === t.key
                    ? "bg-red-600 text-white border-red-600 shadow-md shadow-red-200"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin text-red-600">
              <RefreshCw size={32} />
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredOrders.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <img
              src={nothingImg}
              className="w-40 h-40 mx-auto mb-6 opacity-80"
              alt="empty"
            />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Chưa có đơn hàng nào
            </h3>
            <button className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors">
              Tiếp tục mua sắm
            </button>
          </div>
        )}

        {/* Orders List */}
        <div className="space-y-6">
          {!loading &&
            filteredOrders.map((order) => {
              const statusConfig = getStatusConfig(order.orderStatus);
              const canCancel =
                (order.orderStatus || "").toLowerCase() === "pending";

              return (
                <div
                  key={order.orderId}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300"
                >
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-gray-50 flex flex-wrap gap-4 justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold text-gray-900">
                        Mã đơn: #{order.orderId}
                      </span>
                      <span className="hidden sm:inline text-gray-300">|</span>
                      <span className="text-sm text-gray-500">
                        {new Date(order.orderDate).toLocaleString("vi-VN")}
                      </span>
                    </div>
                    <div
                      className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${statusConfig.color}`}
                    >
                      {statusConfig.icon}
                      <span className="uppercase">{statusConfig.label}</span>
                    </div>
                  </div>

                  {/* Products */}
                  <div className="divide-y divide-gray-50">
                    {order.orderDetails.map((item) => (
                      <div
                        key={item.orderDetailId}
                        className="p-6 flex flex-col sm:flex-row gap-4 sm:items-center group"
                      >
                        <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                          <img
                            src={item.product?.imageUrl || nothingImg}
                            alt={item.product?.productName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-base mb-1 line-clamp-2">
                            {item.product?.productName}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Số lượng: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right sm:text-right">
                          <div className="font-medium text-gray-900">
                            {(item.unitPrice * item.quantity).toLocaleString()}₫
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-5 bg-gray-50/30 border-t border-gray-100 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-gray-700">
                        <span className="text-sm">Tổng tiền:</span>
                        <span className="text-xl font-bold text-red-600">
                          {order.totalAmount.toLocaleString()}₫
                        </span>
                      </div>
                      {order.payment && (
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded w-fit ${
                            order.payment.paymentStatus === "Completed"
                              ? "bg-green-100 text-green-700"
                              : order.payment.paymentStatus === "Refund_Pending"
                              ? "bg-purple-100 text-purple-700"
                              : order.payment.paymentStatus === "Refunded"
                              ? "bg-pink-100 text-pink-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {order.payment.paymentStatus === "Completed"
                            ? "Đã thanh toán"
                            : order.payment.paymentStatus === "Refund_Pending"
                            ? "Chờ hoàn tiền"
                            : order.payment.paymentStatus === "Refunded"
                            ? "Đã hoàn tiền"
                            : "Chưa thanh toán"}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-3 w-full sm:w-auto">
                      {/* Nút Hủy Đơn */}
                      {canCancel && (
                        <button
                          onClick={() => handleCancelOrder(order)}
                          className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg border border-red-200 text-red-600 font-medium hover:bg-red-50 transition-colors"
                        >
                          Hủy đơn
                        </button>
                      )}

                      {/* Nút Chi Tiết (Luôn hiện để User xem lại) */}
                      <button
                        onClick={() => handleOpenDetail(order)} // Gắn hàm mở Modal
                        className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                      >
                        Chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* --- MODAL CHI TIẾT ĐƠN HÀNG --- */}
      <Modal
        title={
          <span className="text-lg font-bold text-gray-800">
            Thông tin đơn hàng
          </span>
        }
        open={isDetailOpen}
        onCancel={() => setIsDetailOpen(false)}
        footer={null} // Không cần nút footer mặc định
        width={700}
        centered
      >
        {detailOrder && (
          <div className="pt-2">
            {/* 1. Header Modal */}
            <div className="flex justify-between items-start mb-6 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">
                  Mã đơn hàng
                </p>
                <p className="font-mono font-bold text-gray-800 text-lg">
                  #{detailOrder.orderId}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase mb-1">
                  Ngày đặt hàng
                </p>
                <p className="font-medium text-gray-700">
                  {new Date(detailOrder.orderDate).toLocaleString("vi-VN")}
                </p>
              </div>
            </div>

            {/* 2. Địa chỉ & Thanh toán */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
                  <MapPin size={16} className="text-red-500" /> Địa chỉ nhận
                  hàng
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed bg-white border border-gray-100 p-3 rounded-lg shadow-sm">
                  {detailOrder.shippingAddress}
                </p>
                {detailOrder.customerNote && (
                  <div className="mt-2 text-sm text-red-500 italic">
                    *Ghi chú: {detailOrder.customerNote}
                  </div>
                )}
              </div>

              <div>
                <h4 className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
                  <CreditCard size={16} className="text-blue-500" /> Thanh toán
                </h4>
                <div className="flex flex-col gap-2">
                  {/* 1. PHƯƠNG THỨC THANH TOÁN */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Phương thức:</span>
                    <span className="font-medium">
                      {detailOrder.paymentMethodId === "PM001"
                        ? "COD (Thanh toán khi nhận hàng)"
                        : detailOrder.paymentMethodId?.includes("PM002")
                        ? "VNPay"
                        : detailOrder.paymentMethodId}
                    </span>
                  </div>

                  {/* 2. TRẠNG THÁI THANH TOÁN */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Trạng thái:</span>
                    {(() => {
                      // Logic map trạng thái & màu sắc
                      const status = detailOrder.payment?.paymentStatus;
                      let color = "default";
                      let label = "Chưa thanh toán";

                      switch (status) {
                        case "Pending":
                          color = "gold";
                          label = "Chờ thanh toán";
                          break;
                        case "Completed":
                          color = "success"; // hoặc "green"
                          label = "Đã thanh toán";
                          break;
                        case "Failed":
                          color = "error"; // hoặc "red"
                          label = "Thất bại";
                          break;
                        case "Refund_Pending":
                          color = "purple";
                          label = "Yêu cầu hoàn tiền";
                          break;
                        case "Refunded":
                          color = "magenta";
                          label = "Đã hoàn tiền";
                          break;
                        default:
                          // Nếu null (thường là COD lúc mới đặt)
                          if (detailOrder.paymentMethodId === "PM001") {
                            label = "Đợi thanh toán (COD)";
                          }
                          break;
                      }

                      return <Tag color={color}>{label}</Tag>;
                    })()}
                  </div>

                  {/* 3. MÃ GIAO DỊCH (NẾU CÓ) */}
                  {detailOrder.payment?.transactionId && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Mã GD:</span>
                      <span className="font-mono text-xs text-gray-700 bg-gray-100 px-1 rounded">
                        {detailOrder.payment.transactionId}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Divider orientation="left" className="text-gray-400 text-xs">
              Sản phẩm
            </Divider>

            {/* 3. Danh sách sản phẩm (Scroll nếu dài) */}
            <div className="max-h-64 overflow-y-auto pr-2 space-y-3 mb-6">
              {detailOrder.orderDetails.map((item) => (
                <div
                  key={item.orderDetailId}
                  className="flex gap-4 items-center p-2 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <img
                    src={item.product?.imageUrl}
                    className="w-14 h-14 object-cover rounded border"
                    alt="product"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 line-clamp-1">
                      {item.product?.productName}
                    </p>
                    <p className="text-xs text-gray-500">x{item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-indigo-600">
                      {item.unitPrice.toLocaleString()} ₫
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* 4. Tổng tiền Footer */}
            <div className="border-t pt-4 flex justify-between items-center">
              <span className="text-gray-600 font-medium">
                Tổng thành tiền:
              </span>
              <span className="text-2xl font-bold text-red-600">
                {detailOrder.totalAmount.toLocaleString()} ₫
              </span>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
