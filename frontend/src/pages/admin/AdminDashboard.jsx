import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import {
  Card,
  Statistic,
  Table,
  Tag,
  Row,
  Col,
  Button,
  Avatar,
  Segmented,
  Spin,
  Typography,
  Space,
} from "antd";
import {
  DollarCircleOutlined,
  ShoppingCartOutlined,
  UsergroupAddOutlined,
  DropboxOutlined,
  RiseOutlined,
  MoreOutlined,
  LoadingOutlined,
  FallOutlined,
  FireOutlined,
  BarChartOutlined,
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
} from "recharts";
import Cookies from "js-cookie";

const { Title, Text } = Typography;

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

  // --- STATE ---
  const [timeRange, setTimeRange] = useState("year");
  const [loading, setLoading] = useState(false);
  
  // Data States
  const [topCategories, setTopCategories] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [orderStatusData, setOrderStatusData] = useState([]);
  
  // Dữ liệu so sánh Doanh thu (Actual vs Estimated)
  const [comparisonData, setComparisonData] = useState([]);

  const [kpiData, setKpiData] = useState({
    totalUsers: 0,
    userGrowth: 0,
    newOrders: 0,
    orderGrowth: 0,
    monthlyRevenue: 0,
    revenueGrowth: 0,
    totalStock: 0,
  });

  // --- API CALLS ---
  useEffect(() => {
    if (!token) return;

    // 1. Top Categories
    fetch("http://localhost:8080/api/admin/dashboard/categories/top", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const formatted = data.map((item) => ({
          name: item.name,
          sales: item.value,
        }));
        setTopCategories(formatted);
      })
      .catch((err) => console.error(err));

    // 2. Top Products
    fetch("http://localhost:8080/api/admin/dashboard/products/top", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const formatted = data.map((item, index) => ({ key: index, ...item }));
        setTopProducts(formatted);
      })
      .catch((err) => console.error(err));

    // 3. KPI Overview
    fetch("http://localhost:8080/api/admin/dashboard/overview", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("API Error");
        return res.json();
      })
      .then((data) => {
        if (data) setKpiData(data);
      })
      .catch((err) => console.warn(err));

    // 4. Order Status
    fetch("http://localhost:8080/api/admin/dashboard/orders/status", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const formattedData = data.map((item) => {
          const key = item.name ? item.name.toUpperCase() : "";
          return {
            ...item,
            name: STATUS_TRANSLATIONS[key] || item.name,
            color: STATUS_COLORS[key] || "#000000",
          };
        });
        setOrderStatusData(formattedData);
      })
      .catch((err) => console.error(err));
  }, [token]);

  // --- 5. API CHART: SO SÁNH DOANH THU (Đã sửa) ---
  useEffect(() => {
    const fetchComparisonData = async () => {
      if (!token) return;
      setLoading(true);
      try {
        // Gọi API so sánh doanh thu
        const res = await fetch(
          "http://localhost:8080/api/admin/dashboard/chart/revenue-comparison",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        
        if (Array.isArray(data) && data.length > 0) {
          setComparisonData(data);
        }
      } catch (error) {
        console.error("Lỗi Chart Comparison:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchComparisonData();
  }, [token]); // API này thường mặc định theo năm, nếu muốn theo timeRange thì nối chuỗi query

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

  // --- SUB-COMPONENTS ---
  const StatCard = ({ title, value, icon, color, prefix, growth }) => (
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
    <div className="space-y-8 pb-10 bg-gray-50/30 p-2">
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Title level={2} style={{ marginBottom: 0, color: "#111827" }}>
            Tổng quan
          </Title>
          <Text type="secondary">
            Xin chào, Admin {user?.fullName || "Admin"}!{" "}
          </Text>
        </div>
      </div>

      {/* 2. KPI CARDS */}
      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Doanh thu tháng này"
            value={new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
              maximumFractionDigits: 0,
            }).format(kpiData.monthlyRevenue)}
            growth={kpiData.revenueGrowth}
            icon={<DollarCircleOutlined className="text-2xl" />}
            color="indigo"
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
            title="Tổng sản phẩm tồn Kho"
            value={kpiData.totalStock} 
            formatter={(value) => new Intl.NumberFormat('vi-VN').format(value)}
            icon={<DropboxOutlined className="text-2xl" />}
            color="orange"
          />
        </Col>
      </Row>

      {/* 3. CHARTS ROW */}
      <Row gutter={[24, 24]}>
        {/* REVENUE COMPARISON CHART */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <div className="flex items-center justify-between">
                <span className="font-bold text-lg text-gray-800 flex items-center gap-2">
                  <BarChartOutlined className="text-indigo-600" />
                  Hiệu quả kinh doanh
                </span>
                {/* Ẩn Segmented nếu API so sánh chưa hỗ trợ filter theo tuần/tháng */}
                {/* <Segmented ... /> */}
              </div>
            }
            bordered={false}
            className="shadow-sm rounded-2xl h-full border border-gray-100"
          >
            {loading ? (
              <div className="h-[320px] flex items-center justify-center">
                <Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />} />
              </div>
            ) : (
              <div className="h-[320px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  {/* SỬA LẠI: Dùng comparisonData và vẽ 2 Area */}
                  <AreaChart
                    data={comparisonData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorEst" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorAct" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
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
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      }}
                      formatter={(value, name) => [
                        new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(value),
                        name === "Thực tế" ? "Thực tế" : "Ước tính",
                      ]}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    
                    {/* Đường Ước tính (Estimated) */}
                    <Area
                      type="monotone"
                      dataKey="estimated"
                      name="Ước tính"
                      stroke="#c99091ff"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      fillOpacity={1}
                      fill="url(#colorEst)"
                    />
                    
                    {/* Đường Thực tế (Actual) */}
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
              </div>
            )}
          </Card>
        </Col>

        {/* PIE CHART */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <span className="font-bold text-lg text-gray-800">
                Tỷ lệ đơn hàng
              </span>
            }
            bordered={false}
            className="shadow-sm rounded-2xl h-full border border-gray-100"
          >
            <div className="h-[320px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `${value} đơn`}
                    contentStyle={{ borderRadius: "8px" }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[60%] text-center">
                <span className="block text-3xl font-extrabold text-gray-800">
                  {orderStatusData.reduce((acc, cur) => acc + cur.value, 0)}
                </span>
                <span className="text-sm text-gray-400 font-medium">
                  Tổng đơn
                </span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 4. ANALYSIS ROW */}
      <Row gutter={[24, 24]}>
        {/* Top Products Table */}
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
            />
          </Card>
        </Col>

        {/* Top Categories Bar Chart */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <span className="font-bold text-lg text-gray-800">
                Top Danh mục được chú ý
              </span>
            }
            bordered={false}
            className="shadow-sm rounded-2xl border border-gray-100 h-full"
          >
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={topCategories}
                  margin={{ right: 20 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={100}
                    interval={0}
                    tick={{ fontSize: 13, fontWeight: 500, fill: "#4b5563" }}
                  />
                  <Tooltip
                    cursor={{ fill: "#f3f4f6", radius: 4 }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar
                    dataKey="sales"
                    fill="#8884d8"
                    barSize={24}
                    radius={[0, 6, 6, 0]}
                  >
                    {topCategories.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index % 2 === 0 ? "#6366f1" : "#a5b4fc"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}