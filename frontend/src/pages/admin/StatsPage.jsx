import React, { useState, useEffect, useCallback } from "react";
import { 
  Card, Select, Typography, Row, Col, Statistic, Spin, Button, Table, Tag, Empty 
} from "antd";
import { 
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, BarChart, LabelList
} from "recharts";
import { 
  DownloadOutlined, ThunderboltOutlined, ClockCircleOutlined, AlertOutlined 
} from "@ant-design/icons";
import Cookies from "js-cookie";

const { Title, Text } = Typography;
const { Option } = Select;

const API_BASE_URL = "http://localhost:8080/api/admin/dashboard";

export default function StatsPage() {
  const [loading, setLoading] = useState(false);
  
  // Data States
  const [chartData, setChartData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [summary, setSummary] = useState({ totalRev: 0, totalOrders: 0, aov: 0 });

  // Filter State
  const [timeRange, setTimeRange] = useState("7_DAYS");

  // Helper: Get Fetch Options
  const getFetchOptions = (method = 'GET') => {
    const token = Cookies.get("jwt");
    return {
      method: method,
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  };

  // Helper: Fetch Wrapper
  const fetchData = async (url) => {
    const response = await fetch(url, getFetchOptions());
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  };

  // 1. Load Chart Data (Revenue + Orders)
  const fetchChartData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchData(`${API_BASE_URL}/chart/revenue?range=${timeRange}`);
      
      // Tính toán tổng hợp ngay tại client
      let totalRev = 0;
      let totalOrders = 0;
      data.forEach(item => {
        totalRev += item.revenue;
        totalOrders += item.orderCount;
      });

      setSummary({
        totalRev,
        totalOrders,
        aov: totalOrders > 0 ? totalRev / totalOrders : 0
      });
      setChartData(data);
    } catch (error) {
      console.error("Lỗi chart:", error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  // 2. Load Radar Data (Categories)
  const fetchCategoryData = async () => {
    try {
      const data = await fetchData(`${API_BASE_URL}/categories/top`);
      // Transform data cho Radar Chart
      const maxVal = Math.max(...data.map(d => d.value)) || 100;
      const formatted = data.map(d => ({
        subject: d.name,
        A: d.value,
        fullMark: maxVal + (maxVal * 0.2)
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

  const formatCurrency = (value) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  // Function giả lập xuất Excel
  const handleExport = () => {
    const headers = ["Ngày,Doanh thu,Số đơn hàng\n"];
    const csvContent = chartData.map(e => `${e.label},${e.revenue},${e.orderCount}`).join("\n");
    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `report_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <Title level={4} className="!m-0 flex items-center gap-2">
            <ThunderboltOutlined className="text-yellow-500"/> Phân tích hiệu quả kinh doanh
          </Title>
          <Text type="secondary" className="text-xs">Báo cáo chi tiết & Xuất dữ liệu</Text>
        </div>
        
        <div className="flex gap-3">
          <Select 
            value={timeRange} 
            onChange={setTimeRange} 
            style={{ width: 140 }}
            bordered={false}
            className="bg-gray-50 rounded-md border border-gray-200"
          >
            <Option value="7_DAYS">7 ngày qua</Option>
            <Option value="1_MONTH">30 ngày qua</Option>
            <Option value="3_MONTHS">3 tháng qua</Option>
          </Select>
          
          <Button 
            type="primary" 
            icon={<DownloadOutlined />} 
            onClick={handleExport}
            className="bg-indigo-600 hover:bg-indigo-500"
          >
            Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* SECTION 1: METRICS (AOV) */}
      <Row gutter={16}>
        <Col span={8}>
          <Card bordered={false} className="shadow-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl">
            <Statistic 
              title={<span className="text-blue-100">Tổng doanh thu (Kỳ này)</span>}
              value={summary.totalRev}
              formatter={(val) => <span className="text-white font-bold">{formatCurrency(val)}</span>}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} className="shadow-sm bg-white rounded-xl">
            <Statistic 
              title="Tổng đơn hàng"
              value={summary.totalOrders}
              prefix={<ThunderboltOutlined className="text-yellow-500"/>}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} className="shadow-sm bg-white rounded-xl border-l-4 border-emerald-500">
            <Statistic 
              title="Giá trị trung bình đơn (AOV)"
              value={summary.aov}
              formatter={(val) => formatCurrency(val)}
              suffix={<Text type="secondary" className="text-xs ml-2">(Doanh thu / Đơn)</Text>}
            />
          </Card>
        </Col>
      </Row>

      {/* SECTION 2: CHART ROW 1 (Composed + Radar) */}
      <Row gutter={[16, 16]}>
        {/* Composed Chart */}
        <Col xs={24} lg={16}>
          <Card 
            title="Tương quan Doanh thu & Sản lượng" 
            bordered={false} 
            className="shadow-md rounded-xl"
            extra={<Tag color="processing">Phân tích xu hướng</Tag>}
          >
            <Spin spinning={loading}>
              <div style={{ height: 400, width: '100%' }}>
                <ResponsiveContainer>
                  <ComposedChart data={chartData}>
                    <CartesianGrid stroke="#f5f5f5" vertical={false} />
                    <XAxis dataKey="label" scale="point" padding={{ left: 20, right: 20 }} />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" tickFormatter={(val) => `${val/1000000}M`} />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === "revenue" ? formatCurrency(value) : value, 
                        name === "revenue" ? "Doanh thu" : "Đơn hàng"
                      ]}
                      contentStyle={{ borderRadius: '8px' }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenue" name="Doanh thu" barSize={30} fill="#413ea0" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="orderCount" name="Số đơn hàng" stroke="#ff7300" strokeWidth={3} dot={{r: 4}} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Spin>
          </Card>
        </Col>

        {/* Radar Chart */}
        <Col xs={24} lg={8}>
          <Card 
            title="Sức mạnh danh mục" 
            bordered={false} 
            className="shadow-md rounded-xl h-full"
            bodyStyle={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            <div style={{ width: '100%', height: 350 }}>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={categoryData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
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
                <Empty description="Chưa có dữ liệu danh mục" />
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* SECTION 3: TABLE */}
      <Card title="Dữ liệu chi tiết theo ngày" bordered={false} className="shadow-sm rounded-xl">
        <Table 
          dataSource={chartData} 
          rowKey="label"
          pagination={{ pageSize: 5 }}
          columns={[
            { title: 'Thời gian', dataIndex: 'label', key: 'label', render: (text) => <b>{text}</b> },
            { 
              title: 'Doanh thu', 
              dataIndex: 'revenue', 
              key: 'revenue', 
              render: (val) => <span className="text-indigo-600 font-medium">{formatCurrency(val)}</span>,
              sorter: (a, b) => a.revenue - b.revenue
            },
            { 
              title: 'Tổng đơn hàng', 
              dataIndex: 'orderCount', 
              key: 'orderCount', 
              align: 'center',
              render: (val) => <Tag color={val > 5 ? "green" : "orange"}>{val} đơn</Tag> 
            },
            {
              title: 'Hiệu quả (AOV)',
              key: 'eff',
              render: (_, record) => (
                <span className="text-gray-500 text-xs">
                  {record.orderCount > 0 ? formatCurrency(record.revenue / record.orderCount) : 0} / đơn
                </span>
              )
            }
          ]}
        />
      </Card>
    </div>
  );
}