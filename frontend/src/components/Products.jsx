import { useState, useEffect, useContext } from "react";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";
import { message } from "antd";
import { Eye } from "lucide-react";
import Cookies from "js-cookie";
import { CartContext } from "../context/CartContext.jsx";

export default function Products({ searchTerm = "", priceRange }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState("");
  const [messageApi, contextHolder] = message.useMessage();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const categoryId = params.get("category");
  const token = Cookies.get("jwt");

  const { refreshCartCount } = useContext(CartContext);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let url = "http://localhost:8080/api/products";
        if (categoryId) url += `?categoryId=${categoryId}`;

        const res = await fetch(url);
        const data = await res.json();
        setProducts(data);

        if (categoryId) {
          const catRes = await fetch("http://localhost:8080/api/categories");
          const cats = await catRes.json();
          const current = cats.find((c) => c.categoryId === categoryId);
          setCategoryName(current ? current.categoryName : "");
        } else {
          setCategoryName("");
        }
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId]);

  const filteredProducts = products.filter((p) => {
    const matchesName = p.productName.toLowerCase().includes(searchTerm.toLowerCase());
    const price = parseFloat(p.price);
    const matchesPrice =
      (!priceRange?.min || price >= priceRange.min) &&
      (!priceRange?.max || price <= priceRange.max);
    return matchesName && matchesPrice;
  });

  useEffect(() => {
    if (loading) return;
    if (searchTerm.trim() !== "") {
      if (filteredProducts.length > 0) {
        messageApi.success(`Tìm thấy ${filteredProducts.length} sản phẩm phù hợp`);
      } else {
        messageApi.warning("Không tìm thấy sản phẩm nào phù hợp");
      }
    }
  }, [searchTerm, filteredProducts.length, loading]);

  const handleAddToCart = async (product) => {
    const finalPrice = product.discount > 0
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
        let errorMessage = "Thêm vào giỏ hàng thất bại";
        try {
          const errData = await res.json();
          errorMessage = errData.message || errorMessage;
        } catch {
          //
        }
        throw new Error(errorMessage);
      }

      messageApi.success(`Đã thêm ${product.productName} vào giỏ hàng!`);

      refreshCartCount(Cookies.get("user_id"), token);

    } catch (err) {
      console.error(err);
      messageApi.error(err.message || "Không thể thêm vào giỏ hàng. Vui lòng thử lại.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-600">
        Đang tải sản phẩm...
      </div>
    );
  }

  return (
    <div className="mt-10 px-6 max-w-7xl mx-auto">
      {contextHolder}
      <h2 className="text-2xl font-bold mb-6">
        {categoryName ? `Danh mục: ${categoryName}` : "Tất cả sản phẩm"}
      </h2>

      {filteredProducts.length === 0 ? (
        <p className="text-center text-gray-500">Không có sản phẩm nào.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((prod) => {
            const finalPrice = prod.discount > 0
              ? prod.price * (1 - prod.discount / 100)
              : prod.price;

            return (
              <div
                key={prod.productId}
                className="group bg-white rounded-xl shadow hover:shadow-lg overflow-hidden transition-all duration-300 flex flex-col"
              >
                <div className="relative">
                  <img
                    src={prod.imageUrl || "https://via.placeholder.com/300x200?text=No+Image"}
                    alt={prod.productName}
                    className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {prod.discount > 0 && (
                    <span className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-xl shadow">
                      -{prod.discount}%
                    </span>
                  )}
                </div>

                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="text-lg font-semibold text-gray-800 truncate mb-1">
                    {prod.productName}
                  </h3>

                  {prod.discount > 0 ? (
                    <>
                      <p className="text-gray-500 line-through text-sm">
                        {prod.price?.toLocaleString("vi-VN")} ₫
                      </p>
                      <p className="text-red-600 font-bold mb-3">
                        {finalPrice?.toLocaleString("vi-VN")} ₫
                      </p>
                    </>
                  ) : (
                    <p className="text-red-600 font-bold mb-3">
                      {prod.price?.toLocaleString("vi-VN")} ₫
                    </p>
                  )}

                  <div className="mt-auto flex gap-2">
                    <button
                      onClick={() => handleAddToCart(prod)}
                      className="flex-1 flex items-center justify-center gap-1 bg-gray-100 text-gray-800 px-2 py-1.5 rounded text-xs font-medium hover:bg-gray-200 transition"
                    >
                      <ShoppingCartOutlined className="text-[15px]" />
                      Thêm vào <br /> giỏ hàng
                    </button>

                    <Link
                      to={`/product/${prod.productId}`}
                      className="flex-1 flex items-center justify-center gap-1 bg-blue-600 text-white px-2 py-1.5 rounded text-xs font-medium transition"
                    >
                      <Eye className="w-4 h-4 transition-all" />
                      <span className="ml-1">Xem chi tiết</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
