export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

export const MEDIA_BASE_URL =
  import.meta.env.VITE_MEDIA_URL ||
  API_BASE_URL.replace(/\/api\/?$/, "");

export function buildMediaUrl(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;

  const base = MEDIA_BASE_URL.replace(/\/$/, "");
  const path = String(url).startsWith("/") ? url : `/${url}`;

  return `${base}${path}`;
}

export function buildProductMediaProxyUrl(productId, kind) {
  if (!productId || !kind) return "";

  const base = API_BASE_URL.replace(/\/$/, "");
  return `${base}/products/${productId}/media/${kind}/`;
}
