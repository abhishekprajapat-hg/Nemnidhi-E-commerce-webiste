import React from "react";

const ADDRESS_TYPES = ["Home", "Work"];

function Input({ label, id, hint, ...props }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--nm-muted)]">
        {label}
      </span>
      <input
        id={id}
        name={id}
        {...props}
        className="block w-full rounded-xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-3.5 py-2.5 text-sm text-[var(--nm-text)] shadow-sm transition focus:border-[var(--nm-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--nm-accent)]/20 disabled:cursor-not-allowed disabled:opacity-60"
      />
      {hint ? <span className="mt-1 block text-[11px] text-[var(--nm-muted)]">{hint}</span> : null}
    </label>
  );
}

export default function AddressForm({
  title,
  address,
  onAddressChange,
  disabled = false,
  stepNumber = 1,
}) {
  const selectedAddressType = ADDRESS_TYPES.includes(address?.label)
    ? address.label
    : "Home";
  const setField = (key, value) => onAddressChange((state) => ({ ...state, [key]: value }));
  const isShipping = title.toLowerCase().includes("shipping");

  return (
    <fieldset
      disabled={disabled}
      className="overflow-hidden rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-card)] shadow-[0_18px_44px_-36px_rgba(0,0,0,0.45)]"
    >
      <div className="flex items-center justify-between gap-3 border-b border-[var(--nm-border)] bg-[var(--nm-bg)]/35 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-md bg-[var(--nm-accent)] px-2 text-xs font-bold text-white">
            {stepNumber}
          </span>
          <div>
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[var(--nm-muted)]">Checkout Step</p>
            <h2 className="text-sm font-semibold uppercase tracking-[0.06em]">{title}</h2>
          </div>
        </div>
        {isShipping && (
          <span className="rounded-md border border-[var(--nm-border)] bg-[var(--nm-card)] px-2 py-1 text-[11px] font-semibold text-[var(--nm-muted)]">
            Default Delivery Address
          </span>
        )}
      </div>

      <div className="p-4 sm:p-5">
        <p className="text-xs text-[var(--nm-muted)]">
          Enter complete details for smooth doorstep delivery and order updates.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input
            label="Full Name"
            id="fullName"
            placeholder="Enter full name"
            value={address.fullName}
            onChange={(event) => setField("fullName", event.target.value)}
            required
          />
          <Input
            label="Mobile Number"
            id="phone"
            type="tel"
            placeholder="10-digit mobile number"
            value={address.phone}
            onChange={(event) => setField("phone", event.target.value)}
            hint="Order updates will be sent to this number"
          />
          <Input
            label="Pincode"
            id="postalCode"
            placeholder="e.g. 452001"
            value={address.postalCode}
            onChange={(event) => setField("postalCode", event.target.value)}
            required
          />
          <Input
            label="City / District"
            id="city"
            placeholder="e.g. Indore"
            value={address.city}
            onChange={(event) => setField("city", event.target.value)}
            required
          />
          <Input
            label="State"
            id="country"
            placeholder="e.g. Madhya Pradesh"
            value={address.country}
            onChange={(event) => setField("country", event.target.value)}
            required
          />
          <div className="flex flex-col justify-end">
            <span className="mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--nm-muted)]">
              Address Type
            </span>
            <div className="flex gap-2">
              {ADDRESS_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setField("label", type)}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                    selectedAddressType === type
                      ? "border-[var(--nm-accent)] bg-[var(--nm-accent-soft)] text-[var(--nm-accent-strong)]"
                      : "border-[var(--nm-border)] bg-[var(--nm-surface)] text-[var(--nm-muted)] hover:border-[var(--nm-accent)]/50"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <label className="sm:col-span-2 block text-sm">
            <span className="mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--nm-muted)]">
              Full Address (House No, Building, Street, Area)
            </span>
            <textarea
              id="address"
              name="address"
              rows={3}
              placeholder="Flat no., area, nearby landmark"
              value={address.address}
              onChange={(event) => setField("address", event.target.value)}
              required
              className="block w-full rounded-xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-3.5 py-2.5 text-sm text-[var(--nm-text)] shadow-sm transition focus:border-[var(--nm-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--nm-accent)]/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>
        </div>
      </div>
    </fieldset>
  );
}
