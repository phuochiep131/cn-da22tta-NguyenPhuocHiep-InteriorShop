import { useContext, useState, useEffect, useCallback } from "react";
import { AuthContext } from "../../context/AuthContext";
import {
  Card,
  Statistic,
  Table,
  Tag,
  Row,
  Col,
  Avatar,
  Spin,
  Typography,
  DatePicker,
  Segmented,
  Space,
} from "antd";
import {
  DollarCircleOutlined,
  ShoppingCartOutlined,
  UsergroupAddOutlined,
  DropboxOutlined,
  RiseOutlined,
  FallOutlined,
  FireOutlined,
  BarChartOutlined,
  CrownOutlined,
  ClockCircleOutlined,
  AlertOutlined,
  PieChartOutlined,
  CalendarOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  LabelList,
} from "recharts";
import Cookies from "js-cookie";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// --- DỮ LIỆU MẪU (MOCK DATA) ---
const MOCK_KPI = {
  totalUsers: 0,
  userGrowth: 0,
  newOrders: 0,
  orderGrowth: 0,
  monthlyRevenue: 0,
  revenueGrowth: 0,
  totalStock: 0,
};

const MOCK_CHART_DATA = [{ label: "Loading", actual: 0 }];
const MOCK_PIE_DATA = [{ name: "Loading", value: 1 }];

// --- CONSTANTS ---
const STATUS_COLORS = {
  PENDING: "#faad14",
  PROCESSING: "#1890ff",
  SHIPPING: "#722ed1",
  DELIVERED: "#52c41a",
  CANCELLED: "#ff4d4f",
  RETURNED: "#8c8c8c",
  REFUNDED: "#8c8c8c",
};

const STATUS_TRANSLATIONS = {
  PENDING: "Chờ xác nhận",
  PROCESSING: "Đang xử lý",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã hủy",
  RETURNED: "Trả hàng",
  REFUNDED: "Hoàn tiền",
};

