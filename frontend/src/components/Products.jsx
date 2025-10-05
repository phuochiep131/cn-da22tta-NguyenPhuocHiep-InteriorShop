import { useState } from "react"
import { Link } from "react-router-dom"

export default function Products() {
  const [products] = useState([
    { id: 1, name: "Bàn gỗ sồi", price: 2500000, image: "/images/h1.jpg" },
    { id: 2, name: "Ghế sofa nỉ", price: 5500000, image: "/images/h1.jpg" },
    { id: 3, name: "Tủ quần áo 3 cánh", price: 7500000, image: "/images/h1.jpg" },
    { id: 4, name: "Giường ngủ gỗ", price: 9500000, image: "/images/h1.jpg" },
    { id: 5, name: "Kệ tivi hiện đại", price: 3200000, image: "/images/h1.jpg" },
    { id: 6, name: "Bàn làm việc", price: 2800000, image: "/images/h1.jpg" },
    { id: 7, name: "Ghế ăn bọc da", price: 1800000, image: "/images/h1.jpg" },
    { id: 8, name: "Sofa góc L", price: 12500000, image: "/images/h1.jpg" },
  ])

  const [priceFilter, setPriceFilter] = useState("all")      // đã áp dụng
  const [selectedChoice, setSelectedChoice] = useState("all") // đang chọn tạm

  // Lọc sản phẩm theo khoảng giá
  const filteredProducts = products.filter(prod => {
    if (priceFilter === "all") return true
    if (priceFilter === "1") return prod.price < 3000000
    if (priceFilter === "2") return prod.price >= 3000000 && prod.price <= 7000000
    if (priceFilter === "3") return prod.price > 7000000
    return true
  })

  return (
    <div className="mt-10 px-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Sản phẩm nổi bật</h2>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Bộ lọc bên trái */}
        <aside className="md:col-span-1 bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Lọc theo giá</h3>

          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="price"
                value="all"
                checked={selectedChoice === "all"}
                onChange={(e) => setSelectedChoice(e.target.value)}
              />
              <span>Tất cả</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="price"
                value="1"
                checked={selectedChoice === "1"}
                onChange={(e) => setSelectedChoice(e.target.value)}
              />
              <span>Dưới 3 triệu</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="price"
                value="2"
                checked={selectedChoice === "2"}
                onChange={(e) => setSelectedChoice(e.target.value)}
              />
              <span>Từ 3 - 7 triệu</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="price"
                value="3"
                checked={selectedChoice === "3"}
                onChange={(e) => setSelectedChoice(e.target.value)}
              />
              <span>Trên 7 triệu</span>
            </label>
          </div>

          <button
            onClick={() => setPriceFilter(selectedChoice)}
            className="w-full mt-4 px-4 py-2 bg-black text-white rounded-md text-sm hover:bg-gray-800 transition"
          >
            Áp dụng
          </button>
        </aside>

        {/* Danh sách sản phẩm bên phải */}
        <section className="md:col-span-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(prod => (
                <div 
                  key={prod.id} 
                  className="group bg-white rounded-lg shadow hover:shadow-lg overflow-hidden transition"
                >
                  <img 
                    src={prod.image} 
                    alt={prod.name} 
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="p-4">
                    <h3 className="text-lg font-medium text-gray-800">{prod.name}</h3>
                    <p className="text-red-600 font-bold mt-2">
                      {prod.price.toLocaleString("vi-VN")} ₫
                    </p>
                    <Link 
                      to={`/product/${prod.id}`} 
                      className="mt-3 inline-block px-4 py-2 bg-black text-white rounded-md text-sm hover:bg-gray-800 transition"
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">Không có sản phẩm nào phù hợp</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
