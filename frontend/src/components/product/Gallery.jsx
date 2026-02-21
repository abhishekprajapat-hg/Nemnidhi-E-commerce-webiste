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
  onToggleWish,
  wishLoading = false,
  canShowNavigation,
}) => {
  const safeImages = Array.isArray(images) && images.length > 0 ? images : ["/placeholder.png"];
  const slideLabel = `${String(active + 1).padStart(2, "0")} / ${String(safeImages.length).padStart(2, "0")}`;

  return (
    <div className="pd-gallery space-y-4">
      <div className="pd-gallery-main relative overflow-hidden rounded-[2rem] border border-[var(--nm-border)] bg-[var(--nm-bg-elevated)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-20 bg-gradient-to-b from-black/15 via-black/5 to-transparent" />

        <span className="absolute left-4 top-4 z-20 rounded-full border border-white/25 bg-black/35 px-3 py-1 text-[11px] font-semibold tracking-[0.1em] text-white backdrop-blur-md">
          {slideLabel}
        </span>

        <Swiper
          modules={[Navigation, Autoplay, Pagination, Thumbs]}
          thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
          onSlideChange={(swiper) => setActive(swiper.activeIndex)}
          onSwiper={setMainSwiper}
          slidesPerView={1}
          navigation={canShowNavigation}
          pagination={{ clickable: true }}
          autoplay={safeImages.length > 1 ? { delay: 4200, disableOnInteraction: true } : false}
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
          <span className="absolute bottom-4 left-4 z-20 rounded-full bg-red-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-red-700">
            Sold Out
          </span>
        ) : null}

        <button
          type="button"
          onClick={onToggleWish}
          disabled={wishLoading}
          className="absolute right-4 top-4 z-20 rounded-full border border-[var(--nm-border)] bg-[color-mix(in_srgb,var(--nm-card)_78%,transparent)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--nm-text)] backdrop-blur-sm transition hover:border-[var(--nm-accent)] hover:text-[var(--nm-accent)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {wishLoading ? "Saving..." : isWished ? "Saved" : "Save"}
          <span className="sr-only">Add to wishlist</span>
        </button>
      </div>

      {safeImages.length > 1 ? (
        <Swiper
          onSwiper={setThumbsSwiper}
          modules={[Thumbs]}
          watchSlidesProgress
          className="thumbnail-swiper !overflow-visible"
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
                className={`overflow-hidden rounded-2xl border bg-[var(--nm-card)] transition ${
                  index === active
                    ? "border-[var(--nm-accent)] shadow-[0_10px_30px_-18px_var(--nm-accent)] ring-2 ring-[var(--nm-accent-soft)]"
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
