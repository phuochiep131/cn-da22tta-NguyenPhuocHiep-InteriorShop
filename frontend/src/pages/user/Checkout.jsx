import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { message, Modal, Input, Select, Tag } from "antd";
import {
  NotebookPen,
  Puzzle,
  SquareChartGantt,
  MapPin,
  Edit,
  Trash2,
  Plus,
} from "lucide-react";
import Cookies from "js-cookie";

export default function Checkout() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const token = Cookies.get("jwt");

  // Payment
  const [paymentMethod, setPaymentMethod] = useState("PM001");
  const [note, setNote] = useState("");
  const [paymentMethods, setPaymentMethods] = useState([]);

  // Coupon
  const [coupons, setCoupons] = useState([]);
  const [selectedCouponId, setSelectedCouponId] = useState(null);
  const [couponValue, setCouponValue] = useState(0);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [tempSelectedCouponId, setTempSelectedCouponId] = useState(null);

  // Address management
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [modalData, setModalData] = useState({
    name: "",
    phone: "",
    address: "",
  });

  // Product info
  const product = state?.product;
  const quantity = state?.quantity || 1;
  const discount = product ? product.discount || 0 : 0;
  const finalPrice = product ? product.price * (1 - discount / 100) : 0;
  const totalPrice = finalPrice * quantity;
  const totalPriceWithCoupon = Math.max(totalPrice - couponValue, 0);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/payment-methods", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch payment methods");

        const data = await res.json();
        //console.log(data)
        setPaymentMethods(data);
      } catch (err) {
        messageApi.error("Không thể tải phương thức thanh toán");
        console.error(err);
      }
    };

    fetchPaymentMethods();
  }, [token]);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/coupons", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        const data = await res.json();

        setCoupons(data);
      } catch {
        messageApi.error("Không thể tải danh sách voucher");
      }
    };
    fetchCoupons();
  }, []);

  const handleSelectCoupon = (couponId) => {
    const selected = coupons.find((c) => c.couponId === couponId);
    if (!selected) {
      setSelectedCouponId(null);
      setCouponValue(0);
      return;
    }

    let discountAmount = 0;
    if (selected.discountType === "percent") {
      discountAmount = (totalPrice * selected.discountValue) / 100;
    } else {
      discountAmount = selected.discountValue;
    }

    setSelectedCouponId(couponId);
    setCouponValue(discountAmount);
  };

  const handleConfirmOrder = () => {
    const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
    console.log({
      product_id: product.productId,
      quantity,
      payment_method: paymentMethod,
      note,
      coupon: selectedCouponId,
      address: selectedAddress,
      totalPayment: totalPriceWithCoupon,
    });
    messageApi.success("Đặt hàng thành công (demo)!");
    navigate("/");
  };

  const openAddModal = () => {
    setEditingAddress(null);
    setModalData({ name: "", phone: "", address: "" });
    setIsModalOpen(true);
  };
  const openEditModal = (address) => {
    setEditingAddress(address);
    setModalData({
      name: address.name,
      phone: address.phone,
      address: address.address,
    });
    setIsModalOpen(true);
  };
  const handleSaveAddress = () => {
    if (!modalData.name || !modalData.phone || !modalData.address) {
      messageApi.warning("Vui lòng nhập đầy đủ thông tin!");
      return;
    }
    if (editingAddress) {
      setAddresses((prev) =>
        prev.map((a) =>
          a.id === editingAddress.id ? { ...a, ...modalData } : a
        )
      );
    } else {
      const newId = addresses.length
        ? Math.max(...addresses.map((a) => a.id)) + 1
        : 1;
      setAddresses((prev) => [...prev, { id: newId, ...modalData }]);
      setSelectedAddressId(newId);
    }
    setIsModalOpen(false);
  };
  const handleDeleteAddress = (id) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    if (selectedAddressId === id && addresses.length > 1)
      setSelectedAddressId(addresses[0].id);
  };

  if (!product) {
    return (
      <p className="text-center text-gray-500 py-10">
        Không có sản phẩm để thanh toán.
      </p>
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
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`flex items-start justify-between p-2 border rounded cursor-pointer ${
                selectedAddressId === addr.id
                  ? "border-red-500"
                  : "border-gray-200"
              }`}
              onClick={() => setSelectedAddressId(addr.id)}
            >
              <div>
                <p className="font-semibold text-base">
                  {addr.name} | {addr.phone}
                </p>
                <p className="text-gray-600 text-sm">{addr.address}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(addr);
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteAddress(addr.id);
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={openAddModal}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 mt-2"
          >
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
            <img
              src={product.imageUrl}
              className="w-16 h-16 rounded object-cover"
            />
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

      {/* Chọn coupon */}
      <div className="bg-white p-5 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Puzzle className="w-5 h-5" /> Voucher
          </h3>

          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setTempSelectedCouponId(selectedCouponId);
              setIsCouponModalOpen(true);
            }}
            className="px-3 py-1.5 bg-white text-blue-600 rounded-md transition"
          >
            Thay đổi
          </a>
        </div>

        {selectedCouponId ? (
          <Tag color="green">
            Đã chọn:{" "}
            {coupons.find((c) => c.couponId === selectedCouponId)?.description}
          </Tag>
        ) : (
          <p className="text-gray-500 text-sm">Chưa chọn voucher nào</p>
        )}
      </div>

      {/* Phương thức thanh toán */}
      <div className="bg-white p-5 shadow-sm mb-4">
        <h3 className="font-semibold mb-3 text-lg flex items-center gap-2">
          <SquareChartGantt className="w-5 h-5" /> Phương thức thanh toán
        </h3>
        <div className="space-y-2">
          {paymentMethods.map((pm) => (
            <label
              key={pm.id}
              className="flex items-center gap-2 cursor-pointer text-sm"
            >
              <input
                type="radio"
                name="payment"
                value={pm.id}
                checked={paymentMethod === pm.id}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              {pm.name}
            </label>
          ))}
        </div>
      </div>

      {/* Tổng tiền + Đặt hàng */}
      <div className="bg-white shadow-sm p-6 text-right rounded">
        <div className="text-gray-700 mb-3 text-base">
          Tổng thanh toán:
          <span className="text-red-600 font-bold text-2xl ml-2">
            {totalPriceWithCoupon.toLocaleString("vi-VN")} ₫
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
          onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
          className="mb-2"
        />
        <Input
          placeholder="Số điện thoại"
          value={modalData.phone}
          onChange={(e) =>
            setModalData({ ...modalData, phone: e.target.value })
          }
          className="mb-2"
        />
        <Input
          placeholder="Địa chỉ"
          value={modalData.address}
          onChange={(e) =>
            setModalData({ ...modalData, address: e.target.value })
          }
        />
      </Modal>

      <Modal
        title="Chọn mã giảm giá"
        open={isCouponModalOpen}
        onCancel={() => setIsCouponModalOpen(false)}
        footer={null}
        width={700}
      >
        {/* Thanh tìm kiếm */}
        <div className="flex items-center gap-2 mb-4">
          <Input placeholder="Mã Voucher" className="flex-1" />
          <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition">
            Áp dụng
          </button>
        </div>

        <h4 className="font-semibold mb-2 text-gray-700">
          Mã giảm giá khả dụng
        </h4>

        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {coupons.length === 0 ? (
            <p className="text-gray-500 text-sm">Không có mã giảm giá nào.</p>
          ) : (
            coupons.map((c) => {
              const isInactive = !c.isActive;
              const isSelected = selectedCouponId === c.couponId;
              return (
                <div
                  key={c.couponId}
                  onClick={() => {
                    if (!isInactive) setTempSelectedCouponId(c.couponId);
                  }}
                  className={`flex items-center border rounded-lg p-3 transition cursor-pointer ${
                    isInactive
                      ? "opacity-50 cursor-not-allowed bg-gray-50"
                      : "hover:shadow-md hover:border-blue-400"
                  } ${isSelected ? "border-blue-500" : "border-gray-200"}`}
                >
                  {/* Hình trái */}
                  <div className="w-24 h-24 bg-cyan-100 flex items-center justify-center rounded-md text-cyan-600 font-bold text-sm shrink-0">
                    {c.couponType === "freeship" ? "FREESHIP" : "GIẢM GIÁ"}
                  </div>

                  {/* Nội dung giữa */}
                  <div className="flex-1 px-4">
                    <p className="font-semibold text-gray-800">Mã ưu đãi</p>
                    <p className="text-sm text-gray-600">{c.description}</p>
                    <p className="text-xs text-red-500 mt-1">
                      Dành riêng cho bạn
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      HSD:{" "}
                      {new Date(c.endDate).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}{" "}
                    </p>
                  </div>

                  {/* Checkbox phải */}
                  <div className="pr-2">
                    <input
                      type="radio"
                      checked={tempSelectedCouponId === c.couponId}
                      readOnly
                      className="w-5 h-5 accent-blue-500 cursor-pointer"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer giống Shopee */}
        <div className="flex justify-end gap-3 mt-5 border-t pt-4">
          <button
            onClick={() => setIsCouponModalOpen(false)}
            className="px-5 py-2 border rounded-md hover:bg-gray-100"
          >
            TRỞ LẠI
          </button>
          <button
            onClick={() => {
              if (tempSelectedCouponId) {
                handleSelectCoupon(tempSelectedCouponId);
              } else {
                setSelectedCouponId(null);
                setCouponValue(0);
              }
              setIsCouponModalOpen(false);
            }}
            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
          >
            OK
          </button>
        </div>
      </Modal>
    </div>
  );
}
