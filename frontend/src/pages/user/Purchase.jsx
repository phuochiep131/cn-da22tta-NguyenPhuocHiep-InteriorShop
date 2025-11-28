import { useEffect, useState, useContext } from "react";
import Cookies from "js-cookie";
import { message } from "antd";
import { CartContext } from "../../context/CartContext";
import nothingImg from "../../assets/nothing.png";
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  XCircle, 
  ShoppingBag, 
  Search,
  RefreshCw 
} from "lucide-react";

export default function Purchase() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const { refreshCartCount } = useContext(CartContext);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { key: "all", label: "Tất cả" },
    { key: "pending", label: "Chờ xác nhận" },
    { key: "processing", label: "Đang xử lý" },
    { key: "shipping", label: "Đang giao" },
    { key: "delivered", label: "Hoàn thành" },
    { key: "cancelled", label: "Đã hủy" },
  ];

  const getStatusConfig = (status) => {
    switch (status) {
      case "pending":
        return { color: "text-orange-600 bg-orange-50 border-orange-200", icon: <Clock size={16} />, label: "Chờ xác nhận" };
      case "processing":
        return { color: "text-blue-600 bg-blue-50 border-blue-200", icon: <Package size={16} />, label: "Đang xử lý" };
      case "shipping":
        return { color: "text-indigo-600 bg-indigo-50 border-indigo-200", icon: <Truck size={16} />, label: "Đang giao hàng" };
      case "delivered":
        return { color: "text-green-600 bg-green-50 border-green-200", icon: <CheckCircle size={16} />, label: "Giao thành công" };
      case "cancelled":
        return { color: "text-red-600 bg-red-50 border-red-200", icon: <XCircle size={16} />, label: "Đã hủy" };
      default:
        return { color: "text-gray-600 bg-gray-50 border-gray-200", icon: <Clock size={16} />, label: "Chờ xác nhận" };
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
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
        const sortedData = data.sort((a, b) => b.orderId - a.orderId);
        
        setOrders(sortedData);
        await refreshCartCount(userId, token);
      } catch (err) {
        message.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredOrders =
    filter === "all"
      ? orders
      : orders.filter(
          (o) => (o.orderStatus || "pending").toLowerCase() === filter.toLowerCase()
        );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        
        {/* Page Title */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-red-100 text-red-600 rounded-full">
            <ShoppingBag size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Lịch sử đơn hàng</h1>
        </div>

        {/* Sticky Tabs Navigation */}
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

        {/* Loading State */}
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
            <img src={nothingImg} className="w-40 h-40 mx-auto mb-6 opacity-80" alt="empty" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Chưa có đơn hàng nào</h3>
            <p className="text-gray-500 mb-6">Hãy khám phá thêm các sản phẩm thú vị tại cửa hàng của chúng tôi.</p>
            <button className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors">
              Tiếp tục mua sắm
            </button>
          </div>
        )}

        {/* Orders List */}
        <div className="space-y-6">
          {!loading && filteredOrders.map((order) => {
            const statusConfig = getStatusConfig(order.orderStatus);
            
            return (
              <div
                key={order.orderId}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300"
              >
                {/* Order Header */}
                <div className="px-6 py-4 border-b border-gray-50 flex flex-wrap gap-4 justify-between items-center bg-gray-50/50">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-gray-900">
                      Mã đơn: #{order.orderId}
                    </span>
                    <span className="hidden sm:inline text-gray-300">|</span>
                    {/* Giả sử có ngày đặt, nếu không thì bỏ dòng này */}
                    {/* <span className="text-sm text-gray-500">20/11/2023 14:30</span> */}
                  </div>
                  
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${statusConfig.color}`}>
                    {statusConfig.icon}
                    <span className="uppercase">{statusConfig.label}</span>
                  </div>
                </div>

                {/* Product List */}
                <div className="divide-y divide-gray-50">
                  {order.orderDetails.map((item) => (
                    <div
                      key={item.orderDetailId}
                      className="p-6 flex flex-col sm:flex-row gap-4 sm:items-center group"
                    >
                      {/* Image */}
                      <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.productName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-base mb-1 line-clamp-2">
                          {item.product.productName}
                        </h4>
                        <p className="text-sm text-gray-500">
                          x{item.quantity}
                        </p>
                      </div>

                      {/* Price (Single Item) */}
                      <div className="text-right sm:text-right">
                        {/* Nếu có giá cũ thì thêm vào đây */}
                        <div className="font-medium text-gray-900">
                          {(item.unitPrice * item.quantity).toLocaleString()}₫
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer: Total & Actions */}
                <div className="px-6 py-5 bg-gray-50/30 border-t border-gray-100 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4">
                  
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="text-sm">Thành tiền:</span>
                    <span className="text-xl font-bold text-red-600">
                      {order.totalAmount.toLocaleString()}₫
                    </span>
                  </div>

                  <div className="flex gap-3 w-full sm:w-auto">
                    {order.orderStatus === "pending" && (
                      <button 
                        className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 hover:text-red-600 hover:border-red-200 transition-colors"
                      >
                        Hủy đơn
                      </button>
                    )}

                    {order.orderStatus === "delivered" || order.orderStatus === "cancelled" ? (
                      <button className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 shadow-sm shadow-red-200 transition-all">
                        Mua lại
                      </button>
                    ) : null}

                    {/* Nút Liên hệ/Chi tiết dùng chung cho các trạng thái khác */}
                    {order.orderStatus !== "pending" && order.orderStatus !== "cancelled" && (
                       <button className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg border border-gray-300 text-gray-600 font-medium hover:bg-gray-50">
                        Chi tiết
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}