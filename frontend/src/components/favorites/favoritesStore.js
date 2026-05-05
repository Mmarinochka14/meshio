const FAVORITES_STORAGE_KEY = "meshio_favorites";

const listeners = new Set();

function normalizeId(id) {
  return String(id);
}

function readIds() {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);

    if (!raw) return [];

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed.map(normalizeId);
  } catch {
    return [];
  }
}

function writeIds(ids) {
  const uniqueIds = Array.from(new Set(ids.map(normalizeId)));

  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(uniqueIds));
  notifyFavorites();
}

export function getFavoriteIds() {
  return readIds();
}

export function setFavoriteIds(ids) {
  writeIds(Array.isArray(ids) ? ids : []);
}

export function addFavoriteId(id) {
  const productId = normalizeId(id);
  const ids = readIds();

  if (ids.includes(productId)) return;

  writeIds([...ids, productId]);
}

export function removeFavoriteId(id) {
  const productId = normalizeId(id);
  const ids = readIds();

  writeIds(ids.filter((item) => item !== productId));
}

export function clearFavoriteIds() {
  writeIds([]);
}

export function isFavoriteId(id) {
  const productId = normalizeId(id);

  return readIds().includes(productId);
}

export function subscribeFavorites(callback) {
  listeners.add(callback);

  return () => {
    listeners.delete(callback);
  };
}

export function notifyFavorites() {
  listeners.forEach((callback) => callback());
}
