import React from 'react'
import { Link } from 'react-router-dom'

export default function ProductCard({ p }) {
  return (
    // ⭐️ Dark Mode: Background, Border, and Shadow applied
    <div className="border border-gray-200 rounded-lg bg-white p-3 shadow-sm dark:bg-zinc-800 dark:border-zinc-700">
      <Link to={`/product/${p._id || p.slug}`}>
        <img 
          src={p.images?.[0] || '/placeholder.png'} 
          alt={p.title} 
          className="w-full h-64 object-cover rounded-md bg-gray-100 dark:bg-zinc-700"
          // ⭐️ Added onError handler for stability
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder.png'; }}
        />
      </Link>
      <h3 className="mt-3 font-semibold dark:text-white">{p.title}</h3>
      <p className="text-gray-600 dark:text-gray-400">₹{(p.price||0).toFixed(2)}</p>
      {/* Link color updated for dark theme */}
      <Link 
        className="inline-block mt-2 text-sm text-blue-600 hover:underline dark:text-indigo-400" 
        to={`/product/${p._id || p.slug}`}
      >
        View Details
      </Link>
    </div>
  )
}