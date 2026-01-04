import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

export default function Slideshow() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8080/api/slideshows/public")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Lỗi khi tải slideshow");
        }
        return res.json();
      })
      .then((data) => {
        setSlides(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch slides:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="h-48 flex items-center justify-center text-gray-400">Đang tải...</div>;
  if (slides.length === 0) return null;

  return (
    // 1. CHỈNH CHIỀU NGANG: Đổi max-w-7xl thành max-w-6xl (nhỏ hơn chút) hoặc max-w-5xl (nhỏ hẳn)
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-100 relative group">
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={0}
          slidesPerView={1}
          navigation={true}
          pagination={{ clickable: true, dynamicBullets: true }}
          loop={slides.length > 1}
          autoplay={{
            delay: 4000,
            disableOnInteraction: false,
          }}
          className="w-full h-full 
            [&_.swiper-button-next]:text-white [&_.swiper-button-next]:opacity-70 hover:[&_.swiper-button-next]:opacity-100
            [&_.swiper-button-prev]:text-white [&_.swiper-button-prev]:opacity-70 hover:[&_.swiper-button-prev]:opacity-100
            [&_.swiper-button-next]:scale-75 sm:[&_.swiper-button-next]:scale-90
            [&_.swiper-button-prev]:scale-75 sm:[&_.swiper-button-prev]:scale-90
            [&_.swiper-pagination-bullet]:bg-white [&_.swiper-pagination-bullet-active]:bg-blue-500
          "
        >
          {slides.map((slide) => (
            <SwiperSlide key={slide.id}>
            
              <div className="relative w-full h-48 sm:h-64 md:h-80 lg:h-[380px]">
                
                <a 
                  href={slide.targetUrl || "#"} 
                  className={slide.targetUrl ? "cursor-pointer" : "cursor-default"}
                >
                    <img
                    src={slide.imageUrl} 
                    alt={slide.title || "Slideshow image"} 
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    loading="lazy"
                    onError={(e) => { e.target.src = "https://placehold.co/1000x500?text=No+Image"; }}
                    />
                </a>

                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300 pointer-events-none"></div>

                {(slide.title || slide.description) && (
                  // Chỉnh lại vị trí text cho phù hợp với độ cao mới
                  <div className="absolute bottom-6 left-6 md:bottom-12 md:left-12 text-white z-10 pointer-events-none">
                    <h3 className="text-xl md:text-3xl font-bold drop-shadow-md">{slide.title}</h3>
                    <p className="text-xs md:text-base mt-1 drop-shadow-md opacity-90">{slide.description}</p>
                  </div>
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}