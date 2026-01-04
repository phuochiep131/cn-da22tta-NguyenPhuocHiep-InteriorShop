import { Mail, Phone, MapPin, Facebook, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-neutral-950 text-gray-400 py-12 mt-auto border-t border-neutral-900 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Chuyển thành 2 cột để cân đối vì bạn chỉ có 2 nội dung */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20">
          {/* Cột 1: Brand */}
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-white tracking-tight uppercase">
              NPH Store
            </h2>
            <p className="text-sm leading-7 text-gray-500 max-w-sm">
              Mang đến không gian sống tiện nghi, hiện đại và đẳng cấp cho ngôi
              nhà của bạn. <br />
              Chúng tôi cam kết chất lượng trên từng sản phẩm.
            </p>
          </div>

          {/* Cột 2: Contact - Căn phải trên desktop để cân đối */}
          <div className="flex flex-col md:items-end">
            <div className="text-left">
              {" "}
              {/* Giữ text căn trái cho dễ đọc */}
              <h3 className="text-white font-bold uppercase mb-5 tracking-wide text-sm border-b border-neutral-800 pb-2 inline-block">
                Thông tin liên hệ
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 group">
                  <MapPin
                    size={20}
                    className="text-blue-600 mt-0.5 group-hover:text-blue-500 transition-colors"
                  />
                  <span className="text-sm hover:text-gray-300 transition-colors">
                    Nhị Long, Vĩnh Long
                  </span>
                </li>
                <li className="flex items-center gap-3 group">
                  <Phone
                    size={20}
                    className="text-green-500 group-hover:text-green-400 transition-colors"
                  />
                  <span className="text-sm font-medium text-white group-hover:text-green-400 transition-colors cursor-pointer">
                    0779849012
                  </span>
                </li>
                <li className="flex items-center gap-3 group">
                  <Mail
                    size={20}
                    className="text-orange-500 group-hover:text-orange-400 transition-colors"
                  />
                  <span className="text-sm hover:text-orange-400 transition-colors cursor-pointer">
                    support@nphstore.vn
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-neutral-900 mt-12 pt-8 text-center">
          <p className="text-xs text-neutral-600 font-medium tracking-wide">
            © 2025 NPH STORE. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
