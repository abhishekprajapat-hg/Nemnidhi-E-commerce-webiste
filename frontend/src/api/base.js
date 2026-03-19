export function getApiOrigin(rawValue = "") {
  const raw = String(rawValue || "").trim();
  if (!raw || raw === "/") return "";

  return raw.replace(/\/+$/, "").replace(/\/api$/i, "");
}

export function buildApiUrl(path = "", rawValue = "") {
  const origin = getApiOrigin(rawValue);
  const normalizedPath = `/${String(path || "").replace(/^\/+/, "")}`;
  const apiPath =
    normalizedPath === "/api" || normalizedPath.startsWith("/api/")
      ? normalizedPath
      : `/api${normalizedPath}`;

  return `${origin}${apiPath}`;
}
