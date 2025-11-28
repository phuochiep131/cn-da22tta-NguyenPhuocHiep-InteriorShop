import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";

// Import CSS
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

export default function Slideshow() {
  const slides = [
    { id: 1, image: "/images/slide1.jpg", alt: "Slide 1" },
    { id: 2, image: "/images/slide2.jpg", alt: "Slide 2" },
    { id: 3, image: "/images/slide3.jpg", alt: "Slide 3" },
  ];

  return (
    // Container chính: Thêm padding ngang trên mobile (px-4) để không bị dính sát lề
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-100 relative group">
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={0} // Bỏ khoảng cách để ảnh nối liền mạch
          slidesPerView={1}
          navigation={true}
          pagination={{ clickable: true, dynamicBullets: true }} // dynamicBullets giúp gọn gàng nếu nhiều slide
          loop={true} // Vòng lặp vô tận
          autoplay={{
            delay: 4000,
            disableOnInteraction: false, // Tiếp tục auto sau khi người dùng chạm vào
          }}
          className="w-full h-full 
            /* Tùy chỉnh màu sắc nút điều hướng và chấm tròn */
            [&_.swiper-button-next]:text-white [&_.swiper-button-next]:opacity-70 hover:[&_.swiper-button-next]:opacity-100
            [&_.swiper-button-prev]:text-white [&_.swiper-button-prev]:opacity-70 hover:[&_.swiper-button-prev]:opacity-100
            [&_.swiper-button-next]:scale-75 sm:[&_.swiper-button-next]:scale-100 /* Nhỏ lại trên mobile */
            [&_.swiper-button-prev]:scale-75 sm:[&_.swiper-button-prev]:scale-100
            [&_.swiper-pagination-bullet]:bg-white [&_.swiper-pagination-bullet-active]:bg-blue-500
          "
        >
          {slides.map((slide) => (
            <SwiperSlide key={slide.id}>
              {/* Responsive Height:
                  - h-64 (256px) trên Mobile
                  - h-80 (320px) trên Tablet
                  - h-96 (384px) trên Desktop (Giữ nguyên kích thước gốc bạn muốn)
                  - lg:h-[450px] trên màn hình lớn hẳn (Tùy chọn)
              */}
              <div className="relative w-full h-64 sm:h-80 md:h-96 lg:h-[450px]">
                <img
                  src={slide.image}
                  alt={slide.alt}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  loading="lazy"
                />

                {/* Lớp phủ mờ nhẹ (Optional): Giúp text (nếu có) hoặc mũi tên dễ nhìn hơn */}
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300"></div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}
