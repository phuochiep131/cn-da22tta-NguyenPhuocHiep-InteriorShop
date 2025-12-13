import { useState, useEffect, useContext } from "react";
import { ShoppingCartOutlined, FilterOutlined } from "@ant-design/icons";
import { Link, useSearchParams } from "react-router-dom"; // Import thêm setSearchParams nếu chưa dùng
import { message, Empty, Spin, Drawer } from "antd";
import { Eye, ShoppingCart, Filter, X, Grid } from "lucide-react"; // Thêm icon Grid
import Cookies from "js-cookie";
import { CartContext } from "../context/CartContext.jsx";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]); // <--- STATE MỚI: Danh sách danh mục
  const [priceRange, setPriceRange] = useState({ min: null, max: null });
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [messageApi, contextHolder] = message.useMessage();

  // Lấy cả setSearchParams để update URL
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get("search") || "";
  const categoryId = searchParams.get("category"); // Lấy ID danh mục đang chọn từ URL

  const token = Cookies.get("jwt");
  const { refreshCartCount } = useContext(CartContext);

  // 1. FETCH CATEGORIES (Chạy 1 lần khi mount)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (error) {
        console.error("Lỗi tải danh mục:", error);
      }
    };
    fetchCategories();
  }, []);

  // 2. FETCH PRODUCTS (Chạy khi URL thay đổi categoryId)
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let url = "http://localhost:8080/api/products";
        // Backend lọc theo category
        if (categoryId) url += `?categoryId=${categoryId}`;

        const res = await fetch(url);
        const data = await res.json();

        // Giữ nguyên logic lọc số lượng > 0 của bạn
        const filtered = data.filter((item) => item.quantity > 0);
        setProducts(filtered);
      } catch (error) {
        console.error("Lỗi tải sản phẩm:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId]); // Khi URL thay đổi param category, cái này tự chạy lại

  // 3. FILTER LOGIC (Client-side cho Search & Price)
  const filteredProducts = products.filter((p) => {
    const matchesName = p.productName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const finalPrice =
      p.discount > 0 ? p.price * (1 - p.discount / 100) : p.price;

    const matchesPrice =
      (!priceRange.min || finalPrice >= priceRange.min) &&
      (!priceRange.max || finalPrice <= priceRange.max);

    return matchesName && matchesPrice;
  });

  // --- XỬ LÝ CHỌN DANH MỤC ---
  const handleCategorySelect = (id) => {
    const newParams = new URLSearchParams(searchParams);

    if (id === null) {
      newParams.delete("category"); // Xóa param nếu chọn "Tất cả"
    } else {
      newParams.set("category", id); // Set param mới
    }

    // Reset lại filter giá khi chuyển danh mục (tuỳ chọn, để UX tốt hơn)
    setPriceRange({ min: null, max: null });

    setSearchParams(newParams); // Update URL -> trigger useEffect fetchProducts
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
    setMobileFilterOpen(false); // Mobile only
  };

  const handleAddToCart = async (product) => {
    if (!token) {
      messageApi.warning("Vui lòng đăng nhập để mua hàng!");
      return;
    }
    if (product.quantity <= 0) {
      messageApi.error("Sản phẩm này đã hết hàng!");
      return;
    }

    const finalPrice =
      product.discount > 0
        ? product.price * (1 - product.discount / 100)
        : product.price;

    const orderPayload = {
      userId: Cookies.get("user_id"),
      paymentMethodId: null,
      shippingAddress: "",
      customerNote: "",
      couponId: null,
      totalAmount: finalPrice,
      isOrder: false,
      orderStatus: "pending",
      orderDetails: [
        {
          product: { productId: product.productId },
          quantity: 1,
          unitPrice: finalPrice,
          originalUnitPrice: product.price,
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

      if (!res.ok) {
        let errorMessage = "Thêm thất bại";
        try {
          const textData = await res.text();
          try {
            const jsonData = JSON.parse(textData);
            errorMessage = jsonData.message || jsonData.error || textData;
          } catch {
            errorMessage = textData;
          }
        } catch (e) {
          console.error("Error parsing response", e);
        }
        throw new Error(errorMessage);
      }

      messageApi.success({
        content: `Đã thêm ${product.productName} vào giỏ!`,
        icon: <ShoppingCartOutlined style={{ color: "green" }} />,
      });
      refreshCartCount(Cookies.get("user_id"), token);
    } catch (error) {
      console.error(error);
      messageApi.error(error.message || "Lỗi kết nối server");
    }
  };

  const FilterContent = () => (
    <div className="space-y-8">
      {/* 1. PHẦN LỌC DANH MỤC (Giao diện Radio giống Giá tiền) */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Grid size={16} /> Danh mục
        </h3>
        <div className="space-y-2">
          {/* Nút Tất cả */}
          <div
            onClick={() => handleCategorySelect(null)}
            className={`cursor-pointer px-3 py-2.5 rounded-lg text-sm transition-all border flex items-center gap-3 ${
              !categoryId
                ? "bg-blue-50 border-blue-200 text-blue-700 font-medium"
                : "border-transparent hover:bg-gray-50 text-gray-600"
            }`}
          >
            {/* Vòng tròn Radio */}
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

          {/* List danh mục từ API */}
          {categories.map((cat) => {
            // Kiểm tra active
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
                {/* Vòng tròn Radio */}
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

      <div className="border-t border-gray-100 pt-6"></div>

      {/* 2. PHẦN LỌC GIÁ (Giữ nguyên) */}
      <div>
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

      {/* Nút Xóa bộ lọc */}
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
        <Spin size="large" tip="Đang tải sản phẩm..." />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {contextHolder}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 mb-4 pt-4">
          <h1 className="text-xl font-bold text-gray-800">
            {categoryId
              ? `Danh mục: ${
                  categories.find(
                    (c) => String(c.categoryId) === String(categoryId)
                  )?.categoryName || "Sản phẩm"
                }`
              : ""}
          </h1>
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden flex items-center justify-center gap-2 bg-white border border-gray-300 px-4 py-2.5 rounded-lg font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition shadow-sm"
          >
            <Filter size={18} />
            Bộ lọc & Sắp xếp
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* SIDEBAR DESKTOP */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-32">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
                <FilterOutlined className="text-blue-600 text-lg" />
                <h2 className="font-bold text-gray-800 text-lg">Bộ lọc</h2>
              </div>
              <FilterContent />
            </div>
          </aside>

          {/* DRAWER MOBILE */}
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
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium hover:underline"
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {filteredProducts.map((prod) => {
                  const finalPrice =
                    prod.discount > 0
                      ? prod.price * (1 - prod.discount / 100)
                      : prod.price;

                  const isOutOfStock = prod.quantity <= 0;

                  return (
                    <div
                      key={prod.productId}
                      className={`group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col relative ${
                        isOutOfStock ? "opacity-75 grayscale-[0.5]" : ""
                      }`}
                    >
                      {/* --- PHẦN HÌNH ẢNH & CARD CONTENT GIỮ NGUYÊN --- */}
                      <div className="relative pt-[100%] bg-gray-100 overflow-hidden">
                        {prod.discount > 0 && !isOutOfStock && (
                          <span className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded shadow-sm">
                            -{prod.discount}%
                          </span>
                        )}
                        {isOutOfStock && (
                          <div className="absolute inset-0 z-20 bg-black/40 flex items-center justify-center">
                            <span className="bg-black text-white px-3 py-1 font-bold text-sm uppercase tracking-wider">
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
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        {!isOutOfStock && (
                          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 backdrop-blur-[1px] z-10">
                            <button
                              onClick={() => handleAddToCart(prod)}
                              className="bg-white text-gray-800 p-2.5 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-lg transform translate-y-4 group-hover:translate-y-0 duration-300"
                              title="Thêm vào giỏ"
                            >
                              <ShoppingCart size={20} />
                            </button>
                            <Link
                              to={`/product/${prod.productId}`}
                              className="bg-white text-gray-800 p-2.5 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-lg transform translate-y-4 group-hover:translate-y-0 duration-300 delay-75"
                              title="Xem chi tiết"
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

                        <div className="mt-auto">
                          <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2 justify-between">
                            <div className="flex gap-2 items-baseline">
                              <span className="text-red-600 font-bold text-base sm:text-lg">
                                {finalPrice?.toLocaleString("vi-VN")}₫
                              </span>
                              {prod.discount > 0 && (
                                <span className="text-gray-400 text-xs line-through">
                                  {prod.price?.toLocaleString("vi-VN")}₫
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleAddToCart(prod)}
                          disabled={isOutOfStock}
                          className={`lg:hidden mt-3 w-full text-xs font-bold py-2 rounded-lg transition ${
                            isOutOfStock
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : "bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white"
                          }`}
                        >
                          {isOutOfStock ? "HẾT HÀNG" : "THÊM VÀO GIỎ"}
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
    </div>
  );
}
