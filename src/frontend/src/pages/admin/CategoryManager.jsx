import { useState, useEffect, useContext } from "react";
import { Table, Input, Button, Space, Modal, Form, message, Popconfirm, Card, Typography, Tooltip, Badge } from "antd";
import { EditOutlined, DeleteOutlined, SearchOutlined, PlusOutlined, ReloadOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { AuthContext } from "../../context/AuthContext";
import Cookies from "js-cookie";

const { Title, Text } = Typography;
const { confirm } = Modal;

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const token = Cookies.get("jwt");
  const { user, logout } = useContext(AuthContext);

  useEffect(() => {
    if (!user || !token) return;
    if (user.role !== "ADMIN") {
      messageApi.error("Bạn không có quyền truy cập trang này!");
      // navigate("/")
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
      setSelectedRowKeys(prev => prev.filter(key => key !== id));
    } catch {
      messageApi.error("Không thể xóa danh mục (có thể đang chứa sản phẩm)");
    }
  };

  const showDeleteConfirm = () => {
    if (!selectedRowKeys.length) {
      messageApi.warning("Vui lòng chọn ít nhất một danh mục để xóa!");
      return;
    }

    confirm({
      title: `Bạn chắc chắn muốn xóa ${selectedRowKeys.length} danh mục?`,
      icon: <ExclamationCircleOutlined />,
      content: 'Hành động này không thể hoàn tác và có thể ảnh hưởng đến các sản phẩm liên quan.',
      okText: 'Xóa ngay',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: handleConfirmDelete,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      setLoading(true);
      const deletePromises = selectedRowKeys.map(id =>
          fetch(`http://localhost:8080/api/categories/${id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
          }).then(res => {
             if(!res.ok) throw new Error(`Failed to delete ${id}`);
             return id;
          })
      );

      const results = await Promise.allSettled(deletePromises);
      const successfulDeletes = results.filter(r => r.status === 'fulfilled').length;
      const failedDeletes = results.filter(r => r.status === 'rejected').length;

      if (successfulDeletes > 0) {
          messageApi.success(`Đã xóa thành công ${successfulDeletes} danh mục.`);
      }
      if (failedDeletes > 0) {
          messageApi.error(`Không thể xóa ${failedDeletes} danh mục (có thể do ràng buộc dữ liệu).`);
      }

      setSelectedRowKeys([]);
      fetchCategories();
    } catch {
      messageApi.error("Có lỗi xảy ra trong quá trình xóa.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
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
      messageApi.error("Lưu thất bại, mã danh mục có thể đã tồn tại.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => setSearchText(e.target.value.toLowerCase());

  const filteredCategories = categories.filter(
    (c) =>
      c.categoryName?.toLowerCase().includes(searchText) ||
      c.description?.toLowerCase().includes(searchText)
  );

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    columnWidth: 48,
  };

  const columns = [
    {
      title: "Mã",
      dataIndex: "categoryId",
      width: 100,
      responsive: ['sm'],
      render: (text) => <Text type="secondary" className="font-mono">{text}</Text>

    },
    {
      title: "Tên danh mục",
      dataIndex: "categoryName",
      ellipsis: true,
      render: (text) => <Text strong className="text-base">{text}</Text>
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      ellipsis: true,
      responsive: ['lg'],
    },
    {
      title: "",
      key: "actions",
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Chỉnh sửa">
            <Button type="text" shape="circle" icon={<EditOutlined className="text-blue-600"/>} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Popconfirm
            title="Xóa danh mục này?"
            description="Hành động này không thể hoàn tác."
            onConfirm={() => handleDelete(record.categoryId)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true, size: 'small' }}
            cancelButtonProps={{ size: 'small' }}
          >
             <Tooltip title="Xóa">
                <Button type="text" danger shape="circle" icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-full">
      {contextHolder}

      <Card
        bordered={false}
        className="shadow-sm"
        bodyStyle={{ padding: '16px 24px' }}
      >
        {/* --- Responsive Header Section --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            {/* Title & Stats */}
            <div>
                <Title level={3} style={{ margin: 0, fontWeight: 600 }}>
                    Quản lý danh mục
                </Title>
                 <Text type="secondary">Tổng số: {categories.length} danh mục</Text>
            </div>

            {/* Action Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                 {/* Search */}
                 <Input
                    placeholder="Tìm theo tên hoặc mô tả..."
                    prefix={<SearchOutlined className="text-gray-400" />}
                    onChange={handleSearch}
                    allowClear
                    className="w-full sm:w-64"
                  />

                 {/* Buttons Group */}
                 <Space className="w-full sm:w-auto" wrap>
                      {/* Nút Xóa nhiều - Chỉ hiện khi có chọn */}
                      {selectedRowKeys.length > 0 && (
                         <Button
                           danger
                           type="dashed"
                           icon={<DeleteOutlined />}
                           onClick={showDeleteConfirm}
                           className="flex-1 sm:flex-none"
                         >
                           Xóa <Badge count={selectedRowKeys.length} style={{ backgroundColor: '#ff4d4f', marginLeft: 4 }} showZero={false} /> mục
                         </Button>
                      )}

                    <Button icon={<ReloadOutlined />} onClick={fetchCategories} loading={loading} className="hidden sm:inline-flex">
                        Làm mới
                    </Button>

                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleAdd}
                      className="bg-indigo-600 hover:bg-indigo-500 flex-1 sm:flex-none w-full sm:w-auto font-medium"
                      size="middle"
                    >
                      Thêm mới
                    </Button>
                 </Space>
            </div>
        </div>

        {/* --- Table Section --- */}
        <Table
          rowSelection={rowSelection}
          dataSource={filteredCategories}
          columns={columns}
          rowKey="categoryId"
          loading={loading}
          pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} mục`,
          }}
          scroll={{ x: 700 }}
          size="middle"
        />
      </Card>

      {/* --- Modal Thêm/Sửa --- */}
      <Modal
        title={
          <Space><span className="text-lg">{editingCategory ? "Cập nhật danh mục" : "Thêm danh mục mới"}</span></Space>
        }
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        okText={editingCategory ? "Cập nhật" : "Tạo mới"}
        cancelText="Hủy bỏ"
        confirmLoading={loading}
        maskClosable={false}
      >
        <Form form={form} layout="vertical" className="pt-4">
          <Form.Item
            name="categoryId"
            label="Mã danh mục (ID)"
            rules={[
                { required: true, message: "Vui lòng nhập mã danh mục!" },
                { pattern: /^[a-zA-Z0-9_-]+$/, message: "Mã chỉ chứa chữ, số, gạch ngang/dưới" }
            ]}
            extra={!editingCategory && "Mã là duy nhất và không thể thay đổi sau khi tạo."}
          >
            <Input
                placeholder="VD: SOFA_PHONG_KHACH"
                disabled={!!editingCategory}
                className="font-mono"
                maxLength={50}
                showCount={!editingCategory}
            />
          </Form.Item>
          <Form.Item
            name="categoryName"
            label="Tên danh mục hiển thị"
            rules={[{ required: true, message: "Vui lòng nhập tên danh mục!" }]}
          >
            <Input placeholder="VD: Sofa Phòng Khách Cao Cấp" maxLength={100} showCount/>
          </Form.Item>
          <Form.Item name="description" label="Mô tả chi tiết">
            <Input.TextArea
                rows={4}
                placeholder="Nhập mô tả cho danh mục này (tùy chọn)..."
                maxLength={500}
                showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}