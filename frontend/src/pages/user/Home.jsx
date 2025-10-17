import { useState } from "react";
import { Search, Filter, Check } from "lucide-react";
import { Dropdown } from "antd";
import Slideshow from "../../components/Slideshow";
import Products from "../../components/Products";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [query, setQuery] = useState("");

  // Bộ lọc đang áp dụng thật
  const [priceRange, setPriceRange] = useState({ min: null, max: null });
  // Bộ lọc tạm khi đang chọn trong dropdown
  const [tempChoice, setTempChoice] = useState(null);

  const filterChoices = [
    { key: "under25m", label: "Dưới 2.500.000 ₫", range: { min: 0, max: 2500000 } },
    { key: "25to5m", label: "2.500.000 ₫ – 5.000.000 ₫", range: { min: 2500000, max: 5000000 } },
    { key: "5to10m", label: "5.000.000 ₫ – 10.000.000 ₫", range: { min: 5000000, max: 10000000 } },
    { key: "10to20m", label: "10.000.000 ₫ – 20.000.000 ₫", range: { min: 10000000, max: 20000000 } },
    { key: "20to50m", label: "20.000.000 ₫ – 50.000.000 ₫", range: { min: 20000000, max: 50000000 } },
    { key: "over50m", label: "Trên 50.000.000 ₫", range: { min: 50000000, max: null } },
  ];


  const handleSearch = () => setSearchTerm(query.trim());
  const handleKeyDown = (e) => e.key === "Enter" && handleSearch();
  const handleClear = () => {
    setQuery("");
    setSearchTerm("");
  };

  const handleApplyFilter = () => {
    const choice = filterChoices.find((c) => c.key === tempChoice);
    if (choice) {
      setPriceRange(choice.range);
    } else {
      setPriceRange({ min: null, max: null });
    }
  };

  const handleClearFilter = () => {
    setTempChoice(null);
    setPriceRange({ min: null, max: null });
  };

  const filterMenu = (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 w-60 py-2">
      {filterChoices.map((choice) => (
        <button
          key={choice.key}
          className={`flex items-center justify-between w-full text-left px-4 py-2 hover:bg-gray-100 ${
            tempChoice === choice.key ? "bg-gray-100 font-medium" : ""
          }`}
          onClick={() => setTempChoice(choice.key)}
        >
          <span>{choice.label}</span>
          {tempChoice === choice.key && <Check size={16} className="text-green-600" />}
        </button>
      ))}

      <div className="border-t my-2"></div>

      <div className="flex justify-end gap-2 px-3 pb-1">
        <button
          onClick={handleClearFilter}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
        >
          Xóa
        </button>
        <button
          onClick={handleApplyFilter}
          className="px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md"
        >
          Áp dụng
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-4">

      {/* Slideshow */}
      <Slideshow />

      {/* Thanh tìm kiếm + lọc */}
      <div className="mt-6 flex justify-center">
        <div className="w-full max-w-lg flex items-center gap-2 relative">
          <input
            type="text"
            placeholder="Tìm sản phẩm bạn muốn..."
            className="w-full px-4 py-2 border rounded-full shadow-sm focus:ring-2 focus:ring-black focus:outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          {/* Nút tìm kiếm */}
          <button
            onClick={handleSearch}
            className="p-2 rounded-full bg-black text-white hover:bg-gray-800 transition"
          >
            <Search size={16} />
          </button>

          {/* Dropdown bộ lọc */}
          <Dropdown
            trigger={["click"]}
            placement="bottomRight"
            dropdownRender={() => filterMenu}
          >
            <button
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
              title="Lọc theo giá"
            >
              <Filter size={16} />
            </button>
          </Dropdown>

          {query && (
            <button
              onClick={handleClear}
              className="p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
              title="Xóa tìm kiếm"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Danh sách sản phẩm */}
      <Products searchTerm={searchTerm} priceRange={priceRange} />
    </div>
  );
}
