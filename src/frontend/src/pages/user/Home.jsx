import Slideshow from "../../components/Slideshow";
import Products from "../../components/Products";

export default function Home() {
  return (
    <div className="animate-in fade-in duration-500">
      {/* Slideshow Banner */}
      <section className="mb-8">
        <Slideshow />
      </section>

      {/* Danh sách sản phẩm */}
      {/* Component Products tự quản lý việc hiển thị sản phẩm, phân trang và bộ lọc riêng của nó */}
      <section>
        <Products />
      </section>
    </div>
  );
}
