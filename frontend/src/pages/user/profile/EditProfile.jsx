import { useState, useContext, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import Cookies from "js-cookie";
import { message, Modal, Slider } from "antd";
import Cropper from "react-easy-crop";
import getCroppedImg from "./cropImage";
import { 
  Camera, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Save, 
  Loader2,
  ChevronLeft
} from "lucide-react";

export default function EditProfile() {
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const fileInputRef = useRef(null);

  const token = Cookies.get("jwt");

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [address, setAddress] = useState(user?.address || "");
  const [gender, setGender] = useState(user?.gender || "Nam");
  const [birthDate, setBirthDate] = useState(user?.birthDate || "");
  const [role] = useState(user?.role || "Member"); // Hiển thị role cho đẹp
  const [avatarPreview, setAvatarPreview] = useState(
    user?.avatar ||
      "https://res.cloudinary.com/ddnzj70uw/image/upload/v1759990027/avt-default_r2kgze.png"
  );
  
  // Loading states
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Cropper states
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isSelectAction, setIsSelectAction] = useState(false);

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleAvatarClick = () => {
    setIsSelectAction(true);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result);
      setIsCropping(true);
    };
    reader.readAsDataURL(file);
    e.target.value = null; 
  };

  const handleCropConfirm = async () => {
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      setAvatarPreview(croppedImage);
      setIsCropping(false);

      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", croppedImage);
      formData.append("upload_preset", "my_interior_shop");

      const res = await fetch("https://api.cloudinary.com/v1_1/ddnzj70uw/image/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload ảnh thất bại");

      const data = await res.json();
      setAvatarPreview(data.secure_url);
      messageApi.success("Đổi ảnh đại diện thành công!");
    } catch (err) {
      console.error(err);
      messageApi.error("Có lỗi xảy ra khi xử lý ảnh!");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      messageApi.error("Phiên đăng nhập hết hạn.");
      navigate("/login");
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch(`http://localhost:8080/api/users/${user.userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName,
          phoneNumber,
          address,
          gender,
          birthDate,
          role,
          avatar: avatarPreview,
        }),
      });

      if (!res.ok) throw new Error("Cập nhật thất bại!");
      const updatedUser = await res.json();

      login(updatedUser, token);
      messageApi.success("Cập nhật hồ sơ thành công!");
    } catch (err) {
      messageApi.error(`Lỗi: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      {contextHolder}

      {/* --- Action Modal: Chọn ảnh mới hoặc crop lại --- */}
      <Modal
        open={isSelectAction}
        onCancel={() => setIsSelectAction(false)}
        footer={null}
        title={<span className="text-lg font-semibold">Thay đổi ảnh đại diện</span>}
        centered
        width={400}
      >
        <div className="flex flex-col gap-3 pt-2">
          <button
            className="w-full bg-black text-white px-4 py-3 rounded-lg font-medium hover:bg-gray-800 transition flex items-center justify-center gap-2"
            onClick={() => {
              fileInputRef.current?.click();
              setIsSelectAction(false);
            }}
          >
            <Camera size={18} /> Tải ảnh mới lên
          </button>
          <button
            className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-200 transition"
            onClick={() => {
              setImageSrc(avatarPreview);
              setIsCropping(true);
              setIsSelectAction(false);
            }}
          >
            Cắt lại ảnh hiện tại
          </button>
        </div>
      </Modal>

      {/* --- Crop Modal --- */}
      <Modal
        open={isCropping}
        onCancel={() => setIsCropping(false)}
        onOk={handleCropConfirm}
        okText="Xác nhận"
        cancelText="Hủy"
        width={500}
        centered
        okButtonProps={{ className: "bg-black hover:bg-gray-800 border-none" }}
      >
        <div className="flex flex-col items-center">
          <h3 className="text-lg font-semibold mb-4 w-full">Căn chỉnh ảnh</h3>
          <div className="relative w-full h-80 bg-gray-900 rounded-lg overflow-hidden mb-4">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="w-full px-4">
            <label className="text-sm text-gray-500 mb-1 block">Thu phóng</label>
            <Slider
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={setZoom}
              trackStyle={{ backgroundColor: 'black' }}
              handleStyle={{ borderColor: 'black', backgroundColor: 'black' }}
            />
          </div>
        </div>
      </Modal>

      {/* --- MAIN UI --- */}
      <div className="max-w-5xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-500 hover:text-black mb-6 transition-colors"
        >
          <ChevronLeft size={20} /> Quay lại
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="md:grid md:grid-cols-12 min-h-[600px]">
            
            {/* LEFT COLUMN: Avatar & Summary */}
            <div className="md:col-span-4 bg-gray-50/50 p-8 flex flex-col items-center text-center border-b md:border-b-0 md:border-r border-gray-100">
              <div className="relative group mb-4">
                <div
                  onClick={handleAvatarClick}
                  className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-md cursor-pointer relative"
                >
                  <img
                    src={avatarPreview}
                    alt="avatar"
                    className={`w-full h-full object-cover transition-opacity ${isUploading ? 'opacity-50' : 'opacity-100'}`}
                  />
                  
                  {/* Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="text-white w-8 h-8" />
                  </div>

                  {/* Uploading Spinner */}
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="animate-spin text-black w-8 h-8" />
                    </div>
                  )}
                </div>
                
                {/* Status dot */}
                <div className="absolute bottom-3 right-3 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900">{fullName || "Người dùng"}</h2>
              <p className="text-gray-500 font-medium mb-6 uppercase tracking-wider text-xs bg-gray-200 px-3 py-1 rounded-full mt-2 inline-block">
                {role}
              </p>

              <div className="w-full text-left space-y-3 mt-4">
                <div className="flex items-center gap-3 text-gray-600 text-sm bg-white p-3 rounded-lg shadow-sm">
                  <User size={16} className="text-gray-400" />
                  <span className="truncate">{user?.email || "Chưa cập nhật email"}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600 text-sm bg-white p-3 rounded-lg shadow-sm">
                  <Phone size={16} className="text-gray-400" />
                  <span>{phoneNumber || "Chưa cập nhật SĐT"}</span>
                </div>
              </div>

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            {/* RIGHT COLUMN: Edit Form */}
            <div className="md:col-span-8 p-8 md:p-10">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Thông tin cá nhân</h1>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <User size={16} /> Họ và tên
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all bg-gray-50 focus:bg-white"
                      placeholder="Nhập họ tên của bạn"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Phone size={16} /> Số điện thoại
                    </label>
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all bg-gray-50 focus:bg-white"
                      placeholder="0912..."
                    />
                  </div>

                  {/* Birth Date */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Calendar size={16} /> Ngày sinh
                    </label>
                    <input
                      type="date"
                      value={birthDate ? birthDate.split("T")[0] : ""}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all bg-gray-50 focus:bg-white"
                    />
                  </div>

                  {/* Gender */}
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Giới tính</label>
                    <div className="flex gap-4">
                      {['Nam', 'Nữ', 'Khác'].map((g) => (
                        <label 
                          key={g} 
                          className={`
                            flex-1 cursor-pointer py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all
                            ${gender === g ? 'border-black bg-black text-white shadow-md' : 'border-gray-200 bg-white hover:bg-gray-50'}
                          `}
                        >
                          <input
                            type="radio"
                            name="gender"
                            value={g}
                            checked={gender === g}
                            onChange={() => setGender(g)}
                            className="hidden"
                          />
                          {g}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Address */}
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <MapPin size={16} /> Địa chỉ
                    </label>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all bg-gray-50 focus:bg-white resize-none"
                      placeholder="Số nhà, tên đường, phường/xã..."
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-200 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20} />}
                    {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}