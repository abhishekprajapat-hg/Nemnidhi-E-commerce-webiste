import React from "react";
import { Link } from "react-router-dom";

export default function ProductCard({ p }) {
  const productId = p?._id || p?.slug;
  const image = p?.images?.[0] || "/placeholder.png";
  const title = p?.title || "Product";
  const price = Number(p?.price || 0);

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
      <Link to={`/product/${productId}`}>
        <img
          src={image}
          alt={title}
          className="h-auto w-full rounded-md bg-gray-100 object-cover object-[center_22%] aspect-[3/4] sm:aspect-auto sm:h-64 sm:object-center dark:bg-zinc-700"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = "/placeholder.png";
          }}
        />
      </Link>

      <h3 className="mt-3 font-semibold dark:text-white">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400">Rs {price.toFixed(2)}</p>

      <Link
        className="mt-2 inline-block text-sm text-blue-600 hover:underline dark:text-indigo-400"
        to={`/product/${productId}`}
      >
        View Details
      </Link>
    </article>
  );
}
