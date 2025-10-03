import { Link } from "react-router-dom"

export default function MainMenu() {
  const menus = [
    { name: "Trang chủ", path: "/" },
    { name: "Sản phẩm", path: "/products" },
    { name: "Khuyến mãi", path: "/promotions" },
    { name: "Công nghệ", path: "/technology" },
    { name: "Liên hệ", path: "/contact" },
  ]

  return (
    <div className="px-6 py-2 flex justify-center space-x-10 text-base font-medium">
      {menus.map((menu, i) => (
        <Link 
          key={i} 
          to={menu.path} 
          className="text-gray-700 hover:text-black transition"
        >
          {menu.name}
        </Link>
      ))}
    </div>
  )
}
