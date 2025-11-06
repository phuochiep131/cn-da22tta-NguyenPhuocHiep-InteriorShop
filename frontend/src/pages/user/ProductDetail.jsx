import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ShoppingCartOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { message } from "antd";
import { Eye } from "lucide-react";

export default function ProductDetail() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();

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

  const handleAddToCart = (prod) => {
    const selected = prod || product;
    messageApi.success(`Đã thêm ${quantity} ${selected.productName} vào giỏ hàng!`);
  };

  const handleBuyNow = () => {
    messageApi.info(`Mua ngay ${quantity} sản phẩm`);
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
                <p className="text-gray-500 line-through">{product.price?.toLocaleString("vi-VN")} ₫</p>
                <p className="text-red-600 text-2xl font-semibold">{finalPrice?.toLocaleString("vi-VN")} ₫ (giảm {discount}%)</p>
              </>
            ) : (
              <p className="text-red-600 text-2xl font-semibold">{product.price?.toLocaleString("vi-VN")} ₫</p>
            )}
          </div>

          <p className="text-gray-700 mb-4">{product.description || "Không có mô tả."}</p>        

          <div className="flex items-center gap-3 mb-6">
            <span className="text-gray-700 font-medium">Số lượng:</span>
            <button
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="px-3 py-1 bg-gray-200 rounded"
            >
              -
            </button>
            <span className="px-4 py-1 border rounded">{quantity}</span>
            <button
              onClick={() =>
                setQuantity(q => {
                  if (q + 1 > product.quantity) {
                    messageApi.warning("Số lượng vượt quá tồn kho!");
                    return q;
                  }
                  return q + 1;
                })
              }
              className="px-3 py-1 bg-gray-200 rounded"
            >
              +
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleAddToCart(product)}
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

      <div className="rounded-lg p-4 mb-6 text-base text-gray-900 space-y-2">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2 pb-1">
          Mô tả sản phẩm
        </h2>
        <p><span className="font-semibold">Kích thước:</span> {product.size || "Không có thông tin"}</p>
        <p><span className="font-semibold">Màu sắc:</span> {product.color || "Không có thông tin"}</p>
        <p><span className="font-semibold">Chất liệu:</span> {product.material || "Không có thông tin"}</p>
        <p><span className="font-semibold">Bảo hành:</span> {product.warranty || "Không có thông tin"}</p>
        <p><span className="font-semibold">Xuất xứ:</span> {product.origin || "Không có thông tin"}</p>
      </div>

      <hr className="border-t-4 border-blue-600 my-10" />

      <div className="mt-10 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Sản phẩm liên quan</h2>

        {relatedProducts.length === 0 ? (
          <p className="text-center text-gray-500 italic">Không có sản phẩm liên quan.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.map((prod) => (
              <div key={prod.productId} className="group bg-white rounded-xl shadow hover:shadow-lg transition-all duration-300">
                <img
                  src={prod.imageUrl || "https://via.placeholder.com/300x200?text=No+Image"}
                  alt={prod.productName}
                  className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-300"
                />

                <div className="p-4 flex flex-col">
                  <h3 className="text-lg font-semibold text-gray-800 truncate mb-1">{prod.productName}</h3>

                  {prod.discount > 0 ? (
                    <>
                      <p className="text-gray-500 line-through text-sm">{prod.price?.toLocaleString("vi-VN")} ₫</p>
                      <p className="text-red-600 font-bold mb-3">{(prod.price * (1 - prod.discount / 100))?.toLocaleString("vi-VN")} ₫</p>
                    </>
                  ) : (
                    <p className="text-red-600 font-bold mb-3">{prod.price?.toLocaleString("vi-VN")} ₫</p>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
