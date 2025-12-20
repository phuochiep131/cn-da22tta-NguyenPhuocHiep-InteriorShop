import { useState } from "react";
import { message, Input, Button, Form } from "antd";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  Facebook,
  Instagram,
  Twitter,
} from "lucide-react";

const { TextArea } = Input;

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();

  // Xử lý gửi form (Giả lập)
  const onFinish = (values) => {
    setLoading(true);
    console.log("Form values:", values);

    // Giả lập gọi API delay 1.5s
    setTimeout(() => {
      setLoading(false);
      messageApi.success("Cảm ơn bạn! Chúng tôi đã nhận được tin nhắn.");
      form.resetFields();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {contextHolder}

      {/* --- HEADER BANNER --- */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            Liên Hệ Với Chúng Tôi
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            Chúng tôi luôn sẵn sàng lắng nghe ý kiến đóng góp và giải đáp mọi
            thắc mắc của bạn. Hãy kết nối ngay!
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* --- LEFT COLUMN: CONTACT INFO --- */}
          <div className="space-y-8">
            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">Địa chỉ</h3>
                <p className="text-gray-600">
                  123 Đường Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4">
                  <Phone className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">Hotline</h3>
                <p className="text-gray-600 text-lg font-medium">1900 123 456</p>
                <p className="text-gray-500 text-sm">(08:00 - 22:00 hàng ngày)</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">Email</h3>
                <p className="text-gray-600">support@shopper.com</p>
                <p className="text-gray-600">contact@shopper.com</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">
                  Giờ làm việc
                </h3>
                <p className="text-gray-600">Thứ 2 - Thứ 6: 8:00 - 21:00</p>
                <p className="text-gray-600">Cuối tuần: 9:00 - 22:00</p>
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-gray-900 text-white p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold mb-1">Kết nối mạng xã hội</h3>
                <p className="text-gray-400 text-sm">
                  Theo dõi chúng tôi để nhận ưu đãi mới nhất
                </p>
              </div>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-blue-600 transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-pink-600 transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-sky-500 transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN: CONTACT FORM --- */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Gửi tin nhắn cho chúng tôi
            </h2>
            
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              size="large"
              requiredMark={false}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item
                  name="fullName"
                  label={<span className="font-medium text-gray-700">Họ và tên</span>}
                  rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
                >
                  <Input placeholder="Nhập họ tên của bạn" />
                </Form.Item>

                <Form.Item
                  name="phone"
                  label={<span className="font-medium text-gray-700">Số điện thoại</span>}
                  rules={[
                    { required: true, message: "Vui lòng nhập SĐT" },
                    { pattern: /^[0-9]{10,11}$/, message: "SĐT không hợp lệ" },
                  ]}
                >
                  <Input placeholder="Nhập số điện thoại" />
                </Form.Item>
              </div>

              <Form.Item
                name="email"
                label={<span className="font-medium text-gray-700">Email</span>}
                rules={[
                  { required: true, message: "Vui lòng nhập email" },
                  { type: "email", message: "Email không hợp lệ" },
                ]}
              >
                <Input placeholder="Nhập địa chỉ email" />
              </Form.Item>

              <Form.Item
                name="message"
                label={<span className="font-medium text-gray-700">Nội dung tin nhắn</span>}
                rules={[{ required: true, message: "Vui lòng nhập nội dung" }]}
              >
                <TextArea
                  rows={5}
                  placeholder="Bạn cần hỗ trợ vấn đề gì?"
                  className="resize-none"
                />
              </Form.Item>

              <Form.Item className="mb-0">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  className="w-full h-12 bg-black hover:!bg-gray-800 text-lg font-medium flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> Gửi tin nhắn
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>

        {/* --- GOOGLE MAPS SECTION --- */}
        <div className="mt-16 rounded-2xl overflow-hidden shadow-sm border border-gray-200 h-[400px]">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.954067902467!2d106.6997639147183!3d10.7380196628373!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f9b87b7a701%3A0x6b83ce527d2c382f!2sRMIT%20University%20Vietnam!5e0!3m2!1sen!2s!4v1646732345678!5m2!1sen!2s"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Google Maps"
          ></iframe>
        </div>
      </div>
    </div>
  );
}