import { useEffect, useState } from "react";
import { message, Tabs, Spin, Empty } from "antd";
import {
  Ticket,
  Copy,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  CalendarDays,
} from "lucide-react";
import Cookies from "js-cookie";

// Helper format tiền tệ
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

// Helper format ngày
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function PromotionsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageApi, contextHolder] = message.useMessage();
  const token = Cookies.get("jwt");

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      // Gọi API lấy tất cả active coupons
      // Giả sử backend có endpoint này, nếu không bạn dùng endpoint search/filter
      const res = await fetch("http://localhost:8080/api/coupons/active", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Bỏ comment nếu API yêu cầu login
        },
      });
      
      if (!res.ok) throw new Error("Không thể tải danh sách mã giảm giá");
      
      const data = await res.json();
      setCoupons(data);
    } catch (error) {
      console.error(error);
      // Dữ liệu giả lập để bạn test UI nếu chưa có API
      setCoupons(MOCK_COUPONS); 
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    messageApi.success({
      content: `Đã sao chép mã: ${code}`,
      icon: <CheckCircle2 className="text-green-500" />,
    });
  };

  // Phân loại coupon
  const now = new Date();
  
  const activeCoupons = coupons.filter(c => {
    const startDate = new Date(c.startDate);
    const endDate = new Date(c.endDate);
    const isSoldOut = c.usageLimit && c.usedCount >= c.usageLimit;
    return c.isActive && startDate <= now && endDate > now && !isSoldOut;
  });

  const upcomingCoupons = coupons.filter(c => {
    const startDate = new Date(c.startDate);
    return c.isActive && startDate > now;
  });

  // Component hiển thị thẻ Voucher
  const CouponCard = ({ coupon, isUpcoming = false }) => {
    const isPercent = coupon.discountType === "percent";
    const percentValue = coupon.discountValue;
    const fixedValue = formatCurrency(coupon.discountValue);
    
    // Tính phần trăm sử dụng (cho thanh progress)
    const usagePercent = coupon.usageLimit 
      ? Math.round((coupon.usedCount / coupon.usageLimit) * 100) 
      : 0;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col sm:flex-row h-full transition-all hover:shadow-md hover:border-red-200 group">
        {/* Phần bên trái: Giá trị giảm */}
        <div className={`sm:w-32 md:w-40 p-4 flex flex-col items-center justify-center text-white relative overflow-hidden shrink-0 
          ${isUpcoming ? 'bg-gray-400' : 'bg-red-600'}`}>
          
          {/* Họa tiết răng cưa mô phỏng vé */}
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-50 rounded-full"></div>
          <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full sm:block hidden"></div>
          
          <div className="relative z-10 text-center">
            <span className="text-xs font-medium opacity-90 uppercase">Voucher</span>
            <div className="font-bold text-2xl sm:text-3xl my-1">
              {isPercent ? `${percentValue}%` : 'GIẢM'}
            </div>
            {!isPercent && <div className="text-sm font-bold">{fixedValue}</div>}
            <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full mt-1">
              SHOPPER
            </span>
          </div>
        </div>

        {/* Phần bên phải: Thông tin chi tiết */}
        <div className="flex-1 p-4 flex flex-col justify-between relative">
          <div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-gray-800 text-lg leading-tight">
                {coupon.code}
              </h3>
              {!isUpcoming && (
                <button 
                  onClick={() => handleCopyCode(coupon.code)}
                  className="text-gray-400 hover:text-red-600 transition-colors p-1"
                  title="Sao chép mã"
                >
                  <Copy size={18} />
                </button>
              )}
            </div>
            
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {coupon.description || `Giảm ${isPercent ? percentValue + '%' : fixedValue} cho đơn hàng.`}
            </p>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 w-fit px-2 py-1 rounded border border-gray-100">
                <ShoppingBag size={12} />
                <span>Đơn tối thiểu: {formatCurrency(coupon.minOrderAmount)}</span>
              </div>
              
              {isPercent && coupon.maxDiscount && (
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 w-fit px-2 py-1 rounded border border-gray-100">
                  <AlertCircle size={12} />
                  <span>Giảm tối đa: {formatCurrency(coupon.maxDiscount)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-dashed border-gray-200">
            <div className="flex items-center justify-between text-xs mb-2">
               <div className="flex items-center gap-1 text-gray-500">
                  {isUpcoming ? <CalendarDays size={14}/> : <Clock size={14} />}
                  <span>
                    {isUpcoming 
                      ? `Bắt đầu: ${formatDate(coupon.startDate)}` 
                      : `Hết hạn: ${formatDate(coupon.endDate)}`
                    }
                  </span>
               </div>
            </div>

            {/* Thanh trạng thái sử dụng */}
            {!isUpcoming && coupon.usageLimit && (
              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
                <div 
                  className="bg-red-500 h-1.5 rounded-full" 
                  style={{ width: `${usagePercent}%` }}
                ></div>
              </div>
            )}
            
            {!isUpcoming && coupon.usageLimit && (
               <div className="text-[10px] text-gray-400 text-right">
                 Đã dùng: {usagePercent}%
               </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const TabContent = ({ data, isUpcoming }) => {
    if (loading) return (
      <div className="flex justify-center py-20">
        <Spin size="large" />
      </div>
    );

    if (data.length === 0) return (
      <Empty 
        image={Empty.PRESENTED_IMAGE_SIMPLE} 
        description="Hiện tại không có mã giảm giá nào." 
        className="py-10"
      />
    );

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 py-4">
        {data.map((coupon) => (
          <CouponCard key={coupon.couponId} coupon={coupon} isUpcoming={isUpcoming} />
        ))}
      </div>
    );
  };

  const items = [
    {
      key: '1',
      label: (
        <span className="flex items-center gap-2 px-2">
          <Ticket size={18} /> Đang diễn ra ({activeCoupons.length})
        </span>
      ),
      children: <TabContent data={activeCoupons} isUpcoming={false} />,
    },
    {
      key: '2',
      label: (
        <span className="flex items-center gap-2 px-2">
          <Clock size={18} /> Sắp diễn ra ({upcomingCoupons.length})
        </span>
      ),
      children: <TabContent data={upcomingCoupons} isUpcoming={true} />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      {contextHolder}
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center justify-center sm:justify-start gap-3">
            <Ticket className="w-8 h-8 text-red-600" /> 
            Kho Voucher & Ưu Đãi
          </h1>
          <p className="mt-2 text-gray-600">
            Săn ngay mã giảm giá hấp dẫn dành riêng cho bạn.
          </p>
        </div>

        {/* Tabs & Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[500px]">
          <Tabs 
            defaultActiveKey="1" 
            items={items} 
            size="large"
            tabBarStyle={{ marginBottom: 24 }}
          />
        </div>
      </div>
    </div>
  );
}

// --- DỮ LIỆU MẪU (Dùng để test khi chưa có API) ---
const MOCK_COUPONS = [
  {
    couponId: 1,
    code: "WELCOME50",
    description: "Giảm giá cho khách hàng mới",
    discountType: "fixed",
    discountValue: 50000,
    minOrderAmount: 200000,
    maxDiscount: null,
    startDate: "2023-10-01T00:00:00",
    endDate: "2025-12-31T23:59:59",
    usageLimit: 1000,
    usedCount: 150,
    isActive: true
  },
  {
    couponId: 2,
    code: "SALE10",
    description: "Giảm 10% tối đa 50k cho đơn từ 150k",
    discountType: "percent",
    discountValue: 10,
    minOrderAmount: 150000,
    maxDiscount: 50000,
    startDate: "2023-11-01T00:00:00",
    endDate: "2024-12-30T23:59:59",
    usageLimit: 500,
    usedCount: 480, // Sắp hết
    isActive: true
  },
  {
    couponId: 3,
    code: "FREESHIP",
    description: "Miễn phí vận chuyển",
    discountType: "fixed",
    discountValue: 30000,
    minOrderAmount: 300000,
    maxDiscount: null,
    startDate: "2023-12-01T00:00:00",
    endDate: "2024-12-31T23:59:59",
    usageLimit: null, // Không giới hạn
    usedCount: 200,
    isActive: true
  },
  {
    couponId: 4,
    code: "TET2025",
    description: "Siêu sale đón Tết",
    discountType: "percent",
    discountValue: 20,
    minOrderAmount: 500000,
    maxDiscount: 200000,
    startDate: "2025-01-01T00:00:00", // Sắp diễn ra
    endDate: "2025-02-01T23:59:59",
    usageLimit: 100,
    usedCount: 0,
    isActive: true
  }
];