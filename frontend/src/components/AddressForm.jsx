import React from 'react';

// Ek reusable Input component (Dark mode support added)
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
        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base px-4 py-2.5 
                   dark:bg-zinc-700 dark:border-zinc-600 dark:text-white 
                   disabled:bg-gray-100 dark:disabled:bg-zinc-900"
      />
    </div>
  </div>
);

/**
 * Yeh ek reusable address form hai.
 * Props:
 * - title: Form ka title (e.g., "Shipping address")
 * - address: Address state object
 * - onAddressChange: State update karne ke liye function
 * - disabled: Form ko disable karne ke liye (e.g., loading)
 */
export default function AddressForm({ title, address, onAddressChange, disabled = false }) {
  const setField = (k, v) => onAddressChange((s) => ({ ...s, [k]: v }));

  return (
    // ⭐️ Fieldset ko dark mode classes di hain
    <fieldset disabled={disabled} className="rounded-xl border border-gray-200 bg-[#fffcfc] p-6 shadow-sm dark:bg-zinc-800 dark:border-zinc-700">
      <h2 className="text-lg font-semibold mb-4 dark:text-white">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Input
            label="Full name"
            id="fullName"
            value={address.fullName}
            onChange={(e) => setField("fullName", e.target.value)}
            required
          />
        </div>
        <div className="md:col-span-2">
          <Input
            label="Address"
            id="address"
            placeholder="1234 Main St"
            value={address.address}
            onChange={(e) => setField("address", e.target.value)}
            required
          />
        </div>
        <div>
          <Input
            label="City"
            id="city"
            value={address.city}
            onChange={(e) => setField("city", e.target.value)}
            required
          />
        </div>
        <div>
          <Input
            label="Postal code"
            id="postalCode"
            value={address.postalCode}
            onChange={(e) => setField("postalCode", e.target.value)}
            required
          />
        </div>
        <div>
          <Input
            label="Country"
            id="country"
            value={address.country}
            onChange={(e) => setField("country", e.target.value)}
            required
          />
        </div>
        <div>
          <Input
            label="Phone"
            id="phone"
            type="tel"
            placeholder="+91 12345 67890"
            value={address.phone}
            onChange={(e) => setField("phone", e.target.value)}
          />
        </div>
      </div>
    </fieldset>
  );
}