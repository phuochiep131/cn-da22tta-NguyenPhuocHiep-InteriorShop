import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { message } from "antd";

// --- ICONS (SVG) ---
const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);
const MailIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);
const LockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
    />
  </svg>
);
const CameraIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);
const PhoneIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
    />
  </svg>
);
const LocationIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rePassword: "",
    fullName: "",
    phone: "",
    address: "",
    gender: "Nam",
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

      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone_number: formData.phone,
        address: formData.address,
        gender: formData.gender,
        avatar: avatarUrl,
      };

      const res = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
          messageApi.error("Đăng ký thất bại: " + data.error);
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
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {contextHolder}

      {/* LEFT SIDE: Image / Branding */}
      {/* - lg:sticky lg:top-0 lg:h-screen: Giữ ảnh cố định khi cuộn trên Desktop
          - hidden lg:flex: Ẩn trên Mobile để tập trung vào Form
      */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-900 relative justify-center items-center overflow-hidden lg:sticky lg:top-0 lg:h-screen">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000&auto=format&fit=crop')",
          }}
        ></div>
        <div className="relative z-10 text-center px-10">
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
            Interior Shop
          </h1>
          <p className="text-gray-200 text-lg font-light">
            Kiến tạo không gian sống đẳng cấp và tiện nghi cho ngôi nhà của bạn.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: Form */}
      {/* - pt-24: Padding top lớn (khoảng 96px) để tránh bị Header che trên Mobile
          - lg:pt-12: Padding top nhỏ hơn trên Desktop vì layout 2 cột thoáng hơn
          - min-h-screen: Đảm bảo bao phủ toàn bộ chiều cao nhưng cho phép cuộn tự nhiên
      */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 min-h-screen pt-24 lg:pt-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Tạo tài khoản mới
            </h2>
            <p className="text-gray-500 mt-2 text-sm">
              Nhập thông tin chi tiết để bắt đầu
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Avatar Upload */}
            <div className="flex justify-center mb-6">
              <div className="relative group">
                <div
                  onClick={handleAvatarClick}
                  className="w-28 h-28 rounded-full border-4 border-gray-100 shadow-lg overflow-hidden cursor-pointer relative"
                >
                  <img
                    src={preview}
                    alt="Avatar Preview"
                    className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-all">
                    <CameraIcon />
                    <span className="text-white text-xs font-medium ml-1">
                      Đổi ảnh
                    </span>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  ref={fileInputRef}
                  className="hidden"
                />
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Họ và tên
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <UserIcon />
                </div>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-black focus:border-black block transition-colors"
                  placeholder="Nguyễn Văn A"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <MailIcon />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-black focus:border-black block transition-colors"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            {/* Group: Phone & Gender */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số điện thoại
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <PhoneIcon />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-black focus:border-black block transition-colors"
                    placeholder="0912..."
                  />
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giới tính
                </label>
                <div className="relative">
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full pl-3 pr-4 py-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-black focus:border-black block transition-colors appearance-none"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      ></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <LocationIcon />
                </div>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-black focus:border-black block transition-colors"
                  placeholder="Số 123, Đường ABC..."
                />
              </div>
            </div>

            {/* Group: Passwords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <LockIcon />
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-black focus:border-black block transition-colors"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {/* Re-Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nhập lại mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <LockIcon />
                  </div>
                  <input
                    type="password"
                    name="rePassword"
                    value={formData.rePassword}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-black focus:border-black block transition-colors"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-70 transition-all mt-6"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Đang xử lý...
                </span>
              ) : (
                "Đăng ký ngay"
              )}
            </button>

            {/* Footer */}
            <p className="text-center text-sm text-gray-600 mt-4 pb-4">
              Đã có tài khoản?{" "}
              <Link
                to="/login"
                className="font-semibold text-black hover:underline"
              >
                Đăng nhập tại đây
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
