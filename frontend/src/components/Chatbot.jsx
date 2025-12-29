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

// Thay đổi URL này thành URL thật của backend bạn
const API_URL = "http://localhost:8080/api/chatbot/ask";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [inputMsg, setInputMsg] = useState("");
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState(() => {
    try {
      const savedMessages = sessionStorage.getItem("chat_history");
      return savedMessages
        ? JSON.parse(savedMessages)
        : [
            {
              id: 1,
              text: "Xin chào! Tôi là trợ lý ảo NPH Store. Tôi có thể giúp bạn tìm Sofa, Bàn ăn... hoặc tư vấn thiết kế ngay lập tức!",
              sender: "bot",
            },
          ];
    } catch (error) {
      console.error("Lỗi đọc lịch sử chat:", error);
      return [];
    }
  });

  useEffect(() => {
    sessionStorage.setItem("chat_history", JSON.stringify(messages));
    scrollToBottom();
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleClearChat = () => {
    if (window.confirm("Bạn có chắc muốn xóa toàn bộ lịch sử chat không?")) {
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

  const handleSendMessage = async (e, textToShow, textToSend = null) => {
    if (e) e.preventDefault();
    const displayMsg = textToShow || inputMsg;
    const apiMsg = textToSend || displayMsg;

    if (!displayMsg?.trim()) return;

    // 1. UI update: Thêm tin nhắn user vào list ngay lập tức
    const newUserMsg = { id: Date.now(), text: displayMsg, sender: "user" };
    setMessages((prev) => [...prev, newUserMsg]);
    setInputMsg("");
    setIsTyping(true);

    // 2. LOGIC MEMORY: Lọc lấy 5 cặp hội thoại gần nhất (10 tin nhắn)
    // Lấy messages hiện tại (lọc bỏ lỗi)
    const validMessages = messages.filter((msg) => !msg.isError);
    // Cắt lấy 10 tin nhắn cuối cùng (để gửi kèm tin nhắn mới)
    const historySlice = validMessages.slice(-10);

    // Map sang format API yêu cầu
    const historyPayload = historySlice.map((msg) => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text,
    }));

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: apiMsg,
          history: historyPayload, // Gửi kèm lịch sử
        }),
      });

      if (!response.ok) throw new Error("Lỗi kết nối server");

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
          text: "Xin lỗi, hiện tại máy chủ đang bận. Vui lòng thử lại sau.",
          sender: "bot",
          isError: true,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // --- COMPONENT CON: THẺ SẢN PHẨM ---
  const MiniProductCard = ({ name, url, imgUrl, priceString }) => {
    let oldPriceStr = "";
    let newPriceStr = priceString || "";

    if (priceString && priceString.includes("|")) {
      const parts = priceString.split("|");
      oldPriceStr = parts[0]?.trim() || "";
      newPriceStr = parts[1]?.trim() || "";
    }

    const formatPrice = (price) => {
      if (!price || price === "0") return "";
      const num = parseInt(price.toString().replace(/\D/g, "")) || 0;
      if (num === 0) return "Liên hệ";
      return num.toLocaleString("vi-VN") + "đ";
    };

    let discountPercent = 0;
    if (oldPriceStr && newPriceStr) {
      const oldP = parseInt(oldPriceStr.replace(/\D/g, ""));
      const newP = parseInt(newPriceStr.replace(/\D/g, ""));
      if (oldP > newP && oldP > 0) {
        discountPercent = Math.round(((oldP - newP) / oldP) * 100);
      }
    }

    return (
      <div className="mt-2 mb-3 group relative block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-300 w-full max-w-[260px]">
        <a href={url} target="_blank" rel="noopener noreferrer" className="block relative h-40 w-full overflow-hidden bg-gray-50">
          <img
            src={imgUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/300x200?text=NPH+Store";
            }}
          />
          {discountPercent > 0 && (
            <div className="absolute top-0 right-0 bg-red-600 text-white text-[11px] font-bold px-2 py-1 rounded-bl-lg shadow-sm z-10">
              -{discountPercent}%
            </div>
          )}
        </a>

        <div className="p-3">
          <a href={url} target="_blank" rel="noopener noreferrer">
            <h4 className="text-[13px] font-semibold text-gray-800 line-clamp-2 leading-snug mb-2 min-h-[2.5em] hover:text-blue-600 transition-colors">
              {name}
            </h4>
          </a>

          <div className="flex items-end justify-between mt-1">
            <div className="flex flex-col">
              <span className="text-red-600 font-bold text-[15px] leading-none">
                {formatPrice(newPriceStr)}
              </span>
              {discountPercent > 0 && (
                <span className="text-[11px] text-gray-400 line-through mt-1">
                  {formatPrice(oldPriceStr)}
                </span>
              )}
            </div>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
            >
              <ChevronRight size={18} />
            </a>
          </div>
        </div>
      </div>
    );
  };

  // --- XỬ LÝ TEXT & FORMATTING ---
  const formatMessage = (text) => {
    if (!text) return null;
    const cleanText = text.replace(/\*\*/g, ""); 
    const parts = [];
    let lastIndex = 0;
    const productRegex = /\[([^\]]+)\]\(([^)]+)\)[\s\n]*!\[([^\]]*)\]\(([^)]+)\)/g;

    let match;
    while ((match = productRegex.exec(cleanText)) !== null) {
      if (match.index > lastIndex) {
        parts.push(renderTextWithLines(cleanText.substring(lastIndex, match.index)));
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
      if (!line.trim() && index > 0) return <div key={index} className="h-2" />;
      if (!line.trim()) return null;
      return (
        <div key={index} className="mb-1 leading-relaxed text-gray-700 text-[14px]">
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
          className="text-blue-600 font-medium hover:underline inline-flex items-center gap-0.5"
        >
          {match[1]} <ExternalLink size={10} />
        </a>
      );
      lastIdx = linkRegex.lastIndex;
    }
    if (lastIdx < text.length) fragments.push(text.substring(lastIdx));
    return fragments;
  };

  return (
    <>
      <div className={`fixed z-[9999] flex flex-col font-sans transition-all duration-300 origin-bottom-right ${isOpen ? "opacity-100 scale-100 translate-y-0 pointer-events-auto visible" : "opacity-0 scale-90 translate-y-10 pointer-events-none invisible"} bottom-0 right-0 w-full h-[100dvh] rounded-none sm:bottom-24 sm:right-6 sm:w-[400px] sm:h-[600px] sm:max-h-[80vh] sm:rounded-2xl shadow-2xl`}>
        <div className="bg-white w-full h-full sm:rounded-2xl overflow-hidden flex flex-col shadow-xl border border-gray-200">
          <div className="bg-gradient-to-r from-blue-700 to-blue-600 p-4 flex justify-between items-center text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-inner">
                  <Armchair size={20} className="text-white" />
                </div>
                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-blue-600 animate-pulse"></span>
              </div>
              <div>
                <h3 className="font-bold text-base text-white tracking-wide">Trợ lý Nội Thất</h3>
                <p className="text-[11px] text-blue-100 font-light flex items-center gap-1">
                  <span className="w-1 h-1 bg-blue-200 rounded-full"></span> Luôn sẵn sàng hỗ trợ
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={handleClearChat} className="hover:bg-white/20 p-2 rounded-lg transition-colors text-blue-100 hover:text-white"><RefreshCw size={18} /></button>
              <button onClick={() => setIsOpen(false)} className="hover:bg-red-500/80 p-2 rounded-lg transition-colors text-blue-100 hover:text-white"><X size={20} /></button>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto bg-[#f0f2f5] space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex w-full ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                {msg.sender === "bot" && (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 text-blue-600 shrink-0 border border-blue-200 self-end mb-1"><ShoppingBag size={14} /></div>
                )}
                <div className={`max-w-[85%] p-3.5 text-[14px] shadow-sm leading-relaxed ${msg.sender === "user" ? "bg-blue-600 text-white rounded-2xl rounded-br-sm" : "bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-bl-sm"} ${msg.isError ? "border-red-200 bg-red-50 text-red-600" : ""}`}>
                  {msg.sender === "bot" && !msg.isError ? <div className="break-words">{formatMessage(msg.text)}</div> : msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start items-center">
                <div className="w-8 h-8 rounded-full bg-gray-200/50 flex items-center justify-center mr-2 opacity-50 self-end mb-1"><ShoppingBag size={14} className="text-gray-500" /></div>
                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 flex items-center gap-1 h-10"><Loader2 size={16} className="animate-spin text-gray-400" /></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white border-t border-gray-100">
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
              {[{ label: "🛋️ Sofa", query: "Tìm Sofa phòng khách..." }, { label: "🍽️ Bàn ăn", query: "Tìm Bàn ăn..." }, { label: "🛏️ Giường", query: "Tìm Giường ngủ gỗ..." }, { label: "📚 Bàn học", query: "Tìm Bàn học sinh..." }].map((item, index) => (
                <button key={index} onClick={(e) => handleSendMessage(e, item.label, item.query)} className="whitespace-nowrap px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs text-gray-600 font-medium hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors">{item.label}</button>
              ))}
            </div>
            <form onSubmit={(e) => handleSendMessage(e, inputMsg)} className="flex gap-2 items-center bg-gray-50 p-1.5 rounded-full border border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
              <input type="text" value={inputMsg} onChange={(e) => setInputMsg(e.target.value)} placeholder="Bạn cần tìm nội thất gì?" className="flex-1 px-4 py-2 bg-transparent text-sm focus:outline-none text-gray-700 placeholder-gray-400" />
              <button type="submit" disabled={!inputMsg.trim() || isTyping} className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-transform active:scale-95 flex items-center justify-center w-10 h-10 shadow-md">
                {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
              </button>
            </form>
          </div>
        </div>
      </div>
      <div className={`fixed bottom-6 right-6 z-50 transition-all duration-500 ${!isOpen ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 rotate-90 pointer-events-none"}`}>
        <button onClick={() => setIsOpen(true)} className="group relative flex items-center justify-center w-16 h-16 bg-blue-600 hover:bg-blue-700 rounded-full shadow-[0_8px_30px_rgb(37,99,235,0.3)] border-4 border-white transition-all duration-300 active:scale-95">
          <MessageCircle size={30} className="text-white" strokeWidth={1.5} />
          <span className="absolute top-0 right-0 flex h-3.5 w-3.5 -mt-1 -mr-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border-2 border-white"></span></span>
        </button>
      </div>
    </>
  );
}