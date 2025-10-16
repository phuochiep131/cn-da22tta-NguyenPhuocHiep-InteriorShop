import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronsDown, ChevronsDownUp } from "lucide-react";

export default function MainMenu() {
  const [categories, setCategories] = useState([]);
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const dropdownTimeout = useRef(null);

  const menus = [
    { name: "Trang chủ", path: "/" },
    { name: "Sản phẩm", path: "/products", dropdown: true },
    { name: "Khuyến mãi", path: "/promotions" },
    { name: "Công nghệ", path: "/technology" },
    { name: "Liên hệ", path: "/contact" },
  ];

  useEffect(() => {
    fetch("http://localhost:8080/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch(() => setCategories([]));
  }, []);

  const handleMouseEnter = (name) => {
    clearTimeout(dropdownTimeout.current);
    setHoveredMenu(name);
  };

  const handleMouseLeave = () => {
    dropdownTimeout.current = setTimeout(() => {
      setHoveredMenu(null);
    }, 150);
  };

  return (
    <nav className="relative flex justify-start bg-white border-b border-gray-100">
      <div className="flex items-center space-x-10 py-3 text-base font-medium select-none pl-[15%]">
        {menus.map((menu, i) => (
          <div
            key={i}
            className="relative flex items-center"
            onMouseEnter={() => menu.dropdown && handleMouseEnter(menu.name)}
            onMouseLeave={() => menu.dropdown && handleMouseLeave()}
          >
            {menu.dropdown ? (
              <button
                type="button"
                onClick={(e) => e.preventDefault()}
                className="flex items-center gap-1 text-gray-700 hover:text-black transition bg-transparent border-none outline-none cursor-pointer leading-none"
                style={{ lineHeight: "1.5rem" }}
              >
                {menu.name}
                {hoveredMenu === menu.name ? (
                  <ChevronsDownUp size={16} className="ml-1" />
                ) : (
                  <ChevronsDown size={16} className="ml-1" />
                )}
              </button>
            ) : (
              <Link
                to={menu.path}
                className="text-gray-700 hover:text-black transition flex items-center gap-1 leading-none"
              >
                {menu.name}
              </Link>
            )}

            {/* Dropdown danh mục */}
            {menu.dropdown && hoveredMenu === menu.name && (
              <div
                className="absolute left-1/2 -translate-x-1/2 top-full mt-6 
                           w-[720px] bg-white shadow-2xl rounded-lg border border-gray-100 
                           p-6 grid grid-cols-4 gap-4 z-50 transition-all duration-200 ease-in-out"
                onMouseEnter={() => handleMouseEnter(menu.name)}
                onMouseLeave={handleMouseLeave}
              >
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <Link
                      key={cat.categoryId}
                      to={`/products?category=${cat.categoryId}`}
                      className="group relative block text-gray-700 hover:text-blue-600 transition pb-1"
                    >
                      {cat.categoryName}
                      <span
                        className="absolute left-0 bottom-0 w-0 h-[2px] bg-blue-600 
                                  transition-all duration-300 ease-in-out group-hover:w-full"
                      ></span>
                    </Link>
                  ))
                ) : (
                  <p className="text-gray-500 col-span-4 text-center">
                    Không có danh mục nào
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}
