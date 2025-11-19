import React from "react";

export default function Input({ label, id, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="mt-1">
        <input
          id={id}
          name={id}
          {...props}
          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base px-4 py-2.5 dark:bg-zinc-700 dark:border-zinc-600 dark:text-gray-100"
        />
      </div>
    </div>
  );
}
