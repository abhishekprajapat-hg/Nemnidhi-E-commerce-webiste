// /src/components/ui/atoms.js
import React from 'react';
import { Link } from 'react-router-dom';

export function Badge({ children, tone = 'yellow' }) {
  const toneClasses =
    tone === 'green'
      ? 'bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-300'
      : tone === 'red'
      ? 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-300'
      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/10 dark:text-yellow-300';
  return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${toneClasses}`}>{children}</span>;
}

export function Th({ children, align = 'left' }) {
  return <th className={`px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${align === 'right' ? 'text-right' : 'text-left'}`}>{children}</th>;
}
export function Td({ children, align = 'left', className = '' }) {
  return <td className={`px-3 py-3 text-sm dark:text-gray-200 ${align === 'right' ? 'text-right' : ''} ${className}`.trim()}>{children}</td>;
}
export function Skeleton({ w = 'w-full', h = 'h-4' }) {
  return <div className={`${w} ${h} rounded bg-gray-200 dark:bg-zinc-700 animate-pulse`} />;
}

export function PaginationControls({ currentPage, totalPages, onPageChange }) {
  return (
    <div className="flex items-center justify-between mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 text-sm font-medium border rounded-md bg-white disabled:opacity-50 dark:bg-zinc-700 dark:border-zinc-600 dark:text-gray-300"
      >
        Previous
      </button>
      <span className="text-sm text-gray-700 dark:text-gray-300">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 text-sm font-medium border rounded-md bg-white disabled:opacity-50 dark:bg-zinc-700 dark:border-zinc-600 dark:text-gray-300"
      >
        Next
      </button>
    </div>
  );
}
