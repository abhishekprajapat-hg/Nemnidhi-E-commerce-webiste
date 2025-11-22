// src/components/product/RelatedProducts.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import ProductCard from "./ProductCard";

const RelatedProducts = ({ related, loadingRelated, canShowNavigation }) => {
  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold dark:text-white">You may also like</h2>
        <Link to="/products" className="text-sm text-gray-600 dark:text-gray-300 hover:underline">View all</Link>
      </div>

      {loadingRelated ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[4/5] bg-gray-200 dark:bg-zinc-700 rounded-lg" />
              <div className="h-4 bg-gray-200 dark:bg-zinc-700 mt-2 w-2/3 rounded" />
            </div>
          ))}
        </div>
      ) : related.length === 0 ? (
        <div className="text-gray-500 dark:text-gray-400">No related products.</div>
      ) : (
        <Swiper modules={[Navigation]} spaceBetween={24} slidesPerView={2} navigation={canShowNavigation} breakpoints={{ 320: { slidesPerView: 2 }, 640: { slidesPerView: 3 }, 1024: { slidesPerView: 4 } }} className="related-products-swiper">
          {related.map((p) => (
            <SwiperSlide key={p._id}>
              <ProductCard p={p} />
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </section>
  );
};

export default RelatedProducts;
