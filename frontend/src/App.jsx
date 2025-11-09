import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";

import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManager from "./pages/admin/UserManager";
import CategoryManager from "./pages/admin/CategoryManager";
import ProductManager from "./pages/admin/ProductManager";
import PaymentMethodManager from "./pages/admin/PaymentMethodManager";
import CouponManager from "./pages/admin/CouponManager";

import Home from "./pages/user/Home";
import Login from "./pages/user/Login";
import Register from "./pages/user/Register";
import EditProfile from "./pages/user/profile/EditProfile";
import Products from "./components/Products";
import ProductDetail from "./pages/user/ProductDetail";
import Checkout from "./pages/user/Checkout";

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:productId" element={<ProductDetail />} />
          <Route path="/checkout" element={<Checkout />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UserManager />} />
          <Route path="categories" element={<CategoryManager />} />
          <Route path="products" element={<ProductManager />} />
          <Route path="payment-methods" element={<PaymentMethodManager />} />
          <Route path="coupons" element={<CouponManager />} />
          <Route path="orders" element={<div>Quản lý đơn hàng</div>} />
          <Route path="statistics" element={<div>Trang thống kê</div>} />
        </Route>

        
      </Routes>
    </Router>
  );
}
