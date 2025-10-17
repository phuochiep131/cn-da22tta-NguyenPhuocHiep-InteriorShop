import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation, Pagination, Autoplay } from "swiper/modules"
import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/pagination"

export default function Slideshow() {
  return (
    <div className="w-full max-w-7xl mx-auto rounded-lg overflow-hidden shadow-md">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={30}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 3000 }}
      >
        <SwiperSlide>
          <img src="/images/slide1.jpg" alt="Slide 1" className="w-full h-96 object-cover" />
        </SwiperSlide>
        <SwiperSlide>
          <img src="/images/slide2.jpg" alt="Slide 2" className="w-full h-96 object-cover" />
        </SwiperSlide>
        <SwiperSlide>
          <img src="/images/slide3.jpg" alt="Slide 3" className="w-full h-96 object-cover" />
        </SwiperSlide>
      </Swiper>
    </div>
  )
}
