// src/Pages/OrderSuccess.jsx
import React from "react";
import { Link, useParams } from "react-router-dom";

export default function OrderSuccess() {
  const { id } = useParams();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-9 h-9 text-green-600">
            <path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/>
          </svg>
        </div>
        <h1 className="mt-5 text-2xl font-bold">Your order was placed successfully</h1>
        <p className="mt-2 text-gray-600">
          Thank you for shopping with us. We’re processing your order now.
        </p>

        <div className="mt-4 text-sm text-gray-500">
          Order ID: <span className="font-mono text-gray-800">{id}</span>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to="/products" className="px-4 py-2 bg-black text-white rounded-lg hover:opacity-90">
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
