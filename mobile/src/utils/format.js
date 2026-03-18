export const formatCurrency = (value) =>
  `Rs ${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

export const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const formatRating = (value) => Number(value || 0).toFixed(1);

export const sentenceCase = (value = "") =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^\w/, (match) => match.toUpperCase());
