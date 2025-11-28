import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ShoppingCartOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { message, Button, Spin } from "antd";
import { Eye, ShoppingCart } from "lucide-react";
import Cookies from "js-cookie";
import { CartContext } from "../../context/CartContext";

export default function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  // State
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  // Context & Auth
  const { refreshCartCount } = useContext(CartContext);
  const token = Cookies.get("jwt");

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `http://localhost:8080/api/products/${productId}`
        );
        if (!res.ok) throw new Error("Không thể tải sản phẩm");
        const data = await res.json();
        setProduct(data);
        setQuantity(1);
      } catch (err) {
        messageApi.error(err.message || "Lỗi tải sản phẩm");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    window.scrollTo(0, 0);
  }, [productId]);

  useEffect(() => {
    if (!productId) return;
    const fetchRelated = async () => {
      try {
        const res = await fetch(
          `http://localhost:8080/api/products/${productId}/related`
        );
        if (!res.ok) throw new Error("Lỗi tải sản phẩm liên quan");
        const data = await res.json();
        setRelatedProducts(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchRelated();
  }, [productId]);

  const handleAddToCart = async (prod, qty = 1) => {
    if (!token) {
      messageApi.warning("Vui lòng đăng nhập để mua hàng!");
      navigate("/login");
      return;
    }

    const selectedProduct = prod || product;

    const finalPrice =
      selectedProduct.discount > 0
        ? selectedProduct.price * (1 - selectedProduct.discount / 100)
        : selectedProduct.price;

    const orderPayload = {
      userId: Cookies.get("user_id"),
      paymentMethodId: null,
      shippingAddress: "",
      customerNote: "",
      couponId: null,
      totalAmount: finalPrice * qty,
      isOrder: false,
      orderStatus: "pending",
      orderDetails: [
        {
          product: { productId: selectedProduct.productId },
          quantity: qty,
          unitPrice: finalPrice,
          originalUnitPrice: selectedProduct.price,
        },
      ],
    };

    try {
      const res = await fetch("http://localhost:8080/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderPayload),
      });

      if (!res.ok) throw new Error("Thêm thất bại");

      messageApi.success({
        content: `Đã thêm ${qty} ${selectedProduct.productName} vào giỏ!`,
        icon: <ShoppingCartOutlined style={{ color: "green" }} />,
      });
      refreshCartCount(Cookies.get("user_id"), token);
    } catch {
      messageApi.error("Không thể thêm vào giỏ hàng. Vui lòng thử lại.");
    }
  };

  // --- LOGIC MUA NGAY ĐÃ ĐƯỢC CẬP NHẬT ---
  const handleBuyNow = () => {
    if (!token) {
      messageApi.warning("Vui lòng đăng nhập để mua hàng!");
      navigate("/login");
      return;
    }

    // Tính toán giá sau khi giảm (nếu có)
    const finalPrice =
      product.discount > 0
        ? product.price * (1 - product.discount / 100)
        : product.price;

    navigate("/checkout", {
      state: {
        // Truyền object product nhưng ghi đè giá bằng giá đã giảm
        // và lưu giá gốc vào field originalPrice để Checkout xử lý
        product: {
            ...product,
            price: finalPrice, // Checkout sẽ dùng giá này để tính tổng tiền
            originalPrice: product.price // Lưu lại giá gốc
        },
        quantity: quantity,
      },
    });
  };
  // ---------------------------------------

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Spin size="large" tip="Đang tải thông tin sản phẩm..." />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p className="mb-4">Không tìm thấy sản phẩm.</p>
        <Button onClick={() => navigate("/")}>Về trang chủ</Button>
      </div>
    );
  }

  const mainDiscount = product.discount || 0;
  const mainFinalPrice = product.price
    ? product.price * (1 - mainDiscount / 100)
    : 0;

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      {contextHolder}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Nút Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-500 hover:text-blue-600 mb-4 sm:mb-6 transition-colors text-sm sm:text-base"
        >
          <ArrowLeftOutlined className="mr-2" /> Quay lại
        </button>

        {/* =========================================
            KHỐI CHI TIẾT SẢN PHẨM (MAIN PRODUCT)
           ========================================= */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 md:p-8 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {/* 1. Ảnh sản phẩm */}
            <div className="rounded-xl overflow-hidden bg-gray-100 border border-gray-100 relative group aspect-square">
              <img
                src={
                  product.imageUrl ||
                  "https://via.placeholder.com/500x500?text=No+Image"
                }
                alt={product.productName}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {mainDiscount > 0 && (
                <div className="absolute top-4 left-4">
                  <span className="bg-red-500 text-white text-xs sm:text-sm font-bold px-3 py-1.5 rounded shadow-sm">
                    -{mainDiscount}%
                  </span>
                </div>
              )}
            </div>

            {/* 2. Thông tin chi tiết */}
            <div className="flex flex-col">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {product.productName}
              </h1>

              {/* KHỐI GIÁ TIỀN */}
              <div className="mb-6 pb-6 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
                  <span className="text-3xl sm:text-4xl font-bold text-red-600">
                    {mainFinalPrice?.toLocaleString("vi-VN")}₫
                  </span>
                  {mainDiscount > 0 && (
                    <span className="text-lg sm:text-xl text-gray-400 line-through font-medium">
                      {product.price?.toLocaleString("vi-VN")}₫
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-gray-500">Tình trạng:</span>
                  <span
                    className={`text-sm font-bold ${
                      product.quantity > 0 ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {product.quantity > 0
                      ? `Còn ${product.quantity} sản phẩm`
                      : "Hết hàng"}
                  </span>
                </div>
              </div>

              {/* Mô tả ngắn */}
              <p className="text-gray-600 mb-8 leading-relaxed text-sm sm:text-base">
                {product.description || "Chưa có mô tả cho sản phẩm này."}
              </p>

              {/* Chọn số lượng */}
              <div className="flex items-center gap-6 mb-8">
                <span className="font-semibold text-gray-700">Số lượng:</span>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden h-10">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-full bg-gray-50 hover:bg-gray-100 text-gray-600 transition flex items-center justify-center font-bold"
                  >
                    -
                  </button>
                  <span className="w-12 h-full flex items-center justify-center font-semibold text-gray-800 bg-white border-x border-gray-100">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity((q) => (q + 1 > product.quantity ? q : q + 1))
                    }
                    className="w-10 h-full bg-gray-50 hover:bg-gray-100 text-gray-600 transition flex items-center justify-center font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Nút hành động */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-auto">
                <button
                  onClick={() => handleAddToCart(product, quantity)}
                  className="flex-1 py-3.5 px-6 border-2 border-blue-600 text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingCartOutlined className="text-xl" />
                  THÊM VÀO GIỎ
                </button>

                <button
                  onClick={handleBuyNow}
                  className="flex-1 py-3.5 px-6 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-md hover:shadow-lg transition-all flex items-center justify-center"
                >
                  MUA NGAY
                </button>
              </div>
            </div>
          </div>

          {/* Tab thông số kỹ thuật */}
          <div className="mt-12 pt-8 border-t border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              Thông tin chi tiết
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-12 text-sm">
              <div className="flex justify-between py-3 border-b border-gray-50">
                <span className="text-gray-500">Kích thước</span>
                <span className="font-medium text-gray-900">
                  {product.size || "Tiêu chuẩn"}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-50">
                <span className="text-gray-500">Màu sắc</span>
                <span className="font-medium text-gray-900">
                  {product.color || "Đa dạng"}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-50">
                <span className="text-gray-500">Chất liệu</span>
                <span className="font-medium text-gray-900">
                  {product.material || "Cao cấp"}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-50">
                <span className="text-gray-500">Bảo hành</span>
                <span className="font-medium text-gray-900">
                  {product.warranty || "12 Tháng"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================
            SẢN PHẨM LIÊN QUAN
           ========================================= */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <span className="w-1.5 h-8 bg-blue-600 rounded-full block"></span>
            Sản phẩm liên quan
          </h2>

          {relatedProducts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <p className="text-gray-500">Chưa có sản phẩm liên quan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((prod) => {
                const final =
                  prod.discount > 0
                    ? prod.price * (1 - prod.discount / 100)
                    : prod.price;

                return (
                  <div
                    key={prod.productId}
                    className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col relative"
                  >
                    {/* Image Area */}
                    <div className="relative pt-[100%] bg-gray-100 overflow-hidden">
                      {prod.discount > 0 && (
                        <span className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded shadow-sm">
                          -{prod.discount}%
                        </span>
                      )}

                      <img
                        src={
                          prod.imageUrl ||
                          "https://via.placeholder.com/400x400?text=No+Image"
                        }
                        alt={prod.productName}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />

                      {/* Hover Overlay Buttons */}
                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 backdrop-blur-[1px]">
                        <button
                          onClick={() => handleAddToCart(prod)}
                          className="bg-white text-gray-800 p-2.5 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-lg transform translate-y-4 group-hover:translate-y-0 duration-300"
                          title="Thêm vào giỏ"
                        >
                          <ShoppingCartOutlined />
                        </button>
                        <Link
                          to={`/product/${prod.productId}`}
                          className="bg-white text-gray-800 p-2.5 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-lg transform translate-y-4 group-hover:translate-y-0 duration-300 delay-75"
                          title="Xem chi tiết"
                        >
                          <Eye size={20} />
                        </Link>
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-3 sm:p-4 flex flex-col flex-grow">
                      <Link
                        to={`/product/${prod.productId}`}
                        className="group-hover:text-blue-600 transition-colors"
                      >
                        <h3 className="font-medium text-gray-800 text-sm sm:text-base line-clamp-2 min-h-[40px] leading-snug mb-2">
                          {prod.productName}
                        </h3>
                      </Link>

                      <div className="mt-auto">
                        <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                          <span className="text-red-600 font-bold text-base sm:text-lg">
                            {final?.toLocaleString("vi-VN")}₫
                          </span>
                          {prod.discount > 0 && (
                            <span className="text-gray-400 text-xs line-through">
                              {prod.price?.toLocaleString("vi-VN")}₫
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Mobile Add Button */}
                      <button
                        onClick={() => handleAddToCart(prod)}
                        className="lg:hidden mt-3 w-full bg-blue-50 text-blue-600 text-xs font-bold py-2 rounded-lg hover:bg-blue-600 hover:text-white transition"
                      >
                        THÊM VÀO GIỎ
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}