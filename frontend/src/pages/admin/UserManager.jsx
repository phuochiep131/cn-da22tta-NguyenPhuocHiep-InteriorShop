import { useState, useEffect, useContext } from "react";
import { Table, Input, Button, Space, Modal, Form, Select, message, 
Popconfirm, DatePicker, Tag } from "antd";
import { EditOutlined, DeleteOutlined, SearchOutlined, PlusOutlined } from "@ant-design/icons";
import { AuthContext } from "../../context/AuthContext";
import Cookies from "js-cookie";
import dayjs from "dayjs";

export default function UserManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [form] = Form.useForm();

  const [messageApi, contextHolder] = message.useMessage(); // ✅ thêm dòng này

  const token = Cookies.get("jwt");
  const { user, logout } = useContext(AuthContext);

  // ------------------ Fetch Users ------------------
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

  // ------------------ Handlers ------------------
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
    if (!selectedRowKeys.length) {
      messageApi.warning("Vui lòng chọn ít nhất một người dùng để xóa!");
      return;
    }
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

      messageApi.success(
        editingUser ? "Cập nhật người dùng thành công" : "Thêm người dùng thành công"
      );

      setIsModalOpen(false);
      fetchUsers();
    } catch {
      messageApi.error("Lưu thất bại, vui lòng kiểm tra lại");
    }
  };

  const handleSearch = (value) => setSearchText(value.toLowerCase());

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
      title: "Ảnh đại diện",
      dataIndex: "avatar",
      render: (avatar) => (
        <img
          src={
            avatar ||
            "https://res.cloudinary.com/ddnzj70uw/image/upload/v1759990027/avt-default_r2kgze.png"
          }
          alt="avatar"
          className="w-10 h-10 rounded-full object-cover"
        />
      ),
    },
    { title: "Họ và tên", dataIndex: "fullName" },
    { title: "Email", dataIndex: "email" },
    { title: "Giới tính", dataIndex: "gender" },
    {
      title: "Ngày sinh",
      dataIndex: "birthDate",
      key: "birthDate",
      render: (text) => (text ? new Date(text).toLocaleDateString() : "—"),
    },
    { title: "Số điện thoại", dataIndex: "phoneNumber" },
    {
      title: "Vai trò",
      dataIndex: "role",
      render: (role) => {
        let color = "blue";
        if (role === "ADMIN") {
          color = "red";
        }
        return (
          <Tag color={color} style={{ borderRadius: "6px", padding: "2px 8px" }}>
            {role}
          </Tag>
        );
      },
    },
    {
      title: "Ngày tạo tài khoản",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => new Date(text).toLocaleString(),
    },

    {
      title: "Thao tác",
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa người dùng này?"
            onConfirm={() => handleDelete(record.userId)}
          >
            <Button danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ------------------ Render ------------------
  return (
    <div className="p-4 bg-gray-50 w-full h-full box-border">
      {contextHolder}
      <h2 className="text-2xl font-semibold mb-6">Quản lý người dùng</h2>

      <Space className="mb-4 flex-wrap" wrap>
        <Input
          placeholder="Tìm kiếm theo tên hoặc email"
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
          Thêm người dùng
        </Button>
        <Button
          danger
          disabled={!selectedRowKeys.length}
          onClick={openDeleteModal}
        >
          Xóa nhiều
        </Button>
        <Button onClick={fetchUsers}>Làm mới</Button>
      </Space>

      <Table
        rowSelection={rowSelection}
        dataSource={filteredUsers}
        columns={columns}
        rowKey="userId"
        loading={loading}
        pagination={{ pageSize: 8 }}
        scroll={{ x: "max-content" }}
        className="bg-white shadow rounded-lg"
      />

      {/* Modal thêm/sửa */}
      <Modal
        title={editingUser ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="fullName"
            label="Họ và tên"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true }]}
          >
            <Input disabled={!!editingUser} />
          </Form.Item>
          {!editingUser && (
            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[{ required: true }]}
            >
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item name="phoneNumber" label="Số điện thoại">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Địa chỉ">
            <Input />
          </Form.Item>
          <Form.Item name="gender" label="Giới tính">
            <Select>
              <Select.Option value="Nam">Nam</Select.Option>
              <Select.Option value="Nữ">Nữ</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="birthDate"
            label="Ngày sinh"
            rules={[{ required: false }]}
          >
            <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="role" label="Vai trò">
            <Select>
              <Select.Option value="USER">USER</Select.Option>
              <Select.Option value="ADMIN">ADMIN</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal xóa nhiều */}
      <Modal
        title={`Xác nhận xóa ${selectedRowKeys.length} người dùng`}
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
