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
  Descriptions,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  DeleteOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import Cookies from "js-cookie";
import { AuthContext } from "../../context/AuthContext";

const { Title, Text } = Typography;

export default function OrderManager() {
  const [orders, setOrders] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const token = Cookies.get("jwt");
  const { user } = useContext(AuthContext);

  const statusOptions = [
    { value: "pending", label: "Chờ xác nhận", color: "orange" },
    { value: "processing", label: "Vận chuyển", color: "blue" },
    { value: "shipping", label: "Chờ giao hàng", color: "cyan" },
    { value: "delivered", label: "Đã giao", color: "green" },
    { value: "cancelled", label: "Đã hủy", color: "red" },
  ];

  const paymentStatusOptions = [
    { value: "Pending", label: "Chờ thanh toán", color: "gold" },
    { value: "Completed", label: "Đã thanh toán", color: "success" },
    { value: "Failed", label: "Thất bại", color: "error" },
  ];

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
      setOrders(data);
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
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
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
      width: 280,
      render: (_, record) => (
        <div className="flex gap-3 items-center">
          {record.orderDetails?.[0]?.product?.imageUrl ? (
            <img
              src={record.orderDetails[0].product.imageUrl}
              className="w-12 h-12 rounded border object-cover"
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
          </div>
        </div>
      ),
    },
    {
      title: "Tổng tiền",
      dataIndex: "totalAmount",
      width: 150,
      render: (v) => (
        <span className="font-semibold text-indigo-600">
          {v.toLocaleString()} ₫
        </span>
      ),
    },
    {
      title: "Trạng thái đơn",
      dataIndex: "orderStatus",
      render: (s, record) => {
        let statusValue = s;
        try {
          statusValue = JSON.parse(s).status;
        } catch {
          //
        } 
        return (
          <Select
            value={statusValue}
            onChange={(val) => updateStatus(record.orderId, val)}
            style={{ width: 140 }}
            size="small"
            variant="filled"
          >
            {statusOptions.map((opt) => (
              <Select.Option key={opt.value} value={opt.value}>
                <Tag color={opt.color} style={{ margin: 0 }} bordered={false}>
                  {opt.label}
                </Tag>
              </Select.Option>
            ))}
          </Select>
        );
      },
    },
    {
      title: "Thanh toán",
      dataIndex: "payment",
      render: (payment) =>
        payment ? (
          <Select
            value={payment.paymentStatus}
            style={{ width: 140 }}
            size="small"
            onChange={(val) => updatePaymentStatus(payment.paymentId, val)}
          >
            {paymentStatusOptions.map((opt) => (
              <Select.Option key={opt.value} value={opt.value}>
                <Tag color={opt.color} style={{ margin: 0 }} bordered={false}>
                  {opt.label}
                </Tag>
              </Select.Option>
            ))}
          </Select>
        ) : (
          "—"
        ),
    },
    {
      title: "",
      fixed: "right",
      width: 100,
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => {
              setDetailOrder(record);
              setIsDetailOpen(true);
            }}
          />
          <Popconfirm
            title="Xóa đơn này?"
            onConfirm={() => deleteOrder(record.orderId)}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filteredOrders = orders.filter(
    (o) =>
      o.orderId.toLowerCase().includes(searchText) ||
      o.userId.toLowerCase().includes(searchText)
  );

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
      {contextHolder}
      <Card bordered={false} className="shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Quản lý Đơn hàng
            </Title>
            <Text type="secondary">
              {orders.length} đơn hàng trong hệ thống
            </Text>
          </div>
          <div className="flex gap-3">
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
          scroll={{ x: 800 }}
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
                    src={d.product.imageUrl}
                    className="w-16 h-16 object-cover rounded bg-gray-100"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 m-0">
                      {d.product.productName}
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

            <div className="flex justify-end pt-4 border-t">
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
