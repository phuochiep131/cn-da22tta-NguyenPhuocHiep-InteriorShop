import { useState, useEffect, useContext } from "react";
import { Table, Input, Button, Space, Modal, Form, message, Popconfirm, Card, Typography, Tooltip, Badge, Tag, InputNumber, Switch, Image } from "antd";
import { EditOutlined, DeleteOutlined, SearchOutlined, PlusOutlined, ReloadOutlined, ExclamationCircleOutlined, PictureOutlined } from "@ant-design/icons";
import { AuthContext } from "../../context/AuthContext"; // Đảm bảo đường dẫn đúng
import Cookies from "js-cookie";

const { Title, Text } = Typography;
const { confirm } = Modal;

export default function SlideshowManager() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [editingSlide, setEditingSlide] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const token = Cookies.get("jwt");
  const { user, logout } = useContext(AuthContext);

  // 1. Fetch dữ liệu khi load trang
  useEffect(() => {
    if (!user || !token) return;
    if (user.role !== "ADMIN") {
      messageApi.error("Bạn không có quyền truy cập trang này!");
      return;
    }
    fetchSlides();
  }, [user, token]);

  const fetchSlides = async () => {
    setLoading(true);
    try {
      // Gọi API lấy danh sách cho Admin (bao gồm cả ẩn)
      const response = await fetch("http://localhost:8080/api/slideshows/admin", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.status === 401 || response.status === 403) {
        messageApi.error("Phiên đăng nhập đã hết hạn!");
        logout();
        return;
      }
      
      if (!response.ok) throw new Error("Fetch failed");
      const data = await response.json();
      setSlides(data);
    } catch {
      messageApi.error("Không thể tải danh sách slideshow");
    } finally {
      setLoading(false);
    }
  };

  // 2. Các hành động Mở Modal (Thêm/Sửa)
  const handleAdd = () => {
    setEditingSlide(null);
    form.resetFields();
    // Giá trị mặc định
    form.setFieldsValue({ active: true, sortOrder: 0 });
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingSlide(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  // 3. Hành động Xóa (Đơn lẻ)
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:8080/api/slideshows/admin/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Delete failed");
      
      messageApi.success("Xóa slide thành công");
      fetchSlides();
      setSelectedRowKeys((prev) => prev.filter((key) => key !== id));
    } catch {
      messageApi.error("Không thể xóa slide này.");
    }
  };

  // 4. Hành động Xóa (Nhiều)
  const showDeleteConfirm = () => {
    if (!selectedRowKeys.length) {
      messageApi.warning("Vui lòng chọn ít nhất một slide để xóa!");
      return;
    }

    confirm({
      title: `Bạn chắc chắn muốn xóa ${selectedRowKeys.length} slide?`,
      icon: <ExclamationCircleOutlined />,
      content: 'Hành động này không thể hoàn tác.',
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
          fetch(`http://localhost:8080/api/slideshows/admin/${id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
          }).then(res => {
              if(!res.ok) throw new Error(`Failed to delete ${id}`);
              return id;
          })
      );

      const results = await Promise.allSettled(deletePromises);
      const successfulDeletes = results.filter(r => r.status === 'fulfilled').length;
      
      if (successfulDeletes > 0) {
          messageApi.success(`Đã xóa thành công ${successfulDeletes} slide.`);
      } else {
          messageApi.error("Xóa thất bại.");
      }

      setSelectedRowKeys([]);
      fetchSlides();
    } catch {
      messageApi.error("Có lỗi xảy ra trong quá trình xóa.");
    } finally {
      setLoading(false);
    }
  };

  // 5. Lưu (Thêm mới hoặc Cập nhật)
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const isUpdate = !!editingSlide;
      const method = isUpdate ? "PUT" : "POST";
      
      // Nếu update thì cần ID trên URL, nếu tạo mới thì không
      const url = isUpdate
        ? `http://localhost:8080/api/slideshows/admin/${editingSlide.id}`
        : "http://localhost:8080/api/slideshows/admin";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error("Save failed");

      messageApi.success(isUpdate ? "Cập nhật slide thành công" : "Thêm slide thành công");
      setIsModalOpen(false);
      fetchSlides();
    } catch (error) {
      console.error(error);
      messageApi.error("Lưu thất bại. Vui lòng kiểm tra lại dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  // 6. Xử lý tìm kiếm & Filter
  const handleSearch = (e) => setSearchText(e.target.value.toLowerCase());

  const filteredSlides = slides.filter(
    (s) =>
      s.title?.toLowerCase().includes(searchText) ||
      s.description?.toLowerCase().includes(searchText)
  );

  // 7. Cấu hình bảng
  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    columnWidth: 48,
  };

  const columns = [
    {
      title: "Hình ảnh",
      dataIndex: "imageUrl",
      key: "image",
      width: 120,
      render: (url) => (
        <div className="rounded-md overflow-hidden border border-gray-200">
            <Image 
                width={100} 
                height={60} 
                src={url} 
                alt="slide" 
                style={{ objectFit: "cover" }}
                fallback="https://placehold.co/100x60?text=No+Image"
            />
        </div>
      ),
    },
    {
      title: "Thông tin Slide",
      dataIndex: "title",
      key: "info",
      render: (text, record) => (
        <div className="flex flex-col">
            <Text strong className="text-base">{text || "(Không có tiêu đề)"}</Text>
            <Text type="secondary" className="text-xs truncate max-w-xs">{record.description}</Text>
            {record.targetUrl && (
                <a href={record.targetUrl} target="_blank" rel="noreferrer" className="text-blue-500 text-xs mt-1">
                    Link: {record.targetUrl}
                </a>
            )}
        </div>
      ),
    },
    {
      title: "Thứ tự",
      dataIndex: "sortOrder",
      key: "sortOrder",
      width: 80,
      sorter: (a, b) => a.sortOrder - b.sortOrder,
      render: (val) => <div className="text-center font-semibold text-gray-600">{val}</div>
    },
    {
      title: "Trạng thái",
      dataIndex: "active",
      key: "active",
      width: 100,
      render: (active) => (
        <Tag color={active ? "success" : "default"}>
          {active ? "Hiển thị" : "Đang ẩn"}
        </Tag>
      ),
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
            title="Xóa slide này?"
            description="Không thể hoàn tác."
            onConfirm={() => handleDelete(record.id)}
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

      <Card bordered={false} className="shadow-sm" bodyStyle={{ padding: '16px 24px' }}>
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
                <Title level={3} style={{ margin: 0, fontWeight: 600 }}>Quản lý Slideshow</Title>
                <Text type="secondary">Tổng số: {slides.length} slide</Text>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                 <Input
                    placeholder="Tìm theo tiêu đề..."
                    prefix={<SearchOutlined className="text-gray-400" />}
                    onChange={handleSearch}
                    allowClear
                    className="w-full sm:w-64"
                  />
                 <Space className="w-full sm:w-auto" wrap>
                    {selectedRowKeys.length > 0 && (
                          <Button danger type="dashed" icon={<DeleteOutlined />} onClick={showDeleteConfirm} className="flex-1 sm:flex-none">
                            Xóa <Badge count={selectedRowKeys.length} style={{ backgroundColor: '#ff4d4f', marginLeft: 4 }} showZero={false} /> mục
                          </Button>
                     )}
                    <Button icon={<ReloadOutlined />} onClick={fetchSlides} loading={loading} className="hidden sm:inline-flex">Làm mới</Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-500 flex-1 sm:flex-none w-full sm:w-auto font-medium">
                      Thêm Slide
                    </Button>
                 </Space>
            </div>
        </div>

        {/* Table */}
        <Table
          rowSelection={rowSelection}
          dataSource={filteredSlides}
          columns={columns}
          rowKey="id" // Quan trọng: Entity Slideshow dùng id (Long)
          loading={loading}
          pagination={{ pageSize: 5 }}
          scroll={{ x: 800 }}
          size="middle"
        />
      </Card>

      {/* Modal Form */}
      <Modal
        title={<Space><PictureOutlined /> <span className="text-lg">{editingSlide ? "Cập nhật Slide" : "Thêm Slide mới"}</span></Space>}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        okText={editingSlide ? "Cập nhật" : "Tạo mới"}
        cancelText="Hủy bỏ"
        confirmLoading={loading}
        maskClosable={false}
        width={600}
      >
        <Form form={form} layout="vertical" className="pt-4">
            
          {/* URL hình ảnh */}
          <Form.Item
            name="imageUrl"
            label="Đường dẫn hình ảnh (URL)"
            rules={[
                { required: true, message: "Vui lòng nhập link ảnh!" },
                { type: 'url', warningOnly: true, message: 'Định dạng URL không hợp lệ' }
            ]}
            extra="Nhập link ảnh trực tiếp (VD: https://imgur.com/example.jpg)"
          >
            <Input prefix={<PictureOutlined />} placeholder="https://..." />
          </Form.Item>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tiêu đề */}
              <Form.Item name="title" label="Tiêu đề (Tùy chọn)">
                <Input placeholder="VD: Bộ sưu tập Mùa Thu" maxLength={100} showCount />
              </Form.Item>

              {/* Link đích */}
              <Form.Item name="targetUrl" label="Link khi click vào (Tùy chọn)">
                 <Input placeholder="/products/sofa" />
              </Form.Item>
          </div>
          
          {/* Mô tả */}
          <Form.Item name="description" label="Mô tả ngắn">
            <Input.TextArea rows={2} placeholder="Mô tả hiển thị trên slide..." maxLength={255} showCount />
          </Form.Item>

          <div className="flex gap-8">
              {/* Thứ tự */}
              <Form.Item name="sortOrder" label="Thứ tự hiển thị" initialValue={0}>
                 <InputNumber min={0} className="w-full" />
              </Form.Item>

              {/* Trạng thái */}
              <Form.Item name="active" label="Trạng thái" valuePropName="checked" initialValue={true}>
                 <Switch checkedChildren="Hiển thị" unCheckedChildren="Ẩn" />
              </Form.Item>
          </div>

        </Form>
      </Modal>
    </div>
  );
}