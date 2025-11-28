import { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";
import { ArrowUp } from "lucide-react"; // Import icon mũi tên

export default function MainLayout() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Xử lý sự kiện cuộn
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    // Cleanup event listener khi component unmount
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Hàm cuộn lên đầu trang
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-gray-50 font-sans overflow-x-hidden text-gray-800 relative">
      {/* Header cố định */}
      <Header />

      {/* Nội dung chính */}
      <main className="flex-grow w-full pt-[120px] lg:pt-[130px] pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      {/* Footer tràn viền */}
      <Footer />

      {/* NÚT CUỘN VỀ ĐẦU TRANG */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-50 p-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
          showScrollTop
            ? "bg-blue-600 text-white opacity-100 translate-y-0"
            : "bg-transparent text-transparent opacity-0 translate-y-10 pointer-events-none"
        }`}
        aria-label="Về đầu trang"
      >
        <ArrowUp size={24} strokeWidth={2.5} />
      </button>
    </div>
  );
}
