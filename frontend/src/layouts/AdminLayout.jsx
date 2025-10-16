import { useContext } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Menu } from "antd";
import {
  HomeOutlined,
  UserOutlined,
  ShoppingOutlined,
  DollarOutlined,
  BarChartOutlined,
  LogoutOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { AuthContext } from "../context/AuthContext";

export default function AdminLayout() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick = ({ key }) => {
    switch (key) {
      case "home":
        navigate("/");
        break;
      case "dashboard":
        navigate("/admin");
        break;
      case "users":
        navigate("/admin/users");
        break;
      case "categories":
        navigate("/admin/categories");
        break;
      case "products":
        navigate("/admin/products");
        break;
      case "orders":
        navigate("/admin/orders");
        break;
      case "stats":
        navigate("/admin/statistics");
        break;
      case "logout":
        logout();
        navigate("/");
        break;
      default:
        break;
    }
  };

  const menuItems = [
    { key: "home", icon: <ArrowLeftOutlined />, label: "Trang chủ" }, // 🔹 Mới thêm
    { key: "dashboard", icon: <HomeOutlined />, label: "Dashboard" },
    { key: "users", icon: <UserOutlined />, label: "Người dùng" },
    { key: "categories", icon: <ShoppingOutlined />, label: "Danh mục" },
    { key: "products", icon: <ShoppingOutlined />, label: "Sản phẩm" },
    { key: "orders", icon: <DollarOutlined />, label: "Đơn hàng" },
    { key: "stats", icon: <BarChartOutlined />, label: "Thống kê" },
    { key: "logout", icon: <LogoutOutlined />, label: "Đăng xuất" },
  ];

  return (
    <div className="flex min-h-screen w-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-52 bg-gray-900 text-white flex flex-col flex-shrink-0">
        <div className="py-12 text-center text-xl font-bold border-b border-gray-700">
          🛠️ Admin
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[
            location.pathname === "/admin"
              ? "dashboard"
              : location.pathname.replace("/admin/", ""),
          ]}
          items={menuItems}
          onClick={handleMenuClick}
          className="flex-1 bg-gray-900"
        />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow flex justify-between items-center px-6 h-16 sticky top-0 z-20">
          <h1 className="text-lg font-bold text-gray-800">Admin Dashboard</h1>
          <div className="flex items-center gap-3">
            <img
              src={
                user?.avatar ||
                "https://res.cloudinary.com/ddnzj70uw/image/upload/v1759990027/avt-default_r2kgze.png"
              }
              alt="avatar"
              className="w-9 h-9 rounded-full object-cover border border-gray-200"
            />
            <span className="text-gray-700 font-medium">
              {user?.fullName || user?.email}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto w-full">
          <div className="w-full h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
