import React from "react";
import { Link } from "react-router-dom";

// ... (SVG Icons yahan paste karein) ...
const IconInstagram = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.07 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.225-.148-4.771-1.664-4.919-4.919-.058-1.265-.07-1.644-.07-4.849 0-3.204.012-3.584.07-4.849.148-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.689-.073-4.948-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>;
const IconFacebook = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>;
const IconTwitter = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>;


export default function Footer() {
  return (
    <footer className="bg-[#fdf7f7] text-gray-600 border-t border-gray-200 dark:bg-zinc-900 dark:text-gray-400 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        
        <div>
          <div className="text-2xl font-bold tracking-tight font-serif text-gray-900 dark:text-white mb-4">
            NEMNIDHI
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Celebrating Indian heritage with our curated collection of handloom sarees, lehengas, and artisanal ethnic wear.
          </p>
          <div className="flex items-center gap-5 mt-6">
            <a href="#" className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition" aria-label="Instagram">
              <IconInstagram />
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition" aria-label="Facebook">
              <IconFacebook />
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition" aria-label="Twitter">
              <IconTwitter />
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase mb-4">Shop</h3>
          <ul className="space-y-3 text-sm">
            <li><Link to="/products?category=Banarasi" className="hover:text-black dark:hover:text-white">Banarasi Sarees</Link></li>
            <li><Link to="/products?category=Lehenga" className="hover:text-black dark:hover:text-white">Lehengas</Link></li>
            <li><Link to="/products?category=Kurta" className="hover:text-black dark:hover:text-white">Kurta Sets</Link></li>
            <li><Link to="/products" className="hover:text-black dark:hover:text-white">All Products</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase mb-4">Company</h3>
          <ul className="space-y-3 text-sm">
            <li><Link to="/about" className="hover:text-black dark:hover:text-white">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-black dark:hover:text-white">Contact Us</Link></li>
            <li><Link to="/faq" className="hover:text-black dark:hover:text-white">FAQs</Link></li>
            <li><Link to="/customer-service" className="hover:text-black dark:hover:text-white">Customer Service</Link></li>
            <li><Link to="/admin/login" className="hover:text-black dark:hover:text-white">Admin</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase mb-4">Stay Connected</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Join our newsletter for updates on new arrivals and exclusive offers.
          </p>
          <form className="flex gap-2">
            <input
              type="email"
              placeholder="Your email"
              className="flex-1 px-3 py-2 rounded-md bg-white text-sm border border-gray-300 focus:ring-1 focus:ring-indigo-500 outline-none dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-black text-white font-medium hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              Join
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 border-t border-gray-200 dark:border-zinc-800">
        <div className="md:flex md:items-center md:justify-between">
          
          <div className="mt-4 md:mt-0 text-center md:text-right text-xs text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} NEMNIDHI. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}