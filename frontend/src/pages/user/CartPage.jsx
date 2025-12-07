import { useEffect, useState, useContext } from "react";
import Cookies from "js-cookie";
import { CartContext } from "../../context/CartContext";
import { message } from "antd";
import { useNavigate } from "react-router-dom";
import {
  Trash2,
  ShoppingBag,
  Minus,
  Plus,
  ArrowRight,
  AlertCircle,
  Ban,
} from "lucide-react"; // Thêm icon Ban
import nothingImg from "../../assets/nothing.png";

export default function CartPage() {
  const userId = Cookies.get("user_id");
  const token = Cookies.get("jwt");
  const navigate = useNavigate();
  const [cartOrders, setCartOrders] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [messageApi, contextHolder] = message.useMessage();
  const { refreshCartCount } = useContext(CartContext);

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/cart/items/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Failed to fetch cart");

      const data = await res.json();
      setCartOrders(data);

      const initialSelected = {};
      data.forEach((order) => {
        order.orderDetails.forEach((item) => {
          initialSelected[item.orderDetailId] = false;
        });
      });
      setSelectedItems(initialSelected);

      refreshCartCount(userId, token);
    } catch (error) {
      console.error("Cart error:", error);
    }
  };

  const handleSelectItem = (orderDetailId) => {
    setSelectedItems((prev) => ({
      ...prev,
      [orderDetailId]: !prev[orderDetailId],
    }));
  };

  // --- LOGIC CHỌN TẤT CẢ (ĐÃ SỬA) ---
  const handleSelectAll = (checked) => {
    const newSelected = {};
    cartOrders.forEach((order) => {
      order.orderDetails.forEach((item) => {
        // Quan trọng: Kiểm tra tồn kho trước khi cho phép chọn
        // Sử dụng ?? để chấp nhận giá trị 0
        const stock = item.product.quantity ?? 999;

        if (stock > 0) {
          newSelected[item.orderDetailId] = checked;
        } else {
          newSelected[item.orderDetailId] = false; // Hết hàng thì luôn false
        }
      });
    });
    setSelectedItems(newSelected);

    if (checked) messageApi.success("Đã chọn tất cả sản phẩm có sẵn");
  };

  const handleQuantityChange = (orderDetailId, delta) => {
    setCartOrders((prev) =>
      prev.map((order) => ({
        ...order,
        orderDetails: order.orderDetails.map((item) => {
          if (item.orderDetailId === orderDetailId) {
            // SỬA: Dùng ?? để nếu quantity = 0 thì vẫn lấy 0
            const maxStock = item.product.quantity ?? 999;

            // Nếu hết hàng thì chặn luôn không cho thay đổi (phòng hờ)
            if (maxStock === 0) return item;

            const newQty = item.quantity + delta;

            if (newQty < 1) return item;

            if (newQty > maxStock) {
              messageApi.warning(`Sản phẩm chỉ còn lại ${maxStock} món!`);
              return item;
            }

            return {
              ...item,
              quantity: newQty,
              subtotal: newQty * item.unitPrice,
            };
          }
          return item;
        }),
      }))
    );
  };

  const handleDeleteItem = async (orderId) => {
    try {
      const res = await fetch(`http://localhost:8080/api/orders/${orderId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Xóa sản phẩm thất bại");

      setCartOrders((prev) =>
        prev.filter((order) => order.orderId !== orderId)
      );

      messageApi.success("Đã xóa sản phẩm khỏi giỏ hàng");
      refreshCartCount(userId, token);
    } catch (error) {
      console.error(error);
      messageApi.error("Xóa sản phẩm thất bại");
    }
  };

  const selectedTotal = cartOrders.reduce((sum, order) => {
    return (
      sum +
      order.orderDetails.reduce((s, item) => {
        return s + (selectedItems[item.orderDetailId] ? item.subtotal : 0);
      }, 0)
    );
  }, 0);

  const handleCheckout = () => {
    const selectedOrders = cartOrders
      .map((order) => {
        const selectedOrderDetails = order.orderDetails.filter(
          (item) => selectedItems[item.orderDetailId]
        );
        if (selectedOrderDetails.length === 0) return null;
        return { ...order, orderDetails: selectedOrderDetails };
      })
      .filter(Boolean);

    if (!selectedOrders.length) {
      return messageApi.error("Vui lòng chọn ít nhất 1 sản phẩm để đặt hàng!");
    }

    // Kiểm tra lại lần cuối
    const hasInvalidQuantity = selectedOrders.some((order) =>
      order.orderDetails.some((item) => {
        const stock = item.product.quantity ?? 999;
        return item.quantity > stock || stock === 0;
      })
    );

    if (hasInvalidQuantity) {
      return messageApi.error(
        "Một số sản phẩm không đủ số lượng tồn kho. Vui lòng kiểm tra lại!"
      );
    }

    let orderToSend;
    if (
      selectedOrders.length === 1 &&
      selectedOrders[0].orderDetails.length === 1
    ) {
      orderToSend = selectedOrders[0];
    } else {
      orderToSend = {
        userId,
        orderDetails: selectedOrders.flatMap((o) => o.orderDetails),
        totalAmount: selectedTotal,
      };
    }

    const oldOrderIds = selectedOrders.map((o) => o.orderId);

    navigate("/checkout", {
      state: {
        userId,
        order: orderToSend,
        total: selectedTotal,
        oldOrderIds,
      },
    });
  };

  if (!cartOrders.length) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full">
          <img
            src={nothingImg}
            className="w-40 h-40 mx-auto mb-6 opacity-80"
            alt="empty"
          />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Giỏ hàng trống
          </h2>
          <p className="text-gray-500 mb-6">
            Có vẻ như bạn chưa thêm sản phẩm nào vào giỏ hàng.
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition-colors w-full font-medium"
          >
            Tiếp tục mua sắm
          </button>
        </div>
      </div>
    );
  }

  // Đếm tổng số lượng sản phẩm có thể chọn (tồn kho > 0) để hiển thị ở checkbox Chọn tất cả
  const availableItemsCount = cartOrders.reduce(
    (acc, order) =>
      acc +
      order.orderDetails.filter((item) => (item.product.quantity ?? 999) > 0)
        .length,
    0
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      {contextHolder}
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8 flex items-center gap-3">
          <ShoppingBag className="w-8 h-8" /> Giỏ hàng của bạn
        </h1>

        <div className="lg:grid lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  // Checked nếu số lượng item được chọn == tổng số item khả dụng
                  checked={
                    availableItemsCount > 0 &&
                    Object.values(selectedItems).filter(
                      (isSelected) => isSelected
                    ).length === availableItemsCount
                  }
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
                <span className="font-medium text-gray-700">
                  Chọn tất cả ({availableItemsCount} sản phẩm có sẵn)
                </span>
              </label>
            </div>

            <div className="space-y-4">
              {cartOrders.map((order) =>
                order.orderDetails.map((item) => {
                  // LOGIC QUAN TRỌNG TẠI ĐÂY
                  // Dùng ?? để bắt chính xác số 0
                  const stock = item.product.quantity ?? 999;
                  const isOutOfStock = stock === 0;
                  const isMaxReached = item.quantity >= stock;

                  return (
                    <div
                      key={item.orderDetailId}
                      className={`group bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative 
                        ${
                          isOutOfStock
                            ? "bg-gray-50 opacity-75 grayscale-[0.5]"
                            : ""
                        } 
                      `}
                    >
                      <div className="flex gap-4 sm:gap-6">
                        <div className="flex items-center justify-center pt-1 sm:pt-0">
                          <input
                            type="checkbox"
                            className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-200"
                            checked={!!selectedItems[item.orderDetailId]}
                            onChange={() =>
                              handleSelectItem(item.orderDetailId)
                            }
                            disabled={isOutOfStock} // Disable checkbox nếu hết hàng
                          />
                        </div>

                        <div className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative">
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.productName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {/* Overlay nếu hết hàng */}
                          {isOutOfStock && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <span className="bg-black/70 text-white text-xs px-2 py-1 rounded font-bold uppercase">
                                Hết hàng
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <h3
                                className={`text-base sm:text-lg font-semibold line-clamp-2 pr-8 ${
                                  isOutOfStock
                                    ? "text-gray-500"
                                    : "text-gray-800"
                                }`}
                              >
                                {item.product.productName}
                              </h3>
                              <button
                                onClick={() => handleDeleteItem(order.orderId)}
                                className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                title="Xóa sản phẩm"
                              >
                                <Trash2 size={20} />
                              </button>
                            </div>
                            <p className="text-gray-500 text-sm mt-1">
                              Đơn giá: {item.unitPrice.toLocaleString()}₫
                            </p>

                            {/* HIỂN THỊ TRẠNG THÁI KHO */}
                            {isOutOfStock ? (
                              <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-bold">
                                <Ban size={12} />
                                Đã hết hàng
                              </p>
                            ) : (
                              <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                <AlertCircle size={12} />
                                Còn lại trong kho: {stock}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-4">
                            <div
                              className={`flex items-center border border-gray-300 rounded-lg w-max ${
                                isOutOfStock
                                  ? "opacity-50 pointer-events-none"
                                  : ""
                              }`}
                            >
                              <button
                                onClick={() =>
                                  handleQuantityChange(item.orderDetailId, -1)
                                }
                                className="p-2 hover:bg-gray-100 text-gray-600 transition-colors rounded-l-lg disabled:opacity-50"
                                disabled={item.quantity <= 1 || isOutOfStock} // Disable nút giảm
                              >
                                <Minus size={16} />
                              </button>

                              <span className="w-10 text-center font-medium text-gray-900 text-sm">
                                {item.quantity}
                              </span>

                              <button
                                onClick={() =>
                                  handleQuantityChange(item.orderDetailId, 1)
                                }
                                disabled={isMaxReached || isOutOfStock} // Disable nút tăng
                                className={`p-2 transition-colors rounded-r-lg ${
                                  isMaxReached || isOutOfStock
                                    ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                                    : "hover:bg-gray-100 text-gray-600"
                                }`}
                              >
                                <Plus size={16} />
                              </button>
                            </div>

                            <div className="text-right">
                              <span className="block text-xs text-gray-500 sm:hidden">
                                Thành tiền:
                              </span>
                              <span
                                className={`text-lg font-bold ${
                                  isOutOfStock
                                    ? "text-gray-400 line-through"
                                    : "text-red-600"
                                }`}
                              >
                                {item.subtotal.toLocaleString()}₫
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="lg:col-span-4 mt-8 lg:mt-0">
            {/* ... Phần Tổng giỏ hàng giữ nguyên ... */}
            {/* (Đã có sẵn trong code gốc của bạn, không cần thay đổi logic ở đây, 
                 vì selectedItems đã tự lọc bỏ sản phẩm hết hàng nên tổng tiền sẽ đúng) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:sticky lg:top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Tổng giỏ hàng
              </h2>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính</span>
                  <span>{selectedTotal.toLocaleString()}₫</span>
                </div>
                {/* ... */}
                <div className="border-t border-dashed border-gray-200 pt-4 flex justify-between items-center">
                  <span className="font-bold text-gray-900 text-lg">
                    Tổng cộng
                  </span>
                  <span className="font-bold text-2xl text-red-600">
                    {selectedTotal.toLocaleString()}₫
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={selectedTotal === 0} // Disable nút nếu không chọn gì
                className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 group transition-all
                    ${
                      selectedTotal === 0
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
                        : "bg-red-600 text-white shadow-red-200 hover:bg-red-700 hover:shadow-xl"
                    }
                `}
              >
                Tiến hành đặt hàng
                {selectedTotal > 0 && (
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
