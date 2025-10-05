import Slideshow from "../../components/Slideshow"
import Products from "../../components/Products"

export default function Home() {
  return (
    <div className="p-4">
      {/* Slideshow */}
      <Slideshow />

      {/* Search box */}
      <div className="mt-6 flex justify-center">
        <input
          type="text"
          placeholder="Tìm sản phẩm bạn muốn..."
          className="w-full max-w-lg px-4 py-2 border rounded-full shadow-sm focus:ring-2 focus:ring-black focus:outline-none"
        />
      </div>

      {/* Hiển thị sản phẩm */}
      <Products />

      
    </div>
  )
}
