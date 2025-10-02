import { useState, useEffect, useRef } from "react"
import { Menu, X, ShoppingCart, User } from "lucide-react"
import { Link } from "react-router-dom"

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const menuRef = useRef(null)

  const handleLogout = () => {
    setIsLoggedIn(false)
    setShowUserMenu(false)
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="text-xl md:text-2xl font-bold text-gray-900">
          Nội Thất <span className="text-gray-600">Store</span>
        </div>

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex space-x-6">
          <Link to="/" className="text-gray-700 hover:text-black">Trang chủ</Link>
          <a href="#" className="text-gray-700 hover:text-black">Sản phẩm</a>
          <a href="#" className="text-gray-700 hover:text-black">Khuyến mãi</a>
          <a href="#" className="text-gray-700 hover:text-black">Liên hệ</a>
        </nav>

        {/* Cart + Login/Logout - Desktop */}
        <div className="hidden md:flex space-x-3 items-center relative">
          <button className="text-gray-800 p-2 rounded-md hover:bg-gray-900 hover:text-white transition">
            <ShoppingCart size={20} />
          </button>

          {!isLoggedIn ? (
            <Link
              to="/login"
              className="text-gray-800 px-3 py-2 rounded-md text-sm hover:bg-gray-900 hover:text-white transition flex items-center"
            >
              <User size={20}/> Đăng nhập
            </Link>
          ) : (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 text-gray-800 px-3 py-2 rounded-md text-sm hover:bg-gray-900 hover:text-white transition"
              >
                <User size={20}/> 
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Thông tin cá nhân</a>
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Đơn hàng</a>
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Cài đặt</a>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hamburger Button - Mobile */}
        <button
          className="md:hidden p-2 text-gray-700"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 px-4 py-3 space-y-3">
          <Link to="/" className="block text-gray-700 hover:text-black">Trang chủ</Link>
          <a href="#" className="block text-gray-700 hover:text-black">Sản phẩm</a>
          <a href="#" className="block text-gray-700 hover:text-black">Khuyến mãi</a>
          <a href="#" className="block text-gray-700 hover:text-black">Liên hệ</a>

          <div className="flex flex-col gap-2">
            <button className="w-full border border-gray-800 text-gray-800 px-3 py-2 rounded-md text-sm hover:bg-gray-900 hover:text-white transition">
              Giỏ hàng
            </button>
            {!isLoggedIn ? (
              <Link
                to="/login"
                className="w-full text-center border border-gray-800 text-gray-800 px-3 py-2 rounded-md text-sm hover:bg-gray-900 hover:text-white transition"
              >
                Đăng nhập
              </Link>
            ) : (
              <>
                <a href="#" className="w-full text-left border border-gray-800 text-gray-800 px-3 py-2 rounded-md text-sm hover:bg-gray-900 hover:text-white transition">Thông tin cá nhân</a>
                <a href="#" className="w-full text-left border border-gray-800 text-gray-800 px-3 py-2 rounded-md text-sm hover:bg-gray-900 hover:text-white transition">Đơn hàng</a>
                <a href="#" className="w-full text-left border border-gray-800 text-gray-800 px-3 py-2 rounded-md text-sm hover:bg-gray-900 hover:text-white transition">Cài đặt</a>
                <button
                  onClick={handleLogout}
                  className="w-full border border-gray-800 text-red-600 px-3 py-2 rounded-md text-sm hover:bg-gray-900 hover:text-white transition"
                >
                  Đăng xuất
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
