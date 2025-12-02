import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Xin chào! Tôi là trợ lý ảo InteriorShop. Tôi có thể giúp bạn tìm nội thất (Sofa, Bàn ăn...) hoặc tư vấn giá cả ngay lập tức!",
      sender: "bot",
    },
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const API_URL = "http://localhost:8080/api/chatbot/ask";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // --- 1. COMPONENT: Mini Product Card ---
  // Hiển thị thẻ sản phẩm nhỏ gọn khi phát hiện có Link + Ảnh
  // ... imports

  // --- 1. COMPONENT CARD MỚI: GIAO DIỆN PRO ---
  const MiniProductCard = ({ name, url, imgUrl, priceString }) => {
    // 1. Tách chuỗi giá
    let oldPriceStr = "";
    let newPriceStr = priceString;

    if (priceString && priceString.includes("|")) {
      const parts = priceString.split("|");
      oldPriceStr = parts[0].trim();
      newPriceStr = parts[1].trim();
    }

    // 2. Helper format tiền (thêm dấu chấm)
    const formatPrice = (price) => {
      if (!price) return "";
      // Chuyển đổi về số để format chuẩn locale VN, sau đó thêm ký hiệu đ
      const num = parseInt(price.replace(/\D/g, "")) || 0;
      return num.toLocaleString("vi-VN") + "đ";
    };

    // 3. Tính % giảm giá (để hiển thị Tag)
    let discountPercent = 0;
    if (oldPriceStr && newPriceStr) {
      const oldP = parseInt(oldPriceStr.replace(/\D/g, ""));
      const newP = parseInt(newPriceStr.replace(/\D/g, ""));
      if (oldP > newP) {
        discountPercent = Math.round(((oldP - newP) / oldP) * 100);
      }
    }

    return (
      <div className="mt-3 mb-4 group relative block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-all duration-300 w-full max-w-[250px]">
        {/* VÙNG ẢNH SẢN PHẨM */}
        <div className="relative h-36 w-full overflow-hidden bg-gray-50">
          <img
            src={imgUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/150?text=No+Image";
            }}
          />

          {/* Badge % Giảm giá (Xịn hơn chữ SALE thường) */}
          {discountPercent > 0 && (
            <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg shadow-sm z-10">
              -{discountPercent}%
            </div>
          )}

          {/* Overlay gradient nhẹ khi hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
        </div>

        {/* VÙNG THÔNG TIN */}
        <div className="p-3">
          {/* Tên sản phẩm */}
          <h4
            className="text-[13px] font-medium text-gray-700 line-clamp-2 leading-snug mb-2 h-9"
            title={name}
          >
            {name}
          </h4>

          {/* KHU VỰC GIÁ (ĐÃ SỬA ĐẸP HƠN) */}
          <div className="flex flex-col mb-3">
            {/* Giá mới to, rõ ràng */}
            <div className="text-red-600 font-bold text-base leading-none mb-1">
              {formatPrice(newPriceStr)}
            </div>

            {/* Giá cũ nhỏ, gạch ngang (nếu có) */}
            {oldPriceStr && (
              <div className="text-[11px] text-gray-400 line-through decoration-gray-400 flex items-center gap-1">
                {formatPrice(oldPriceStr)}
              </div>
            )}
          </div>

          {/* Nút bấm (Style nhẹ nhàng hơn) */}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="group/btn flex items-center justify-center w-full rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-200 gap-1"
          >
            Xem chi tiết
            <ChevronRight
              size={14}
              className="transition-transform group-hover/btn:translate-x-0.5"
            />
          </a>
        </div>
      </div>
    );
  };

  // 2. LOGIC PARSER (Cập nhật lấy giá từ Alt Text)
  const formatMessage = (text) => {
    // Xóa ** trước
    const cleanText = text.replace(/\*\*/g, "");
    const parts = [];
    let lastIndex = 0;

    // Regex: [Name](Link) ![PriceInfo](ImgUrl)
    // match[3] bây giờ sẽ chứa chuỗi giá "Old|New"
    const productRegex =
      /\[([^\]]+)\]\(([^)]+)\)[\s\n]*!\[([^\]]*)\]\(([^)]+)\)/g;

    let match;
    while ((match = productRegex.exec(cleanText)) !== null) {
      if (match.index > lastIndex) {
        const preText = cleanText.substring(lastIndex, match.index);
        parts.push(renderTextWithLines(preText));
      }

      parts.push(
        <MiniProductCard
          key={`prod-${match.index}`}
          name={match[1]} // Tên SP
          url={match[2]} // Link SP
          priceString={match[3]} // Chuỗi giá (nằm trong Alt Text của ảnh)
          imgUrl={match[4]} // Link Ảnh
        />
      );

      lastIndex = productRegex.lastIndex;
    }

    if (lastIndex < cleanText.length) {
      const remainingText = cleanText.substring(lastIndex);
      parts.push(renderTextWithLines(remainingText));
    }

    return parts;
  };

  // ... Các phần còn lại giữ nguyên

  const renderTextWithLines = (text) => {
    // Tách chuỗi theo dấu xuống dòng
    return text.split("\n").map((line, index) => {
      // Nếu dòng trống thì render 1 khoảng cách nhỏ
      if (!line.trim()) return <div key={index} className="h-2"></div>;

      // Nếu dòng có nội dung thì xử lý link thường
      return (
        <div key={index} className="mb-1 leading-relaxed text-gray-700">
          {formatSimpleLinks(line)}
        </div>
      );
    });
  };

  // Hàm phụ: Chỉ xử lý link thường [Text](Url) nếu không có ảnh đi kèm
  const formatSimpleLinks = (text) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const fragments = [];
    let lastIdx = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        fragments.push(text.substring(lastIdx, match.index));
      }
      fragments.push(
        <a
          key={`link-${match.index}`}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-0.5"
        >
          {match[1]} <ExternalLink size={10} />
        </a>
      );
      lastIdx = linkRegex.lastIndex;
    }
    if (lastIdx < text.length) fragments.push(text.substring(lastIdx));
    return fragments;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const newUserMsg = { id: Date.now(), text: inputMsg, sender: "user" };
    setMessages((prev) => [...prev, newUserMsg]);
    setInputMsg("");
    setIsTyping(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newUserMsg.text }),
      });

      if (!response.ok) throw new Error("Lỗi kết nối");

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, text: data.reply, sender: "bot" },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: "Lỗi kết nối server.",
          sender: "bot",
          isError: true,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* ... Phần Nút Trigger (Giữ nguyên) ... */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-none font-sans">
        {/* Cửa sổ Chat */}
        <div
          className={`bg-white w-[360px] h-[550px] rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 origin-bottom-right border border-gray-200 flex flex-col pointer-events-auto ${
            isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0"
          }`}
        >
          {/* Header */}
          <div className="bg-blue-600 p-4 flex justify-between items-center text-white shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                <ShoppingBag size={18} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Interior Assistant</h3>
                <div className="flex items-center gap-1 text-[11px] text-blue-100">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>{" "}
                  Online
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.sender === "bot" && (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 text-blue-600 shrink-0 mt-1">
                    <ShoppingBag size={14} />
                  </div>
                )}

                <div
                  className={`max-w-[85%] p-3 text-sm shadow-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-blue-600 text-white rounded-2xl rounded-br-none"
                      : "bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-bl-none"
                  }`}
                >
                  {/* LOGIC RENDER */}
                  {msg.sender === "bot" && !msg.isError ? (
                    <div className="break-words">{formatMessage(msg.text)}</div>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 ml-10">
                <div className="bg-gray-200 w-2 h-2 rounded-full animate-bounce"></div>
                <div className="bg-gray-200 w-2 h-2 rounded-full animate-bounce delay-75"></div>
                <div className="bg-gray-200 w-2 h-2 rounded-full animate-bounce delay-150"></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area (Giữ nguyên) */}
          <div className="p-3 bg-white border-t border-gray-100">
            <form
              onSubmit={handleSendMessage}
              className="flex gap-2 items-center bg-gray-100 p-1.5 rounded-full"
            >
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder="Nhập tin nhắn..."
                className="flex-1 px-4 py-2 bg-transparent text-sm focus:outline-none"
              />
              <button
                type="submit"
                disabled={!inputMsg.trim()}
                className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="pointer-events-auto bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all"
        >
          {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
        </button>
      </div>
    </>
  );
}
