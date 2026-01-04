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
  Card,
  Typography,
  Tooltip
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  PlusOutlined,
  CreditCardOutlined,
  ReloadOutlined
} from "@ant-design/icons";
import { AuthContext } from "../../context/AuthContext";
import Cookies from "js-cookie";

const { Title, Text } = Typography;

export default function PaymentMethodManager() {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [editingMethod, setEditingMethod] = useState(null);
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
    fetchPaymentMethods();
  }, [user, token]);

  const fetchPaymentMethods = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8080/api/payment-methods", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401 || response.status === 403) {
        messageApi.error("Phiên đăng nhập đã hết hạn!");
        logout();
        return;
      }

      if (!response.ok) throw new Error("Fetch failed");
      const data = await response.json();
      setPaymentMethods(data);
    } catch {
      messageApi.error("Không thể tải danh sách phương thức thanh toán");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingMethod(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingMethod(record);
    form.setFieldsValue({ name: record.name });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:8080/api/payment-methods/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Delete failed");
      messageApi.success("Xóa phương thức thanh toán thành công");
      fetchPaymentMethods();
    } catch {
      messageApi.error("Không thể xóa phương thức thanh toán");
    }
  };

  const openDeleteModal = () => {
    if (!selectedRowKeys.length) {
      return;
    }
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      for (const id of selectedRowKeys) {
        await fetch(`http://localhost:8080/api/payment-methods/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      messageApi.success("Đã xóa các phương thức được chọn");
      setSelectedRowKeys([]);
      fetchPaymentMethods();
      setIsDeleteModalOpen(false);
    } catch {
      messageApi.error("Không thể xóa các phương thức được chọn");
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      const method = editingMethod ? "PUT" : "POST";
      const url = editingMethod
        ? `http://localhost:8080/api/payment-methods/${editingMethod.id}`
        : "http://localhost:8080/api/payment-methods";

      const payload = editingMethod
        ? { id: editingMethod.id, name: values.name }
        : { name: values.name };

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
        editingMethod
          ? "Cập nhật thành công"
          : "Thêm mới thành công"
      );

      setIsModalOpen(false);
      fetchPaymentMethods();
    } catch {
      messageApi.error("Lưu thất bại, vui lòng kiểm tra lại");
    }
  };

  const handleSearch = (e) => setSearchText(e.target.value.toLowerCase());

  const filteredMethods = paymentMethods.filter((m) =>
    m.name?.toLowerCase().includes(searchText)
  );

  const rowSelection = { selectedRowKeys, onChange: setSelectedRowKeys };

  const columns = [
    { 
        title: "Mã PT", 
        dataIndex: "id", 
        key: "id",
        width: 150,
        render: (text) => <span className="font-mono text-gray-500 font-semibold">{text}</span>
    },
    { 
        title: "Tên phương thức", 
        dataIndex: "name", 
        key: "name",
        render: (text) => (
            <span className="flex items-center gap-2 font-medium text-gray-800">
                <CreditCardOutlined className="text-indigo-600" />
                {text}
            </span>
        )
    },
    {
      title: "",
      width: 100,
      render: (_, record) => (
        <Space>
          <Tooltip title="Chỉnh sửa">
             <Button type="text" icon={<EditOutlined className="text-blue-600"/>} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Popconfirm
            title="Xóa phương thức này?"
            onConfirm={() => handleDelete(record.id)}
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
      
      {/* Container giới hạn độ rộng cho đẹp vì bảng này ít cột */}
      <Card bordered={false} className="shadow-sm max-w-4xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
                <Title level={4} style={{ margin: 0 }}>Phương thức thanh toán</Title>
                <Text type="secondary">{paymentMethods.length} phương thức khả dụng</Text>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <Input
                  placeholder="Tìm kiếm..."
                  prefix={<SearchOutlined className="text-gray-400" />}
                  onChange={handleSearch}
                  className="w-full sm:w-60"
                />

                {selectedRowKeys.length > 0 && (
                     <Button danger icon={<DeleteOutlined />} onClick={openDeleteModal}>
                       Xóa ({selectedRowKeys.length})
                     </Button>
                )}

                <Button icon={<ReloadOutlined/>} onClick={fetchPaymentMethods} />
                
                <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={handleAdd}
                    className="bg-indigo-600"
                >
                  Thêm mới
                </Button>
            </div>
        </div>

        {/* Table Section */}
        <Table
            rowSelection={rowSelection}
            dataSource={filteredMethods}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 8 }}
            scroll={{ x: 600 }}
        />
      </Card>

      {/* Modal Thêm/Sửa */}
      <Modal
        title={editingMethod ? "Chỉnh sửa phương thức" : "Thêm phương thức mới"}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        centered
      >
        <Form form={form} layout="vertical" className="pt-4">
          <Form.Item
            name="name"
            label="Tên phương thức"
            rules={[{ required: true, message: "Vui lòng nhập tên phương thức" }]}
          >
            <Input 
                prefix={<CreditCardOutlined className="text-gray-400"/>} 
                placeholder="Ví dụ: Tiền mặt, Chuyển khoản ngân hàng..."
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Xóa nhiều */}
      <Modal
        title="Xác nhận xóa"
        open={isDeleteModalOpen}
        onOk={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        okText="Xóa vĩnh viễn"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
        centered
      >
        <p>Bạn có chắc chắn muốn xóa <b>{selectedRowKeys.length}</b> phương thức thanh toán đã chọn?</p>
        <p className="text-red-500 text-sm">Hành động này không thể hoàn tác và có thể ảnh hưởng đến các đơn hàng cũ.</p>
      </Modal>
    </div>
  );
}