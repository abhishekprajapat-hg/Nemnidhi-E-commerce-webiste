export const ADDRESS_LABELS = ["Home", "Work", "Other"];

export const EMPTY_ADDRESS = {
  label: "Home",
  fullName: "",
  phone: "",
  address: "",
  landmark: "",
  city: "",
  postalCode: "",
  country: "",
};

export const normalizeAddress = (source = {}) => {
  const nextLabel = String(source.label || "").trim();

  return {
    label: ADDRESS_LABELS.includes(nextLabel) ? nextLabel : "Home",
    fullName: String(source.fullName || "").trim(),
    phone: String(source.phone || "").trim(),
    address: String(source.address || "").trim(),
    landmark: String(source.landmark || "").trim(),
    city: String(source.city || "").trim(),
    postalCode: String(source.postalCode || "").trim(),
    country: String(source.country || "").trim(),
  };
};

export const mapSavedAddresses = (addresses = []) =>
  Array.isArray(addresses)
    ? addresses
        .filter(Boolean)
        .map((entry) => ({
          _id: String(entry?._id || ""),
          ...normalizeAddress(entry),
        }))
        .filter((entry) => entry._id)
    : [];

export const isAddressComplete = (address = {}) =>
  ["fullName", "address", "city", "postalCode", "country"].every((field) =>
    Boolean(String(address[field] || "").trim())
  );
