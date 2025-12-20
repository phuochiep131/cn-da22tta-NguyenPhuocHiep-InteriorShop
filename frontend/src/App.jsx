import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";

import AdminRoute from "./components/AdminRoute";
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManager from "./pages/admin/UserManager";
import CategoryManager from "./pages/admin/CategoryManager";
import ProductManager from "./pages/admin/ProductManager";
import PaymentMethodManager from "./pages/admin/PaymentMethodManager";
import CouponManager from "./pages/admin/CouponManager";
import OrderManager from "./pages/admin/OrderManager";
import StatsPage from "./pages/admin/StatsPage";
import FlashSaleManager from "./pages/admin/FlashSaleManager";

import Home from "./pages/user/Home";
import Login from "./pages/user/Login";
import Register from "./pages/user/Register";
import EditProfile from "./pages/user/profile/EditProfile";
import PromotionsPage from "./pages/PromotionsPage";
import ContactPage from "./pages/ContactPage";
import Products from "./components/Products";
import ProductDetail from "./pages/user/ProductDetail";
import Checkout from "./pages/user/Checkout";
import Purchase from "./pages/user/Purchase";
import CartPage from "./pages/user/CartPage";
import PaymentReturn from "./pages/user/PaymentReturn";

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:productId" element={<ProductDetail />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/purchase" element={<Purchase />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/payment-return" element={<PaymentReturn />} />
          <Route path="/promotions" element={<PromotionsPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UserManager />} />
            <Route path="categories" element={<CategoryManager />} />
            <Route path="products" element={<ProductManager />} />
            <Route path="flash-sale" element={<FlashSaleManager />} />
            <Route path="payment-methods" element={<PaymentMethodManager />} />
            <Route path="coupons" element={<CouponManager />} />
            <Route path="orders" element={<OrderManager />} />
            <Route path="stats" element={<StatsPage />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}
