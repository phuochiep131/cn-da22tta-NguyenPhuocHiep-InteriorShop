import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import Cookies from "js-cookie";
import { message } from "antd";

export default function EditProfile() {
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [messageApi, contextHolder] = message.useMessage();

  const token = Cookies.get("jwt");

  const [role] = useState(user?.role || "");
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [email] = useState(user?.email || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [address, setAddress] = useState(user?.address || "");
  const [gender, setGender] = useState(user?.gender || "");
  const [birthDate, setBirthDate] = useState(user?.birthDate || "");

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-10 text-center">
        <p className="text-gray-700">
          Bạn cần đăng nhập để chỉnh sửa thông tin cá nhân..
        </p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      messageApi.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/users/${user.userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName,
          email,
          phoneNumber,
          address,
          gender,
          birthDate,
          role,
        }),
      });

      if (!response.ok) throw new Error("Cập nhật thất bại!");

      const updatedUser = await response.json();
      login(updatedUser, token); // Cập nhật lại thông tin user trong AuthContext

      messageApi.success("Cập nhật thông tin thành công!");
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      messageApi.error(`Lỗi: ${err.message}`);
    }
  };

  return (
    <>
      {contextHolder}
      <div className="max-w-2xl mx-auto mt-10 bg-white shadow p-6 rounded-md">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Chỉnh sửa thông tin cá nhân
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Họ và tên */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-black focus:outline-none"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full mt-1 px-3 py-2 border rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
            />
          </div>

          {/* Số điện thoại */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Số điện thoại
            </label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Nhập số điện thoại..."
              className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-black focus:outline-none"
            />
          </div>

          {/* Địa chỉ */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Địa chỉ</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Nhập địa chỉ..."
              className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-black focus:outline-none"
            />
          </div>

          {/* Giới tính */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Giới tính
            </label>
            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="gender"
                  value="Nam"
                  checked={gender === "Nam"}
                  onChange={() => setGender("Nam")}
                />
                <span>Nam</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="gender"
                  value="Nữ"
                  checked={gender === "Nữ"}
                  onChange={() => setGender("Nữ")}
                />
                <span>Nữ</span>
              </label>
            </div>
          </div>

          {/* Ngày sinh */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày sinh
            </label>
            <input
              type="date"
              value={birthDate ? birthDate.split("T")[0] : ""}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-black focus:outline-none"
            />
          </div>

          {/* Nút lưu */}
          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition"
          >
            Lưu thay đổi
          </button>
        </form>
      </div>
    </>
  );
}
