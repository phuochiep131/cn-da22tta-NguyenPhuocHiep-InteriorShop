export default function Footer() {
  return (
    <footer className="bg-black text-gray-300 py-8 mt-10">
      <div className="px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
        
        {/* About */}
        <div>
          <h2 className="text-lg font-semibold text-white">Nội Thất Store</h2>
          <p className="mt-2 text-sm text-gray-400">
            Chuyên cung cấp các sản phẩm nội thất chất lượng, hiện đại và tiện ích cho mọi gia đình.
          </p>
        </div>

        {/* Links */}
        <div>
          <h2 className="text-lg font-semibold text-white">Liên kết</h2>
          <ul className="mt-2 space-y-2 text-sm">
            <li><a href="#" className="hover:text-white">Trang chủ</a></li>
            <li><a href="#" className="hover:text-white">Sản phẩm</a></li>
            <li><a href="#" className="hover:text-white">Khuyến mãi</a></li>
            <li><a href="#" className="hover:text-white">Liên hệ</a></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h2 className="text-lg font-semibold text-white">Liên hệ</h2>
          <p className="mt-2 text-sm text-gray-400">Email: support@noithatstore.vn</p>
          <p className="mt-1 text-sm text-gray-400">Hotline: 0123 456 789</p>
        </div>
      </div>

      <div className="border-t border-gray-700 mt-6 pt-4 text-center text-sm text-gray-500">
        © 2025 Nội Thất Store. All rights reserved.
      </div>
    </footer>
  )
}
