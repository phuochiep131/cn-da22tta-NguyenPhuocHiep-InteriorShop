import { Link } from "react-router-dom"

export default function Login() {
  return (
    <div className="flex justify-center items-center min-h-auto bg-gray-50">
      <div className="w-full max-w-md m-16 rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-center mb-6">Đăng nhập</h2>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-black focus:outline-none"
              placeholder="Nhập email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
            <input
              type="password"
              className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-black focus:outline-none"
              placeholder="Nhập mật khẩu"
            />
          </div>
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
      </div>
    </div>
  )
}
