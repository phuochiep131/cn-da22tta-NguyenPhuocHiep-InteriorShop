import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ChevronDown, ChevronRight } from "lucide-react";

export default function MainMenu() {
  const [categories, setCategories] = useState([]);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mobileSubOpen, setMobileSubOpen] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8080/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch(() => setCategories([]));
  }, []);

  const menus = [
    { name: "Trang chủ", path: "/" },
    { name: "Sản phẩm", path: "/products", dropdown: true },
    { name: "Khuyến mãi", path: "/promotions" },
    { name: "Góc cảm hứng", path: "/technology" },
    { name: "Liên hệ", path: "/contact" },
  ];

  return (
    <nav className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-12">
          {/* Mobile Toggle Button */}
          <button
            className="lg:hidden flex items-center gap-2 text-gray-800 font-medium"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
          >
            {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
            <span className="uppercase text-sm tracking-wide">Danh mục</span>
          </button>

          {/* DESKTOP MENU */}
          <div className="hidden lg:flex items-center space-x-8">
            {menus.map((menu, i) => (
              <div key={i} className="relative group h-12 flex items-center">
                {menu.dropdown ? (
                  <>
                    <Link
                      to={menu.path}
                      className="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-blue-600 transition uppercase tracking-wide"
                    >
                      {menu.name} <ChevronDown size={14} />
                    </Link>
                    {/* Desktop Dropdown */}
                    <div className="absolute top-full left-0 w-64 bg-white shadow-xl rounded-b-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-50">
                      <div className="py-2">
                        {categories.map((cat) => (
                          <Link
                            key={cat.categoryId}
                            to={`/products?category=${cat.categoryId}`}
                            className="block px-5 py-2.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition"
                          >
                            {cat.categoryName}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <Link
                    to={menu.path}
                    className="text-sm font-semibold text-gray-700 hover:text-blue-600 transition uppercase tracking-wide"
                  >
                    {menu.name}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MOBILE MENU OVERLAY */}
      {isMobileOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-white border-t border-gray-200 shadow-2xl z-40 max-h-[calc(100vh-120px)] overflow-y-auto">
          <div className="flex flex-col p-4 space-y-1">
            {menus.map((menu, i) => (
              <div key={i}>
                {menu.dropdown ? (
                  <div>
                    <button
                      onClick={() => setMobileSubOpen(!mobileSubOpen)}
                      className="w-full flex items-center justify-between py-3 px-2 text-gray-800 font-medium hover:bg-gray-50 rounded-lg"
                    >
                      {menu.name}
                      <ChevronDown
                        size={18}
                        className={`transition-transform ${
                          mobileSubOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {mobileSubOpen && (
                      <div className="pl-6 space-y-2 pb-2 bg-gray-50 rounded-lg">
                        {categories.map((cat) => (
                          <Link
                            key={cat.categoryId}
                            to={`/products?category=${cat.categoryId}`}
                            className="block py-2 text-sm text-gray-600"
                            onClick={() => setIsMobileOpen(false)}
                          >
                            • {cat.categoryName}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to={menu.path}
                    className="block py-3 px-2 text-gray-800 font-medium hover:bg-gray-50 rounded-lg"
                    onClick={() => setIsMobileOpen(false)}
                  >
                    {menu.name}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
