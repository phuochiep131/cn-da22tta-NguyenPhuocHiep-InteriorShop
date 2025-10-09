import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { message } from "antd";

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rePassword: "",
    fullName: "",
    avatar: null,
  });

  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(
    "https://res.cloudinary.com/ddnzj70uw/image/upload/v1759990027/avt-default_r2kgze.png"
  );
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, avatar: file });
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (formData.password !== formData.rePassword) {
      messageApi.error("Mật khẩu nhập lại không khớp!");
      setLoading(false);
      return;
    }

    try {
      let avatarUrl =
        "https://res.cloudinary.com/ddnzj70uw/image/upload/v1759990027/avt-default_r2kgze.png";

      // Nếu người dùng chọn ảnh, upload lên Cloudinary
      if (formData.avatar) {
        const data = new FormData();
        data.append("file", formData.avatar);
        data.append("upload_preset", "my_interior_shop");

        const resUpload = await fetch(
          "https://api.cloudinary.com/v1_1/ddnzj70uw/image/upload",
          {
            method: "POST",
            body: data,
          }
        );

        const uploadResult = await resUpload.json();
        avatarUrl = uploadResult.secure_url;
      }

      const res = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          avatar: avatarUrl,
        }),
      });

      const data = await res.json();

      if (res.ok && data.message) {
        messageApi.success("Đăng ký thành công!");
        setTimeout(() => {
          navigate("/login", {
            state: {
              email: formData.email,
              password: formData.password,
            },
          });
        }, 1500);
      } else if (data.error) {
        if (data.error.includes("exists")) {
          messageApi.error("Email đã được sử dụng, vui lòng chọn email khác!");
        } else {
          messageApi.error("Đăng ký thất bại, vui lòng thử lại!");
        }
      } else {
        messageApi.error("Có lỗi xảy ra, vui lòng thử lại!");
      }
    } catch (error) {
      console.error("Lỗi khi đăng ký:", error);
      messageApi.error("Không thể kết nối đến máy chủ!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center bg-gray-50">
      {contextHolder}
      <div className="w-full max-w-md m-16 rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-center mb-6">Đăng ký</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-black focus:outline-none"
              placeholder="Nhập email"
              required
            />
          </div>

          {/* Mật khẩu */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mật khẩu
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-black focus:outline-none"
              placeholder="Tạo mật khẩu"
              required
            />
          </div>

          {/* Nhập lại mật khẩu */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nhập lại mật khẩu
            </label>
            <input
              type="password"
              name="rePassword"
              value={formData.rePassword}
              onChange={handleChange}
              className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-black focus:outline-none"
              placeholder="Nhập lại mật khẩu"
              required
            />
          </div>

          {/* Họ và tên */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Họ và tên
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-black focus:outline-none"
              placeholder="Nhập họ và tên"
              required
            />
          </div>

          {/* Avatar */}
          <div className="flex flex-col items-center">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ảnh đại diện
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              ref={fileInputRef}
              className="hidden"
            />
            <img
              src={preview}
              alt="Avatar"
              onClick={handleAvatarClick}
              className="w-24 h-24 rounded-full cursor-pointer object-cover border hover:opacity-80 transition"
              title="Nhấn để chọn ảnh đại diện"
            />
          </div>

          {/* Nút đăng ký */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition disabled:opacity-60"
          >
            {loading ? "Đang xử lý..." : "Đăng ký"}
          </button>
        </form>

        <p className="text-sm text-center mt-4">
          Đã có tài khoản?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
