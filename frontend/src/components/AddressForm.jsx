import React from "react";

function Input({ label, id, ...props }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--nm-muted)]">
        {label}
      </span>
      <input
        id={id}
        name={id}
        {...props}
        className="block w-full rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-4 py-3 text-sm text-[var(--nm-text)] focus:border-[var(--nm-accent)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      />
    </label>
  );
}

export default function AddressForm({ title, address, onAddressChange, disabled = false }) {
  const setField = (key, value) => onAddressChange((state) => ({ ...state, [key]: value }));

  return (
    <fieldset disabled={disabled} className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-5 sm:p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input
            label="Full Name"
            id="fullName"
            value={address.fullName}
            onChange={(event) => setField("fullName", event.target.value)}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <Input
            label="Address"
            id="address"
            placeholder="1234 Main Street"
            value={address.address}
            onChange={(event) => setField("address", event.target.value)}
            required
          />
        </div>
        <Input
          label="City"
          id="city"
          value={address.city}
          onChange={(event) => setField("city", event.target.value)}
          required
        />
        <Input
          label="Postal Code"
          id="postalCode"
          value={address.postalCode}
          onChange={(event) => setField("postalCode", event.target.value)}
          required
        />
        <Input
          label="Country"
          id="country"
          value={address.country}
          onChange={(event) => setField("country", event.target.value)}
          required
        />
        <Input
          label="Phone"
          id="phone"
          type="tel"
          placeholder="+91 12345 67890"
          value={address.phone}
          onChange={(event) => setField("phone", event.target.value)}
        />
      </div>
    </fieldset>
  );
}
