import { useState, useEffect, useContext } from "react";
import {
  Table,
  Input,
  Button,
  Space,
  Modal,
  Form,
  message,
  Popconfirm,
  DatePicker,
  InputNumber,
  Select,
  Switch,
  Row,
  Col,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { AuthContext } from "../../context/AuthContext";
import Cookies from "js-cookie";
import dayjs from "dayjs";

export default function CouponManager() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const token = Cookies.get("jwt");
  const { user, logout } = useContext(AuthContext);

  useEffect(() => {
    if (!user || !token) return;
    if (user.role !== "ADMIN") {
      messageApi.error("Bạn không có quyền truy cập trang này!");
      return;
    }
    fetchCoupons();
  }, [user, token]);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8080/api/coupons", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401 || response.status === 403) {
        messageApi.error("Phiên đăng nhập đã hết hạn!");
        logout();
        return;
      }

      if (!response.ok) throw new Error("Fetch failed");
      const data = await response.json();
      setCoupons(data);
    } catch {
      messageApi.error("Không thể tải danh sách voucher");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCoupon(null);
    form.resetFields();
    form.setFieldsValue({ discountType: "percent", isActive: true });
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingCoupon(record);
    form.setFieldsValue({
      ...record,
      startDate: dayjs(record.startDate),
      endDate: dayjs(record.endDate),
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      const payload = {
        ...values,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate.toISOString(),
      };

      const url = editingCoupon
        ? `http://localhost:8080/api/coupons/${editingCoupon.couponId}`
        : "http://localhost:8080/api/coupons";

      const method = editingCoupon ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Save failed");

      messageApi.success(
        editingCoupon ? "Cập nhật thành công" : "Thêm thành công"
      );
      setIsModalOpen(false);
      fetchCoupons();
    } catch {
      messageApi.error("Lưu thất bại, vui lòng kiểm tra dữ liệu");
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:8080/api/coupons/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      messageApi.success("Xóa thành công");
      fetchCoupons();
    } catch {
      messageApi.error("Không thể xóa voucher");
    }
  };

  const openDeleteModal = () => {
    if (!selectedRowKeys.length) {
      messageApi.warning("Vui lòng chọn ít nhất một voucher để xóa!");
      return;
    }
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      for (const id of selectedRowKeys) {
        await fetch(`http://localhost:8080/api/coupons/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      messageApi.success("Đã xóa các voucher được chọn");
      setSelectedRowKeys([]);
      setIsDeleteModalOpen(false);
      fetchCoupons();
    } catch {
      messageApi.error("Không thể xóa các voucher được chọn");
    }
  };

  const handleSearch = (value) => setSearchText(value.toLowerCase());
  const filteredCoupons = coupons.filter((c) =>
    c.code?.toLowerCase().includes(searchText)
  );

  const toggleStatus = async (id, currentStatus) => {
    try {
      await fetch(`http://localhost:8080/api/coupons/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: !currentStatus }),
      });
      message.success("Cập nhật trạng thái thành công");
      fetchCoupons();
    } catch (error) {
      message.error("Cập nhật trạng thái thất bại");
      console.error(error);
    }
  };

  const rowSelection = { selectedRowKeys, onChange: setSelectedRowKeys };

  const columns = [
    { title: "ID", dataIndex: "couponId", key: "couponId" },
    { title: "Mã", dataIndex: "code", key: "code" },
    { title: "Mô tả", dataIndex: "description", key: "description" },
    { title: "Loại", dataIndex: "discountType", key: "discountType" },
    { title: "Giá trị", dataIndex: "discountValue", key: "discountValue" },
    {
      title: "Đơn tối thiểu",
      dataIndex: "minOrderAmount",
      key: "minOrderAmount",
    },
    { title: "Giảm tối đa", dataIndex: "maxDiscount", key: "maxDiscount" },
    { title: "Ngày bắt đầu", dataIndex: "startDate" },
    { title: "Ngày kết thúc", dataIndex: "endDate" },
    { title: "Giới hạn", dataIndex: "usageLimit", key: "usageLimit" },
    { title: "Đã dùng", dataIndex: "usedCount", key: "usedCount" },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      render: (_, record) => (
        <Button
          type={record.isActive ? "primary" : "default"}
          onClick={() => toggleStatus(record.couponId, record.isActive)}
        >
          {record.isActive ? "Hoạt động" : "Ngừng"}
        </Button>
      ),
    },
    { title: "Ngày tạo", dataIndex: "createdAt", key: "createdAt" },
    {
      title: "Thao tác",
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa voucher này?"
            onConfirm={() => handleDelete(record.couponId)}
          >
            <Button danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4 bg-gray-50 w-full h-full box-border">
      {contextHolder}
      <h2 className="text-2xl font-semibold mb-6">Quản lý Voucher / Coupon</h2>

      <Space className="mb-4 flex-wrap" wrap>
        <Input
          placeholder="Tìm kiếm theo mã"
          prefix={<SearchOutlined />}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-64"
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Thêm voucher
        </Button>
        <Button
          danger
          disabled={!selectedRowKeys.length}
          onClick={openDeleteModal}
        >
          Xóa nhiều
        </Button>
        <Button onClick={fetchCoupons}>Làm mới</Button>
      </Space>

      <Table
        rowSelection={rowSelection}
        dataSource={filteredCoupons}
        columns={columns}
        rowKey="couponId"
        loading={loading}
        pagination={{ pageSize: 8 }}
        scroll={{ x: "max-content" }}
        className="bg-white shadow rounded-lg"
      />

      {/* Modal Thêm/Sửa Voucher */}
      <Modal
        title={editingCoupon ? "Chỉnh sửa voucher" : "Thêm voucher mới"}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        width={900}
      >
        <Form form={form} layout="vertical">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="code"
                label="Mã voucher"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item name="description" label="Mô tả">
                <Input />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="discountType"
                label="Loại giảm"
                rules={[{ required: true }]}
              >
                <Select>
                  <Select.Option value="percent">Phần trăm</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="discountValue"
                label="Giá trị giảm"
                rules={[{ required: true }]}
              >
                <InputNumber className="w-full" min={0} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item name="minOrderAmount" label="Đơn tối thiểu">
                <InputNumber className="w-full" min={0} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item name="maxDiscount" label="Giảm tối đa">
                <InputNumber className="w-full" min={0} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="startDate"
                label="Ngày bắt đầu"
                rules={[{ required: true }]}
              >
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="endDate"
                label="Ngày kết thúc"
                rules={[{ required: true }]}
              >
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item name="usageLimit" label="Số lượt dùng tối đa">
                <InputNumber className="w-full" min={0} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item name="usedCount" label="Đã dùng">
                <InputNumber className="w-full" disabled />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="isActive"
                label="Trạng thái"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title={`Xác nhận xóa ${selectedRowKeys.length} voucher`}
        open={isDeleteModalOpen}
        onOk={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        okText="Xóa"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        <p>Hành động này không thể hoàn tác. Bạn chắc chắn chứ?</p>
      </Modal>
    </div>
  );
}
