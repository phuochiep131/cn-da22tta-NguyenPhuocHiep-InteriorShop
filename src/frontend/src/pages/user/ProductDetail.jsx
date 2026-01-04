import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ShoppingCartOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  ThunderboltFilled,
} from "@ant-design/icons";
import { message, Button, Spin, Rate, Tabs, Avatar } from "antd";
import { Eye, Clock, Zap } from "lucide-react"; // Thêm icon
import Cookies from "js-cookie";
import { CartContext } from "../../context/CartContext";

// --- COMPONENT TIMER (Copy từ Products.jsx) ---
const FlashSaleTimer = ({ endDate }) => {
  const calculateTimeLeft = () => {
    const difference = +new Date(endDate) - +new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    } else {
      return null;
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  if (!timeLeft)
    return <span className="text-sm font-bold text-white">Đã kết thúc</span>;
  const pad = (n) => String(n).padStart(2, "0");

  return (
    <div className="flex items-center gap-2 text-white font-bold bg-black/20 px-3 py-1 rounded-lg">
      <Clock size={16} />
      <span>
        {timeLeft.days > 0 ? `${pad(timeLeft.days)}d : ` : ""}
        {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
      </span>
    </div>
  );
};

export default function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  // State Product
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  // State Flash Sale
  const [flashSale, setFlashSale] = useState(null); // [NEW]

  // State Reviews
  const [reviews, setReviews] = useState([]);
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Check purchase
  const [hasPurchased, setHasPurchased] = useState(false);

  // Context & Auth
  const { refreshCartCount } = useContext(CartContext);
  const token = Cookies.get("jwt");
  const currentUserId = Cookies.get("user_id");

  // --- 1. FETCH FLASH SALE (MỚI) ---
  useEffect(() => {
    const fetchFlashSale = async () => {
      try {
        const res = await fetch(
          "http://localhost:8080/api/flash-sales/current"
        );
        if (res.ok) {
          const text = await res.text();
          if (text) {
            const data = JSON.parse(text);
            if (data && data.status === "Active") {
              setFlashSale(data);
            }
          }
        }
      } catch (e) {
        console.warn("Lỗi Flash Sale:", e);
      }
    };
    fetchFlashSale();
  }, []);

  // --- 2. FETCH PRODUCT ---
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

  // --- FETCH RELATED & REVIEWS & PURCHASE STATUS (Giữ nguyên) ---
  useEffect(() => {
    if (!productId) return;
    const fetchRelated = async () => {
      try {
        const res = await fetch(
          `http://localhost:8080/api/products/${productId}/related`
        );
        if (res.ok) setRelatedProducts(await res.json());
      } catch (err) {
        console.error(err);
      }
    };
    fetchRelated();

    const fetchReviews = async () => {
      try {
        const res = await fetch(
          `http://localhost:8080/api/reviews/product/${productId}`
        );
        if (res.ok) setReviews((await res.json()).reverse());
      } catch (error) {
        console.error(error);
      }
    };
    fetchReviews();
  }, [productId]);

  useEffect(() => {
    if (!token || !currentUserId || !productId) return;
    const checkPurchaseStatus = async () => {
      try {
        const res = await fetch(
          `http://localhost:8080/api/orders/user/${currentUserId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const orders = await res.json();
          const bought = orders.some((order) => {
            const isDelivered =
              (order.orderStatus || "").toLowerCase() === "delivered";
            if (!isDelivered) return false;
            return order.orderDetails.some(
              (detail) =>
                detail.product?.productId.toString() === productId.toString()
            );
          });
          setHasPurchased(bought);
        }
      } catch (error) {
        console.error(error);
      }
    };
    checkPurchaseStatus();
  }, [currentUserId, productId, token]);

  // --- 3. HELPER: TÍNH GIÁ & FLASH SALE (Copy logic từ Products.jsx) ---
  const getProductPriceInfo = (prod) => {
    if (!prod) return {};

    // Kiểm tra trong Flash Sale
    if (flashSale && flashSale.items) {
      const fsItem = flashSale.items.find(
        (item) => item.productId === prod.productId
      );
      if (fsItem) {
        // Còn suất Flash Sale không?
        const isStillOnSale = fsItem.soldCount < fsItem.quantity;
        if (isStillOnSale) {
          return {
            finalPrice: fsItem.flashSalePrice,
            originalPrice: prod.price,
            discountPercent: Math.round(
              ((prod.price - fsItem.flashSalePrice) / prod.price) * 100
            ),
            isFlashSale: true,
            fsQuantity: fsItem.quantity,
            fsSold: fsItem.soldCount,
            // Số lượng tối đa có thể mua theo Flash Sale
            maxAvailable: fsItem.quantity - fsItem.soldCount,
          };
        }
      }
    }

    // Giá thường
    const normalFinalPrice =
      prod.discount > 0 ? prod.price * (1 - prod.discount / 100) : prod.price;

    return {
      finalPrice: normalFinalPrice,
      originalPrice: prod.price,
      discountPercent: prod.discount,
      isFlashSale: false,
      maxAvailable: prod.quantity,
    };
  };

  // --- LẤY THÔNG TIN SẢN PHẨM HIỆN TẠI ---
  const {
    finalPrice,
    originalPrice,
    discountPercent,
    isFlashSale,
    fsSold,
    fsQuantity,
    maxAvailable,
  } = getProductPriceInfo(product);

  const isOutOfStock = product?.quantity <= 0;
  // Thanh phần trăm Flash Sale
  const soldPercent = isFlashSale ? Math.round((fsSold / fsQuantity) * 100) : 0;

  // --- 4. HANDLE ADD TO CART (Cập nhật logic) ---
  const handleAddToCart = async (prod, qty = 1) => {
    if (!token) {
      messageApi.warning("Vui lòng đăng nhập để mua hàng!");
      navigate("/login");
      return;
    }

    const selectedProduct = prod || product;

    // Sử dụng logic giá chuẩn hóa
    const priceInfo = getProductPriceInfo(selectedProduct);

    // Check tồn kho & Flash Sale limit
    if (priceInfo.isFlashSale) {
      if (qty > priceInfo.maxAvailable) {
        messageApi.warning(
          `Chỉ còn ${priceInfo.maxAvailable} suất Flash Sale!`
        );
        return;
      }
    } else if (selectedProduct.quantity <= 0) {
      messageApi.info(
        "Sản phẩm đang hết hàng. Bạn đang đặt trước sản phẩm này."
      );
    }

    const orderPayload = {
      userId: Cookies.get("user_id"),
      totalAmount: priceInfo.finalPrice * qty,
      orderStatus: "pending",
      shippingAddress: "cart",
      isOrder: 0,
      orderDetails: [
        {
          product: { productId: selectedProduct.productId },
          quantity: qty,
          unitPrice: priceInfo.finalPrice,
          originalUnitPrice: selectedProduct.price,
          isFlashSale: priceInfo.isFlashSale ? 1 : 0, // [QUAN TRỌNG] Gửi cờ
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
      refreshCartCount(currentUserId, token);
    } catch {
      messageApi.error("Không thể thêm vào giỏ hàng. Vui lòng thử lại.");
    }
  };

  // --- 5. HANDLE BUY NOW (Cập nhật logic) ---
  const handleBuyNow = () => {
    if (!token) {
      messageApi.warning("Vui lòng đăng nhập để mua hàng!");
      navigate("/login");
      return;
    }

    // Check tồn kho
    if (isFlashSale) {
      if (quantity > maxAvailable) {
        messageApi.warning(`Chỉ còn ${maxAvailable} suất Flash Sale!`);
        return;
      }
    } else if (isOutOfStock || quantity > product.quantity) {
      messageApi.warning("Sản phẩm không đủ số lượng!");
      return;
    }

    navigate("/checkout", {
      state: {
        product: {
          ...product,
          price: finalPrice, // Giá đã tính toán (Flash Sale hoặc thường)
          originalPrice: product.price,
          isFlashSale: isFlashSale, // [QUAN TRỌNG] Truyền cờ sang Checkout
        },
        quantity: quantity,
      },
    });
  };

  const handleSubmitReview = async () => {
    /* Giữ nguyên logic cũ */
    if (!token) {
      messageApi.warning("Vui lòng đăng nhập để đánh giá!");
      return;
    }
    if (!commentInput.trim()) {
      messageApi.warning("Vui lòng nhập nội dung đánh giá!");
      return;
    }
    setSubmittingReview(true);
    try {
      const payload = {
        userId: currentUserId,
        productId: productId,
        rating: ratingInput,
        comment: commentInput,
      };
      const res = await fetch("http://localhost:8080/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Gửi đánh giá thất bại");
      const newReview = await res.json();
      setReviews([newReview, ...reviews]);
      setCommentInput("");
      setRatingInput(5);
      messageApi.success("Cảm ơn bạn đã đánh giá sản phẩm!");
    } catch (error) {
      messageApi.error("Lỗi: " + error.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
        ).toFixed(1)
      : 0;

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Spin size="large" />
      </div>
    );
  if (!product)
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p>Không tìm thấy sản phẩm.</p>
        <Button onClick={() => navigate("/")}>Về trang chủ</Button>
      </div>
    );

  // Tabs
  const tabsItems = [
    {
      key: "1",
      label: "Chi tiết & Thông số",
      children: (
        <div className="py-4">
          {/* Giữ nguyên nội dung Tab chi tiết */}
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Thông số kỹ thuật
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
            <div className="flex justify-between py-3 border-b border-gray-50">
              <span className="text-gray-500">Xuất xứ</span>
              <span className="font-medium text-gray-900">
                {product.origin || "Việt Nam"}
              </span>
            </div>
          </div>
          <div className="mt-8">
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Mô tả sản phẩm
            </h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
              {product.description || "Chưa có mô tả chi tiết."}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "2",
      label: `Đánh giá khách hàng (${reviews.length})`,
      children: (
        <div className="py-4">
          {/* Giữ nguyên nội dung Tab đánh giá */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-gray-50 p-6 rounded-xl text-center mb-6">
                <h4 className="text-gray-500 mb-1">Đánh giá trung bình</h4>
                <div className="text-5xl font-bold text-gray-800 mb-2">
                  {averageRating}/5
                </div>
                <Rate
                  disabled
                  allowHalf
                  value={parseFloat(averageRating)}
                  className="text-yellow-400 text-lg"
                />
                <div className="text-sm text-gray-400 mt-2">
                  ({reviews.length} nhận xét)
                </div>
              </div>
              <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
                <h4 className="font-bold text-gray-800 mb-4">
                  Viết đánh giá của bạn
                </h4>
                {!token ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500 mb-3 text-sm">
                      Vui lòng đăng nhập để viết đánh giá
                    </p>
                    <Button onClick={() => navigate("/login")}>
                      Đăng nhập ngay
                    </Button>
                  </div>
                ) : !hasPurchased ? (
                  <div className="text-center py-4 bg-yellow-50 rounded-lg border border-yellow-100 p-4">
                    <ShoppingCartOutlined className="text-2xl text-yellow-500 mb-2" />
                    <p className="text-gray-700 font-semibold text-sm mb-1">
                      Chưa mua sản phẩm
                    </p>
                    <p className="text-gray-500 text-xs">
                      Bạn cần mua sản phẩm này và nhận hàng thành công để có thể
                      viết đánh giá.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <span className="block text-sm text-gray-600 mb-2">
                        Bạn chấm sản phẩm này bao nhiêu sao?
                      </span>
                      <Rate
                        value={ratingInput}
                        onChange={setRatingInput}
                        className="text-yellow-400 text-2xl"
                      />
                    </div>
                    <div className="mb-4">
                      <textarea
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 transition"
                        rows="4"
                        placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                      ></textarea>
                    </div>
                    <Button
                      type="primary"
                      onClick={handleSubmitReview}
                      loading={submittingReview}
                      className="w-full h-10 bg-blue-600 hover:bg-blue-500 border-none font-semibold"
                    >
                      Gửi đánh giá
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="lg:col-span-2">
              <h4 className="font-bold text-gray-800 mb-4 text-lg">
                Nhận xét gần đây
              </h4>
              {reviews.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-gray-300 rounded-xl">
                  <p className="text-gray-400">
                    Chưa có đánh giá nào cho sản phẩm này.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {reviews.map((rev) => (
                    <div
                      key={rev.reviewId}
                      className="flex gap-4 border-b border-gray-100 pb-6 last:border-0"
                    >
                      <Avatar
                        icon={<UserOutlined />}
                        size="large"
                        className="flex-shrink-0 bg-gray-200"
                      />
                      <div className="flex-grow">
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <span className="font-bold text-gray-800 block">
                              {rev.userName || "Người dùng ẩn danh"}
                            </span>
                            <span className="text-xs text-gray-400">
                              {rev.createdAt
                                ? new Date(rev.createdAt).toLocaleString(
                                    "vi-VN"
                                  )
                                : ""}
                            </span>
                          </div>
                          <Rate
                            disabled
                            value={rev.rating}
                            className="text-yellow-400 text-xs"
                          />
                        </div>
                        <p className="text-gray-600 text-sm mt-2 bg-gray-50 p-3 rounded-lg">
                          {rev.comment}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      {contextHolder}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-500 hover:text-blue-600 mb-4 sm:mb-6 transition-colors text-sm sm:text-base"
        >
          <ArrowLeftOutlined className="mr-2" /> Quay lại
        </button>

        {/* --- MAIN PRODUCT INFO --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 md:p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {/* IMAGE SECTION */}
            <div className="rounded-xl overflow-hidden bg-gray-100 border border-gray-100 relative group aspect-square">
              {isOutOfStock && (
                <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center backdrop-blur-[1px]">
                  <span className="text-white font-bold text-2xl border-4 border-white px-6 py-2 tracking-widest uppercase transform -rotate-12">
                    Hết hàng
                  </span>
                </div>
              )}

              <img
                src={
                  product.imageUrl ||
                  "https://via.placeholder.com/500x500?text=No+Image"
                }
                alt={product.productName}
                className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                  isOutOfStock ? "grayscale" : ""
                }`}
              />

              {/* Discount Badge */}
              {discountPercent > 0 && !isOutOfStock && (
                <div
                  className={`absolute top-4 left-4 z-10 text-white text-sm font-bold px-3 py-1.5 rounded shadow-sm flex items-center gap-1 ${
                    isFlashSale ? "bg-orange-600" : "bg-red-500"
                  }`}
                >
                  {isFlashSale && <Zap size={14} fill="currentColor" />}-
                  {discountPercent}%
                </div>
              )}
            </div>

            {/* INFO SECTION */}
            <div className="flex flex-col">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 leading-tight">
                {product.productName}
              </h1>

              {/* FLASH SALE BANNER (MỚI) */}
              {isFlashSale && !isOutOfStock && (
                <div className="mb-4 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg p-3 text-white shadow-md">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ThunderboltFilled className="text-xl text-yellow-300 animate-pulse" />
                      <span className="font-bold italic uppercase">
                        Flash Sale
                      </span>
                    </div>
                    <FlashSaleTimer endDate={flashSale.endDate} />
                  </div>
                  {/* Progress Bar */}
                  <div className="mt-3 relative w-full h-4 bg-black/20 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-yellow-400"
                      style={{ width: `${soldPercent}%` }}
                    ></div>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-black/70 uppercase">
                      {soldPercent >= 90 ? "Sắp hết" : `Đã bán ${fsSold}`}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 mb-4">
                <Rate
                  disabled
                  allowHalf
                  value={parseFloat(averageRating)}
                  className="text-yellow-400 text-sm"
                />
                <span className="text-sm text-gray-500">
                  ({reviews.length} đánh giá)
                </span>
              </div>

              {/* Price */}
              <div className="mb-6 pb-6 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
                  <span
                    className={`text-3xl sm:text-4xl font-bold ${
                      isFlashSale ? "text-orange-600" : "text-red-600"
                    }`}
                  >
                    {finalPrice?.toLocaleString("vi-VN")}₫
                  </span>
                  {discountPercent > 0 && (
                    <span className="text-lg sm:text-xl text-gray-400 line-through font-medium">
                      {originalPrice?.toLocaleString("vi-VN")}₫
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-gray-500">Tình trạng:</span>
                  {isOutOfStock ? (
                    <span className="text-sm font-bold text-red-500">
                      Hết hàng
                    </span>
                  ) : isFlashSale ? (
                    <span className="text-sm font-bold text-orange-600 animate-pulse">
                      Đang trong Flash Sale (Còn {maxAvailable} suất)
                    </span>
                  ) : (
                    <span className="text-sm font-bold text-green-600">
                      Còn {product.quantity} sản phẩm
                    </span>
                  )}
                </div>
              </div>

              <p className="text-gray-600 mb-8 leading-relaxed text-sm sm:text-base line-clamp-3">
                {product.description || "Chưa có mô tả chi tiết."}
              </p>

              {/* Quantity */}
              <div className="flex items-center gap-6 mb-8">
                <span className="font-semibold text-gray-700">Số lượng:</span>
                <div
                  className={`flex items-center border border-gray-300 rounded-lg overflow-hidden h-10`}
                >
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
                      setQuantity((q) => {
                        if (isFlashSale) {
                          return q + 1 > maxAvailable ? q : q + 1;
                        }
                        if (isOutOfStock) {
                          return q + 1;
                        }
                        return q + 1 > product.quantity ? q : q + 1;
                      })
                    }
                    className="w-10 h-full bg-gray-50 hover:bg-gray-100 text-gray-600 transition flex items-center justify-center font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Buttons Action */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-auto">
                <button
                  onClick={() => handleAddToCart(product, quantity)}
                  disabled={false}
                  className={`flex-1 py-3.5 px-6 border-2 font-bold rounded-lg transition-colors flex items-center justify-center gap-2
                    ${
                      isFlashSale
                        ? "border-orange-500 text-orange-600 hover:bg-orange-50"
                        : "border-blue-600 text-blue-600 hover:bg-blue-50"
                    }
                  `}
                >
                  <ShoppingCartOutlined className="text-xl" />
                  {isOutOfStock ? "ĐẶT TRƯỚC" : "THÊM VÀO GIỎ"}
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  className={`flex-1 py-3.5 px-6 font-bold rounded-lg shadow-md transition-all flex items-center justify-center
                    ${
                      isOutOfStock
                        ? "bg-gray-300 text-white cursor-not-allowed shadow-none"
                        : isFlashSale
                        ? "bg-orange-600 text-white hover:bg-orange-700 hover:shadow-lg"
                        : "bg-red-600 text-white hover:bg-red-700 hover:shadow-lg"
                    }
                  `}
                >
                  {isOutOfStock ? "HẾT HÀNG" : "MUA NGAY"}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <Tabs defaultActiveKey="1" items={tabsItems} />
          </div>
        </div>

        {/* --- RELATED PRODUCTS (Giữ nguyên logic hiển thị) --- */}
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
                // Logic hiển thị card liên quan đơn giản (như file cũ)
                const final =
                  prod.discount > 0
                    ? prod.price * (1 - prod.discount / 100)
                    : prod.price;
                return (
                  <div
                    key={prod.productId}
                    className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col relative"
                  >
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
                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 backdrop-blur-[1px]">
                        <button
                          onClick={() => handleAddToCart(prod)}
                          className="bg-white text-gray-800 p-2.5 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-lg transform translate-y-4 group-hover:translate-y-0 duration-300"
                        >
                          <ShoppingCartOutlined />
                        </button>
                        <Link
                          to={`/product/${prod.productId}`}
                          className="bg-white text-gray-800 p-2.5 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-lg transform translate-y-4 group-hover:translate-y-0 duration-300 delay-75"
                        >
                          <Eye size={20} />
                        </Link>
                      </div>
                    </div>
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
