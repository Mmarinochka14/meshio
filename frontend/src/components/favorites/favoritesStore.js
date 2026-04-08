const FAVORITES_KEY = "meshio_favorite_ids";

const listeners = new Set();

function notify() {
  listeners.forEach((fn) => fn());
}

function readFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(Number) : [];
  } catch {
    return [];
  }
}

function writeFavorites(ids) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  notify();
}

export function subscribeFavorites(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getFavoriteIds() {
  return readFavorites();
}

export function isFavoriteStored(productId) {
  return readFavorites().includes(Number(productId));
}

export function addFavoriteId(productId) {
  const ids = readFavorites();
  const normalized = Number(productId);

  if (!ids.includes(normalized)) {
    writeFavorites([...ids, normalized]);
  } else {
    notify();
  }
}

export function removeFavoriteId(productId) {
  const normalized = Number(productId);
  const ids = readFavorites().filter((id) => id !== normalized);
  writeFavorites(ids);
}

export function syncFavoritesFromProducts(products = []) {
  const ids = products
    .filter((item) => Boolean(item?.is_favorite))
    .map((item) => Number(item.id));

  writeFavorites(ids);
}

export function clearFavoritesStore() {
  localStorage.removeItem(FAVORITES_KEY);
  notify();
}
