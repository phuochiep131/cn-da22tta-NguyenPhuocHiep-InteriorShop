import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useContext } from "react"; // [UPDATE] Thêm useContext
import { message, Modal, Input, Divider, Button } from "antd";
import {
  MapPin,
  Edit,
  Trash2,
  Plus,
  ShoppingBag,
  NotebookPen,
  Ticket,
  UserRound,
  Phone,
  CreditCard,
  Truck,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import Cookies from "js-cookie";
import { AuthContext } from "../../context/AuthContext"; // [UPDATE] Import AuthContext

// --- HÀM KIỂM TRA HẠN SỬ DỤNG ---
const isCouponExpired = (endDate) => {
  if (!endDate) return false;
  return new Date().getTime() > new Date(endDate).getTime();
};

export default function Checkout() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const token = Cookies.get("jwt");

  // [UPDATE] Lấy thông tin user từ AuthContext
  const { user } = useContext(AuthContext);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [note, setNote] = useState("");
  const [paymentMethods, setPaymentMethods] = useState([]);

  // Coupon
  const [coupons, setCoupons] = useState([]);
  const [selectedCouponId, setSelectedCouponId] = useState(null);
  const [couponValue, setCouponValue] = useState(0);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [tempSelectedCouponId, setTempSelectedCouponId] = useState(null);
  const [manualCouponCode, setManualCouponCode] = useState("");

  // Address
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [modalData, setModalData] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const [singleProduct, setSingleProduct] = useState(state?.product || null);
  const [items, setItems] = useState(state?.order?.orderDetails || []);
  const [oldOrderIds, setOldOrderIds] = useState(state?.oldOrderIds || []);

  // [UPDATE] useEffect để load thông tin user vào danh sách địa chỉ
  useEffect(() => {
    if (user) {
      // Kiểm tra xem user có thông tin cơ bản không để tạo địa chỉ mặc định
      // Lưu ý: Tên trường khớp với API trả về (thường là camelCase so với DB snake_case)
      const defaultAddress = {
        id: 1, // ID mặc định cho địa chỉ chính
        name: user.fullName || "", // Mapping từ full_name
        phone: user.phoneNumber || "", // Mapping từ phone_number
        address: user.address || "", // Mapping từ address
      };

      // Chỉ set nếu có ít nhất tên hoặc số điện thoại
      if (defaultAddress.name || defaultAddress.phone) {
        setAddresses([defaultAddress]);
        setSelectedAddressId(1);
      }
    }
  }, [user]);

  useEffect(() => {
    if ((!state || !state.product) && !singleProduct) {
      const pendingOrder = sessionStorage.getItem("pendingOrder");
      if (pendingOrder) {
        const {
          singleProduct: sp,
          items: it,
          oldOrderIds: oldIds,
          note: n,
          paymentMethod: pm,
          couponId: cid,
        } = JSON.parse(pendingOrder);

        setSingleProduct(sp || null);
        setItems(it || []);
        setOldOrderIds(oldIds || []);
        setNote(n || "");
        setPaymentMethod(pm || "PM001");
        setSelectedCouponId(cid || null);
      }
    }
  }, []);

  const productsToPay = [
    ...items,
    ...(singleProduct
      ? [{ ...singleProduct, quantity: state?.quantity || 1 }]
      : []),
  ];

  const totalPrice = productsToPay.reduce(
    (sum, item) =>
      sum +
      (item.subtotal || (item.product?.price || item.price) * item.quantity),
    0
  );

  const totalPriceWithCoupon = Math.max(totalPrice - couponValue, 0);

  // Fetch Payment Methods
  useEffect(() => {
    fetch("http://localhost:8080/api/payment-methods", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setPaymentMethods)
      .catch(() => messageApi.error("Không thể tải phương thức thanh toán"));
  }, [token]);

  // Fetch Coupons
  useEffect(() => {
    fetch("http://localhost:8080/api/coupons/active", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setCoupons)
      .catch(() => messageApi.error("Không thể tải danh sách voucher"));
  }, []);

  // --- LOGIC XỬ LÝ VOUCHER ---
  const handleSelectCoupon = (couponId) => {
    const selected = coupons.find((c) => c.couponId === couponId);

    if (!selected) {
      setSelectedCouponId(null);
      setCouponValue(0);
      return;
    }

    if (isCouponExpired(selected.endDate)) {
      messageApi.error(`Mã giảm giá ${selected.code} đã hết hạn sử dụng!`);
      return;
    }

    if (selected.minOrderAmount && totalPrice < selected.minOrderAmount) {
      messageApi.warning(
        `Đơn hàng chưa đạt mức tối thiểu ${selected.minOrderAmount.toLocaleString()}đ để dùng mã này!`
      );
      return;
    }

    let discountAmount = 0;

    if (selected.discountType === "percent") {
      let rawDiscount = (totalPrice * selected.discountValue) / 100;
      if (selected.maxDiscount && selected.maxDiscount > 0) {
        discountAmount = Math.min(rawDiscount, selected.maxDiscount);
      } else {
        discountAmount = rawDiscount;
      }
    } else {
      discountAmount = selected.discountValue;
    }

    setSelectedCouponId(couponId);
    setCouponValue(discountAmount);
    messageApi.success("Áp dụng mã giảm giá thành công!");
  };

  const handleApplyManualCode = () => {
    if (!manualCouponCode.trim()) {
      messageApi.warning("Vui lòng nhập mã voucher!");
      return;
    }

    const normalizedCode = manualCouponCode.trim().toUpperCase();
    const foundCoupon = coupons.find(
      (c) => c.code?.toUpperCase() === normalizedCode
    );

    if (!foundCoupon) {
      messageApi.error("Mã giảm giá không tồn tại!");
      return;
    }

    if (isCouponExpired(foundCoupon.endDate)) {
      messageApi.error("Mã giảm giá đã hết hạn sử dụng!");
      return;
    }

    if (!foundCoupon.isActive) {
      messageApi.error("Mã này hiện đang tạm khóa!");
      return;
    }

    const minSpend = foundCoupon.minOrderAmount || 0;
    if (totalPrice < minSpend) {
      messageApi.warning(
        `Đơn hàng cần tối thiểu ${minSpend.toLocaleString()}đ để sử dụng mã này!`
      );
      return;
    }

    setTempSelectedCouponId(foundCoupon.couponId);
    messageApi.success("Mã hợp lệ! Voucher đã được chọn.");
  };

  const handleConfirmOrder = async () => {
    const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
    if (!selectedAddress)
      return messageApi.warning("Vui lòng chọn địa chỉ nhận hàng!");
    if (!paymentMethod)
      return messageApi.warning("Vui lòng chọn phương thức thanh toán!");
    if (!productsToPay.length)
      return messageApi.warning("Không có sản phẩm để thanh toán!");

    if (selectedCouponId) {
      const finalCoupon = coupons.find((c) => c.couponId === selectedCouponId);
      if (finalCoupon && isCouponExpired(finalCoupon.endDate)) {
        setSelectedCouponId(null);
        setCouponValue(0);
        return messageApi.error(
          `Mã ${finalCoupon.code} đã hết hạn. Vui lòng chọn mã khác.`
        );
      }
    }

    const orderPayload = {
      userId: Cookies.get("user_id"),
      paymentMethodId: paymentMethod,
      shippingAddress: `${selectedAddress.name} - ${selectedAddress.phone} - ${selectedAddress.address}`,
      customerNote: note,
      orderDate: new Date().toISOString(),
      couponId: selectedCouponId ? parseInt(selectedCouponId) : null,
      totalAmount: totalPriceWithCoupon,
      isOrder: true,
      orderStatus: "pending",
      orderDetails: productsToPay.map((item) => ({
        product: { productId: item.product?.productId || item.productId },
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || item.product?.price || item.price,
        originalUnitPrice:
          item.originalUnitPrice ||
          item.originalPrice ||
          item.product?.price ||
          item.price,
      })),
      oldOrderIds,
    };

    if (paymentMethod === "PM002") {
      try {
        const vnpRes = await fetch(
          "http://localhost:8080/api/vnpay/create-payment",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              amount: totalPriceWithCoupon,
              language: "vn",
            }),
          }
        );

        if (!vnpRes.ok) {
          const errorBody = await vnpRes.text();
          console.error("VNPAY API Error Response:", errorBody);
          return messageApi.error("Không thể kết nối VNPAY");
        }

        const vnpData = await vnpRes.json();

        if (vnpData.code === "00" && vnpData.data) {
          sessionStorage.setItem(
            "pendingOrder",
            JSON.stringify({
              singleProduct,
              items,
              oldOrderIds,
              note,
              paymentMethod,
              shippingAddress: orderPayload.shippingAddress, // Lưu địa chỉ đã chọn
              couponId: selectedCouponId,
              buyQuantity: state?.quantity || 1,
            })
          );
          window.location.href = vnpData.data;
          return;
        } else {
          return messageApi.error("Không tạo được liên kết thanh toán VNPAY!");
        }
      } catch (err) {
        console.error(err);
        return messageApi.error("Lỗi khi gọi VNPAY!");
      }
    }

    // COD Order
    const generateTransactionId = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let rand = "";
      for (let i = 0; i < 10; i++) {
        rand += chars[Math.floor(Math.random() * chars.length)];
      }
      return "TM" + rand;
    };

    try {
      let res;
      const apiPath = oldOrderIds?.length
        ? "/api/orders/replace"
        : "/api/orders";
      const method = items.length === 1 && state?.order ? "PUT" : "POST";
      const url =
        items.length === 1 && state?.order
          ? `http://localhost:8080/api/orders/${state.order.orderId}`
          : `http://localhost:8080${apiPath}`;

      res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderPayload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(
            errorJson.message || errorJson.error || "Đặt hàng thất bại"
          );
        } catch {
          throw new Error(errorText || "Đặt hàng thất bại");
        }
      }

      const orderData = await res.json();
      const createdOrderId = orderData.orderId;

      if (paymentMethod === "PM001") {
        const transactionId = generateTransactionId();
        const paymentPayload = {
          orderId: createdOrderId,
          paymentMethodId: paymentMethod,
          transactionId: transactionId,
          amount: totalPriceWithCoupon,
          paymentStatus: "Pending",
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
          console.error("Tạo thanh toán thất bại");
          messageApi.error("Không thể tạo thanh toán!");
        }

        messageApi.success("Đặt hàng thành công!");
        setTimeout(() => {
          navigate("/purchase");
        }, 2000);
        return;
      }
      navigate("/order");
    } catch (err) {
      console.error("Lỗi đặt hàng cuối cùng:", err);
      messageApi.error(
        err.message || "Không thể tạo đơn hàng. Vui lòng thử lại."
      );
    }
  };

  // --- Address Modal Handlers ---
  const openAddModal = () => {
    setEditingAddress(null);
    setModalData({ name: "", phone: "", address: "" });
    setIsModalOpen(true);
  };
  const openEditModal = (addr) => {
    setEditingAddress(addr);
    setModalData({
      name: addr.name,
      phone: addr.phone,
      address: addr.address,
    });
    setIsModalOpen(true);
  };
  const handleSaveAddress = () => {
    if (!modalData.name || !modalData.phone || !modalData.address)
      return messageApi.warning("Vui lòng nhập đầy đủ thông tin!");

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

  if (!productsToPay.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
        <p className="text-xl text-gray-500 font-medium">
          Giỏ hàng của bạn đang trống
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 text-blue-600 hover:underline"
        >
          Tiếp tục mua sắm
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 font-sans">
      {contextHolder}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
          Thanh toán
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ----- LEFT COLUMN: Main Info ----- */}
          <div className="lg:col-span-8 space-y-6">
            {/* Section: Địa chỉ nhận hàng */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" /> Địa chỉ nhận hàng
                </h2>
                <button
                  onClick={openAddModal}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-full transition"
                >
                  <Plus className="w-4 h-4" /> Thêm mới
                </button>
              </div>

              <div className="space-y-3">
                {addresses.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p className="text-gray-500 mb-2">Chưa có địa chỉ nào</p>
                    <button
                      onClick={openAddModal}
                      className="text-blue-600 font-medium"
                    >
                      Thêm địa chỉ ngay
                    </button>
                  </div>
                ) : (
                  addresses.map((addr) => (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`group relative p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        selectedAddressId === addr.id
                          ? "border-blue-600 bg-blue-50/30"
                          : "border-gray-100 hover:border-blue-200"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex gap-4">
                          <div
                            className={`mt-1 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                              selectedAddressId === addr.id
                                ? "border-blue-600 bg-blue-600"
                                : "border-gray-300"
                            }`}
                          >
                            {selectedAddressId === addr.id && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-gray-900">
                                {addr.name}
                              </span>
                              <span className="text-gray-400">|</span>
                              <span className="text-gray-600">
                                {addr.phone}
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed">
                              {addr.address}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4 bg-white p-1 rounded shadow-sm border">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(addr);
                            }}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAddress(addr.id);
                            }}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Section: Sản phẩm */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-600" /> Sản phẩm (
                {productsToPay.length})
              </h2>
              <div className="divide-y divide-gray-100">
                {productsToPay.map((item, index) => (
                  <div
                    key={item.orderDetailId || index}
                    className="py-4 flex gap-4"
                  >
                    <div className="w-20 h-20 shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                      <img
                        src={item.product?.imageUrl || item.imageUrl}
                        alt="product"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 line-clamp-2">
                          {item.product?.productName || item.productName}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Số lượng: x{item.quantity}
                        </p>
                      </div>
                      <div className="flex justify-between items-end">
                        <p className="text-gray-500 text-sm">
                          Đơn giá:{" "}
                          {(
                            item.unitPrice ||
                            item.product?.price ||
                            item.price
                          ).toLocaleString()}{" "}
                          ₫
                        </p>
                        <p className="font-bold text-gray-900 text-lg">
                          {(
                            item.subtotal ||
                            (item.unitPrice ||
                              item.product?.price ||
                              item.price) * item.quantity
                          ).toLocaleString()}{" "}
                          ₫
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section: Phương thức thanh toán */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" /> Phương thức
                thanh toán
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {paymentMethods.map((pm) => (
                  <label
                    key={pm.id}
                    className={`relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-gray-50 ${
                      paymentMethod === pm.id
                        ? "border-blue-600 bg-blue-50/50"
                        : "border-gray-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={pm.id}
                      checked={paymentMethod === pm.id}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-5 h-5 text-blue-600 accent-blue-600"
                    />
                    <div className="flex-1">
                      <span className="block font-medium text-gray-900">
                        {pm.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {pm.id === "PM002"
                          ? "Thanh toán qua ví điện tử/ngân hàng"
                          : "Thanh toán khi nhận hàng"}
                      </span>
                    </div>
                    {pm.id === "PM002" ? (
                      <CreditCard className="w-6 h-6 text-blue-500" />
                    ) : (
                      <Truck className="w-6 h-6 text-green-500" />
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* ----- RIGHT COLUMN: Summary & Actions ----- */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-8 space-y-6">
              {/* Order Summary Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                  <h2 className="font-semibold text-gray-900 text-lg">
                    Tổng quan đơn hàng
                  </h2>
                </div>

                <div className="p-6 space-y-6">
                  {/* Voucher Trigger */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Ticket className="w-4 h-4" /> Mã ưu đãi
                    </label>
                    <button
                      onClick={() => {
                        setTempSelectedCouponId(selectedCouponId);
                        setIsCouponModalOpen(true);
                      }}
                      className="w-full flex items-center justify-between p-3 border border-gray-300 border-dashed rounded-lg text-sm hover:border-blue-500 hover:text-blue-600 transition group bg-gray-50"
                    >
                      <span className="flex items-center gap-2 text-gray-600 group-hover:text-blue-600">
                        {selectedCouponId ? (
                          <span className="font-medium text-green-600">
                            {coupons.find(
                              (c) => c.couponId === selectedCouponId
                            )?.code || "Đã áp dụng mã"}
                          </span>
                        ) : (
                          "Chọn hoặc nhập mã"
                        )}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                    {selectedCouponId && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Đã giảm: {couponValue.toLocaleString()} ₫
                      </p>
                    )}
                  </div>

                  {/* Note Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <NotebookPen className="w-4 h-4" /> Ghi chú cho người bán
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-3 border"
                      rows={2}
                      placeholder="Ví dụ: Giao giờ hành chính..."
                    />
                  </div>

                  <Divider className="my-2" />

                  {/* Calculation */}
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Tạm tính</span>
                      <span>{totalPrice.toLocaleString()} ₫</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Giảm giá</span>
                      <span>-{couponValue.toLocaleString()} ₫</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <span className="font-bold text-gray-900 text-base">
                        Tổng thanh toán
                      </span>
                      <span className="font-bold text-2xl text-red-600">
                        {totalPriceWithCoupon.toLocaleString()} ₫
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleConfirmOrder}
                    className="w-full bg-red-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-red-700 active:scale-[0.98] transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <span>Đặt hàng</span>
                    <ChevronRight className="w-5 h-5 opacity-80" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Địa chỉ */}
      <Modal
        title={
          <div className="text-lg font-bold flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            {editingAddress ? "Sửa địa chỉ" : "Thêm địa chỉ mới"}
          </div>
        }
        open={isModalOpen}
        onOk={handleSaveAddress}
        onCancel={() => setIsModalOpen(false)}
        okText="Lưu địa chỉ"
        cancelText="Hủy"
        okButtonProps={{ className: "bg-blue-600 hover:!bg-blue-700" }}
      >
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Họ và tên
            </label>
            <Input
              size="large"
              placeholder="VD: Nguyễn Văn A"
              value={modalData.name}
              onChange={(e) =>
                setModalData({ ...modalData, name: e.target.value })
              }
              prefix={<UserRound className="w-4 h-4 text-gray-400" />}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Số điện thoại
            </label>
            <Input
              size="large"
              placeholder="VD: 0901234567"
              value={modalData.phone}
              onChange={(e) =>
                setModalData({ ...modalData, phone: e.target.value })
              }
              prefix={<Phone className="w-4 h-4 text-gray-400" />}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Địa chỉ chi tiết
            </label>
            <Input.TextArea
              rows={3}
              placeholder="Số nhà, tên đường, phường/xã..."
              value={modalData.address}
              onChange={(e) =>
                setModalData({ ...modalData, address: e.target.value })
              }
            />
          </div>
        </div>
      </Modal>

      {/* Modal: Voucher */}
      <Modal
        title="Chọn Shopper Voucher"
        open={isCouponModalOpen}
        onCancel={() => setIsCouponModalOpen(false)}
        footer={null}
        width={600}
        className="top-10"
      >
        <div className="flex gap-2 mb-6">
          <Input
            size="large"
            placeholder="Nhập mã Voucher"
            className="bg-gray-50 uppercase"
            value={manualCouponCode}
            onChange={(e) => setManualCouponCode(e.target.value)}
            onPressEnter={handleApplyManualCode}
          />
          <Button
            size="large"
            type="primary"
            className="bg-blue-600"
            onClick={handleApplyManualCode}
          >
            Áp dụng
          </Button>
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 -mr-2 custom-scrollbar">
          {coupons.length === 0 ? (
            <div className="text-center py-10">
              <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Kho voucher của bạn đang trống</p>
            </div>
          ) : (
            coupons.map((c) => {
              const isInactive = !c.isActive;
              const isExpired = isCouponExpired(c.endDate);

              // --- LOGIC KIỂM TRA ĐIỀU KIỆN ---
              const minSpend = c.minOrderAmount || 0;
              const isEligible = totalPrice >= minSpend;

              // Chỉ cho phép chọn nếu voucher active VÀ đủ điều kiện tiền tối thiểu VÀ CHƯA HẾT HẠN
              const canSelect = !isInactive && isEligible && !isExpired;
              const isSelected = tempSelectedCouponId === c.couponId;

              return (
                <div
                  key={c.couponId}
                  onClick={() =>
                    canSelect && setTempSelectedCouponId(c.couponId)
                  }
                  className={`relative flex border rounded-lg overflow-hidden transition-all ${
                    !canSelect
                      ? "opacity-60 bg-gray-100 cursor-not-allowed grayscale-[0.8]"
                      : "cursor-pointer hover:shadow-md bg-white"
                  } ${
                    isSelected
                      ? "border-red-500 ring-1 ring-red-500 bg-red-50/10"
                      : "border-gray-200"
                  }`}
                >
                  {/* Left Ticket Stub */}
                  <div
                    className={`w-28 flex flex-col items-center justify-center p-3 border-r border-dashed ${
                      c.discountType === "fixed"
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    <span className="font-bold text-lg">
                      {c.discountType === "percent"
                        ? `${c.discountValue}%`
                        : "GIẢM TIỀN"}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-white rounded-full mt-1 border shadow-sm">
                      SHOPPER
                    </span>
                  </div>

                  {/* Right Content */}
                  <div className="flex-1 p-3 flex flex-col justify-center">
                    <h4 className="font-bold text-gray-800">
                      {c.description || c.code}
                    </h4>

                    {/* Hiển thị chi tiết giảm giá */}
                    <div className="text-xs text-gray-500 mt-1">
                      <p>
                        Đơn tối thiểu:{" "}
                        {minSpend > 0 ? `${minSpend.toLocaleString()}đ` : "0đ"}
                      </p>
                      {c.discountType === "percent" && c.maxDiscount > 0 && (
                        <p className="text-red-500">
                          Giảm tối đa: {c.maxDiscount.toLocaleString()}đ
                        </p>
                      )}
                    </div>

                    <p className="text-xs text-gray-400 mt-1">
                      HSD: {new Date(c.endDate).toLocaleDateString("vi-VN")}
                    </p>

                    {/* Báo lỗi nếu không đủ điều kiện */}
                    {!canSelect && (
                      <p className="text-xs text-red-600 flex items-center gap-1 mt-1 font-bold">
                        <AlertCircle className="w-3 h-3" />
                        {isInactive
                          ? "Tạm khóa bởi quản trị viên"
                          : isExpired
                          ? "ĐÃ HẾT HẠN SỬ DỤNG"
                          : !isEligible
                          ? `Cần thêm ${(
                              minSpend - totalPrice
                            ).toLocaleString()}đ`
                          : "Không hợp lệ"}
                      </p>
                    )}
                  </div>

                  {/* Radio Check */}
                  <div className="flex items-center px-4">
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? "border-red-500 bg-red-500"
                          : "border-gray-300"
                      }`}
                    >
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button size="large" onClick={() => setIsCouponModalOpen(false)}>
            Trở lại
          </Button>
          <Button
            size="large"
            type="primary"
            className="bg-red-600 hover:!bg-red-700 w-32"
            onClick={() => {
              handleSelectCoupon(tempSelectedCouponId);
              setIsCouponModalOpen(false);
            }}
          >
            OK
          </Button>
        </div>
      </Modal>
    </div>
  );
}
