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
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import Cookies from "js-cookie";
import { AuthContext } from "../../context/AuthContext";

export default function OrderManager() {
  const [orders, setOrders] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const token = Cookies.get("jwt");
  const { user } = useContext(AuthContext);

  const statusOptions = [
    { value: "pending", label: "Chờ xác nhận" },
    { value: "processing", label: "Vận chuyển" },
    { value: "shipping", label: "Chờ giao hàng" },
    { value: "delivered", label: "Đã giao" },
    { value: "cancelled", label: "Đã hủy" },
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
      console.log(data);
      setOrders(data);
    } catch {
      message.error("Không thể tải danh sách đơn hàng");
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

      message.success("Cập nhật trạng thái thành công!");
    } catch {
      message.error("Không thể cập nhật trạng thái");
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (orderId) => {
    try {
      const res = await fetch(`http://localhost:8080/api/orders/${orderId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error();
      message.success("Xóa đơn hàng thành công");
      fetchOrders();
    } catch {
      message.error("Không thể xóa đơn hàng");
    }
  };

  const columns = [
    {
      title: "Mã đơn hàng",
      dataIndex: "orderId",
    },
    {
      title: "Hình ảnh",
      dataIndex: "orderDetails",
      render: (details) =>
        details && details.length > 0 ? (
          <img
            src={details[0].product.imageUrl}
            alt="product"
            style={{
              width: 60,
              height: 60,
              objectFit: "cover",
              borderRadius: 6,
              border: "1px solid #ddd",
            }}
          />
        ) : (
          "—"
        ),
    },
    {
      title: "Sản phẩm",
      dataIndex: "orderDetails",
      render: (details) =>
        details && details.length > 0
          ? details.map((d) => d.product.productName).join(", ")
          : "—",
    },
    {
      title: "Số lượng",
      dataIndex: "orderDetails",
      render: (details) =>
        details && details.length > 0
          ? details.reduce((total, item) => total + item.quantity, 0)
          : 0,
    },
    {
      title: "Tổng tiền",
      dataIndex: "totalAmount",
      render: (v) => v.toLocaleString() + " ₫",
    },
    {
      title: "Trạng thái",
      dataIndex: "orderStatus",
      render: (s, record) => {
        let statusValue;
        try {
          const parsed = JSON.parse(s);
          statusValue = parsed.status;
        } catch {
          statusValue = s;
        }

        return (
          <Select
            value={statusValue}
            onChange={(val) => updateStatus(record.orderId, val)}
            style={{ width: 150 }}
            options={statusOptions}
          />
        );
      },
    },
    {
      title: "Ngày tạo đơn",
      dataIndex: "orderDate",
      render: (v) => new Date(v).toLocaleString(),
    },
    {
      title: "Thao tác",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => {
              setDetailOrder(record);
              setIsDetailOpen(true);
            }}
          >
            Xem
          </Button>

          <Popconfirm
            title="Bạn có chắc chắn muốn xóa đơn hàng này?"
            onConfirm={() => deleteOrder(record.orderId)}
          >
            <Button danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
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
    <div className="p-4 bg-gray-50 w-full h-full">
      <h2 className="text-2xl font-semibold mb-6">Quản lý Đơn hàng</h2>

      <Space className="mb-4" wrap>
        <Input
          placeholder="Tìm theo mã đơn hoặc userId"
          prefix={<SearchOutlined />}
          className="w-64"
          onChange={(e) => setSearchText(e.target.value.toLowerCase())}
        />

        <Button icon={<ReloadOutlined />} onClick={fetchOrders}>
          Làm mới
        </Button>
      </Space>

      <Table
        rowKey="orderId"
        dataSource={filteredOrders}
        columns={columns}
        loading={loading}
        pagination={{ pageSize: 10 }}
        className="bg-white shadow rounded-lg"
      />

      <Modal
        title="Chi tiết đơn hàng"
        open={isDetailOpen}
        onCancel={() => setIsDetailOpen(false)}
        footer={null}
        width={700}
      >
        {detailOrder && (
          <div>
            <p>
              <b>Mã chi tiết đơn hàng:</b>{" "}
              {detailOrder.orderDetails?.map((d) => d.orderDetailId).join(", ")}
            </p>
            <p>
              <b>Địa chỉ nhận hàng:</b> {detailOrder.shippingAddress}
            </p>
            <p>
              <b>Phương thức thanh toán:</b>{" "}
              {detailOrder.paymentMethodId === "PM001"
                ? "Thanh toán khi nhận hàng (COD)"
                : detailOrder.paymentMethodId === "PM002"
                ? "VNPay"
                : "Không xác định"}
            </p>

            <h3 className="mt-4 mb-2 font-semibold">Cập nhật trạng thái</h3>
            <Select
              value={detailOrder.orderStatus}
              style={{ width: 200 }}
              options={statusOptions}
              onChange={(val) =>
                setDetailOrder({ ...detailOrder, orderStatus: val })
              }
            />
            <Button
              type="primary"
              className="ml-3"
              onClick={() =>
                updateStatus(detailOrder.orderId, detailOrder.orderStatus)
              }
            >
              Lưu
            </Button>

            <h3 className="mt-4 mb-2 font-semibold">Sản phẩm</h3>
            {detailOrder.orderDetails?.map((d) => (
              <div key={d.orderDetailId} className="flex gap-3 py-2 border-b">
                <img
                  src={d.product.imageUrl}
                  className="w-16 h-16 object-cover rounded"
                />
                <div>
                  <p className="font-medium">{d.product.productName}</p>
                  <p>Số lượng: {d.quantity}</p>
                  <p>Giá: {d.originalUnitPrice.toLocaleString()} ₫</p>
                </div>
              </div>
            ))}

            <p className="mt-4 text-right text-lg">
              <b>Tổng:</b>{" "}
              <span className="text-red-600">
                {detailOrder.totalAmount.toLocaleString()} ₫
              </span>
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
