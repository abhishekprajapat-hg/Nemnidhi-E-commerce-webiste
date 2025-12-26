import React from "react";
import { Link } from "react-router-dom";

/* ================= ICONS ================= */

const IconInstagram = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path
      fillRule="evenodd"
      d="M12 2.2c3.2 0 3.6.01 4.85.07
      3.25.15 4.77 1.69 4.92 4.92
      .06 1.25.07 1.65.07 4.85s-.01 3.6-.07 4.85
      c-.15 3.23-1.67 4.77-4.92 4.92
      -1.25.06-1.65.07-4.85.07s-3.6-.01-4.85-.07
      c-3.23-.15-4.77-1.67-4.92-4.92
      -.06-1.25-.07-1.65-.07-4.85s.01-3.6.07-4.85
      c.15-3.23 1.67-4.77 4.92-4.92
      1.25-.06 1.65-.07 4.85-.07z
      M12 6.3a5.7 5.7 0 100 11.4 5.7 5.7 0 000-11.4z
      m0 9.4a3.7 3.7 0 110-7.4 3.7 3.7 0 010 7.4z
      m5.95-9.85a1.35 1.35 0 11-2.7 0 1.35 1.35 0 012.7 0z"
      clipRule="evenodd"
    />
  </svg>
);

const IconFacebook = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12
    c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047
    V9.43c0-3.007 1.792-4.669 4.533-4.669
    1.312 0 2.686.235 2.686.235v2.953H15.83
    c-1.491 0-1.956.925-1.956 1.874v2.25
    h3.328l-.532 3.47h-2.796v8.385
    C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const IconTwitter = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M23.953 4.57a10 10 0 01-2.825.775
    4.958 4.958 0 002.163-2.723
    c-.951.555-2.005.959-3.127 1.184
    a4.92 4.92 0 00-8.384 4.482
    C7.69 8.095 4.067 6.13 1.64 3.162
    a4.822 4.822 0 00-.666 2.475
    c0 1.71.87 3.213 2.188 4.096
    a4.904 4.904 0 01-2.228-.616v.06
    a4.923 4.923 0 003.946 4.827
    a4.996 4.996 0 01-2.212.085
    a4.936 4.936 0 004.604 3.417
    9.867 9.867 0 01-6.102 2.105
    c-.39 0-.779-.023-1.17-.067
    a13.995 13.995 0 007.557 2.209
    c9.053 0 13.998-7.496 13.998-13.985
    0-.21 0-.42-.015-.63
    A9.935 9.935 0 0024 4.59z" />
  </svg>
);

/* ================= FOOTER ================= */

export default function Footer() {
  return (
    <footer className="
      bg-[#fff6f6] text-gray-600 border-t border-gray-200
      dark:bg-zinc-900 dark:text-gray-400 dark:border-zinc-800
    ">
      <div className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-4 gap-12">

        {/* Brand */}
        <div>
          <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-4">
            NEMNIDHI
          </h2>

          <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            Celebrating Indian heritage with curated handloom sarees,
            lehengas, and artisanal ethnic wear.
          </p>

          <div className="flex gap-4 mt-6">
            {[IconInstagram, IconFacebook, IconTwitter].map((Icon, i) => (
              <div
                key={i}
                className="
                  w-9 h-9 flex items-center justify-center rounded-full border
                  bg-white text-gray-700 border-gray-300
                  hover:bg-black hover:text-white
                  dark:bg-zinc-800 dark:border-zinc-700 dark:text-gray-300
                  dark:hover:bg-white dark:hover:text-black
                  transition
                "
              >
                <Icon />
              </div>
            ))}
          </div>
        </div>

        {/* Shop */}
        <div>
          <h3 className="text-sm font-semibold uppercase mb-5 text-gray-900 dark:text-white">
            Shop
          </h3>
          <ul className="space-y-3 text-sm">
            <li><Link className="hover:text-black dark:hover:text-white" to="/products">All Products</Link></li>
            <li><Link className="hover:text-black dark:hover:text-white" to="/products?category=Sarees">Sarees</Link></li>
            <li><Link className="hover:text-black dark:hover:text-white" to="/products?category=Tops">Tops</Link></li>
            <li><Link className="hover:text-black dark:hover:text-white" to="/products?category=Jeans">Jeans</Link></li>
            <li><Link className="hover:text-black dark:hover:text-white" to="/products?category=Western">Western</Link></li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h3 className="text-sm font-semibold uppercase mb-5 text-gray-900 dark:text-white">
            Company
          </h3>
          <ul className="space-y-3 text-sm">
            <li><Link className="hover:text-black dark:hover:text-white" to="/home">Home</Link></li>
            <li><Link className="hover:text-black dark:hover:text-white" to="/about">About Us</Link></li>
            <li><Link className="hover:text-black dark:hover:text-white" to="/contact">Contact Us</Link></li>
            <li><Link className="hover:text-black dark:hover:text-white" to="/policies">Policies</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-sm font-semibold uppercase mb-5 text-gray-900 dark:text-white">
            Contact
          </h3>

          <div className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
            <p>📍 14, Uday Nagar, Indore, MP – 452018</p>
            <p>
              📞{" "}
              <a
                href="tel:+918269150205"
                className="hover:text-black dark:hover:text-white"
              >
                +91 82691 50205
              </a>
            </p>
            <p>
              🧾 GST<br />
              <span className="ml-4">23CGZPB7175E1Z5</span>
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-zinc-800 py-6 text-center text-xs text-gray-500 dark:text-gray-400">
        © {new Date().getFullYear()} NEMNIDHI. All rights reserved.
      </div>
    </footer>
  );
}
