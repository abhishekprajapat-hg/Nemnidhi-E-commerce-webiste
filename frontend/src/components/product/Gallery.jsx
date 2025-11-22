// src/components/product/Gallery.jsx
import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, Pagination, Thumbs } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/thumbs";

const Gallery = ({
  images,
  productTitle,
  thumbsSwiper,
  setThumbsSwiper,
  mainSwiper,
  setMainSwiper,
  setActive,
  active,
  inStock,
  isWished,
  setIsWished,
  canShowNavigation,
}) => {
  return (
    <div>
      <div className="relative rounded-2xl overflow-hidden bg-gray-100 dark:bg-zinc-800 border dark:border-zinc-700">
        <Swiper
          modules={[Navigation, Autoplay, Pagination, Thumbs]}
          thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
          onSlideChange={(swiper) => setActive(swiper.activeIndex)}
          onSwiper={setMainSwiper}
          spaceBetween={0}
          slidesPerView={1}
          navigation={canShowNavigation}
          pagination={{ clickable: true }}
          autoplay={{ delay: 5000, disableOnInteraction: true }}
          className="h-full w-full aspect-[4/5] sm:aspect-[3/4] main-gallery-swiper"
        >
          {images.map((img, i) => (
            <SwiperSlide key={i}>
              <img
                src={img}
                alt={productTitle}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/placeholder.png";
                }}
              />
            </SwiperSlide>
          ))}
        </Swiper>

        {!inStock && (
          <span className="absolute top-4 left-4 bg-red-600 text-white text-xs px-2 py-1 rounded z-10">Out of stock</span>
        )}

        <button
          onClick={() => setIsWished(!isWished)}
          className="absolute top-4 right-4 bg-white/70 p-2 rounded-full backdrop-blur-sm dark:bg-zinc-700/70 z-10"
        >
          <span className="dark:text-white">{isWished ? "♥" : "♡"}</span>
          <span className="sr-only">Add to wishlist</span>
        </button>
      </div>

      {images.length > 1 && (
        <Swiper
          onSwiper={setThumbsSwiper}
          spaceBetween={10}
          slidesPerView={4}
          watchSlidesProgress={true}
          modules={[Thumbs]}
          className="mt-4 thumbnail-swiper"
          breakpoints={{
            320: { slidesPerView: 4, spaceBetween: 8 },
            640: { slidesPerView: 5, spaceBetween: 10 },
            1024: { slidesPerView: 7, spaceBetween: 12 },
          }}
        >
          {images.map((src, i) => (
            <SwiperSlide key={i}>
              <button
                onClick={() => {
                  setActive(i);
                  if (mainSwiper && mainSwiper.slideTo) mainSwiper.slideTo(i);
                }}
                className={`aspect-square rounded-lg overflow-hidden border transition-all ${i === active ? "ring-2 ring-black dark:ring-white" : "border-gray-200 dark:border-zinc-700 opacity-70 hover:opacity-100"}`}
              >
                <img src={src} alt={`thumb-${i}`} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/placeholder.png"; }} />
              </button>
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </div>
  );
};

export default Gallery;
