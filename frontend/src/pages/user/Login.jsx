import { useState, useEffect, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState(localStorage.getItem("rememberEmail") || "");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(!!localStorage.getItem("rememberEmail"));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  

  // Nếu token còn trong localStorage thì có thể tự đăng nhập
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Giả lập fetch user profile, bạn có thể gọi API thật ở đây
      setUser({ email }); 
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) throw new Error("Email hoặc mật khẩu không đúng");

      const data = await response.json();
      const token = data.token;

      // Nếu API trả về user, dùng luôn:
      const userData = data.user || { email };
      login(userData, token); // 🔥 gọi hàm từ context

      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setSuccess("");
    setError("");
    navigate("/login");
  };

  return (
    <div className="flex justify-center items-center min-h-auto bg-gray-50">
      <div className="w-full max-w-md m-16 rounded-xl shadow-md p-6">
        {!user ? (
          <>
            <h2 className="text-2xl font-bold text-center mb-6">Đăng nhập</h2>
            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-black focus:outline-none"
                  placeholder="Nhập email"
                  autoComplete="email"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-black focus:outline-none"
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="remember" className="text-sm text-gray-700">
                  Ghi nhớ đăng nhập
                </label>
              </div>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm text-center">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded text-sm text-center">
                  {success}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition"
              >
                Đăng nhập
              </button>
            </form>

            <p className="text-sm text-center mt-4">
              Chưa có tài khoản?{" "}
              <Link to="/register" className="text-blue-600 hover:underline">
                Đăng ký
              </Link>
            </p>
          </>
        ) : (
          <div className="mt-6 bg-gray-100 p-3 rounded-md text-sm text-center">
            <p>Xin chào, {user.email}</p>
            <button
              onClick={handleLogout}
              className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Đăng xuất
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
