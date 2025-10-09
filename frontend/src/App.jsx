import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";

import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";

import Home from "./pages/user/Home";
import Login from "./pages/user/Login";
import Register from "./pages/user/Register";
import EditProfile from "./pages/user/profile/EditProfile";


export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Layout người dùng (có Header + Footer) */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/edit-profile" element={<EditProfile />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<div>Quản lý sản phẩm</div>} />
          <Route path="products" element={<div>Quản lý sản phẩm</div>} />
          <Route path="orders" element={<div>Quản lý đơn hàng</div>} />
          <Route path="statistics" element={<div>Trang thống kê</div>} />
        </Route>

        
      </Routes>
    </Router>
  );
}
