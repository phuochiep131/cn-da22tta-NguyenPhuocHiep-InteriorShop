import { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { message } from "antd";
import Cookies from "js-cookie";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, login } = useContext(AuthContext);

  // 🧠 Nếu người dùng được chuyển từ trang Register, lấy sẵn email và password
  const initialEmail = location.state?.email || localStorage.getItem("rememberEmail") || "";
  const initialPassword = location.state?.password || "";

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState(initialPassword);
  const [remember, setRemember] = useState(!!localStorage.getItem("rememberEmail"));
  const [loading, setLoading] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    
  }, [location.state, messageApi]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) throw new Error("Email hoặc mật khẩu không đúng");

      const data = await response.json();
      const token = data.token;
      if (!token) throw new Error("Phản hồi không hợp lệ từ máy chủ");

      // ✅ Lưu email nếu chọn "Ghi nhớ"
      if (remember) localStorage.setItem("rememberEmail", email);
      else localStorage.removeItem("rememberEmail");

      // ✅ Lưu JWT vào cookie
      Cookies.set("jwt", token, {
        expires: 1 / 24, // 1 giờ
        secure: false,
        sameSite: "Lax",
      });

      setIsLoggingIn(true);
      await login(null, token);

      messageApi.success("Đăng nhập thành công!");
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      messageApi.error(err.message);
      setLoading(false);
      setIsLoggingIn(false);
    }
  };

  return (
    <>
      {contextHolder}
      <div className="flex justify-center items-center min-h-auto bg-gray-50">
        <div className="w-full max-w-md m-16 rounded-xl shadow-md p-6">
          {!user || isLoggingIn ? (
            <>
              <h2 className="text-2xl font-bold text-center mb-6">Đăng nhập</h2>
              <form className="space-y-4" onSubmit={handleLogin}>
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-black focus:outline-none"
                    placeholder="Nhập email"
                    required
                    disabled={loading}
                  />
                </div>

                {/* Mật khẩu */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-black focus:outline-none pr-10"
                    placeholder="Nhập mật khẩu"
                    required
                    disabled={loading}
                  />
                  {/* Biểu tượng con mắt */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[45px] transform -translate-y-1/2 bg-transparent border-none outline-none focus:outline-none p-0"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Ghi nhớ đăng nhập */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="mr-2"
                    disabled={loading}
                  />
                  <label htmlFor="remember" className="text-sm text-gray-700">
                    Ghi nhớ đăng nhập
                  </label>
                </div>

                {/* Nút đăng nhập */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition ${
                    loading ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                </button>
              </form>

              <p className="text-sm text-center mt-4">
                Chưa có tài khoản?{" "}
                <Link to="/register" className="text-blue-600 hover:underline">
                  Đăng ký
                </Link>
              </p>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
