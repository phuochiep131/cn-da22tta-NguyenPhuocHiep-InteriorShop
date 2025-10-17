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
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { AuthContext } from "../../context/AuthContext";
import Cookies from "js-cookie";

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

  // ------------------ Fetch ------------------
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
      messageApi.error("Không thể tải danh mục sản phẩm");
    }
  };

  // ------------------ Upload Cloudinary ------------------
  const uploadToCloudinary = async (file) => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "my_interior_shop");
    data.append("folder", "image/products");

    const res = await fetch("https://api.cloudinary.com/v1_1/ddnzj70uw/image/upload", {
      method: "POST",
      body: data,
    });
    const uploaded = await res.json();
    if (!uploaded.secure_url) throw new Error("Upload failed");
    return uploaded.secure_url;
  };

  // ------------------ Handlers ------------------
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
        {
          uid: "-1",
          name: "image.png",
          status: "done",
          url: record.imageUrl,
        },
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
        messageApi.open({ type: "loading", content: "Đang tải ảnh lên Cloudinary..." });
        imageUrl = await uploadToCloudinary(imageFile);
        messageApi.destroy();
        messageApi.success("Tải ảnh thành công!");
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

      messageApi.success(editingProduct ? "Cập nhật thành công" : "Thêm sản phẩm thành công");
      setIsModalOpen(false);
      fetchProducts();
    } catch (e) {
      messageApi.error("Lưu thất bại, vui lòng kiểm tra lại");
      console.error(e);
    }
  };

  const handleSearch = (val) => setSearchText(val.toLowerCase());
  const filteredProducts = products.filter(
    (p) =>
      p.productName?.toLowerCase().includes(searchText) ||
      p.description?.toLowerCase().includes(searchText)
  );
  const rowSelection = { selectedRowKeys, onChange: setSelectedRowKeys };

  const columns = [
    {
      title: "Ảnh",
      dataIndex: "imageUrl",
      render: (url) =>
        url ? (
          <img
            src={url}
            alt="product"
            style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6 }}
          />
        ) : (
          "Không có ảnh"
        ),
    },
    { title: "Mã sản phẩm", dataIndex: "productId" },
    { title: "Tên sản phẩm", dataIndex: "productName" },
    {
      title: "Giá",
      dataIndex: "price",
      render: (v) => v?.toLocaleString("vi-VN") + " ₫",
    },
    { title: "Số lượng", dataIndex: "quantity" },
    { title: "Giảm giá (%)", dataIndex: "discount" },
    { title: "Màu sắc", dataIndex: "color" },
    {
      title: "Thao tác",
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa sản phẩm này?"
            onConfirm={() => handleDelete(record.productId)}
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
      <h2 className="text-2xl font-semibold mb-6">Quản lý sản phẩm</h2>

      <Space className="mb-4 flex-wrap" wrap>
        <Input
          placeholder="Tìm kiếm theo tên hoặc mô tả"
          prefix={<SearchOutlined />}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-64"
        />
        <Button icon={<PlusOutlined />} type="primary" onClick={handleAdd} className="bg-blue-600">
          Thêm sản phẩm
        </Button>
        <Button danger disabled={!selectedRowKeys.length}>
          Xóa nhiều
        </Button>
        <Button onClick={fetchProducts}>Làm mới</Button>
      </Space>

      <Table
        rowSelection={rowSelection}
        dataSource={filteredProducts}
        columns={columns}
        rowKey="productId"
        loading={loading}
        pagination={{ pageSize: 8 }}
        scroll={{ x: "max-content" }}
        className="bg-white shadow rounded-lg"
      />

      <Modal
        title={editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
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
              <Form.Item name="productId" label="Mã sản phẩm" rules={[{ required: true }]}>
                <Input disabled={!!editingProduct} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item name="productName" label="Tên sản phẩm" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item name="price" label="Giá" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item name="quantity" label="Số lượng" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item name="discount" label="Giảm giá (%)">
                <InputNumber min={0} max={100} style={{ width: "100%" }} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="categoryId"
                label="Danh mục sản phẩm"
                rules={[{ required: true }]}
              >
                <Select
                  placeholder="Chọn danh mục"
                  options={categories.map((c) => ({
                    label: c.categoryName,
                    value: c.categoryId,
                  }))}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item name="color" label="Màu sắc">
                <Input />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item name="size" label="Kích thước">
                <Input />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item name="material" label="Chất liệu">
                <Input />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item name="origin" label="Xuất xứ">
                <Input />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item name="description" label="Mô tả">
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item label="Ảnh sản phẩm">
                <Upload
                  listType="picture-card"
                  fileList={fileList}
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
                    <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
                  )}
                </Upload>
                <p className="text-gray-500 text-sm mt-1">
                  Ảnh sẽ được tải lên Cloudinary trong thư mục <b>image/products</b>
                </p>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
