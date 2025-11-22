import React from "react";

const Input = ({ label, id, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
    </label>
    <div className="mt-1">
      <input
        id={id}
        name={id}
        {...props}
        className={
          "block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base px-4 py-2.5 bg-white " +
          "dark:bg-zinc-700 dark:border-zinc-600 dark:text-white " +
          "disabled:bg-gray-100 dark:disabled:bg-zinc-900 disabled:cursor-not-allowed"
        }
      />
    </div>
  </div>
);

export default Input;
