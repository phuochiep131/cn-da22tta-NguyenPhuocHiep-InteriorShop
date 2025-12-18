import { useState, useEffect, useContext } from "react";
import {
  ShoppingCartOutlined,
  FilterOutlined,
  ThunderboltFilled,
} from "@ant-design/icons";
import { Link, useSearchParams } from "react-router-dom";
import { message, Empty, Spin, Drawer } from "antd";
import { Eye, ShoppingCart, Filter, X, Grid, Zap, Clock } from "lucide-react";
import Cookies from "js-cookie";
import { CartContext } from "../context/CartContext.jsx";

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

  const timeBoxClass =
    "bg-[#6b2a2a] text-white rounded px-2 py-1 flex items-baseline gap-1 min-w-[65px] justify-center";

  return (
    <div className="flex items-center justify-center gap-3 rounded-lg px-4 py-1.5">
      <div className="flex items-center gap-1.5">
        <Clock size={18} className="text-white" />
        <span className="text-yellow-300 font-bold text-base uppercase tracking-wide">
          Kết thúc trong
        </span>
      </div>

      <div className="flex items-center gap-1.5 font-bold">
        {timeLeft.days > 0 && (
          <>
            <div className={timeBoxClass}>
              <span className="text-lg">{pad(timeLeft.days)}</span>
              <span className="text-xs font-normal">ngày</span>
            </div>
            <span className="text-white">:</span>
          </>
        )}

        <div className={timeBoxClass}>
          <span className="text-lg">{pad(timeLeft.hours)}</span>
          <span className="text-xs font-normal">giờ</span>
        </div>

        <span className="text-white">:</span>

        <div className={timeBoxClass}>
          <span className="text-lg">{pad(timeLeft.minutes)}</span>
          <span className="text-xs font-normal">phút</span>
        </div>

        <span className="text-white">:</span>

        <div className={timeBoxClass}>
          <span className="text-lg">{pad(timeLeft.seconds)}</span>
          <span className="text-xs font-normal">giây</span>
        </div>
      </div>
    </div>
  );
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [flashSale, setFlashSale] = useState(null);
  const [priceRange, setPriceRange] = useState({ min: null, max: null });
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [messageApi, contextHolder] = message.useMessage();
  const [searchParams, setSearchParams] = useSearchParams();

  const searchTerm = searchParams.get("search") || "";
  const categoryId = searchParams.get("category");

  const token = Cookies.get("jwt");
  const { refreshCartCount } = useContext(CartContext);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [catRes, fsRes, prodRes] = await Promise.all([
          fetch("http://localhost:8080/api/categories"),
          fetch("http://localhost:8080/api/flash-sales/current"),
          fetch(
            `http://localhost:8080/api/products${
              categoryId ? `?categoryId=${categoryId}` : ""
            }`
          ),
        ]);

        if (catRes.ok) {
          setCategories(await catRes.json());
        }

        if (fsRes.ok) {
          const text = await fsRes.text();
          if (text) {
            try {
              const fsData = JSON.parse(text);
              if (fsData && fsData.status === "Active") {
                setFlashSale(fsData);
              }
            } catch (e) {
              console.warn("Lỗi parse JSON Flash Sale:", e);
            }
          } else {
            setFlashSale(null);
          }
        }

        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setProducts(prodData);
        }
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categoryId]);

  // --- HELPER ---
  const getProductPriceInfo = (product) => {
    if (flashSale && flashSale.items) {
      const fsItem = flashSale.items.find(
        (item) => item.productId === product.productId
      );
      if (fsItem) {
        const isStillOnSale = fsItem.soldCount < fsItem.quantity;
        if (isStillOnSale) {
          return {
            finalPrice: fsItem.flashSalePrice,
            originalPrice: product.price,
            discountPercent: Math.round(
              ((product.price - fsItem.flashSalePrice) / product.price) * 100
            ),
            isFlashSale: true,
            fsQuantity: fsItem.quantity,
            fsSold: fsItem.soldCount,
          };
        }
      }
    }

    const normalFinalPrice =
      product.discount > 0
        ? product.price * (1 - product.discount / 100)
        : product.price;

    return {
      finalPrice: normalFinalPrice,
      originalPrice: product.price,
      discountPercent: product.discount,
      isFlashSale: false,
    };
  };

  // --- [ĐÃ SỬA] LỌC SẢN PHẨM HẾT SUẤT FLASH SALE ---
  const flashSaleList =
    flashSale?.items
      // 1. Lọc bỏ những item đã bán hết suất (soldCount >= quantity)
      ?.filter((fsItem) => fsItem.soldCount < fsItem.quantity)
      // 2. Sau đó mới map sang thông tin sản phẩm đầy đủ
      ?.map((fsItem) => {
        const fullProduct = products.find(
          (p) => p.productId === fsItem.productId
        );
        return fullProduct;
      })
      .filter(Boolean) || [];

  // --- FILTER ---
  const filteredProducts = products.filter((p) => {
    const matchesName = p.productName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const { finalPrice } = getProductPriceInfo(p);
    const matchesPrice =
      (!priceRange.min || finalPrice >= priceRange.min) &&
      (!priceRange.max || finalPrice <= priceRange.max);

    return matchesName && matchesPrice;
  });

  const handleCategorySelect = (id) => {
    const newParams = new URLSearchParams(searchParams);
    if (id === null) newParams.delete("category");
    else newParams.set("category", id);
    setPriceRange({ min: null, max: null });
    setSearchParams(newParams);
    setMobileFilterOpen(false);
  };

  const priceOptions = [
    { label: "Dưới 1 triệu", min: 0, max: 1000000 },
    { label: "1 triệu - 3 triệu", min: 1000000, max: 3000000 },
    { label: "3 triệu - 7 triệu", min: 3000000, max: 7000000 },
    { label: "Trên 7 triệu", min: 7000000, max: Infinity },
  ];

  const handlePriceFilter = (opt) => {
    if (priceRange.min === opt.min && priceRange.max === opt.max) {
      setPriceRange({ min: null, max: null });
    } else {
      setPriceRange({ min: opt.min, max: opt.max });
    }
    setMobileFilterOpen(false);
  };

  // --- LOGIC MUA HÀNG ---
  const handleAddToCart = async (product) => {
    if (!token) {
      messageApi.warning("Vui lòng đăng nhập!");
      return;
    }

    const { finalPrice, isFlashSale, fsQuantity, fsSold } =
      getProductPriceInfo(product);

    // Kiểm tra tồn kho trước khi gửi request
    if (isFlashSale) {
      if (fsSold >= fsQuantity) {
        messageApi.error("Sản phẩm Flash Sale này đã hết suất!");
        return;
      }
    } else if (product.quantity <= 0) {
      messageApi.error("Sản phẩm đã hết hàng!");
      return;
    }

    const orderPayload = {
      userId: Cookies.get("user_id"),
      totalAmount: finalPrice,
      orderStatus: "pending",
      shippingAddress: "cart",
      isOrder: 0,
      orderDetails: [
        {
          product: { productId: product.productId },
          quantity: 1,
          unitPrice: finalPrice,
          originalUnitPrice: product.price,
          isFlashSale: isFlashSale ? 1 : 0,
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
        content: `Đã thêm ${product.productName} vào giỏ!`,
        icon: <ShoppingCartOutlined style={{ color: "green" }} />,
      });
      refreshCartCount(Cookies.get("user_id"), token);
    } catch {
      messageApi.error("Lỗi kết nối server");
    }
  };

  const ProductCard = ({ prod, isFsSection = false }) => {
    const {
      finalPrice,
      originalPrice,
      discountPercent,
      isFlashSale,
      fsSold,
      fsQuantity,
    } = getProductPriceInfo(prod);
    const isOutOfStock = prod.quantity <= 0;
    const soldPercent = isFlashSale
      ? Math.round((fsSold / fsQuantity) * 100)
      : 0;

    return (
      <div
        className={`group bg-white rounded-xl border ${
          isFsSection
            ? "border-orange-200 shadow-md min-w-[220px]"
            : "border-gray-100"
        } overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col relative`}
      >
        <div className="relative pt-[100%] bg-gray-100 overflow-hidden">
          {discountPercent > 0 && !isOutOfStock && (
            <div
              className={`absolute top-2 left-2 z-10 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1 ${
                isFlashSale ? "bg-orange-600" : "bg-red-500"
              }`}
            >
              {isFlashSale && <Zap size={10} fill="currentColor" />} -
              {discountPercent}%
            </div>
          )}

          {isOutOfStock && (
            <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center backdrop-blur-[1px]">
              <span className="text-white font-bold text-lg border-2 border-white px-4 py-1 tracking-widest uppercase transform -rotate-12">
                Hết hàng
              </span>
            </div>
          )}

          <img
            src={
              prod.imageUrl ||
              "https://via.placeholder.com/400x400?text=No+Image"
            }
            alt={prod.productName}
            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${
              isOutOfStock ? "grayscale" : ""
            }`}
          />

          {!isOutOfStock && (
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 backdrop-blur-[1px] z-10">
              <button
                onClick={() => handleAddToCart(prod)}
                className="bg-white text-gray-800 p-2.5 rounded-full hover:bg-blue-600 hover:text-white shadow-lg"
              >
                <ShoppingCart size={20} />
              </button>
              <Link
                to={`/product/${prod.productId}`}
                className="bg-white text-gray-800 p-2.5 rounded-full hover:bg-blue-600 hover:text-white shadow-lg"
              >
                <Eye size={20} />
              </Link>
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col flex-grow">
          <Link
            to={`/product/${prod.productId}`}
            className="group-hover:text-blue-600 transition-colors"
          >
            <h3 className="font-medium text-gray-800 text-sm sm:text-base line-clamp-2 min-h-[40px] leading-snug mb-2">
              {prod.productName}
            </h3>
          </Link>

          {isFlashSale && isFsSection && !isOutOfStock && (
            <div className="mb-3">
              <div className="relative w-full h-3 bg-orange-100 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 to-red-500"
                  style={{ width: `${soldPercent}%` }}
                ></div>
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white uppercase drop-shadow-md">
                  {soldPercent >= 90 ? "Sắp hết" : `Đã bán ${fsSold}`}
                </span>
              </div>
            </div>
          )}

          <div className="mt-auto">
            <div className="flex gap-2 items-baseline flex-wrap">
              <span
                className={`font-bold text-base sm:text-lg ${
                  isOutOfStock
                    ? "text-gray-400"
                    : isFlashSale
                    ? "text-orange-600"
                    : "text-red-600"
                }`}
              >
                {finalPrice?.toLocaleString("vi-VN")}₫
              </span>
              {discountPercent > 0 && !isOutOfStock && (
                <span className="text-gray-400 text-xs line-through">
                  {originalPrice?.toLocaleString("vi-VN")}₫
                </span>
              )}
            </div>
          </div>

          {!isOutOfStock && (
            <button
              onClick={() => handleAddToCart(prod)}
              className={`mt-3 w-full text-xs font-bold py-2 rounded-lg transition 
                        ${
                          isFlashSale
                            ? "bg-orange-100 text-orange-600 hover:bg-orange-600 hover:text-white lg:hidden"
                            : "bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white lg:hidden"
                        }`}
            >
              {isFlashSale ? "MUA NGAY" : "THÊM VÀO GIỎ"}
            </button>
          )}
        </div>
      </div>
    );
  };

  const FilterContent = () => (
    <div className="space-y-8">
      {/* Category Filter */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Grid size={16} /> Danh mục
        </h3>
        <div className="space-y-2">
          <div
            onClick={() => handleCategorySelect(null)}
            className={`cursor-pointer px-3 py-2.5 rounded-lg text-sm transition-all border flex items-center gap-3 ${
              !categoryId
                ? "bg-blue-50 border-blue-200 text-blue-700 font-medium"
                : "border-transparent hover:bg-gray-50 text-gray-600"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                !categoryId ? "border-blue-600" : "border-gray-300"
              }`}
            >
              {!categoryId && (
                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
              )}
            </div>
            <span>Tất cả sản phẩm</span>
          </div>
          {categories.map((cat) => {
            const isActive = String(categoryId) === String(cat.categoryId);
            return (
              <div
                key={cat.categoryId}
                onClick={() => handleCategorySelect(cat.categoryId)}
                className={`cursor-pointer px-3 py-2.5 rounded-lg text-sm transition-all border flex items-center gap-3 ${
                  isActive
                    ? "bg-blue-50 border-blue-200 text-blue-700 font-medium"
                    : "border-transparent hover:bg-gray-50 text-gray-600"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                    isActive ? "border-blue-600" : "border-gray-300"
                  }`}
                >
                  {isActive && (
                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  )}
                </div>
                <span>{cat.categoryName}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Price Filter */}
      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
          Khoảng giá
        </h3>
        <div className="space-y-2">
          {priceOptions.map((opt, i) => {
            const isChecked =
              priceRange.min === opt.min && priceRange.max === opt.max;
            return (
              <div
                key={i}
                onClick={() => handlePriceFilter(opt)}
                className={`cursor-pointer px-3 py-2.5 rounded-lg text-sm transition-all border flex items-center gap-3 ${
                  isChecked
                    ? "bg-blue-50 border-blue-200 text-blue-700 font-medium"
                    : "border-transparent hover:bg-gray-50 text-gray-600"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                    isChecked ? "border-blue-600" : "border-gray-300"
                  }`}
                >
                  {isChecked && (
                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  )}
                </div>
                {opt.label}
              </div>
            );
          })}
        </div>
      </div>

      {(priceRange.min !== null || priceRange.max !== null || categoryId) && (
        <button
          onClick={() => {
            setPriceRange({ min: null, max: null });
            handleCategorySelect(null);
          }}
          className="w-full py-2.5 text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition mt-4"
        >
          Xóa tất cả bộ lọc
        </button>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex justify-center items-center">
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {contextHolder}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* FLASH SALE AREA */}
        {flashSale && flashSaleList.length > 0 && (
          <div className="mt-6 mb-8">
            <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-t-xl p-4 flex flex-wrap items-center justify-between text-white shadow-lg gap-4">
              <div className="flex items-center gap-3">
                <ThunderboltFilled className="text-3xl text-yellow-300 animate-pulse" />
                <div>
                  <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-wider text-white drop-shadow-md">
                    {flashSale.name}
                  </h2>
                </div>
              </div>

              <FlashSaleTimer endDate={flashSale.endDate} />
            </div>

            <div className="bg-orange-50 border-x border-b border-orange-200 p-4 rounded-b-xl shadow-sm">
              <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide">
                {flashSaleList.map((prod) => (
                  <div
                    key={prod.productId}
                    className="flex-shrink-0 w-[200px] sm:w-[220px]"
                  >
                    <ProductCard prod={prod} isFsSection={true} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MAIN LIST */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 mb-4 pt-4">
          <h1 className="text-xl font-bold text-gray-800">
            {categoryId
              ? `Danh mục: ${
                  categories.find(
                    (c) => String(c.categoryId) === String(categoryId)
                  )?.categoryName || "Sản phẩm"
                }`
              : "Tất cả sản phẩm"}
          </h1>
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden flex items-center justify-center gap-2 bg-white border border-gray-300 px-4 py-2.5 rounded-lg font-medium text-gray-700 shadow-sm"
          >
            <Filter size={18} /> Bộ lọc & Sắp xếp
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-32">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
                <FilterOutlined className="text-blue-600 text-lg" />
                <h2 className="font-bold text-gray-800 text-lg">Bộ lọc</h2>
              </div>
              <FilterContent />
            </div>
          </aside>

          <Drawer
            title="Bộ lọc sản phẩm"
            placement="right"
            onClose={() => setMobileFilterOpen(false)}
            open={mobileFilterOpen}
            width={320}
            closeIcon={<X size={20} />}
          >
            <FilterContent />
          </Drawer>

          <div className="flex-1">
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-16 flex flex-col items-center justify-center text-center">
                <Empty description="Không tìm thấy sản phẩm nào phù hợp" />
                <button
                  onClick={() => {
                    setPriceRange({ min: null, max: null });
                    handleCategorySelect(null);
                  }}
                  className="mt-4 text-blue-600 font-medium hover:underline"
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {filteredProducts.map((prod) => (
                  <ProductCard
                    key={prod.productId}
                    prod={prod}
                    isFsSection={false}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
