import { useState, useEffect } from "react";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";
import { message } from "antd";

export default function Products({ searchTerm = "", priceRange }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState("");
  const [messageApi, contextHolder] = message.useMessage();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const categoryId = params.get("category");

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


  const handleAddToCart = (product) => console.log("Thêm vào giỏ:", product.productName);
  const handleBuyNow = (product) => console.log("Mua ngay:", product.productName);

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
          {filteredProducts.map((prod) => (
            <div
              key={prod.productId}
              className="group bg-white rounded-xl shadow hover:shadow-lg overflow-hidden transition-all duration-300 flex flex-col justify-between"
            >
              <img
                src={prod.imageUrl || "https://via.placeholder.com/300x200?text=No+Image"}
                alt={prod.productName}
                className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-300"
              />

              <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-lg font-semibold text-gray-800 truncate mb-1">
                  {prod.productName}
                </h3>
                <p className="text-red-600 font-bold mb-3">
                  {prod.price?.toLocaleString("vi-VN")} ₫
                </p>

                <div className="mt-auto flex gap-2">
                  <button
                    onClick={() => handleAddToCart(prod)}
                    className="flex-1 flex items-center justify-center gap-1 bg-gray-100 text-gray-800 px-2 py-1.5 rounded text-xs font-medium hover:bg-gray-200 transition"
                  >
                    <ShoppingCartOutlined className="text-[15px]" />

                    Thêm vào <br /> giỏ hàng
                  </button>

                  <button
                    onClick={() => handleBuyNow(prod)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-2 py-1.5 rounded text-xs font-medium transition"
                  >
                    Mua ngay
                  </button>
                </div>

                <Link
                  to={`/product/${prod.productId}`}
                  className="mt-3 block text-center text-sm text-blue-600 hover:text-blue-800 transition"
                >
                  Xem chi tiết
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
