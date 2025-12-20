import { useEffect, useState, useContext } from "react";
import {
  Table,
  Input,
  Button,
  Space,
  Modal,
  message,
  Popconfirm,
  Select,
  Card,
  Typography,
  Tag,
  Divider,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  DeleteOutlined,
  ShoppingCartOutlined,
  CreditCardOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  CarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UndoOutlined,
  DollarCircleOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import Cookies from "js-cookie";
import { AuthContext } from "../../context/AuthContext";

const { Title, Text } = Typography;

export default function OrderManager() {
  const [orders, setOrders] = useState([]);
  const [searchText, setSearchText] = useState("");

  // [UPDATED] Thêm state cho bộ lọc phương thức thanh toán
  const [statusFilter, setStatusFilter] = useState(null);
  const [paymentFilter, setPaymentFilter] = useState(null);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState(null); // Mới

  const [loading, setLoading] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const token = Cookies.get("jwt");
  const { user } = useContext(AuthContext);

  const statusOptions = [
    { value: "Pending", label: "Chờ xác nhận", color: "orange" },
    { value: "Processing", label: "Đang xử lý", color: "blue" },
    { value: "Shipping", label: "Đang giao", color: "cyan" },
    { value: "Delivered", label: "Đã giao", color: "green" },
    { value: "Cancelled", label: "Đã hủy", color: "red" },
  ];

  const paymentStatusOptions = [
    { value: "Pending", label: "Chờ thanh toán", color: "gold" },
    { value: "Completed", label: "Đã thanh toán", color: "success" },
    { value: "Failed", label: "Thất bại", color: "error" },
    { value: "Refund_Pending", label: "Yêu cầu hoàn tiền", color: "purple" },
    { value: "Refunded", label: "Đã hoàn tiền", color: "magenta" },
  ];

  // [NEW] Danh sách phương thức thanh toán để lọc
  const paymentMethodOptions = [
    { value: "PM001", label: "COD" },
    { value: "PM002", label: "VNPay" },
  ];

  // Config hiển thị
  const getOrderStatusConfig = (status) => {
    switch ((status || "").toLowerCase()) {
      case "pending":
        return {
          color: "gold",
          icon: <ClockCircleOutlined />,
          bg: "#fff7e6",
          text: "#d46b08",
          label: "Chờ xác nhận",
        };
      case "processing":
        return {
          color: "blue",
          icon: <SyncOutlined spin />,
          bg: "#e6f7ff",
          text: "#096dd9",
          label: "Đang xử lý",
        };
      case "shipping":
        return {
          color: "cyan",
          icon: <CarOutlined />,
          bg: "#e6fffb",
          text: "#08979c",
          label: "Đang giao",
        };
      case "delivered":
        return {
          color: "green",
          icon: <CheckCircleOutlined />,
          bg: "#f6ffed",
          text: "#389e0d",
          label: "Đã giao",
        };
      case "cancelled":
        return {
          color: "red",
          icon: <CloseCircleOutlined />,
          bg: "#fff1f0",
          text: "#cf1322",
          label: "Đã hủy",
        };
      default:
        return {
          color: "default",
          icon: null,
          bg: "#f5f5f5",
          text: "#595959",
          label: status,
        };
    }
  };

  const getPaymentStatusConfig = (status) => {
    switch (status) {
      case "Pending":
        return {
          color: "default",
          icon: <ClockCircleOutlined />,
          bg: "#fafafa",
          text: "#595959",
          label: "Chờ thanh toán",
          border: "#d9d9d9",
        };
      case "Completed":
        return {
          color: "success",
          icon: <CheckCircleOutlined />,
          bg: "#f6ffed",
          text: "#389e0d",
          label: "Đã thanh toán",
          border: "#b7eb8f",
        };
      case "Refund_Pending":
        return {
          color: "processing",
          icon: <UndoOutlined spin />,
          bg: "#f9f0ff",
          text: "#722ed1",
          label: "Yêu cầu hoàn tiền",
          border: "#d3adf7",
        };
      case "Refunded":
        return {
          color: "magenta",
          icon: <DollarCircleOutlined />,
          bg: "#fff0f6",
          text: "#c41d7f",
          label: "Đã hoàn tiền",
          border: "#ffadd2",
        };
      case "Failed":
        return {
          color: "error",
          icon: <CloseCircleOutlined />,
          bg: "#fff2f0",
          text: "#ff4d4f",
          label: "Thất bại",
          border: "#ffccc7",
        };
      default:
        return {
          color: "default",
          icon: null,
          bg: "#f5f5f5",
          text: "#000",
          label: "COD / Chưa TT",
          border: "transparent",
        };
    }
  };

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();      
      setOrders(data.sort((a, b) => b.orderId.localeCompare(a.orderId)));
    } catch {
      messageApi.error("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      setLoading(true);
      const res = await fetch(
        `http://localhost:8080/api/orders/${orderId}/status`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: newStatus,
        }
      );
      if (!res.ok) throw new Error();
      setOrders((prev) =>
        prev.map((o) =>
          o.orderId === orderId ? { ...o, orderStatus: newStatus } : o
        )
      );
      messageApi.success("Cập nhật trạng thái thành công!");
    } catch {
      messageApi.error("Không thể cập nhật trạng thái");
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (paymentId, newStatus) => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/payments/${paymentId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ paymentStatus: newStatus }),
        }
      );
      if (!res.ok) throw new Error();
      messageApi.success("Cập nhật thanh toán thành công!");
      setOrders((prev) =>
        prev.map((order) =>
          order.payment?.paymentId === paymentId
            ? {
                ...order,
                payment: { ...order.payment, paymentStatus: newStatus },
              }
            : order
        )
      );
    } catch {
      messageApi.error("Không thể cập nhật thanh toán!");
    }
  };

  const deleteOrder = async (orderId) => {
    try {
      const res = await fetch(`http://localhost:8080/api/orders/${orderId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      messageApi.success("Xóa đơn hàng thành công");
      fetchOrders();
    } catch {
      messageApi.error("Không thể xóa đơn hàng");
    }
  };

  const columns = [
    {
      title: "Đơn hàng",
      width: 250,
      render: (_, record) => (
        <div className="flex gap-3 items-center">
          {record.orderDetails?.[0]?.product?.imageUrl ? (
            <img
              src={record.orderDetails[0].product.imageUrl}
              className="w-12 h-12 rounded border object-cover"
              alt="product"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center border">
              <ShoppingCartOutlined />
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-mono text-xs text-gray-500">
              {record.orderId}
            </span>
            <span className="font-medium text-gray-800">
              {new Date(record.orderDate).toLocaleDateString("vi-VN")}
            </span>
            <span className="text-[10px] text-gray-400">{record.userId}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Phương thức",
      // Sửa từ "paymentMethodId" thành ["payment", "paymentMethodId"]
      dataIndex: ["payment", "paymentMethodId"],
      width: 130,
      align: "center",
      render: (val) => {
        // Bây giờ val sẽ nhận được giá trị như "PM001" hoặc "PM002"
        const method = val ? val.toUpperCase() : "UNKNOWN";
        let color = "default";
        let icon = null;
        let label = method;

        if (method === "PM001" || method === "COD") {
          color = "cyan";
          label = "COD";
        } else if (method.includes("PM002") || method.includes("VNPAY")) {
          color = "blue";
          icon = <CreditCardOutlined />;
          label = "VNPay";
        }

        return (
          <Tag color={color} icon={icon} className="mr-0 font-medium">
            {label}
          </Tag>
        );
      },
    },
    {
      title: "Tổng tiền",
      dataIndex: "totalAmount",
      width: 140,
      render: (v) => (
        <span className="font-semibold text-indigo-600">
          {v.toLocaleString()} ₫
        </span>
      ),
    },
    {
      title: "Trạng thái đơn",
      dataIndex: "orderStatus",
      width: 170,
      render: (s, record) => {
        const currentVal =
          statusOptions.find(
            (opt) => opt.value.toLowerCase() === (s || "").toLowerCase()
          )?.value || s;
        const config = getOrderStatusConfig(currentVal);
        return (
          <div className="relative group">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all cursor-pointer hover:brightness-95"
              style={{
                backgroundColor: config.bg,
                color: config.text,
                borderColor: config.bg,
              }}
            >
              {config.icon}
              <span className="font-semibold text-xs whitespace-nowrap">
                {config.label}
              </span>
              <span className="ml-auto opacity-50 text-[10px]">▼</span>
            </div>
            <Select
              value={currentVal}
              onChange={(val) => updateStatus(record.orderId, val)}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              popupMatchSelectWidth={180}
            >
              {statusOptions.map((opt) => {
                const c = getOrderStatusConfig(opt.value);
                return (
                  <Select.Option key={opt.value} value={opt.value}>
                    <Tag bordered={false} color={c.color}>
                      {opt.label}
                    </Tag>
                  </Select.Option>
                );
              })}
            </Select>
          </div>
        );
      },
    },
    {
      title: "TT Thanh toán",
      dataIndex: "payment",
      width: 190,
      render: (payment) => {
        if (!payment) return <Tag>Chưa thanh toán</Tag>;
        const config = getPaymentStatusConfig(payment.paymentStatus);
        return (
          <div className="relative group w-full">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all cursor-pointer"
              style={{
                backgroundColor: config.bg,
                color: config.text,
                borderColor: config.border,
                boxShadow:
                  payment.paymentStatus === "REFUND_PENDING"
                    ? "0 0 0 2px rgba(114, 46, 209, 0.1)"
                    : "none",
              }}
            >
              {config.icon}
              <span className="font-medium text-xs whitespace-nowrap overflow-hidden text-ellipsis">
                {config.label}
              </span>
              <span className="ml-auto opacity-50 text-[10px]">▼</span>
            </div>
            <Select
              value={payment.paymentStatus}
              onChange={(val) => updatePaymentStatus(payment.paymentId, val)}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              popupMatchSelectWidth={220}
            >
              {paymentStatusOptions.map((opt) => {
                const c = getPaymentStatusConfig(opt.value);
                return (
                  <Select.Option key={opt.value} value={opt.value}>
                    <div className="flex items-center gap-2">
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: c.text,
                        }}
                      ></div>
                      <span>{opt.label}</span>
                    </div>
                  </Select.Option>
                );
              })}
            </Select>
          </div>
        );
      },
    },
    {
      title: "",
      fixed: "right",
      width: 100,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => {
              setDetailOrder(record);
              setIsDetailOpen(true);
            }}
          />
          <Popconfirm
            title="Xóa đơn này?"
            onConfirm={() => deleteOrder(record.orderId)}
          >
            <Button type="text" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // [UPDATED] Logic Lọc dữ liệu: Search + Status Filter + Payment Filter + Method Filter
  const filteredOrders = orders.filter((o) => {
    // 1. Lọc theo từ khóa
    const matchSearch =
      o.orderId.toLowerCase().includes(searchText) ||
      o.userId.toLowerCase().includes(searchText);

    // 2. Lọc theo Trạng thái đơn
    const matchStatus = statusFilter
      ? (o.orderStatus || "").toLowerCase() === statusFilter.toLowerCase()
      : true;

    // 3. Lọc theo Trạng thái thanh toán
    const currentPaymentStatus = o.payment?.paymentStatus || "pending";
    const matchPayment = paymentFilter
      ? currentPaymentStatus.toLowerCase() === paymentFilter.toLowerCase()
      : true;

    // 4. [NEW] Lọc theo Phương thức thanh toán
    const matchMethod = paymentMethodFilter
      ? (o.payment.paymentMethodId || "")
          .toLowerCase()
          .includes(paymentMethodFilter.toLowerCase())
      : true;

    return matchSearch && matchStatus && matchPayment && matchMethod;
  });

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
      {contextHolder}
      <Card bordered={false} className="shadow-sm">
        {/* Header Control */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Quản lý Đơn hàng
            </Title>
            <Text type="secondary">
              {filteredOrders.length} đơn hàng phù hợp
            </Text>
          </div>

          <div className="flex flex-wrap gap-3 w-full xl:w-auto">
            {/* Bộ lọc Trạng thái đơn */}
            <Select
              placeholder="Trạng thái đơn"
              style={{ width: 150 }}
              allowClear
              onChange={(val) => setStatusFilter(val)}
              suffixIcon={<FilterOutlined />}
            >
              {statusOptions.map((opt) => (
                <Select.Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Select.Option>
              ))}
            </Select>

            {/* Bộ lọc Trạng thái thanh toán */}
            <Select
              placeholder="TT Thanh toán"
              style={{ width: 150 }}
              allowClear
              onChange={(val) => setPaymentFilter(val)}
              suffixIcon={<FilterOutlined />}
            >
              {paymentStatusOptions.map((opt) => (
                <Select.Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Select.Option>
              ))}
            </Select>

            {/* [NEW] Bộ lọc Phương thức thanh toán */}
            <Select
              placeholder="Loại TT"
              style={{ width: 150 }}
              allowClear
              onChange={(val) => setPaymentMethodFilter(val)}
              suffixIcon={<FilterOutlined />}
            >
              {paymentMethodOptions.map((opt) => (
                <Select.Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Select.Option>
              ))}
            </Select>

            <Input
              placeholder="Tìm mã đơn, User ID..."
              prefix={<SearchOutlined />}
              onChange={(e) => setSearchText(e.target.value.toLowerCase())}
              className="w-full sm:w-64"
            />
            <Button icon={<ReloadOutlined />} onClick={fetchOrders} />
          </div>
        </div>

        <Table
          rowKey="orderId"
          dataSource={filteredOrders}
          columns={columns}
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Modal Chi tiết */}
      <Modal
        title={<span className="text-lg font-semibold">Chi tiết đơn hàng</span>}
        open={isDetailOpen}
        onCancel={() => setIsDetailOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailOpen(false)}>
            Đóng
          </Button>,
        ]}
        width={700}
        centered
      >
        {detailOrder && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <Text type="secondary" className="block text-xs uppercase">
                  Mã đơn hàng
                </Text>
                <Text strong copyable>
                  {detailOrder.orderId}
                </Text>
              </div>
              <div>
                <Text type="secondary" className="block text-xs uppercase">
                  Ngày đặt
                </Text>
                <Text>{new Date(detailOrder.orderDate).toLocaleString()}</Text>
              </div>
              <div className="col-span-2">
                <Text type="secondary" className="block text-xs uppercase">
                  Địa chỉ giao hàng
                </Text>
                <Text>{detailOrder.shippingAddress}</Text>
              </div>
              {detailOrder.customerNote && (
                <div className="col-span-2">
                  <Text type="secondary" className="block text-xs uppercase">
                    Ghi chú / Lý do hủy
                  </Text>
                  <Text className="text-red-500">
                    {detailOrder.customerNote}
                  </Text>
                </div>
              )}
            </div>

            <Divider orientation="left" style={{ margin: "12px 0" }}>
              Sản phẩm
            </Divider>

            <div className="max-h-60 overflow-y-auto pr-2 space-y-3">
              {detailOrder.orderDetails?.map((d) => (
                <div
                  key={d.orderDetailId}
                  className="flex gap-4 items-center bg-white border p-2 rounded hover:shadow-sm transition"
                >
                  <img
                    src={d.product?.imageUrl}
                    alt="product"
                    className="w-16 h-16 object-cover rounded bg-gray-100"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 m-0">
                      {d.product?.productName || "Sản phẩm đã xóa"}
                    </p>
                    <p className="text-gray-500 text-sm m-0">
                      Số lượng: x{d.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-indigo-600 m-0">
                      {d.originalUnitPrice.toLocaleString()} ₫
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <div>
                <Text type="secondary" className="mr-2 block mb-1">
                  Thông tin thanh toán:
                </Text>
                <div className="flex flex-col gap-2">
                  <Space>
                    <Tag>
                      {detailOrder.paymentMethodId === "PM001"
                        ? "COD"
                        : detailOrder.paymentMethodId}
                    </Tag>
                    <Tag
                      color={
                        detailOrder.payment?.paymentStatus === "COMPLETED"
                          ? "green"
                          : detailOrder.payment?.paymentStatus ===
                            "REFUND_PENDING"
                          ? "purple"
                          : "default"
                      }
                    >
                      {detailOrder.payment?.paymentStatus || "COD"}
                    </Tag>
                  </Space>

                  {detailOrder.payment?.transactionId && (
                    <div className="flex items-center gap-2 mt-1">
                      <Text type="secondary" className="text-xs">
                        Mã GD:
                      </Text>
                      <Text code copyable className="text-xs m-0">
                        {detailOrder.payment.transactionId}
                      </Text>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <Text type="secondary">Tổng thanh toán</Text>
                <div className="text-2xl font-bold text-red-600">
                  {detailOrder.totalAmount.toLocaleString()} ₫
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
