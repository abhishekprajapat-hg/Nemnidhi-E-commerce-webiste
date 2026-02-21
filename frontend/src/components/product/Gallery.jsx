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
  const safeImages = Array.isArray(images) && images.length > 0 ? images : ["/placeholder.png"];

  return (
    <div>
      <div className="relative overflow-hidden rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-bg-elevated)]">
        <Swiper
          modules={[Navigation, Autoplay, Pagination, Thumbs]}
          thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
          onSlideChange={(swiper) => setActive(swiper.activeIndex)}
          onSwiper={setMainSwiper}
          slidesPerView={1}
          navigation={canShowNavigation}
          pagination={{ clickable: true }}
          autoplay={{ delay: 4500, disableOnInteraction: true }}
          className="aspect-[4/5] w-full"
        >
          {safeImages.map((image, index) => (
            <SwiperSlide key={index}>
              <img
                src={image}
                alt={productTitle}
                className="h-full w-full object-cover"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = "/placeholder.png";
                }}
              />
            </SwiperSlide>
          ))}
        </Swiper>

        {!inStock ? (
          <span className="absolute left-4 top-4 z-10 rounded-full bg-red-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-red-700">
            Out of stock
          </span>
        ) : null}

        <button
          type="button"
          onClick={() => setIsWished(!isWished)}
          className="absolute right-4 top-4 z-10 rounded-full border border-[var(--nm-border)] bg-[var(--nm-card)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] transition hover:border-[var(--nm-accent)] hover:text-[var(--nm-accent)]"
        >
          {isWished ? "Saved" : "Save"}
          <span className="sr-only">Add to wishlist</span>
        </button>
      </div>

      {safeImages.length > 1 ? (
        <Swiper
          onSwiper={setThumbsSwiper}
          modules={[Thumbs]}
          watchSlidesProgress
          className="thumbnail-swiper mt-4"
          breakpoints={{
            320: { slidesPerView: 4, spaceBetween: 8 },
            640: { slidesPerView: 5, spaceBetween: 10 },
            1024: { slidesPerView: 7, spaceBetween: 12 },
          }}
        >
          {safeImages.map((src, index) => (
            <SwiperSlide key={index}>
              <button
                type="button"
                onClick={() => {
                  setActive(index);
                  if (mainSwiper?.slideTo) mainSwiper.slideTo(index);
                }}
                className={`overflow-hidden rounded-2xl border transition ${
                  index === active
                    ? "border-[var(--nm-accent)] ring-2 ring-[var(--nm-accent-soft)]"
                    : "border-[var(--nm-border)] opacity-80 hover:opacity-100"
                }`}
              >
                <img
                  src={src}
                  alt={`thumb-${index}`}
                  className="aspect-square w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = "/placeholder.png";
                  }}
                />
              </button>
            </SwiperSlide>
          ))}
        </Swiper>
      ) : null}
    </div>
  );
};

export default Gallery;
