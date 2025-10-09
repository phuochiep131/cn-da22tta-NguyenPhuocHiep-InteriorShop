import { useState, useContext, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import Cookies from "js-cookie";
import { message, Modal, Slider, Dropdown } from "antd";
import Cropper from "react-easy-crop";
import getCroppedImg from "./cropImage"; // helper cắt ảnh

export default function EditProfile() {
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const fileInputRef = useRef(null);

  const token = Cookies.get("jwt");

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [address, setAddress] = useState(user?.address || "");
  const [gender, setGender] = useState(user?.gender || "");
  const [birthDate, setBirthDate] = useState(user?.birthDate || "");
  const [role] = useState(user?.role || "");
  const [avatarPreview, setAvatarPreview] = useState(
    user?.avatar ||
      "https://res.cloudinary.com/ddnzj70uw/image/upload/v1759990027/avt-default_r2kgze.png"
  );
  const [isUploading, setIsUploading] = useState(false);

  // cropper states
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
  };

  const handleCropConfirm = async () => {
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      setAvatarPreview(croppedImage);
      setIsCropping(false);

      // Upload lên Cloudinary
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", croppedImage);
      formData.append("upload_preset", "my_interior_shop");

      const res = await fetch("https://api.cloudinary.com/v1_1/ddnzj70uw/image/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setAvatarPreview(data.secure_url);
      messageApi.success("Cập nhật ảnh thành công!");
    } catch (err) {
      console.error(err);
      messageApi.error("Cắt ảnh thất bại!");
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
      messageApi.success("Cập nhật thông tin thành công!");
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      messageApi.error(`Lỗi: ${err.message}`);
    }
  };

  return (
    <>
      {contextHolder}

      {/* Modal chọn hành động thay đổi ảnh */}
        <Modal
          open={isSelectAction}
          onCancel={() => setIsSelectAction(false)}
          footer={null}
          title="Thay đổi ảnh đại diện"
        >
          <div className="flex flex-col gap-3">
            <button
              className="bg-black text-white px-3 py-2 rounded hover:bg-gray-800 transition"
              onClick={() => {
                fileInputRef.current?.click();
                setIsSelectAction(false);
              }}
            >
              Chọn ảnh mới
            </button>
            <button
              className="bg-gray-200 px-3 py-2 rounded hover:bg-gray-300 transition"
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


      {/* Modal crop ảnh */}
      <Modal
        open={isCropping}
        onCancel={() => setIsCropping(false)}
        onOk={handleCropConfirm}
        okText="Xác nhận"
        cancelText="Hủy"
        width={400}
      >
        <div className="relative w-full h-64 bg-black">
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
        <div className="mt-3">
          <Slider
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={setZoom}
          />
        </div>
      </Modal>

      <div className="max-w-2xl mx-auto mt-10 bg-white shadow p-6 rounded-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Chỉnh sửa thông tin cá nhân</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-6">
            <div
              onClick={handleAvatarClick}
              className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center cursor-pointer border hover:opacity-90 transition"
            >
              <img
                src={avatarPreview}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={handleAvatarChange}
            />
            {isUploading && <p className="text-sm text-gray-500 mt-2">Đang tải ảnh...</p>}
            <p className="text-sm text-gray-500 mt-2">
              Nhấn vào ảnh để thay đổi hoặc cắt lại
            </p>
          </div>
          


          {/* Họ và tên */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-black focus:outline-none"
            />
          </div>

          {/* Số điện thoại */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Nhập số điện thoại..."
              className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-black focus:outline-none"
            />
          </div>

          {/* Địa chỉ */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Địa chỉ</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Nhập địa chỉ..."
              className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-black focus:outline-none"
            />
          </div>

          {/* Giới tính */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="gender"
                  value="Nam"
                  checked={gender === "Nam"}
                  onChange={() => setGender("Nam")}
                />
                <span>Nam</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="gender"
                  value="Nữ"
                  checked={gender === "Nữ"}
                  onChange={() => setGender("Nữ")}
                />
                <span>Nữ</span>
              </label>
            </div>
          </div>

          {/* Ngày sinh */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
            <input
              type="date"
              value={birthDate ? birthDate.split("T")[0] : ""}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-black focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition"
          >
            Lưu thay đổi
          </button>
        </form>
      </div>
    </>
  );
}
