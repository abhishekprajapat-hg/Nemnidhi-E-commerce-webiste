import React from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import ProductCard from "./ProductCard";

const RelatedProducts = ({ related, loadingRelated, canShowNavigation }) => {
  return (
    <section className="mt-12 rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">You may also like</h2>
        <Link to="/products" className="text-sm font-semibold text-[var(--nm-accent-strong)] transition hover:underline">
          View all
        </Link>
      </div>

      {loadingRelated ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="animate-pulse space-y-2">
              <div className="aspect-[4/5] rounded-2xl bg-[var(--nm-bg-elevated)]" />
              <div className="h-4 w-3/4 rounded bg-[var(--nm-bg-elevated)]" />
            </div>
          ))}
        </div>
      ) : related.length === 0 ? (
        <p className="text-sm text-[var(--nm-muted)]">No related products.</p>
      ) : (
        <Swiper
          modules={[Navigation]}
          spaceBetween={18}
          slidesPerView={2}
          navigation={canShowNavigation}
          breakpoints={{
            320: { slidesPerView: 2, spaceBetween: 12 },
            640: { slidesPerView: 3, spaceBetween: 14 },
            1024: { slidesPerView: 4, spaceBetween: 18 },
          }}
          className="related-products-swiper"
        >
          {related.map((product) => (
            <SwiperSlide key={product._id}>
              <ProductCard p={product} />
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </section>
  );
};

export default RelatedProducts;
