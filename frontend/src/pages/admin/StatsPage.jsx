import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Select,
  Typography,
  Row,
  Col,
  Statistic,
  Spin,
  Table,
  Tag,
  Empty,
  DatePicker,
  message,
} from "antd";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { ThunderboltOutlined, FilterOutlined } from "@ant-design/icons";
import Cookies from "js-cookie";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const API_BASE_URL = "http://localhost:8080/api/admin/dashboard";

export default function StatsPage() {
  // --- STATE ---
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [summary, setSummary] = useState({
    totalRev: 0,
    totalOrders: 0,
    aov: 0,
  });

  // Filter State
  const [filterType, setFilterType] = useState("7_DAYS"); // 7_DAYS, 1_MONTH, CUSTOM...
  const [customDates, setCustomDates] = useState([
    dayjs().subtract(7, "d"),
    dayjs(),
  ]); // Mặc định 7 ngày nếu chọn custom

  // --- HELPER: FETCH ---
  const getFetchOptions = () => {
    const token = Cookies.get("jwt");
    return {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  };

  const fetchData = async (url) => {
    const response = await fetch(url, getFetchOptions());
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);

  // --- 1. LOAD DATA (Logic quan trọng nhất) ---
  const fetchChartData = useCallback(async () => {
    try {
      setLoading(true);
      let url = "";

      // LOGIC CHỌN API DỰA TRÊN FILTER
      if (filterType === "CUSTOM") {
        if (!customDates || customDates.length < 2) {
          setLoading(false);
          return; // Chưa chọn ngày thì không load
        }
        const from = customDates[0].format("YYYY-MM-DD");
        const to = customDates[1].format("YYYY-MM-DD");
        url = `${API_BASE_URL}/chart/revenue/custom?from=${from}&to=${to}`;
      } else {
        // Các mốc cố định: TODAY, 7_DAYS, 1_MONTH...
        url = `${API_BASE_URL}/chart/revenue?range=${filterType}`;
      }

      const data = await fetchData(url);

      // Tính toán tổng hợp (Summary)
      let totalRev = 0;
      let totalOrders = 0;
      data.forEach((item) => {
        totalRev += item.revenue;
        totalOrders += item.orderCount;
      });

      setSummary({
        totalRev,
        totalOrders,
        aov: totalOrders > 0 ? totalRev / totalOrders : 0,
      });
      setChartData(data);
    } catch (error) {
      console.error("Lỗi chart:", error);
      message.error("Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, [filterType, customDates]); // Chạy lại khi filterType hoặc customDates thay đổi

  const fetchCategoryData = async () => {
    try {
      const data = await fetchData(`${API_BASE_URL}/categories/top`);
      const maxVal = Math.max(...data.map((d) => d.value)) || 100;
      const formatted = data.map((d) => ({
        subject: d.name,
        A: d.value,
        fullMark: maxVal + maxVal * 0.2,
      }));
      setCategoryData(formatted);
    } catch (error) {
      console.error("Lỗi category:", error);
    }
  };

  useEffect(() => {
    fetchChartData();
    fetchCategoryData();
  }, [fetchChartData]);

  return (
    <div className="space-y-6">
      {/* --- HEADER & FILTER --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <Title level={4} className="!m-0 flex items-center gap-2">
            <ThunderboltOutlined className="text-yellow-500" /> Tổng quan kinh
            doanh
          </Title>
          <Text type="secondary" className="text-xs">
            Số liệu cập nhật theo thời gian thực
          </Text>
        </div>

        {/* KHU VỰC BỘ LỌC */}
        <div className="flex flex-wrap gap-3 items-center bg-gray-50 p-2 rounded-lg border border-gray-200">
          <FilterOutlined className="text-gray-400 ml-2" />
          <Text strong className="text-sm mr-2 text-gray-600">
            Thời gian:
          </Text>

          {/* 1. Dropdown chọn loại thời gian */}
          <Select
            value={filterType}
            onChange={setFilterType}
            style={{ width: 160 }}
            bordered={false}
            className="bg-white rounded-md shadow-sm"
          >
            <Option value="TODAY">Hôm nay</Option>
            <Option value="7_DAYS">7 ngày qua</Option>
            <Option value="1_MONTH">30 ngày qua</Option>
            <Option value="3_MONTHS">3 tháng qua</Option>
            <Option value="CUSTOM">📅 Tùy chọn ngày</Option>
          </Select>

          {/* 2. RangePicker (Chỉ hiện khi chọn CUSTOM) */}
          {filterType === "CUSTOM" && (
            <RangePicker
              value={customDates}
              onChange={(dates) => setCustomDates(dates)}
              format="DD/MM/YYYY"
              placeholder={["Từ ngày", "Đến ngày"]}
              allowClear={false}
              className="shadow-sm border-indigo-200"
              style={{ width: 260 }}
              disabledDate={(current) =>
                current && current > dayjs().endOf("day")
              } // Không chọn ngày tương lai
            />
          )}
        </div>
      </div>

      {/* --- METRICS CARDS --- */}
      <Row gutter={16}>
        <Col span={8}>
          <Card
            bordered={false}
            className="shadow-sm bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl"
          >
            <Statistic
              title={<span className="text-indigo-100">Tổng doanh thu</span>}
              value={summary.totalRev}
              formatter={(val) => (
                <span className="text-white font-bold text-2xl">
                  {formatCurrency(val)}
                </span>
              )}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} className="shadow-sm bg-white rounded-xl">
            <Statistic
              title="Tổng đơn hàng"
              value={summary.totalOrders}
              prefix={<ThunderboltOutlined className="text-yellow-500" />}
              valueStyle={{ fontWeight: "bold" }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card
            bordered={false}
            className="shadow-sm bg-white rounded-xl border-l-4 border-emerald-500"
          >
            <Statistic
              title="AOV (Giá trị trung bình/đơn)"
              value={summary.aov}
              formatter={(val) => formatCurrency(val)}
              valueStyle={{ color: "#10b981", fontWeight: "bold" }}
            />
          </Card>
        </Col>
      </Row>

      {/* --- CHARTS SECTION --- */}
      <Row gutter={[16, 16]}>
        {/* Composed Chart */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <span>
                Biểu đồ biến động {filterType === "CUSTOM" ? "(Tùy chỉnh)" : ""}
              </span>
            }
            bordered={false}
            className="shadow-md rounded-xl"
            extra={<Tag color="blue">{chartData.length} mốc thời gian</Tag>}
          >
            <Spin spinning={loading}>
              <div style={{ height: 400, width: "100%" }}>
                {chartData.length > 0 ? (
                  <ResponsiveContainer>
                    <ComposedChart data={chartData}>
                      <CartesianGrid stroke="#f5f5f5" vertical={false} />
                      <XAxis
                        dataKey="label"
                        scale="point"
                        padding={{ left: 20, right: 20 }}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        yAxisId="left"
                        orientation="left"
                        stroke="#8884d8"
                        tickFormatter={(val) =>
                          `${(val / 1000000).toFixed(1)}M`
                        }
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#82ca9d"
                      />
                      <Tooltip
                        formatter={(value, name) => [
                          name === "revenue" ? formatCurrency(value) : value,
                          name === "revenue" ? "Doanh thu" : "Đơn hàng",
                        ]}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="revenue"
                        name="Doanh thu"
                        barSize={30}
                        fill="#4f46e5"
                        radius={[4, 4, 0, 0]}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="orderCount"
                        name="Số đơn hàng"
                        stroke="#f59e0b"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty
                    description="Không có dữ liệu trong khoảng thời gian này"
                    className="mt-20"
                  />
                )}
              </div>
            </Spin>
          </Card>
        </Col>

        {/* Radar Chart */}
        <Col xs={24} lg={8}>
          <Card
            title="Tỷ trọng danh mục"
            bordered={false}
            className="shadow-md rounded-xl h-full"
            bodyStyle={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div style={{ width: "100%", height: 350 }}>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius="80%"
                    data={categoryData}
                  >
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, "auto"]} />
                    <Radar
                      name="Số lượng bán"
                      dataKey="A"
                      stroke="#8884d8"
                      strokeWidth={2}
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="Chưa có dữ liệu" />
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* --- TABLE DETAIL --- */}
      <Card
        title="Chi tiết dữ liệu"
        bordered={false}
        className="shadow-sm rounded-xl"
      >
        <Table
          dataSource={chartData}
          rowKey="label"
          pagination={{ pageSize: 5 }}
          size="middle"
          columns={[
            {
              title: "Thời gian",
              dataIndex: "label",
              key: "label",
              render: (text) => <b>{text}</b>,
            },
            {
              title: "Doanh thu",
              dataIndex: "revenue",
              key: "revenue",
              render: (val) => (
                <span className="text-indigo-600 font-medium">
                  {formatCurrency(val)}
                </span>
              ),
              sorter: (a, b) => a.revenue - b.revenue,
            },
            {
              title: "Đơn hàng",
              dataIndex: "orderCount",
              key: "orderCount",
              align: "center",
              render: (val) => (
                <Tag color={val > 0 ? "blue" : "default"}>{val}</Tag>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
