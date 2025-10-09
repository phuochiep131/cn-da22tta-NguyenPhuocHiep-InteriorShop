import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

export default function AdminDashboard() {
  const { user } = useContext(AuthContext);

  return (
    <div className="w-full h-full p-6 bg-gray-50">
      <h2 className="text-2xl font-bold mb-2">
        Xin chào Admin {user?.fullName}!
      </h2>
      <p>Ở đây bạn có thể xem thống kê tổng quan.</p>
    </div>
  );
}
