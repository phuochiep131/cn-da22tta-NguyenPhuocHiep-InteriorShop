import { useState, useEffect, useContext } from "react";
import { Table, Input, Button, Space, Modal, Form, Select, message, Popconfirm, DatePicker, Tag, Card, Avatar, Tooltip, Typography, Badge } from "antd";
import { EditOutlined, DeleteOutlined, SearchOutlined, PlusOutlined, UserOutlined, ReloadOutlined } from "@ant-design/icons";
import { AuthContext } from "../../context/AuthContext";
import Cookies from "js-cookie";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export default function UserManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [editingUser, setEditingUser] = useState(null);
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
    fetchUsers();
  }, [user, token]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8080/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401 || response.status === 403) {
        messageApi.error("Phiên đăng nhập đã hết hạn!");
        logout();
        return;
      }
      if (!response.ok) throw new Error("Fetch failed");
      const data = await response.json();
      setUsers(data);
    } catch {
      messageApi.error("Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingUser(record);
    form.setFieldsValue({
      ...record,
      birthDate: record.birthDate ? dayjs(record.birthDate) : null,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (userId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Delete failed");
      messageApi.success("Xóa người dùng thành công");
      fetchUsers();
    } catch {
      messageApi.error("Không thể xóa người dùng");
    }
  };

  const openDeleteModal = () => {
    if (!selectedRowKeys.length) return;
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      for (const id of selectedRowKeys) {
        await fetch(`http://localhost:8080/api/users/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      messageApi.success("Đã xóa người dùng được chọn");
      setSelectedRowKeys([]);
      fetchUsers();
      setIsDeleteModalOpen(false);
    } catch {
      messageApi.error("Không thể xóa người dùng được chọn");
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingUser && !values.avatar) {
        values.avatar = editingUser.avatar;
      }
      const method = editingUser ? "PUT" : "POST";
      const url = editingUser
        ? `http://localhost:8080/api/users/${editingUser.userId}`
        : "http://localhost:8080/api/auth/register";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });
      if (!response.ok) throw new Error("Save failed");

      messageApi.success(editingUser ? "Cập nhật thành công" : "Thêm mới thành công");
      setIsModalOpen(false);
      fetchUsers();
    } catch {
      messageApi.error("Lưu thất bại, vui lòng kiểm tra lại");
    }
  };

  const handleSearch = (e) => setSearchText(e.target.value.toLowerCase());

  const filteredUsers = users
    .filter(
      (u) =>
        u.fullName?.toLowerCase().includes(searchText) ||
        u.email?.toLowerCase().includes(searchText)
    )
    .sort((a, b) => {
      if (a.role === "ADMIN" && b.role !== "ADMIN") return -1;
      if (a.role !== "ADMIN" && b.role === "ADMIN") return 1;
      return a.fullName.localeCompare(b.fullName);
    });

  const rowSelection = { selectedRowKeys, onChange: setSelectedRowKeys };

  const columns = [
    {
      title: "Người dùng",
      dataIndex: "fullName",
      width: 250,
      render: (text, record) => (
        <div className="flex items-center gap-3">
          <Avatar src={record.avatar} icon={<UserOutlined />} size="large" />
          <div className="flex flex-col">
            <span className="font-medium text-gray-800">{text}</span>
            <span className="text-xs text-gray-500">{record.email}</span>
          </div>
        </div>
      ),
    },
    { 
        title: "Vai trò", 
        dataIndex: "role",
        width: 100,
        render: (role) => (
            <Tag color={role === "ADMIN" ? "red" : "blue"}>{role}</Tag>
        ) 
    },
    { title: "SĐT", dataIndex: "phoneNumber", width: 120 },
    { 
        title: "Giới tính", 
        dataIndex: "gender", 
        responsive: ['md'],
        width: 100,
    },
    {
      title: "Ngày sinh",
      dataIndex: "birthDate",
      responsive: ['lg'],
      render: (text) => (text ? new Date(text).toLocaleDateString("vi-VN") : "—"),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      responsive: ['xl'],
      render: (text) => new Date(text).toLocaleDateString("vi-VN"),
    },
    {
      title: "",
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Space>
          <Tooltip title="Sửa">
            <Button type="text" icon={<EditOutlined className="text-blue-600"/>} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Popconfirm
            title="Xóa người dùng?"
            onConfirm={() => handleDelete(record.userId)}
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
                <Title level={4} style={{ margin: 0 }}>Quản lý người dùng</Title>
                <Text type="secondary">{users.length} tài khoản trong hệ thống</Text>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <Input
                  placeholder="Tìm theo tên, email..."
                  prefix={<SearchOutlined className="text-gray-400" />}
                  onChange={handleSearch}
                  className="w-full sm:w-64"
                />
                
                {selectedRowKeys.length > 0 && (
                     <Button danger icon={<DeleteOutlined />} onClick={openDeleteModal}>
                       Xóa ({selectedRowKeys.length})
                     </Button>
                )}
                
                <Button icon={<ReloadOutlined />} onClick={fetchUsers} />
                
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} className="bg-indigo-600">
                  Thêm mới
                </Button>
            </div>
        </div>

        <Table
            rowSelection={rowSelection}
            dataSource={filteredUsers}
            columns={columns}
            rowKey="userId"
            loading={loading}
            pagination={{ pageSize: 8, showSizeChanger: true }}
            scroll={{ x: 800 }}
        />
      </Card>

      <Modal
        title={editingUser ? "Chỉnh sửa hồ sơ" : "Tạo tài khoản mới"}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        okText="Lưu lại"
        cancelText="Hủy bỏ"
        width={800}
        centered
      >
        <Form form={form} layout="vertical" className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true }]}>
              <Input placeholder="Nhập họ tên đầy đủ" />
            </Form.Item>

            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
              <Input disabled={!!editingUser} placeholder="email@example.com" />
            </Form.Item>

            {!editingUser && (
              <Form.Item name="password" label="Mật khẩu" rules={[{ required: true }]}>
                <Input.Password placeholder="Nhập mật khẩu" />
              </Form.Item>
            )}

            <Form.Item name="phoneNumber" label="Số điện thoại">
              <Input placeholder="09xxxxxxx" />
            </Form.Item>

            <Form.Item name="gender" label="Giới tính">
              <Select placeholder="Chọn giới tính">
                <Select.Option value="Nam">Nam</Select.Option>
                <Select.Option value="Nữ">Nữ</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="birthDate" label="Ngày sinh">
              <DatePicker className="w-full" format="YYYY-MM-DD" placeholder="Chọn ngày sinh" />
            </Form.Item>

            <Form.Item name="role" label="Phân quyền">
              <Select>
                <Select.Option value="USER">USER (Khách hàng)</Select.Option>
                <Select.Option value="ADMIN">ADMIN (Quản trị)</Select.Option>
              </Select>
            </Form.Item>
            
            <Form.Item name="address" label="Địa chỉ" className="md:col-span-2">
              <Input placeholder="Nhập địa chỉ liên hệ" />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <Modal
        title="Xác nhận xóa"
        open={isDeleteModalOpen}
        onOk={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        okText="Xóa vĩnh viễn"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        <p>Bạn có chắc chắn muốn xóa <b>{selectedRowKeys.length}</b> người dùng đã chọn?</p>
        <p className="text-red-500 text-sm">Hành động này không thể hoàn tác.</p>
      </Modal>
    </div>
  );
}