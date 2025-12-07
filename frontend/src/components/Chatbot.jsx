import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Armchair,
} from "lucide-react";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);

  const [messages, setMessages] = useState(() => {
    try {
      const savedMessages = sessionStorage.getItem("chat_history");
      if (savedMessages) {
        return JSON.parse(savedMessages);
      }
    } catch (error) {
      console.error(error);
    }
    return [
      {
        id: 1,
        text: "Xin chào! Tôi là trợ lý ảo NPH Store. Tôi có thể giúp bạn tìm Sofa, Bàn ăn... hoặc tư vấn thiết kế ngay lập tức!",
        sender: "bot",
      },
    ];
  });

  const [inputMsg, setInputMsg] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const API_URL = "http://localhost:8080/api/chatbot/ask";

  useEffect(() => {
    sessionStorage.setItem("chat_history", JSON.stringify(messages));
    scrollToBottom();
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleClearChat = () => {
    if (
      window.confirm(
        "Bạn có chắc muốn xóa toàn bộ lịch sử đoạn chat này không?"
      )
    ) {
      sessionStorage.removeItem("chat_history");
      setMessages([
        {
          id: Date.now(),
          text: "Đoạn chat đã được làm mới. Bạn cần tìm nội thất gì?",
          sender: "bot",
        },
      ]);
    }
  };

  const MiniProductCard = ({ name, url, imgUrl, priceString }) => {
    let oldPriceStr = "";
    let newPriceStr = priceString;

    if (priceString && priceString.includes("|")) {
      const parts = priceString.split("|");
      oldPriceStr = parts[0].trim();
      newPriceStr = parts[1].trim();
    }

    const formatPrice = (price) => {
      if (!price) return "";
      const num = parseInt(price.replace(/\D/g, "")) || 0;
      return num.toLocaleString("vi-VN") + "đ";
    };

    let discountPercent = 0;
    if (oldPriceStr && newPriceStr) {
      const oldP = parseInt(oldPriceStr.replace(/\D/g, ""));
      const newP = parseInt(newPriceStr.replace(/\D/g, ""));
      if (oldP > newP) {
        discountPercent = Math.round(((oldP - newP) / oldP) * 100);
      }
    }

    return (
      <div className="mt-3 mb-4 group relative block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-300 w-full max-w-[280px]">
        <div className="relative h-40 w-full overflow-hidden bg-gray-50">
          <img
            src={imgUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/150?text=No+Image";
            }}
          />
          {discountPercent > 0 && (
            <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg shadow-sm z-10">
              -{discountPercent}%
            </div>
          )}
        </div>
        <div className="p-3">
          <h4
            className="text-[14px] font-medium text-gray-700 line-clamp-2 leading-snug mb-2 h-10"
            title={name}
          >
            {name}
          </h4>
          <div className="flex flex-col mb-3">
            <div className="text-red-600 font-bold text-base leading-none mb-1">
              {formatPrice(newPriceStr)}
            </div>
            {oldPriceStr && (
              <div className="text-[11px] text-gray-400 line-through decoration-gray-400">
                {formatPrice(oldPriceStr)}
              </div>
            )}
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-full rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-200 gap-1"
          >
            Xem chi tiết <ChevronRight size={14} />
          </a>
        </div>
      </div>
    );
  };

  const formatMessage = (text) => {
    const cleanText = text.replace(/\*\*/g, "");
    const parts = [];
    let lastIndex = 0;
    const productRegex =
      /\[([^\]]+)\]\(([^)]+)\)[\s\n]*!\[([^\]]*)\]\(([^)]+)\)/g;

    let match;
    while ((match = productRegex.exec(cleanText)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          renderTextWithLines(cleanText.substring(lastIndex, match.index))
        );
      }
      parts.push(
        <MiniProductCard
          key={`prod-${match.index}`}
          name={match[1]}
          url={match[2]}
          priceString={match[3]}
          imgUrl={match[4]}
        />
      );
      lastIndex = productRegex.lastIndex;
    }
    if (lastIndex < cleanText.length) {
      parts.push(renderTextWithLines(cleanText.substring(lastIndex)));
    }
    return parts;
  };

  const renderTextWithLines = (text) => {
    return text.split("\n").map((line, index) => {
      if (!line.trim()) return <div key={index} className="h-2"></div>;
      return (
        <div
          key={index}
          className="mb-1 leading-relaxed text-gray-700 text-[14px]"
        >
          {formatSimpleLinks(line)}
        </div>
      );
    });
  };

  const formatSimpleLinks = (text) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const fragments = [];
    let lastIdx = 0;
    let match;
    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIdx)
        fragments.push(text.substring(lastIdx, match.index));
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

  const handleSendMessage = async (e, textToShow, textToSend = null) => {
    if (e) e.preventDefault();

    const displayMsg = textToShow || inputMsg;
    const apiMsg = textToSend || displayMsg;

    if (!displayMsg || !displayMsg.trim()) return;

    const newUserMsg = { id: Date.now(), text: displayMsg, sender: "user" };
    setMessages((prev) => [...prev, newUserMsg]);
    setInputMsg("");
    setIsTyping(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: apiMsg }),
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
      <div
        className={`fixed top-12 right-6 z-50 flex flex-col items-end gap-2 font-sans 
        transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) origin-top-right
        ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto visible"
            : "opacity-0 scale-90 -translate-y-10 pointer-events-none invisible"
        }`}
      >
        <div className="bg-white w-[450px] h-[650px] rounded-xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col">
          <div className="bg-gradient-to-r from-blue-700 to-blue-600 p-3.5 flex justify-between items-center text-white shadow-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                  <Armchair size={18} className="text-white" />
                </div>
                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-blue-600"></span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">
                  Trợ lý Nội Thất
                </h3>
                <p className="text-[11px] text-blue-100 opacity-90">
                  Tư vấn thiết kế & Giá cả
                </p>
              </div>
            </div>

            <div className="flex gap-1">
              <button
                onClick={handleClearChat}
                className="hover:bg-white/20 p-1.5 rounded-md transition-colors text-blue-100 hover:text-white"
                title="Làm mới đoạn chat"
              >
                <RefreshCw size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 p-1.5 rounded-md transition-colors text-blue-100 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 p-3 overflow-y-auto bg-[#f8f9fa] space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.sender === "bot" && (
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center mr-2 text-blue-600 shrink-0 mt-1 border border-blue-200">
                    <ShoppingBag size={14} />
                  </div>
                )}
                <div
                  className={`max-w-[85%] p-3 text-[13px] shadow-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-blue-600 text-white rounded-xl rounded-br-none"
                      : "bg-white text-gray-800 border border-gray-200 rounded-xl rounded-bl-none"
                  }`}
                >
                  {msg.sender === "bot" && !msg.isError ? (
                    <div className="break-words">{formatMessage(msg.text)}</div>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start items-center">
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center mr-2">
                  <Loader2 size={14} className="animate-spin text-gray-400" />
                </div>
                <div className="bg-white px-4 py-3 rounded-xl rounded-bl-none shadow-sm border border-gray-100 flex items-center gap-1 h-9">
                  <div
                    className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "-0.3s" }}
                  ></div>
                  <div
                    className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "-0.15s" }}
                  ></div>
                  <div
                    className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"                    
                  ></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white border-t border-gray-100">
            <div className="flex flex-wrap gap-2 mb-3">
              {[
                {
                  label: "🛋️ Sofa phòng khách",                  
                  query:
                    "Tìm Sofa phòng khách. Hãy trả lời theo cấu trúc: 1 câu dẫn nhập ngắn gọn (VD: Dưới đây là các mẫu sofa...), sau đó là danh sách sản phẩm (kèm hình ảnh), và kết thúc bằng 1 lời chúc ngắn.",
                },
                {
                  label: "🍽️ Bàn ăn",
                  query:
                    "Tìm Bàn ăn. Hãy trả lời theo cấu trúc: 1 câu dẫn nhập ngắn gọn, sau đó là danh sách sản phẩm (kèm hình ảnh), và kết thúc bằng 1 lời chúc ngắn.",
                },
                {
                  label: "🛏️ Giường ngủ gỗ",
                  query:
                    "Tìm Giường ngủ gỗ. Hãy trả lời theo cấu trúc: 1 câu dẫn nhập ngắn gọn, sau đó là danh sách sản phẩm (kèm hình ảnh), và kết thúc bằng 1 lời chúc ngắn.",
                },
                {
                  label: "📚 Bàn học sinh",
                  query:
                    "Tìm Bàn học sinh. Hãy trả lời theo cấu trúc: 1 câu dẫn nhập ngắn gọn, sau đó là danh sách sản phẩm (kèm hình ảnh), và kết thúc bằng 1 lời chúc ngắn.",
                },
              ].map((item, index) => (
                <button
                  key={index}
                  onClick={(e) => handleSendMessage(e, item.label, item.query)}
                  className="
                    px-3 py-1.5 
                    bg-white border border-gray-200 rounded-full 
                    text-xs text-gray-600 font-medium
                    shadow-sm hover:shadow-md hover:-translate-y-0.5
                    hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 
                    transition-all duration-200"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => handleSendMessage(e, inputMsg)}
              className="flex gap-2 items-center bg-gray-50 p-1.5 rounded-full border border-gray-200 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-100 transition-all shadow-sm"
            >
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder="Tìm sofa, kệ tivi..."
                className="flex-1 px-4 py-2.5 bg-transparent text-sm focus:outline-none text-gray-700 placeholder-gray-400"
              />
              <button
                type="submit"
                disabled={!inputMsg.trim() || isTyping}
                className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md active:scale-95 flex items-center justify-center w-10 h-10"
              >
                {isTyping ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div
        className={`fixed bottom-24 right-6 z-50 
        transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
        ${
          !isOpen
            ? "opacity-100 scale-100 rotate-0 pointer-events-auto delay-100"
            : "opacity-0 scale-0 rotate-90 pointer-events-none"
        }`}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center justify-center w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg shadow-blue-600/40 border-2 border-white transition-all duration-300"
        >
          <div className="flex flex-col items-center justify-center">
            <div className="relative">
              <MessageCircle
                size={28}
                className="text-white"
                strokeWidth={1.5}
              />
            </div>
          </div>

          <span className="absolute top-0 right-0 flex h-3 w-3 -mt-1 -mr-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
          </span>
        </button>
      </div>
    </>
  );
}
