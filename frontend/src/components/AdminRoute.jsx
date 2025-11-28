import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Spin } from "antd";

const AdminRoute = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Spin size="large" tip="Đang kiểm tra quyền truy cập..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;