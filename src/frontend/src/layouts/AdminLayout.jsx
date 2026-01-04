import { useContext, useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Menu, Drawer, Button, Avatar, Dropdown } from "antd";
import {
  HomeOutlined,
  GiftOutlined,
  UserOutlined,
  ShoppingOutlined,
  DollarOutlined,
  BarChartOutlined,
  LogoutOutlined,
  ArrowLeftOutlined,
  MenuOutlined,
  BellOutlined,
  SettingOutlined,
  CreditCardOutlined,
  TagsOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import { AuthContext } from "../context/AuthContext";

export default function AdminLayout() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleMenuClick = ({ key }) => {
    setMobileOpen(false);
    if (key === "logout") {
      logout();
      navigate("/");
      return;
    }
    if (key === "home") {
      navigate("/");
      return;
    }
    const path = key === "dashboard" ? "/admin" : `/admin/${key}`;
    navigate(path);
  };

  const menuItems = [
    { key: "home", icon: <ArrowLeftOutlined />, label: "Về trang chủ" },
    { type: "divider" },
    { key: "dashboard", icon: <AppstoreOutlined />, label: "Tổng quan" },
    { key: "orders", icon: <ShoppingOutlined />, label: "Đơn hàng" },
    { key: "products", icon: <TagsOutlined />, label: "Sản phẩm" },
    { key: "flash-sale", icon: <GiftOutlined  />, label: "Flash sale" },
    { key: "categories", icon: <MenuOutlined />, label: "Danh mục" },
    { key: "users", icon: <UserOutlined />, label: "Khách hàng" },
    { key: "payment-methods", icon: <CreditCardOutlined />, label: "Thanh toán" },
    { key: "coupons", icon: <DollarOutlined />, label: "Mã giảm giá" },
    { key: "stats", icon: <BarChartOutlined />, label: "Báo cáo doanh thu" },
    { key: "slide-shows", icon: <BarChartOutlined />, label: "Slide shows" },
    { type: "divider" },
    { key: "logout", icon: <LogoutOutlined />, label: "Đăng xuất", danger: true },
  ];

  const SidebarContent = () => (
    <div className="h-full flex flex-col bg-[#001529] text-white">
      <div className="py-6 flex items-center justify-center border-b border-gray-700 bg-[#002140]">
        <span className="text-xl font-bold tracking-wider uppercase text-white">
          🛋️ Admin Interior
        </span>
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[
          location.pathname === "/admin"
            ? "dashboard"
            : location.pathname.split("/").pop(),
        ]}
        items={menuItems}
        onClick={handleMenuClick}
        className="flex-1 py-4 text-base bg-[#001529]"
      />
      <div className="p-4 text-xs text-center text-gray-500 border-t border-gray-700">
        v1.0.0 - Interior CMS
      </div>
    </div>
  );

  const userMenu = (
    <Menu items={[
      { key: 'profile', icon: <UserOutlined />, label: 'Hồ sơ cá nhân' },
      { key: 'settings', icon: <SettingOutlined />, label: 'Cài đặt' },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', onClick: logout, danger: true }
    ]} />
  );

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="w-64 flex-shrink-0 shadow-xl z-20 hidden md:block">
          <SidebarContent />
        </div>
      )}

      {/* Mobile Drawer Sidebar */}
      <Drawer
        placement="left"
        onClose={() => setMobileOpen(false)}
        open={mobileOpen}
        styles={{ body: { padding: 0 } }}
        width={250}
      >
        <SidebarContent />
      </Drawer>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="bg-white shadow-sm h-16 flex justify-between items-center px-4 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            {isMobile && (
              <Button
                icon={<MenuOutlined />}
                onClick={() => setMobileOpen(true)}
                size="large"
              />
            )}
            <h1 className="text-xl font-bold text-gray-800 hidden sm:block">
              Quản trị hệ thống
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <Button type="text" shape="circle" icon={<BellOutlined />} size="large" />
            
            <Dropdown overlay={userMenu} placement="bottomRight" trigger={['click']}>
              <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 px-3 py-1 rounded-lg transition">
                <Avatar
                  src={user?.avatar || "https://res.cloudinary.com/ddnzj70uw/image/upload/v1759990027/avt-default_r2kgze.png"}
                  size="large"
                  className="border border-gray-200"
                />
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-semibold text-gray-700 leading-tight">
                    {user?.fullName || "Admin"}
                  </span>
                  <span className="text-xs text-gray-500">Administrator</span>
                </div>
              </div>
            </Dropdown>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}