export default function AdminDashboard() {
  const token = Cookies.get("jwt");
  const { user } = useContext(AuthContext);

  // --- STATE QUẢN LÝ ---
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false); // Loading riêng cho PieChart

  // --- DATA STATES ---
  const [topCategories, setTopCategories] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [orderStatusData, setOrderStatusData] = useState(MOCK_PIE_DATA);
  const [topCustomers, setTopCustomers] = useState([]);
  const [comparisonData, setComparisonData] = useState(MOCK_CHART_DATA);
  const [kpiData, setKpiData] = useState(MOCK_KPI);
  const [peakHourData, setPeakHourData] = useState([]);
  const [lowStockData, setLowStockData] = useState([]);
  const [stagnantData, setStagnantData] = useState([]);

  // --- FILTER STATE ---
  // Mặc định lọc từ đầu tháng đến hiện tại
  const [dateRange, setDateRange] = useState([
    dayjs().startOf("month"),
    dayjs(),
  ]);

  const BASE_URL = "http://localhost:8080/api/admin/dashboard";
  const headers = { Authorization: `Bearer ${token}` };

  // --- 1. API CALL RIÊNG CHO STATUS (Dùng useCallback để tránh re-render) ---
  const fetchOrderStatus = useCallback(
    async (start, end) => {
      setStatusLoading(true);
      try {
        const url = `${BASE_URL}/orders/status?startDate=${start.toISOString()}&endDate=${end.toISOString()}`;
        const res = await fetch(url, { headers });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const formatted = data.map((item) => {
              const key = item.name ? item.name.toUpperCase() : "";
              return {
                ...item,
                name: STATUS_TRANSLATIONS[key] || item.name,
                color: STATUS_COLORS[key] || "#d1d5db",
              };
            });
            setOrderStatusData(formatted);
          } else {
            setOrderStatusData([
              { name: "Không có dữ liệu", value: 0, color: "#eee" },
            ]);
          }
        }
      } catch (error) {
        console.error("Fetch Status Error:", error);
        setOrderStatusData([{ name: "Lỗi tải", value: 0, color: "#ff4d4f" }]);
      } finally {
        setStatusLoading(false);
      }
    },
    [token]
  );

  // --- 2. API CALL CHUNG (Chạy 1 lần đầu tiên) ---
  useEffect(() => {
    if (!token) return;

    const fetchAllData = async () => {
      setLoading(true);
      try {
        const headersJson = { ...headers, "Content-Type": "application/json" };

        const [
          resCat,
          resProd,
          resKPI,
          resComp,
          resCust,
          resPeak,
          resStock,
          resStagnant,
        ] = await Promise.all([
          fetch(`${BASE_URL}/categories/top`, { headers }).catch(() => null),
          fetch(`${BASE_URL}/products/top`, { headers }).catch(() => null),
          fetch(`${BASE_URL}/overview`, { headers: headersJson }).catch(
            () => null
          ),
          fetch(`${BASE_URL}/chart/revenue-comparison`, { headers }).catch(
            () => null
          ),
          fetch(`${BASE_URL}/customers/top`, { headers }).catch(() => null),
          fetch(`${BASE_URL}/orders/peak-hours`, { headers }).catch(() => null),
          fetch(`${BASE_URL}/products/low-stock`, { headers }).catch(
            () => null
          ),
          fetch(`${BASE_URL}/products/stagnant`, { headers }).catch(() => null),
        ]);

        // Xử lý Top Categories
        if (resCat && resCat.ok) {
          const data = await resCat.json();
          setTopCategories(
            data.map((item) => ({ name: item.name, sales: item.value }))
          );
        }

        // Xử lý Hàng ế (Stagnant Products)
        if (resStagnant && resStagnant.ok) {
          setStagnantData(await resStagnant.json());
        }

        // Xử lý Top Products
        if (resProd && resProd.ok) {
          const data = await resProd.json();
          setTopProducts(data.map((item, idx) => ({ key: idx, ...item })));
        }

        // Xử lý KPI
        if (resKPI && resKPI.ok) {
          setKpiData(await resKPI.json());
        }

        // Xử lý Comparison Chart
        if (resComp && resComp.ok) {
          const data = await resComp.json();
          setComparisonData(
            Array.isArray(data) && data.length > 0
              ? data
              : [{ label: "Không có dữ liệu", actual: 0 }]
          );
        }

        // Xử lý Top Customers
        if (resCust && resCust.ok) {
          const data = await resCust.json();
          setTopCustomers(data.map((item, idx) => ({ key: idx, ...item })));
        }

        // Xử lý Peak Hours
        if (resPeak && resPeak.ok) {
          setPeakHourData(await resPeak.json());
        }

        // Xử lý Low Stock
        if (resStock && resStock.ok) {
          setLowStockData(await resStock.json());
        }

        // Gọi Status lần đầu theo dateRange mặc định
        await fetchOrderStatus(dateRange[0], dateRange[1]);
      } catch (error) {
        console.error("Dashboard Load Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [token]);

  // --- HANDLERS (XỬ LÝ SỰ KIỆN) ---

  // 1. Khi chọn ngày trên lịch (RangePicker)
  const handleRangeChange = (dates) => {
    if (dates) {
      setDateRange(dates);
      fetchOrderStatus(dates[0].startOf("day"), dates[1].endOf("day"));
    }
  };

  // 2. Khi bấm nút chọn nhanh (Segmented)
  const handleQuickFilter = (key) => {
    let start,
      end = dayjs();
    if (key === "today") start = dayjs().startOf("day");
    else if (key === "month") start = dayjs().startOf("month");

    setDateRange([start, end]);
    fetchOrderStatus(start, end);
  };

  // --- COLUMNS CONFIG ---
  const productColumns = [
    {
      title: "Sản phẩm",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div className="flex items-center gap-3">
          <Avatar
            shape="square"
            size={48}
            src={record.image}
            className="border border-gray-200"
          />
          <div>
            <div className="font-semibold text-gray-800 line-clamp-1">
              {text}
            </div>
            <div className="text-xs text-gray-400">ID: #{record.key + 1}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Giá bán",
      dataIndex: "price",
      key: "price",
      render: (price) => (
        <span className="text-gray-600 font-medium">
          {new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(price)}
        </span>
      ),
    },
    {
      title: "Đã bán",
      dataIndex: "sold",
      key: "sold",
      align: "center",
      render: (sold) => (
        <Tag
          color="geekblue"
          className="font-bold border-0 bg-blue-50 text-blue-600 px-3 py-1 rounded-full"
        >
          {sold}
        </Tag>
      ),
    },
    {
      title: "Doanh thu",
      key: "total",
      align: "right",
      render: (_, record) => (
        <span className="font-bold text-indigo-600">
          {new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(record.price * record.sold)}
        </span>
      ),
    },
  ];

  const stagnantColumns = [
    {
      title: "Sản phẩm",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div className="flex items-center gap-3">
          <Avatar shape="square" src={record.image} size={40} />
          <div>
            <div className="font-medium text-gray-800 line-clamp-1">{text}</div>
            <div className="text-xs text-rose-500">
              Không bán được &gt; 3 tháng
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Tồn kho",
      dataIndex: "stock",
      key: "stock",
      align: "right",
      render: (val) => (
        <Tag color="error" className="font-bold">
          {val}
        </Tag>
      ),
    },
  ];

  const customerColumns = [
    {
      title: "Khách hàng VIP",
      dataIndex: "name",
      key: "name",
      render: (text, record, index) => (
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar
              src={record.avatar}
              size={40}
              className="border border-gray-200"
            >
              {text ? text.charAt(0) : "U"}
            </Avatar>
            {index === 0 && (
              <CrownOutlined className="absolute -top-2 -right-2 text-yellow-500 bg-white rounded-full p-0.5 shadow-sm text-lg" />
            )}
            {index === 1 && (
              <CrownOutlined className="absolute -top-2 -right-2 text-gray-400 bg-white rounded-full p-0.5 shadow-sm" />
            )}
            {index === 2 && (
              <CrownOutlined className="absolute -top-2 -right-2 text-orange-600 bg-white rounded-full p-0.5 shadow-sm" />
            )}
          </div>
          <div>
            <div className="font-semibold text-gray-800">{text}</div>
            <div className="text-xs text-gray-400">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Tổng chi tiêu",
      dataIndex: "totalSpent",
      key: "totalSpent",
      align: "right",
      render: (val) => (
        <span className="font-bold text-emerald-600">
          {new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(val)}
        </span>
      ),
    },
  ];

  // --- COMPONENT HELPERS ---
  const StatCard = ({
    title,
    value,
    icon,
    color,
    prefix,
    growth,
    formatter,
  }) => (
    <Card
      bordered={false}
      className="shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl h-full border border-gray-100"
    >
      <div className="flex justify-between items-start">
        <div>
          <Text type="secondary" className="font-medium text-sm">
            {title}
          </Text>
          <div className="mt-1">
            <Statistic
              value={value}
              prefix={prefix}
              formatter={formatter}
              valueStyle={{
                fontSize: "26px",
                fontWeight: "800",
                color: "#1f2937",
              }}
            />
          </div>
        </div>
        <div
          className={`p-3 rounded-xl bg-${color}-50 text-${color}-600 shadow-sm`}
        >
          {icon}
        </div>
      </div>
      {growth !== undefined && (
        <div className="mt-4 flex items-center text-xs font-medium">
          <span
            className={`flex items-center px-2.5 py-1 rounded-full mr-2 ${
              growth >= 0
                ? "text-emerald-700 bg-emerald-50"
                : "text-rose-700 bg-rose-50"
            }`}
          >
            {growth >= 0 ? (
              <RiseOutlined className="mr-1" />
            ) : (
              <FallOutlined className="mr-1" />
            )}
            {Math.abs(growth)}%
          </span>
          <span className="text-gray-400">so với tuần trước</span>
        </div>
      )}
    </Card>
  );

  return (
    <div className="space-y-8 pb-10 bg-gray-50/30 p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Title level={2} style={{ marginBottom: 0, color: "#111827" }}>
            Tổng quan hệ thống
          </Title>
          <Text type="secondary">Xin chào, {user?.fullName || "Admin"}!</Text>
        </div>
      </div>

      {/* KPI ROW */}
      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Doanh thu tháng này"
            value={kpiData.monthlyRevenue}
            growth={kpiData.revenueGrowth}
            icon={<DollarCircleOutlined className="text-2xl" />}
            color="indigo"
            formatter={(value) =>
              new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
                maximumFractionDigits: 0,
              }).format(value)
            }
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Đơn Hàng Mới"
            value={kpiData.newOrders}
            growth={kpiData.orderGrowth}
            icon={<ShoppingCartOutlined className="text-2xl" />}
            color="blue"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Khách Hàng"
            value={kpiData.totalUsers}
            growth={kpiData.userGrowth}
            icon={<UsergroupAddOutlined className="text-2xl" />}
            color="emerald"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Tổng Tồn Kho"
            value={kpiData.totalStock}
            formatter={(value) => new Intl.NumberFormat("vi-VN").format(value)}
            icon={<DropboxOutlined className="text-2xl" />}
            color="orange"
          />
        </Col>
      </Row>

      {/* CHART ROW 1: REVENUE & ORDER STATUS */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <div className="flex items-center gap-2">
                <BarChartOutlined className="text-indigo-600" />
                <span className="font-bold text-lg text-gray-800">
                  Doanh thu (Thực tế)
                </span>
              </div>
            }
            bordered={false}
            className="shadow-sm rounded-2xl h-full border border-gray-100"
          >
            <div style={{ width: "100%", height: 350, minHeight: 300 }}>
              {loading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Spin />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={comparisonData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorAct" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#6366f1"
                          stopOpacity={0.6}
                        />
                        <stop
                          offset="95%"
                          stopColor="#6366f1"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9ca3af", fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9ca3af", fontSize: 12 }}
                      tickFormatter={(value) => `${value / 1000000}M`}
                    />
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f3f4f6"
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      }}
                      formatter={(value) => [
                        new Intl.NumberFormat("vi-VN").format(value),
                        "Doanh thu",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="actual"
                      name="Thực tế"
                      stroke="#6366f1"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorAct)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </Col>

        {/* --- TỶ LỆ ĐƠN HÀNG VỚI BỘ LỌC ĐẸP --- */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <div className="flex items-center gap-2">
                <span className="bg-indigo-50 text-indigo-600 p-1.5 rounded-md flex items-center justify-center">
                  <PieChartOutlined />
                </span>
                <span className="font-bold text-lg text-gray-800">
                  Tỷ lệ đơn hàng
                </span>
              </div>
            }
            bordered={false}
            className="shadow-sm rounded-2xl h-full border border-gray-100 flex flex-col"
            bodyStyle={{ flex: 1 }}
            // --- THANH CÔNG CỤ LỌC (EXTRA) ---
            extra={
              <div className="flex items-center p-1 bg-gray-50 border border-gray-200 rounded-lg">
                <Segmented
                  options={[
                    { label: "Hôm nay", value: "today" },
                    { label: "Tháng này", value: "month" },
                  ]}
                  onChange={handleQuickFilter}
                  size="small"
                  className="font-medium text-gray-600 bg-white shadow-sm"
                />
                <div className="w-[1px] h-4 bg-gray-300 mx-2"></div>
                <RangePicker
                  size="small"
                  value={dateRange}
                  onChange={handleRangeChange}
                  format="DD/MM"
                  allowClear={false}
                  bordered={false}
                  className="bg-transparent w-[140px] !shadow-none hover:bg-gray-100 transition-colors rounded"
                  suffixIcon={<CalendarOutlined className="text-gray-400" />}
                />
              </div>
            }
          >
            <div
              style={{
                width: "100%",
                height: 320,
                minHeight: 300,
                position: "relative",
              }}
            >
              {statusLoading ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <Spin size="large" />
                  <span className="text-gray-400 text-sm">
                    Đang tính toán số liệu...
                  </span>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={orderStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={90}
                        paddingAngle={5}
                        cornerRadius={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {orderStatusData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            className="hover:opacity-80 cursor-pointer transition-opacity"
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${value} đơn`, "Số lượng"]}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[65%] text-center pointer-events-none">
                    <span className="block text-3xl font-extrabold text-gray-800 leading-tight">
                      {orderStatusData.reduce(
                        (acc, cur) => acc + (cur.value || 0),
                        0
                      )}
                    </span>
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                      Tổng đơn
                    </span>
                  </div>
                </>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* ROW 2: NEW CHARTS (PEAK HOUR & LOW STOCK) */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <div className="flex items-center gap-2">
                <ClockCircleOutlined className="text-blue-500" />
                <span className="font-bold text-lg text-gray-800">
                  Khung giờ mua hàng phổ biến
                </span>
              </div>
            }
            bordered={false}
            className="shadow-sm rounded-2xl border border-gray-100 h-full"
          >
            <div style={{ width: "100%", height: 400 }}>
              <ResponsiveContainer>
                <BarChart data={peakHourData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f3f4f6"
                  />
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    interval={2}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                  />
                  <Tooltip
                    cursor={{ fill: "#eff6ff" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    formatter={(value) => [`${value} đơn`, "Số lượng"]}
                  />
                  <Bar
                    dataKey="value"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    name="Số đơn"
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <div className="flex items-center gap-2">
                <AlertOutlined className="text-rose-500" />
                <span className="font-bold text-lg text-gray-800">
                  Sản phẩm sắp hết hàng (&lt; 10 sản phẩm)
                </span>
              </div>
            }
            bordered={false}
            className="shadow-sm rounded-2xl border border-gray-100 h-full"
          >
            <div style={{ width: "100%", height: 400 }}>
              <ResponsiveContainer>
                <BarChart
                  layout="vertical"
                  data={lowStockData}
                  margin={{ left: 0, right: 30 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#f3f4f6"
                  />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={180}
                    tick={{ fontSize: 12, fill: "#374151", fontWeight: 500 }}
                    interval={0}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "#fff1f2" }}
                    contentStyle={{ borderRadius: "8px", border: "none" }}
                  />
                  <Bar
                    dataKey="stock"
                    fill="#fb7185"
                    barSize={20}
                    radius={[0, 4, 4, 0]}
                  >
                    <LabelList
                      dataKey="stock"
                      position="right"
                      style={{
                        fill: "#e11d48",
                        fontWeight: "bold",
                        fontSize: 12,
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* ROW 3: TOP PRODUCTS & CATEGORIES */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <div className="flex items-center gap-2">
                <FireOutlined className="text-orange-500" />
                <span className="font-bold text-lg text-gray-800">
                  Top 5 Sản phẩm bán chạy
                </span>
              </div>
            }
            bordered={false}
            className="shadow-sm rounded-2xl border border-gray-100 h-full"
          >
            <Table
              columns={productColumns}
              dataSource={topProducts}
              pagination={false}
              scroll={{ x: 600 }}
              rowClassName="hover:bg-gray-50 transition-colors"
              loading={loading}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={
              <span className="font-bold text-lg text-gray-800">
                Top Danh mục bán chạy
              </span>
            }
            bordered={false}
            className="shadow-sm rounded-2xl border border-gray-100 h-full"
          >
            <div style={{ width: "100%", height: 300, minHeight: 300 }}>
              {loading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Spin />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  {/* Thay đổi layout thành vertical để nằm ngang */}
                  <BarChart
                    layout="vertical"
                    data={topCategories}
                    margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="#f3f4f6"
                    />

                    {/* Trục X bây giờ là số lượng (type=number) */}
                    <XAxis type="number" hide />

                    {/* Trục Y hiển thị tên danh mục (type=category) */}
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={120} // Tăng width để hiển thị đủ tên danh mục
                      tick={{
                        fontSize: 13,
                        fontWeight: 500,
                        fill: "#4b5563",
                      }}
                      interval={0}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip
                      cursor={{ fill: "#f3f4f6", radius: 4 }}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                      formatter={(value) => [`${value} đơn`, "Đã bán"]}
                    />

                    <Bar
                      dataKey="sales"
                      fill="#8884d8"
                      barSize={24}
                      radius={[0, 4, 4, 0]} // Bo tròn bên phải
                    >
                      <LabelList
                        dataKey="sales"
                        position="right"
                        style={{ fill: "#6366f1", fontWeight: "bold" }}
                      />
                      {topCategories.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index % 2 === 0 ? "#6366f1" : "#a5b4fc"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* ROW 4: TOP CUSTOMERS */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <div className="flex items-center gap-2">
                <CrownOutlined className="text-yellow-500" />
                <span className="font-bold text-lg text-gray-800">
                  Top Khách hàng thân thiết
                </span>
              </div>
            }
            bordered={false}
            className="shadow-sm rounded-2xl border border-gray-100 h-full"
          >
            <Table
              columns={customerColumns}
              dataSource={topCustomers}
              pagination={false}
              rowClassName="hover:bg-gray-50 transition-colors"
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} className="mt-6">
        <Col span={24}>
          <Card
            title={
              <div className="flex items-center gap-2">
                <WarningOutlined className="text-rose-600" />
                <span className="font-bold text-lg text-gray-800">
                  Top 10 sản phẩm "ế" (Tồn kho 3 tháng không bán được)
                </span>
              </div>
            }
            bordered={false}
            className="shadow-sm rounded-2xl border border-gray-100"
          >
            <Table
              columns={stagnantColumns}
              dataSource={stagnantData}
              pagination={false}
              rowKey="name" // Hoặc id nếu có
              loading={loading}
              rowClassName="hover:bg-rose-50 transition-colors"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
