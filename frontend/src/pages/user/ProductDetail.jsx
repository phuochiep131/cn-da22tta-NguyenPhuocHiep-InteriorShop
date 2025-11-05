import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ShoppingCartOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { message } from "antd";

export default function ProductDetail() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();

  // ✅ Lấy chi tiết sản phẩm
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:8080/api/products/${productId}`);
        if (!res.ok) throw new Error("Không thể tải sản phẩm");
        const data = await res.json();
        setProduct(data);
      } catch (err) {
        messageApi.error(err.message || "Lỗi tải sản phẩm");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // ✅ Lấy sản phẩm liên quan (gọi khi product đã có)
  useEffect(() => {
    if (!productId) return;
    const fetchRelated = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/products/${productId}/related`);
        if (!res.ok) throw new Error("Không thể tải sản phẩm liên quan");
        const data = await res.json();
        setRelatedProducts(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchRelated();
  }, [productId]);

  const handleAddToCart = () => {
    if (!product) return;
    messageApi.success(`Đã thêm "${product.productName}" vào giỏ hàng!`);
  };

  const handleBuyNow = () => {
    if (!product) return;
    messageApi.info(`Mua ngay "${product.productName}"`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-600">
        Đang tải thông tin sản phẩm...
      </div>
    );
  }

  if (!product) {
    return <p className="text-center text-gray-500">Không tìm thấy sản phẩm.</p>;
  }

  // ✅ Tính giá sau giảm (nếu có)
  const discount = product.discount || 0;
  const finalPrice = product.price ? product.price * (1 - discount / 100) : 0;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {contextHolder}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-blue-600 mb-6"
      >
        <ArrowLeftOutlined className="mr-1" /> Quay lại
      </button>

      {/* Chi tiết sản phẩm */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <img
          src={product.imageUrl || "https://via.placeholder.com/500x400?text=No+Image"}
          alt={product.productName}
          className="w-full h-96 object-cover rounded-lg shadow"
        />

        <div className="flex flex-col">
          <h1 className="text-3xl font-bold mb-2">{product.productName}</h1>

          <div className="mb-4">
            {discount > 0 ? (
              <>
                <p className="text-gray-500 line-through">
                  {product.price?.toLocaleString("vi-VN")} ₫
                </p>
                <p className="text-red-600 text-2xl font-semibold">
                  {finalPrice?.toLocaleString("vi-VN")} ₫ ({discount}% giảm)
                </p>
              </>
            ) : (
              <p className="text-red-600 text-2xl font-semibold">
                {product.price?.toLocaleString("vi-VN")} ₫
              </p>
            )}
          </div>

          <p className="text-gray-700 mb-4">{product.description || "Không có mô tả."}</p>

          <div className="text-sm text-gray-600 mb-4 space-y-1">
            <div>Số lượng: {product.quantity ?? 0}</div>
            <div>Kích cỡ: {product.size || "—"}</div>
            <div>Màu: {product.color || "—"}</div>
            <div>Chất liệu: {product.material || "—"}</div>
            <div>Bảo hành: {product.warranty || "—"}</div>
            <div>Xuất xứ: {product.origin || "—"}</div>
            {product.category && (
              <div>Danh mục: {product.category.categoryName}</div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              className="flex items-center justify-center gap-2 bg-gray-100 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
            >
              <ShoppingCartOutlined /> Thêm vào giỏ hàng
            </button>

            <button
              onClick={handleBuyNow}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition"
            >
              Mua ngay
            </button>
          </div>
        </div>
      </div>

      <hr className="border-t-4 border-blue-600 my-10" />

      
      {/* ✅ Hiển thị sản phẩm liên quan (dạng lưới giống trang danh mục) */}
<div className="mt-10 px-2 sm:px-0 max-w-7xl mx-auto">
  <h2 className="text-2xl font-bold mb-6 text-gray-800">Sản phẩm liên quan</h2>

  {relatedProducts.length === 0 ? (
    <p className="text-center text-gray-500 italic">Không có sản phẩm liên quan.</p>
  ) : (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
      {relatedProducts.map((prod) => (
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

            {/* Hiển thị giá (nếu có giảm giá) */}
            {prod.discount > 0 ? (
              <>
                <p className="text-gray-500 line-through text-sm">
                  {prod.price?.toLocaleString("vi-VN")} ₫
                </p>
                <p className="text-red-600 font-bold mb-3">
                  {(prod.price * (1 - prod.discount / 100))?.toLocaleString("vi-VN")} ₫
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

              <button
                onClick={() => handleBuyNow(prod)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-2 py-1.5 rounded text-xs font-medium transition"
              >
                Mua ngay
              </button>
            </div>

            <button
              onClick={() => navigate(`/product/${prod.productId}`)}
              className="mt-3 block text-center text-sm text-blue-600 hover:text-blue-800 transition"
            >
              Xem chi tiết
            </button>
          </div>
        </div>
      ))}
    </div>
  )}
</div>

    </div>
  );
}
