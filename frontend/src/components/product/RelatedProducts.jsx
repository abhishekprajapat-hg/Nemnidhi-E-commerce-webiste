import React from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import ProductCard from "./ProductCard";

const RelatedProducts = ({ related, loadingRelated, canShowNavigation }) => {
  return (
    <section className="pd-section-card mt-12 rounded-[2rem] border border-[var(--nm-border)] bg-[var(--nm-card)] p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--nm-muted)]">Complete The Look</p>
          <h2 className="nm-display text-3xl font-semibold leading-none sm:text-4xl">You May Also Like</h2>
        </div>
        <Link
          to="/products"
          className="rounded-full border border-[var(--nm-border)] px-3 py-1.5 text-sm font-semibold text-[var(--nm-accent-strong)] transition hover:border-[var(--nm-accent)] hover:text-[var(--nm-accent)]"
        >
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
          className="related-products-swiper pb-1"
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
