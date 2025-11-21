import { useEffect, useState, useContext } from "react";
import Cookies from "js-cookie";
import { CartContext } from "../../context/CartContext";
import { message } from "antd";
import { Trash2 } from "lucide-react";
import nothingImg from "../../assets/nothing.png";

export default function CartPage() {
  const userId = Cookies.get("user_id");
  const token = Cookies.get("jwt");
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

      // Khởi tạo selectedItems mặc định là false
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

  const handleQuantityChange = (orderDetailId, delta) => {
    setCartOrders((prev) =>
      prev.map((order) => ({
        ...order,
        orderDetails: order.orderDetails.map((item) => {
          if (item.orderDetailId === orderDetailId) {
            const newQty = Math.max(item.quantity + delta, 1);
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

  const handleSelectItem = (orderDetailId) => {
    setSelectedItems((prev) => ({
      ...prev,
      [orderDetailId]: !prev[orderDetailId],
    }));
  };

  const handleSelectAll = (checked) => {
    const newSelected = {};
    Object.keys(selectedItems).forEach((key) => {
      newSelected[key] = checked;
    });
    setSelectedItems(newSelected);

    if (checked) messageApi.success("Đã chọn tất cả sản phẩm");
  };

  const handleDeleteItem = async (orderId) => {
    try {
      const res = await fetch(`http://localhost:8080/api/orders/${orderId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Xóa sản phẩm thất bại");

      // Xóa thành công trên frontend
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

  if (!cartOrders.length) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <h2 className="text-2xl font-bold mb-6">Giỏ hàng của bạn</h2>
        <div className="flex flex-col items-center justify-center mt-20 mb-20">
          <img src={nothingImg} className="w-32 h-32 mb-4" alt="empty" />
          <p className="text-gray-500 text-lg">Hiện tại không có sản phẩm nào trong giỏ hàng.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {contextHolder}
      <h2 className="text-2xl font-bold mb-6">Giỏ hàng của bạn</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow rounded-lg border-separate border-spacing-y-3">

          <thead>
            <tr className="border-b">
              <th className="px-4 py-2 w-12 text-center">
                <input
                  type="checkbox"
                  checked={Object.values(selectedItems).every(Boolean)}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
              <th className="px-4 py-2 text-left">Sản phẩm</th>
              <th className="px-4 py-2 text-center">Giá</th>
              <th className="px-4 py-2 text-center">Số lượng</th>
              <th className="px-4 py-2 text-right">Thành tiền</th>              
            </tr>
          </thead>

          <tbody>
            {cartOrders.map((order) =>
              order.orderDetails.map((item) => (
                <tr key={item.orderDetailId} className="bg-white shadow-sm rounded-lg">
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={!!selectedItems[item.orderDetailId]}
                      onChange={() => handleSelectItem(item.orderDetailId)}
                    />
                  </td>
                  <td className="flex items-center gap-4 px-4 py-2">
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.productName}
                      className="w-16 h-16 object-cover rounded-md border"
                    />
                    <span>{item.product.productName}</span>
                  </td>
                  <td className="text-center">{item.unitPrice.toLocaleString()}₫</td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleQuantityChange(item.orderDetailId, -1)}
                        className="px-2 py-1 border rounded hover:bg-gray-100 focus:outline-none"
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.orderDetailId, 1)}
                        className="px-2 py-1 border rounded hover:bg-gray-100 focus:outline-none"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="text-right px-4 py-2 font-bold text-red-600">
                    {item.subtotal.toLocaleString()}₫
                  </td>
                  <td className="text-center">
                    <Trash2
                      size={18}
                      className="text-red-600 hover:text-red-400 cursor-pointer"
                      onClick={() => handleDeleteItem(order.orderId)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end items-center mt-4 gap-6">
        <div className="text-lg font-semibold">
          Tổng tiền:{" "}
          <span className="text-red-600">{selectedTotal.toLocaleString()}₫</span>
        </div>
        <button className="bg-red-600 text-white py-2 px-6 rounded-lg font-bold hover:bg-red-500">
          Đặt hàng
        </button>
      </div>
    </div>
  );
}
