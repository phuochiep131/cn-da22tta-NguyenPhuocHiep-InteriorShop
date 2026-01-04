import { useState, useContext, useRef, useEffect } from "react";
import {
  ShoppingCart,
  User,
  Search,
  LogOut,
  Shield,
  UserCircle,
  Settings,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom"; // Import useSearchParams
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import MainMenu from "./MainMenu";
import { message } from "antd";
import Cookies from "js-cookie";

export default function Header() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { cartCount, refreshCartCount, resetCartCount } =
    useContext(CartContext);
  const { user, logout } = useContext(AuthContext);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // Hook để lấy param từ URL
  const [keyword, setKeyword] = useState(searchParams.get("search") || ""); // Init state từ URL nếu có

  const menuRef = useRef(null);
  const [messageApi, contextHolder] = message.useMessage();

  const isLoggedIn = !!user;

  // Sync input với URL khi URL thay đổi (trường hợp user back/forward)
  useEffect(() => {
    setKeyword(searchParams.get("search") || "");
  }, [searchParams]);

  useEffect(() => {
    if (user) refreshCartCount(Cookies.get("user_id"), Cookies.get("jwt"));
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [user]);

  const handleLogout = () => {
    logout();
    resetCartCount();
    setShowUserMenu(false);
    messageApi.success("Đăng xuất thành công");
    navigate("/");
  };

  // --- XỬ LÝ TÌM KIẾM ---
  const handleSearch = () => {
    if (keyword.trim()) {
      // Chuyển hướng sang trang chứa component Products kèm query param
      // LƯU Ý: Thay '/products' bằng đường dẫn thực tế chứa danh sách sản phẩm của bạn (ví dụ: '/' nếu là trang chủ)
      navigate(`/products?search=${encodeURIComponent(keyword.trim())}`);
    } else {
      // Nếu xóa trắng ô tìm kiếm thì quay về trang sản phẩm gốc
      navigate(`/products`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };
  // ---------------------

  return (
    <header className="bg-white border-b border-gray-200 fixed top-0 w-full z-50 shadow-sm transition-all">
      {contextHolder}

      {/* TẦNG 1: LOGO - SEARCH - ACTIONS */}
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            to="/"
            className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tighter shrink-0"
          >
            NPH <span className="text-blue-600">STORE</span>
          </Link>

          {/* Search Bar (ĐÃ CẬP NHẬT) */}
          <div className="hidden md:flex flex-1 max-w-lg mx-auto relative">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tìm kiếm ghế sofa, bàn ăn..."
              className="w-full pl-10 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm"
            />
            <button
              onClick={handleSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
            >
              <Search size={18} />
            </button>
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              size={18}
            />
          </div>

          {/* Actions: Cart & User (GIỮ NGUYÊN) */}
          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            {/* ... (Phần Cart và User giữ nguyên như code cũ) ... */}
            <button
              onClick={() => navigate("/cart")}
              className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition group"
            >
              <ShoppingCart
                size={24}
                className="group-hover:text-blue-600 transition"
              />
              <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            </button>

            {!isLoggedIn ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="hidden sm:block text-sm font-semibold text-gray-700 hover:text-blue-600 px-2"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-full hover:bg-blue-700 transition shadow-sm"
                >
                  Đăng ký
                </Link>
              </div>
            ) : (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1 pr-3 rounded-full border border-gray-200 hover:shadow-md transition bg-white"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="p-1.5 w-full h-full text-gray-400" />
                    )}
                  </div>
                  <span className="hidden sm:block text-sm font-semibold text-gray-700 max-w-[80px] truncate">
                    {user.fullName}
                  </span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/50">
                      <p className="font-bold text-gray-800 truncate">
                        {user.fullName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="py-1">
                      {user.role === "ADMIN" && (
                        <Link
                          to="/admin"
                          className="px-5 py-2.5 flex items-center gap-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Shield size={16} /> Trang quản trị
                        </Link>
                      )}
                      <Link
                        to="/purchase"
                        className="px-5 py-2.5 flex items-center gap-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                      >
                        <ShoppingCart size={16} /> Đơn mua hàng
                      </Link>
                      <Link
                        to="/edit-profile"
                        className="px-5 py-2.5 flex items-center gap-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Settings size={16} /> Cài đặt tài khoản
                      </Link>
                    </div>
                    <div className="border-t border-gray-100 mt-1 py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-5 py-2.5 flex items-center gap-3 text-sm text-red-600 hover:bg-red-50 font-medium"
                      >
                        <LogOut size={16} /> Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TẦNG 2: MAIN MENU */}
      <MainMenu />
    </header>
  );
}
