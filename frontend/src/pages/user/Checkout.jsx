import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { message, Modal, Input } from "antd";
import { NotebookPen, Puzzle, SquareChartGantt, MapPin, Edit, Trash2, Plus } from "lucide-react";

export default function Checkout() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const [paymentMethod, setPaymentMethod] = useState("PM001");
  const [note, setNote] = useState("");
  const [coupon, setCoupon] = useState("");
  const [paymentMethods, setPaymentMethods] = useState([]);

  // Product info
  const product = state?.product;
  const quantity = state?.quantity || 1;
  const discount = product ? product.discount || 0 : 0;
  const finalPrice = product ? product.price * (1 - discount / 100) : 0;
  const totalPrice = finalPrice * quantity;

  // Address management
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [modalData, setModalData] = useState({ name: "", phone: "", address: "" });

  useEffect(() => {
    const mockPaymentMethods = [
      { payment_method_id: "PM001", payment_method_name: "Thanh toán khi nhận hàng (COD)" },
      { payment_method_id: "PM002", payment_method_name: "VN Pay" },
    ];
    setPaymentMethods(mockPaymentMethods);
  }, []);

  const handleConfirmOrder = () => {
    const selectedAddress = addresses.find(a => a.id === selectedAddressId);
    console.log({
      product_id: product.productId,
      quantity,
      payment_method: paymentMethod,
      note,
      coupon,
      address: selectedAddress,
    });
    messageApi.success("Đặt hàng thành công (demo)!");
    navigate("/");
  };

  // Modal actions
  const openAddModal = () => {
    setEditingAddress(null);
    setModalData({ name: "", phone: "", address: "" });
    setIsModalOpen(true);
  };
  const openEditModal = (address) => {
    setEditingAddress(address);
    setModalData({ name: address.name, phone: address.phone, address: address.address });
    setIsModalOpen(true);
  };
  const handleSaveAddress = () => {
    if (!modalData.name || !modalData.phone || !modalData.address) {
      messageApi.warning("Vui lòng nhập đầy đủ thông tin!");
      return;
    }
    if (editingAddress) {
      // Update
      setAddresses(prev => prev.map(a => a.id === editingAddress.id ? { ...a, ...modalData } : a));
    } else {
      // Add
      const newId = addresses.length ? Math.max(...addresses.map(a => a.id)) + 1 : 1;
      setAddresses(prev => [...prev, { id: newId, ...modalData }]);
      setSelectedAddressId(newId);
    }
    setIsModalOpen(false);
  };
  const handleDeleteAddress = (id) => {
    setAddresses(prev => prev.filter(a => a.id !== id));
    if (selectedAddressId === id && addresses.length > 1) setSelectedAddressId(addresses[0].id);
  };

  if (!product) {
    return (
      <p className="text-center text-gray-500 py-10">Không có sản phẩm để thanh toán.</p>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {contextHolder}

      {/* Địa chỉ nhận hàng */}
      <div className="bg-white p-5 shadow-sm border-b mb-4">
        <h2 className="font-semibold mb-3 text-lg flex items-center gap-2 text-red-600">
          <MapPin className="w-5 h-5" /> Địa chỉ nhận hàng
        </h2>

        <div className="space-y-3">
          {addresses.map(addr => (
            <div
              key={addr.id}
              className={`flex items-start justify-between p-2 border rounded cursor-pointer ${selectedAddressId === addr.id ? 'border-red-500' : 'border-gray-200'}`}
              onClick={() => setSelectedAddressId(addr.id)}
            >
              <div>
                <p className="font-semibold text-base">{addr.name} | {addr.phone}</p>
                <p className="text-gray-600 text-sm">{addr.address}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={(e) => { e.stopPropagation(); openEditModal(addr); }} className="text-blue-600 hover:text-blue-800">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addr.id); }} className="text-red-600 hover:text-red-800">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          <button onClick={openAddModal} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 mt-2">
            <Plus className="w-4 h-4" /> Thêm địa chỉ
          </button>
        </div>
      </div>

      {/* Sản phẩm */}
      <div className="bg-white shadow-sm mb-4 p-5">
        <h3 className="font-semibold mb-3 text-lg flex items-center gap-2">
          <SquareChartGantt className="w-5 h-5" /> Sản phẩm
        </h3>
        <div className="grid grid-cols-12 p-4 border-b font-semibold text-gray-600 text-sm">
          <div className="col-span-6">Sản phẩm</div>
          <div className="col-span-2 text-center">Đơn giá</div>
          <div className="col-span-2 text-center">Số lượng</div>
          <div className="col-span-2 text-right">Thành tiền</div>
        </div>

        <div className="grid grid-cols-12 p-4 border-b text-sm text-gray-700">
          <div className="col-span-6 flex gap-3 items-center text-base">
            <img src={product.imageUrl} className="w-16 h-16 rounded object-cover" />
            <span>{product.productName}</span>
          </div>
          <div className="col-span-2 text-center">
            {product.price.toLocaleString("vi-VN")}₫
          </div>
          <div className="col-span-2 text-center text-red-600 font-semibold">
            {quantity.toLocaleString("vi-VN")}
          </div>
          <div className="col-span-2 text-right font-bold text-base">
            {(finalPrice * quantity).toLocaleString("vi-VN")} ₫
          </div>
        </div>
      </div>

      {/* Ghi chú */}
      <div className="bg-white p-5 shadow-sm mb-4">
        <h3 className="font-semibold mb-3 text-lg flex items-center gap-2">
          <NotebookPen className="w-5 h-5" /> Ghi chú
        </h3>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full border rounded p-2 text-sm"
          placeholder="Lưu ý..."
        ></textarea>
      </div>

      {/* Nhập coupon */}
      <div className="bg-white p-5 shadow-sm mb-4">
        <h3 className="font-semibold mb-3 text-lg flex items-center gap-2">
          <Puzzle className="w-5 h-5" /> Mã giảm giá
        </h3>
        <input
          type="text"
          value={coupon}
          onChange={(e) => setCoupon(e.target.value)}
          placeholder="Nhập mã giảm giá"
          className="w-full border rounded p-2 text-sm"
        />
      </div>

      {/* Phương thức thanh toán */}
      <div className="bg-white p-5 shadow-sm mb-4">
        <h3 className="font-semibold mb-3 text-lg flex items-center gap-2">
          <SquareChartGantt className="w-5 h-5" /> Phương thức thanh toán
        </h3>
        <div className="space-y-2">
          {paymentMethods.map(pm => (
            <label key={pm.payment_method_id} className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="radio"
                name="payment"
                value={pm.payment_method_id}
                checked={paymentMethod === pm.payment_method_id}
                onChange={e => setPaymentMethod(e.target.value)}
              />
              {pm.payment_method_name}
            </label>
          ))}
        </div>
      </div>

      {/* Tổng tiền + Đặt hàng */}
      <div className="bg-white shadow-sm p-6 text-right rounded">
        <div className="text-gray-700 mb-3 text-base">
          Tổng thanh toán:
          <span className="text-red-600 font-bold text-2xl ml-2">
            {totalPrice.toLocaleString("vi-VN")} ₫
          </span>
        </div>

        <button
          onClick={handleConfirmOrder}
          className="bg-red-600 hover:bg-red-700 text-white px-10 py-3 rounded-lg font-semibold transition text-base"
        >
          Xác nhận đặt hàng
        </button>
      </div>

      {/* Modal thêm/sửa địa chỉ */}
      <Modal
        title={editingAddress ? "Sửa địa chỉ" : "Thêm địa chỉ"}
        open={isModalOpen}
        onOk={handleSaveAddress}
        onCancel={() => setIsModalOpen(false)}
      >
        <Input
          placeholder="Họ và tên"
          value={modalData.name}
          onChange={e => setModalData({...modalData, name: e.target.value})}
          className="mb-2"
        />
        <Input
          placeholder="Số điện thoại"
          value={modalData.phone}
          onChange={e => setModalData({...modalData, phone: e.target.value})}
          className="mb-2"
        />
        <Input
          placeholder="Địa chỉ"
          value={modalData.address}
          onChange={e => setModalData({...modalData, address: e.target.value})}
        />
      </Modal>
    </div>
  );
}
