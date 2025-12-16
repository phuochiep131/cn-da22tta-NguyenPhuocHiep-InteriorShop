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
  Row,
  Col,
  Card,
  Typography,
  Tag,
  Tooltip,
  Drawer,
  Avatar,
  Progress,
  Badge
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  PlusOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  ShoppingOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  StopOutlined,
  PauseCircleOutlined
} from "@ant-design/icons";
import { AuthContext } from "../../context/AuthContext"; 
import Cookies from "js-cookie";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function FlashSaleManager() {
  // --- STATE ---
  const [flashSales, setFlashSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  
  // --- DRAWER STATE ---
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentSaleItems, setCurrentSaleItems] = useState([]);
  const [currentSaleId, setCurrentSaleId] = useState(null);
  const [products, setProducts] = useState([]); 
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);

  // --- HOOKS ---
  const [formSale] = Form.useForm();
  const [formItem] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const token = Cookies.get("jwt");
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (!user || !token) return;
    if (user.role !== "ADMIN") {
      messageApi.error("Bạn không có quyền truy cập trang này!");
      return;
    }
    fetchFlashSales();
    fetchAllProducts();
  }, [user, token]);

  // ================= API CALLS =================

  const fetchFlashSales = async () => {
    setLoading(true);
    try {
      // Gọi API lấy tất cả danh sách cho Admin
      const res = await fetch("http://localhost:8080/api/flash-sales/all-admin", { 
         headers: { Authorization: `Bearer ${token}` },
      });
      
      if(res.ok) {
        const data = await res.json();
        setFlashSales(data);
      } else {
         // Fallback nếu chưa có API all-admin thì gọi current
         const resCurrent = await fetch("http://localhost:8080/api/flash-sales/current", {
            headers: { Authorization: `Bearer ${token}` }
         });
         if (resCurrent.ok) {
             const data = await resCurrent.json();
             setFlashSales(Array.isArray(data) ? data : [data]); 
         }
      }
    } catch {
      messageApi.error("Không thể tải danh sách Flash Sale");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/products");
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("Lỗi tải sản phẩm:", err);
    }
  };

  const fetchSaleItems = async (saleId) => {
    try {
      const res = await fetch(`http://localhost:8080/api/flash-sales/${saleId}`, {
         headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setCurrentSaleItems(data.items || []);
    } catch {
      messageApi.error("Lỗi tải chi tiết đợt sale");
    }
  };

  // ================= HANDLERS: PARENT SALE =================

  const handleAddSale = () => {
    setEditingSale(null);
    formSale.resetFields();
    formSale.setFieldsValue({
        dateRange: [dayjs(), dayjs().add(1, 'day')]
    });
    setIsModalOpen(true);
  };

  const handleEditSale = (record) => {
    setEditingSale(record);
    formSale.setFieldsValue({
      name: record.name,
      description: record.description,
      dateRange: [dayjs(record.startDate), dayjs(record.endDate)],
    });
    setIsModalOpen(true);
  };

  // --- [FIXED] HÀM LƯU FLASH SALE (TẠO/SỬA) ---
  const handleSaveSale = async () => {
    try {
      const values = await formSale.validateFields();
      
      const payload = {
        name: values.name,
        description: values.description,
        startDate: values.dateRange[0].toISOString(),
        endDate: values.dateRange[1].toISOString(),
        status: editingSale ? editingSale.status : "Inactive"
      };

      const url = editingSale 
        ? `http://localhost:8080/api/flash-sales/${editingSale.flashSaleId}` 
        : "http://localhost:8080/api/flash-sales";
        
      const method = editingSale ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Lỗi khi lưu");

      messageApi.success(editingSale ? "Cập nhật thành công" : "Tạo mới thành công");
      setIsModalOpen(false);
      fetchFlashSales(); // Load lại bảng

    } catch {
      messageApi.error("Thao tác thất bại. Vui lòng thử lại.");
    }
  };

  // --- [NEW] HÀM CẬP NHẬT TRẠNG THÁI ---
  const handleUpdateStatus = async (id, newStatus) => {
      try {
          const res = await fetch(`http://localhost:8080/api/flash-sales/${id}/status`, {
              method: "PUT",
              headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ status: newStatus }),
          });

          if (!res.ok) throw new Error("Failed");
          
          messageApi.success(`Đã chuyển trạng thái sang ${newStatus}`);
          fetchFlashSales(); // Load lại để thấy thay đổi
      } catch {
          messageApi.error("Không thể cập nhật trạng thái");
      }
  };

  const handleDeleteSale = async (id) => {
    try {
      await fetch(`http://localhost:8080/api/flash-sales/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      messageApi.success("Đã xóa chương trình");
      fetchFlashSales();
    } catch {
      messageApi.error("Xóa thất bại");
    }
  };

  // ================= HANDLERS: CHILD ITEMS =================

  const openItemDrawer = (record) => {
    setCurrentSaleId(record.flashSaleId);
    fetchSaleItems(record.flashSaleId);
    setIsDrawerOpen(true);
  };

  const handleAddItem = async () => {
    try {
      const values = await formItem.validateFields();
      const payload = {
         productId: values.productId,
         flashSalePrice: values.flashSalePrice,
         quantity: values.quantity
      };

      const res = await fetch(`http://localhost:8080/api/flash-sales/${currentSaleId}/items`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      if(!res.ok) throw new Error("Failed");

      messageApi.success("Đã thêm sản phẩm");
      setIsAddItemModalOpen(false);
      formItem.resetFields();
      fetchSaleItems(currentSaleId);
      fetchFlashSales(); // Load lại bảng cha để cập nhật số lượng SP
    } catch {
      messageApi.error("Thêm sản phẩm thất bại");
    }
  };

  // ================= COLUMNS =================

  const saleColumns = [
    {
      title: "Tên chương trình",
      dataIndex: "name",
      render: (text) => <span className="font-semibold text-indigo-700">{text}</span>
    },
    {
      title: "Thời gian",
      width: 260,
      render: (_, record) => (
        <div className="flex flex-col text-xs text-gray-600">
           <div className="flex items-center gap-1 mb-1">
             <ClockCircleOutlined className="text-green-600"/> 
             <span>{dayjs(record.startDate).format("DD/MM/YYYY HH:mm")}</span>
           </div>
           <div className="flex items-center gap-1">
             <ClockCircleOutlined className="text-red-500"/>
             <span>{dayjs(record.endDate).format("DD/MM/YYYY HH:mm")}</span>
           </div>
        </div>
      )
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 160,
      render: (status, record) => (
         <Select
            value={status}
            style={{ width: '100%' }}
            onChange={(val) => handleUpdateStatus(record.flashSaleId, val)}
            options={[
                { value: 'Active', label: <span className="text-green-600"><CheckCircleOutlined/> Đang diễn ra </span> },
                { value: 'Inactive', label: <span className="text-orange-500"><PauseCircleOutlined/> Sắp bắt đầu </span> },
                { value: 'Finished', label: <span className="text-red-500"><StopOutlined/> Đã kết thúc</span> },
            ]}
         />
      )
    },
    {
        title: "Sản phẩm",
        render: (_, record) => (
            <Tag color="geekblue">{record.items ? record.items.length : 0} SP</Tag>
        )
    },
    {
      title: "",
      width: 140,
      render: (_, record) => (
        <Space>
           <Tooltip title="Quản lý sản phẩm">
            <Button type="primary" ghost icon={<ShoppingOutlined />} onClick={() => openItemDrawer(record)} />
          </Tooltip>
          <Tooltip title="Sửa thông tin">
            <Button type="text" icon={<EditOutlined className="text-blue-600" />} onClick={() => handleEditSale(record)} />
          </Tooltip>
          <Popconfirm title="Xóa chương trình?" onConfirm={() => handleDeleteSale(record.flashSaleId)} okButtonProps={{danger: true}}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const itemColumns = [
      {
          title: "Sản phẩm",
          dataIndex: "productName",
          render: (text, record) => (
              <div className="flex items-center gap-3">
                  <Avatar shape="square" size="large" src={record.productImageUrl} />
                  <div>
                      <div className="font-medium line-clamp-1">{text}</div>
                      <div className="text-xs text-gray-400">ID: {record.productId}</div>
                  </div>
              </div>
          )
      },
      {
          title: "Giá Sale",
          dataIndex: "flashSalePrice",
          render: (price) => <Text strong className="text-red-600">{price?.toLocaleString()}đ</Text>
      },
      {
          title: "Tiến độ",
          width: 180,
          render: (_, record) => (
              <div className="flex flex-col">
                  <Progress percent={Math.round((record.soldCount / record.quantity) * 100)} size="small" status="active" />
                  <span className="text-xs text-gray-500 text-center">{record.soldCount} / {record.quantity} đã bán</span>
              </div>
          )
      }
  ];

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
      {contextHolder}

      <Card bordered={false} className="shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <Title level={4} style={{ margin: 0 }} className="flex items-center gap-2">
               <ThunderboltOutlined className="text-yellow-500"/> Quản lý Flash Sale
            </Title>
            <Text type="secondary">Cài đặt khung giờ và sản phẩm giảm giá sốc</Text>
          </div>
          <div className="flex gap-3">
             <Button icon={<ReloadOutlined />} onClick={fetchFlashSales}>Làm mới</Button>
             <Button type="primary" icon={<PlusOutlined />} onClick={handleAddSale} className="bg-indigo-600">
               Tạo chương trình
             </Button>
          </div>
        </div>

        <Table
          dataSource={flashSales}
          columns={saleColumns}
          rowKey="flashSaleId"
          loading={loading}
          pagination={{ pageSize: 5 }}
        />
      </Card>

      {/* MODAL: CREATE/EDIT */}
      <Modal
        title={editingSale ? "Cập nhật chương trình" : "Tạo Flash Sale mới"}
        open={isModalOpen}
        onOk={handleSaveSale}
        onCancel={() => setIsModalOpen(false)}
        okText="Lưu lại"
        cancelText="Hủy"
      >
        <Form form={formSale} layout="vertical" className="pt-4">
            <Form.Item name="name" label="Tên chương trình" rules={[{required: true}]}>
                <Input placeholder="VD: Săn sale 12h trưa" />
            </Form.Item>
            <Form.Item name="description" label="Mô tả">
                <Input.TextArea rows={2}/>
            </Form.Item>
            <Form.Item name="dateRange" label="Thời gian" rules={[{required: true}]}>
                <RangePicker showTime format="YYYY-MM-DD HH:mm" className="w-full" />
            </Form.Item>
        </Form>
      </Modal>

      {/* DRAWER: ITEMS */}
      <Drawer
        title={`Sản phẩm trong: ${flashSales.find(f => f.flashSaleId === currentSaleId)?.name || ''}`}
        width={720}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddItemModalOpen(true)}>
                Thêm sản phẩm
            </Button>
        }
      >
          <Table dataSource={currentSaleItems} columns={itemColumns} rowKey="flashSaleItemId" pagination={false} />
      </Drawer>

      {/* MODAL: ADD ITEM */}
      <Modal
         title="Thêm sản phẩm vào Flash Sale"
         open={isAddItemModalOpen}
         onOk={handleAddItem}
         onCancel={() => setIsAddItemModalOpen(false)}
         okText="Thêm ngay"
      >
          <Form form={formItem} layout="vertical" className="pt-4">
              <Form.Item name="productId" label="Chọn sản phẩm" rules={[{required: true}]}>
                  <Select 
                    showSearch 
                    placeholder="Tìm kiếm..."
                    optionFilterProp="children"
                    filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                    options={products.map(p => ({ value: p.productId, label: `${p.productName} - ${p.price.toLocaleString()}đ` }))}
                  />
              </Form.Item>
              <Row gutter={16}>
                  <Col span={12}>
                      <Form.Item name="flashSalePrice" label="Giá Sale" rules={[{required: true}]}>
                          <InputNumber className="w-full" formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={v => v.replace(/\$\s?|(,*)/g, '')} addonAfter="đ"/>
                      </Form.Item>
                  </Col>
                  <Col span={12}>
                      <Form.Item name="quantity" label="Số lượng" rules={[{required: true}]}>
                          <InputNumber className="w-full" min={1} />
                      </Form.Item>
                  </Col>
              </Row>
          </Form>
      </Modal>
    </div>
  );
}