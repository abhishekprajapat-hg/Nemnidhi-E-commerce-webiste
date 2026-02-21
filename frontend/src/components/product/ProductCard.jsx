import React from "react";
import { Link } from "react-router-dom";

const ProductCard = ({ p }) => {
  const thumb =
    (Array.isArray(p?.variants) && p.variants.length > 0 && p.variants[0].images?.[0]) ||
    (Array.isArray(p?.images) && p.images[0]) ||
    p?.image ||
    "/placeholder.png";

  const price =
    (Array.isArray(p?.variants) && p.variants.length > 0 && p.variants[0].sizes?.[0]?.price) ||
    Number(p?.price || 0);

  return (
    <article className="group overflow-hidden rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-surface)] transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <Link to={`/product/${p._id}`} className="block">
        <div className="aspect-[4/5] overflow-hidden bg-[var(--nm-bg-elevated)]">
          <img
            src={thumb}
            alt={p.title || "product"}
            className="h-full w-full object-cover object-[center_22%] sm:object-center transition duration-300 group-hover:scale-105"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = "/placeholder.png";
            }}
          />
        </div>
      </Link>

      <div className="p-3">
        <Link to={`/product/${p._id}`}>
          <p className="line-clamp-1 text-sm font-semibold transition group-hover:text-[var(--nm-accent)]">{p.title}</p>
        </Link>
        <p className="mt-1 text-sm text-[var(--nm-muted)]">Rs {Number(price || 0).toFixed(2)}</p>
      </div>
    </article>
  );
};

export default ProductCard;
