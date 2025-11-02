import { useState, useEffect, useContext } from "react";
import { Table, Input, Button, Space, Modal, Form, message, Popconfirm } from "antd";
import { EditOutlined, DeleteOutlined, SearchOutlined, PlusOutlined } from "@ant-design/icons";
import { AuthContext } from "../../context/AuthContext";
import Cookies from "js-cookie";

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
      messageApi.warning("Vui lòng chọn ít nhất một phương thức để xóa!");
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
          ? "Cập nhật phương thức thanh toán thành công"
          : "Thêm phương thức thanh toán thành công"
      );

      setIsModalOpen(false);
      fetchPaymentMethods();
    } catch {
      messageApi.error("Lưu thất bại, vui lòng kiểm tra lại");
    }
  };

  const handleSearch = (value) => setSearchText(value.toLowerCase());

  const filteredMethods = paymentMethods.filter((m) =>
    m.name?.toLowerCase().includes(searchText)
  );

  const rowSelection = { selectedRowKeys, onChange: setSelectedRowKeys };

  const columns = [
    { title: "Mã phương thức", dataIndex: "id", key: "id" },
    { title: "Tên phương thức", dataIndex: "name", key: "name" },
    {
      title: "Thao tác",
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa phương thức này?"
            onConfirm={() => handleDelete(record.id)}
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
      <h2 className="text-2xl font-semibold mb-6">Quản lý phương thức thanh toán</h2>

      <Space className="mb-4 flex-wrap" wrap>
        <Input
          placeholder="Tìm kiếm theo tên phương thức"
          prefix={<SearchOutlined />}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-64"
        />
        <Button
          icon={<PlusOutlined />}
          type="primary"
          onClick={handleAdd}
          className="bg-blue-600"
        >
          Thêm phương thức
        </Button>
        <Button danger disabled={!selectedRowKeys.length} onClick={openDeleteModal}>
          Xóa nhiều
        </Button>
        <Button onClick={fetchPaymentMethods}>Làm mới</Button>
      </Space>

      <Table
        rowSelection={rowSelection}
        dataSource={filteredMethods}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 8 }}
        scroll={{ x: "max-content" }}
        className="bg-white shadow rounded-lg"
      />

      {/* Modal thêm/sửa */}
      <Modal
        title={editingMethod ? "Chỉnh sửa phương thức thanh toán" : "Thêm phương thức mới"}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Tên phương thức"
            rules={[{ required: true, message: "Vui lòng nhập tên phương thức" }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal xóa nhiều */}
      <Modal
        title={`Xác nhận xóa ${selectedRowKeys.length} phương thức`}
        open={isDeleteModalOpen}
        onOk={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        okText="Xóa"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        <p>Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa?</p>
      </Modal>
    </div>
  );
}
