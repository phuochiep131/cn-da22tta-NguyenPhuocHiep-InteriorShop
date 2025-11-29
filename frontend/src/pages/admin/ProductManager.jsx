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
  InputNumber,
  Select,
  Upload,
  Row,
  Col,
  Card,
  Typography,
  Image,
  Tooltip,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  PlusOutlined,
  UploadOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { AuthContext } from "../../context/AuthContext";
import Cookies from "js-cookie";

const { Title } = Typography;

export default function ProductManager() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const token = Cookies.get("jwt");
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (!user || !token) return;
    if (user.role !== "ADMIN") {
      messageApi.error("Bạn không có quyền truy cập trang này!");
      return;
    }
    fetchProducts();
    fetchCategories();
  }, [user, token]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();
      setProducts(data);
    } catch {
      messageApi.error("Không thể tải danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCategories(data);
    } catch {
      messageApi.error("Không thể tải danh mục");
    }
  };

  const uploadToCloudinary = async (file) => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "my_interior_shop");
    data.append("folder", "image/products");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/ddnzj70uw/image/upload",
      {
        method: "POST",
        body: data,
      }
    );
    const uploaded = await res.json();
    if (!uploaded.secure_url) throw new Error("Upload failed");
    return uploaded.secure_url;
  };

  const handleAdd = () => {
    setEditingProduct(null);
    form.resetFields();
    setImageFile(null);
    setFileList([]);
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingProduct(record);
    form.setFieldsValue(record);
    setImageFile(null);
    if (record.imageUrl) {
      setFileList([
        { uid: "-1", name: "image.png", status: "done", url: record.imageUrl },
      ]);
    } else {
      setFileList([]);
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`http://localhost:8080/api/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      messageApi.success("Xóa sản phẩm thành công");
      fetchProducts();
    } catch {
      messageApi.error("Không thể xóa sản phẩm");
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      let imageUrl = editingProduct?.imageUrl || "";

      if (imageFile) {
        messageApi.open({
          type: "loading",
          content: "Đang tải ảnh lên Cloudinary...",
        });
        imageUrl = await uploadToCloudinary(imageFile);
        messageApi.destroy();
      }

      const payload = { ...values, imageUrl };
      const method = editingProduct ? "PUT" : "POST";
      const url = editingProduct
        ? `http://localhost:8080/api/products/${editingProduct.productId}`
        : "http://localhost:8080/api/products";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();
      messageApi.success(
        editingProduct ? "Cập nhật thành công" : "Thêm sản phẩm thành công"
      );
      setIsModalOpen(false);
      fetchProducts();
    } catch {
      messageApi.error("Lưu thất bại, vui lòng kiểm tra lại");
    }
  };

  const handleSearch = (val) => setSearchText(val.toLowerCase());
  const filteredProducts = products.filter(
    (p) =>
      p.productName?.toLowerCase().includes(searchText) ||
      p.description?.toLowerCase().includes(searchText)
  );

  const columns = [
    {
      title: "Sản phẩm",
      dataIndex: "productName",
      width: 300,
      render: (text, record) => (
        <div className="flex gap-3">
          <Image
            width={50}
            height={50}
            src={record.imageUrl}
            className="rounded object-cover"
            fallback="https://via.placeholder.com/50"
          />
          <div>
            <div className="font-medium line-clamp-2">{text}</div>
            <div className="text-xs text-gray-500 font-mono">
              {record.productId}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Giá bán",
      dataIndex: "price",
      width: 120,
      render: (v) => (
        <span className="font-semibold">{v?.toLocaleString("vi-VN")} ₫</span>
      ),
    },
    { title: "Kho", dataIndex: "quantity", width: 80, align: "center" },
    {
      title: "Giảm",
      dataIndex: "discount",
      width: 80,
      align: "center",
      render: (v) =>
        v > 0 ? <span className="text-red-500 font-bold">-{v}%</span> : "-",
    },
    { title: "Bảo hành", dataIndex: "warranty", responsive: ["lg"] },
    {
      title: "",
      fixed: "right",
      width: 100,
      render: (_, record) => (
        <Space>
          <Tooltip title="Sửa">
            <Button
              type="text"
              icon={<EditOutlined className="text-blue-600" />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa sản phẩm này?"
            onConfirm={() => handleDelete(record.productId)}
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
            <Title level={4} style={{ margin: 0 }}>
              Quản lý sản phẩm
            </Title>
            <div className="text-gray-500 text-sm">
              {products.length} sản phẩm hiện có
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Input
              placeholder="Tìm tên sản phẩm..."
              prefix={<SearchOutlined />}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full sm:w-64"
            />
            <Button icon={<ReloadOutlined />} onClick={fetchProducts} />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              className="bg-blue-600"
            >
              Thêm mới
            </Button>
          </div>
        </div>

        <Table
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          dataSource={filteredProducts}
          columns={columns}
          rowKey="productId"
          loading={loading}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 900 }}
        />
      </Card>

      <Modal
        title={editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        width={800}
        okText="Lưu"
        cancelText="Hủy"
        centered
      >
        <Form form={form} layout="vertical" className="pt-4">
          <Row gutter={16}>
            {/* Cột trái */}
            <Col span={24} md={16}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="productName"
                    label="Tên sản phẩm"
                    rules={[{ required: true }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="productId"
                    label="Mã SP"
                    rules={[{ required: true }]}
                  >
                    <Input disabled={!!editingProduct} className="font-mono" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="price"
                    label="Giá"
                    rules={[{ required: true }]}
                  >
                    <InputNumber
                      min={0}
                      style={{ width: "100%" }}
                      formatter={(value) =>
                        `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="quantity"
                    label="Số lượng"
                    rules={[{ required: true }]}
                  >
                    <InputNumber min={0} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="discount" label="Giảm giá (%)">
                    <InputNumber min={0} max={100} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="categoryId"
                    label="Danh mục"
                    rules={[{ required: true }]}
                  >
                    <Select
                      options={categories.map((c) => ({
                        label: c.categoryName,
                        value: c.categoryId,
                      }))}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="warranty" label="Bảo hành">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="description" label="Mô tả">
                    <Input.TextArea rows={3} />
                  </Form.Item>
                </Col>
              </Row>
            </Col>

            {/* Cột phải - Ảnh & Thuộc tính phụ */}
            <Col span={24} md={8}>
              <Form.Item label="Hình ảnh">
                <Upload
                  listType="picture-card"
                  fileList={fileList}
                  maxCount={1}
                  onRemove={() => {
                    setFileList([]);
                    setImageFile(null);
                    form.setFieldValue("imageUrl", "");
                  }}
                  beforeUpload={(file) => {
                    setImageFile(file);
                    setFileList([
                      {
                        uid: file.uid,
                        name: file.name,
                        status: "done",
                        url: URL.createObjectURL(file),
                      },
                    ]);
                    return false;
                  }}
                >
                  {fileList.length < 1 && (
                    <div className="flex flex-col items-center">
                      <UploadOutlined />
                      <div className="mt-2 text-xs">Upload</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
              <Form.Item name="color" label="Màu sắc">
                <Input />
              </Form.Item>
              <Form.Item name="size" label="Kích thước">
                <Input />
              </Form.Item>
              <Form.Item name="material" label="Chất liệu">
                <Input />
              </Form.Item>
              <Form.Item name="origin" label="Xuất xứ">
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
