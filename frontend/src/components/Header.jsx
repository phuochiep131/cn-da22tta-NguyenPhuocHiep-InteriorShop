import { useState, useEffect, useRef, useContext } from "react";
import { Menu, X, ShoppingCart, User, Lock, LogOut, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import MainMenu from "./MainMenu";
import { message } from "antd";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage(); // ✅ thêm dòng này

  const { user, logout } = useContext(AuthContext);
  const isLoggedIn = !!user;

  // Ẩn menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProfile = () => {
    navigate("/edit-profile");
    setShowUserMenu(false);
  };

  const handleChangePassword = () => {
    navigate("/change-password");
    setShowUserMenu(false);
  };

  const handleLogout = () => {
    logout();
    messageApi.success("Đăng xuất thành công!"); // ✅ dùng messageApi thay vì message
    setShowUserMenu(false);
    navigate("/");
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      {contextHolder} {/* ✅ Thêm context holder */}
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="text-xl md:text-2xl font-bold text-gray-900">
          Nội Thất <span className="text-gray-600">Store</span>
        </div>

        {/* Cart + User */}
        <div className="hidden md:flex space-x-3 items-center relative">
          <button className="text-gray-800 p-2 rounded-md hover:bg-gray-900 hover:text-white transition">
            <ShoppingCart size={20} />
          </button>

          {!isLoggedIn ? (
            <Link
              to="/login"
              className="text-gray-800 px-3 py-2 rounded-md text-sm hover:bg-gray-900 hover:text-white transition flex items-center"
            >
              <User size={20} /> Đăng nhập
            </Link>
          ) : (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 text-gray-800 px-3 py-2 rounded-md text-sm hover:bg-gray-900 hover:text-white transition"
              >
                <User size={20} />
                <span>{user.fullName || user.email}</span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <div className="px-4 py-2 border-b text-sm text-gray-700">
                    <div className="font-medium">{user.fullName || user.email}</div>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <Shield size={14} className="mr-1" />
                      {user.role || "USER"}
                    </div>
                  </div>

                  <button
                    onClick={handleProfile}
                    className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <User size={16} /> Thông tin cá nhân
                  </button>

                  <button
                    onClick={handleChangePassword}
                    className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Lock size={16} /> Đổi mật khẩu
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2 border-t"
                  >
                    <LogOut size={16} /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Nút menu mobile */}
        <button
          className="md:hidden p-2 text-gray-700"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      <MainMenu />
    </header>
  );
}
