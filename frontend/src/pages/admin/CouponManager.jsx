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
  Card,
  Typography,
  Tag,
  Tooltip,
  Badge
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  PlusOutlined,
  ReloadOutlined,
  PercentageOutlined,
  DollarOutlined
} from "@ant-design/icons";
import { AuthContext } from "../../context/AuthContext";
import Cookies from "js-cookie";
import dayjs from "dayjs";

const { Title, Text } = Typography;

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
    form.setFieldsValue({ 
        discountType: "percent", 
        isActive: true,
        startDate: dayjs(),
        endDate: dayjs().add(7, 'day')
    });
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
    if (!selectedRowKeys.length) return;
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
    } catch {
      message.error("Cập nhật trạng thái thất bại");
    }
  };

  const handleSearch = (e) => setSearchText(e.target.value.toLowerCase());
  
  const filteredCoupons = coupons.filter((c) =>
    c.code?.toLowerCase().includes(searchText)
  );

  const rowSelection = { selectedRowKeys, onChange: setSelectedRowKeys };

  const columns = [
    { 
        title: "Mã Code", 
        dataIndex: "code", 
        fixed: 'left',
        width: 150,
        render: (text) => <Tag color="geekblue" className="font-mono text-base px-2 py-1 uppercase">{text}</Tag>
    },
    { 
        title: "Loại giảm giá", 
        dataIndex: "discountType", 
        width: 140,
        render: (type) => (
            type === 'percent' 
            ? <Tag color="purple" icon={<PercentageOutlined />}>Phần trăm</Tag> 
            : <Tag color="green" icon={<DollarOutlined />}>Tiền mặt</Tag>
        )
    },
    { 
        title: "Giá trị", 
        dataIndex: "discountValue", 
        width: 120,
        render: (val, record) => (
            <span className="font-bold text-red-600">
                {val.toLocaleString()} {record.discountType === 'percent' ? '%' : 'đ'}
            </span>
        )
    },
    {
      title: "Đơn tối thiểu",
      dataIndex: "minOrderAmount",
      width: 150,
      responsive: ['md'],
      render: (val) => val ? `${val.toLocaleString()} đ` : '0 đ'
    },
    { 
        title: "Thời gian áp dụng", 
        width: 220,
        responsive: ['lg'],
        render: (_, record) => (
            <div className="flex flex-col text-xs text-gray-500">
                <span>Bắt đầu: {dayjs(record.startDate).format("DD/MM/YYYY")}</span>
                <span>Kết thúc: {dayjs(record.endDate).format("DD/MM/YYYY")}</span>
            </div>
        )
    },
    { 
        title: "Sử dụng", 
        width: 120,
        render: (_, record) => (
            <div className="flex items-center gap-1">
                <span className={record.usedCount >= record.usageLimit ? "text-red-500 font-bold" : ""}>
                    {record.usedCount}
                </span>
                <span className="text-gray-400">/</span>
                <span>{record.usageLimit}</span>
            </div>
        )
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      width: 100,
      render: (isActive, record) => (
        <Switch 
            checked={isActive} 
            onChange={() => toggleStatus(record.couponId, isActive)} 
            size="small"
        />
      ),
    },
    {
      title: "",
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Space>
          <Tooltip title="Chỉnh sửa">
            <Button type="text" icon={<EditOutlined className="text-blue-600"/>} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Popconfirm
            title="Xóa voucher này?"
            onConfirm={() => handleDelete(record.couponId)}
            okText="Xóa" cancelText="Hủy" okButtonProps={{danger: true}}
          >
            <Tooltip title="Xóa">
                <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
      {contextHolder}
      
      <Card bordered={false} className="shadow-sm">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
                <Title level={4} style={{ margin: 0 }}>Quản lý Voucher</Title>
                <Text type="secondary">{coupons.length} mã giảm giá đang có hiệu lực</Text>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <Input
                  placeholder="Tìm mã code..."
                  prefix={<SearchOutlined className="text-gray-400" />}
                  onChange={handleSearch}
                  className="w-full sm:w-64"
                />
                
                {selectedRowKeys.length > 0 && (
                     <Button danger icon={<DeleteOutlined />} onClick={openDeleteModal}>
                       Xóa ({selectedRowKeys.length})
                     </Button>
                )}
                
                <Button icon={<ReloadOutlined />} onClick={fetchCoupons} />
                
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} className="bg-indigo-600">
                  Thêm mới
                </Button>
            </div>
        </div>

        {/* Table Section */}
        <Table
          rowSelection={rowSelection}
          dataSource={filteredCoupons}
          columns={columns}
          rowKey="couponId"
          loading={loading}
          pagination={{ pageSize: 8, showSizeChanger: true }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Modal Thêm/Sửa */}
      <Modal
        title={editingCoupon ? "Cập nhật Voucher" : "Tạo Voucher mới"}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        okText="Lưu lại"
        cancelText="Hủy bỏ"
        width={800}
        centered
      >
        <Form form={form} layout="vertical" className="pt-4">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="code"
                label="Mã Voucher (Code)"
                rules={[{ required: true, message: "Vui lòng nhập mã" }]}
              >
                <Input placeholder="VD: SALE50, TET2025" className="uppercase font-mono"/>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="description" label="Mô tả ngắn">
                <Input placeholder="VD: Giảm giá nhân dịp tết..." />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="discountType" label="Loại giảm giá" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="percent">Phần trăm (%)</Select.Option>
                  {/* Nếu backend hỗ trợ fixed amount thì mở comment dưới */}
                  {/* <Select.Option value="fixed">Số tiền cố định (VNĐ)</Select.Option> */}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="discountValue"
                label="Giá trị giảm"
                rules={[{ required: true }]}
                help="Nhập số % hoặc số tiền tùy theo loại giảm giá"
              >
                <InputNumber className="w-full" min={0} />
              </Form.Item>
            </Col>

            <Col xs={12} sm={8}>
              <Form.Item name="minOrderAmount" label="Đơn tối thiểu">
                <InputNumber 
                    className="w-full" 
                    min={0} 
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>

            <Col xs={12} sm={8}>
              <Form.Item name="maxDiscount" label="Giảm tối đa">
                <InputNumber 
                    className="w-full" 
                    min={0}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} 
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={8}>
              <Form.Item name="usageLimit" label="Tổng lượt dùng">
                <InputNumber className="w-full" min={0} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="startDate" label="Ngày bắt đầu" rules={[{ required: true }]}>
                <DatePicker className="w-full" showTime format="YYYY-MM-DD HH:mm" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="endDate" label="Ngày kết thúc" rules={[{ required: true }]}>
                <DatePicker className="w-full" showTime format="YYYY-MM-DD HH:mm" />
              </Form.Item>
            </Col>

            <Col span={24}>
                <div className="bg-gray-50 p-3 rounded flex items-center justify-between">
                    <span>Kích hoạt ngay sau khi tạo?</span>
                    <Form.Item name="isActive" valuePropName="checked" noStyle>
                        <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
                    </Form.Item>
                </div>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Modal Xóa */}
      <Modal
        title="Xác nhận xóa"
        open={isDeleteModalOpen}
        onOk={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        okText="Xóa vĩnh viễn"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        <p>Bạn có chắc chắn muốn xóa <b>{selectedRowKeys.length}</b> voucher đã chọn không?</p>
        <p className="text-red-500 text-sm">Hành động này không thể hoàn tác.</p>
      </Modal>
    </div>
  );
}