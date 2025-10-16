import { useState, useEffect, useContext } from "react";
import { Table, Input, Button, Space, Modal, Form, message, Popconfirm,} from "antd";
import { EditOutlined, DeleteOutlined, SearchOutlined, PlusOutlined,} from "@ant-design/icons";
import { AuthContext } from "../../context/AuthContext";
import Cookies from "js-cookie";

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const token = Cookies.get("jwt");
  const { user, logout } = useContext(AuthContext);

  // ------------------ Fetch Categories ------------------
  useEffect(() => {
    if (!user || !token) return;
    if (user.role !== "ADMIN") {
      messageApi.error("Bạn không có quyền truy cập trang này!");
      return;
    }
    fetchCategories();
  }, [user, token]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8080/api/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401 || response.status === 403) {
        messageApi.error("Phiên đăng nhập đã hết hạn!");
        logout();
        return;
      }
      if (!response.ok) throw new Error("Fetch failed");
      const data = await response.json();
      setCategories(data);
    } catch {
      messageApi.error("Không thể tải danh sách danh mục");
    } finally {
      setLoading(false);
    }
  };

  // ------------------ Handlers ------------------
  const handleAdd = () => {
    setEditingCategory(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingCategory(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:8080/api/categories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Delete failed");
      messageApi.success("Xóa danh mục thành công");
      fetchCategories();
    } catch {
      messageApi.error("Không thể xóa danh mục");
    }
  };

  const openDeleteModal = () => {
    if (!selectedRowKeys.length) {
      messageApi.warning("Vui lòng chọn ít nhất một danh mục để xóa!");
      return;
    }
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      for (const id of selectedRowKeys) {
        await fetch(`http://localhost:8080/api/categories/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      messageApi.success("Đã xóa các danh mục được chọn");
      setSelectedRowKeys([]);
      fetchCategories();
      setIsDeleteModalOpen(false);
    } catch {
      messageApi.error("Không thể xóa các danh mục được chọn");
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const method = editingCategory ? "PUT" : "POST";
      const url = editingCategory
        ? `http://localhost:8080/api/categories/${editingCategory.categoryId}`
        : "http://localhost:8080/api/categories";

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
        editingCategory
          ? "Cập nhật danh mục thành công"
          : "Thêm danh mục thành công"
      );
      setIsModalOpen(false);
      fetchCategories();
    } catch {
      messageApi.error("Lưu thất bại, vui lòng kiểm tra lại");
    }
  };

  const handleSearch = (value) => setSearchText(value.toLowerCase());

  const filteredCategories = categories.filter(
    (c) =>
      c.categoryName?.toLowerCase().includes(searchText) ||
      c.description?.toLowerCase().includes(searchText)
  );

  const rowSelection = { selectedRowKeys, onChange: setSelectedRowKeys };

  const columns = [
    { title: "Mã danh mục", dataIndex: "categoryId" },
    { title: "Tên danh mục", dataIndex: "categoryName" },
    { title: "Mô tả", dataIndex: "description" },
    {
      title: "Thao tác",
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa danh mục này?"
            onConfirm={() => handleDelete(record.categoryId)}
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
      <h2 className="text-2xl font-semibold mb-6">Quản lý danh mục</h2>

      <Space className="mb-4 flex-wrap" wrap>
        <Input
          placeholder="Tìm kiếm theo tên hoặc mô tả"
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
          Thêm danh mục
        </Button>
        <Button
          danger
          disabled={!selectedRowKeys.length}
          onClick={openDeleteModal}
        >
          Xóa nhiều
        </Button>
        <Button onClick={fetchCategories}>Làm mới</Button>
      </Space>

      <Table
        rowSelection={rowSelection}
        dataSource={filteredCategories}
        columns={columns}
        rowKey="categoryId"
        loading={loading}
        pagination={{ pageSize: 8 }}
        scroll={{ x: "max-content" }}
        className="bg-white shadow rounded-lg"
      />

      {/* Modal thêm/sửa */}
      <Modal
        title={
          editingCategory ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"
        }
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="categoryId"
            label="Mã danh mục"
            rules={[{ required: true }]}
          >
            <Input disabled={!!editingCategory} />
          </Form.Item>
          <Form.Item
            name="categoryName"
            label="Tên danh mục"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal xóa nhiều */}
      <Modal
        title={`Xác nhận xóa ${selectedRowKeys.length} danh mục`}
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
