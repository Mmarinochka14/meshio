const FAVORITES_KEY = "meshio_guest_favorites";

const listeners = new Set();

function emit() {
  listeners.forEach((listener) => listener());
}

function readIds() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (id) => Number.isInteger(id) || /^\d+$/.test(String(id)),
    );
  } catch {
    return [];
  }
}

function writeIds(ids) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  emit();
}

export function getFavoriteIds() {
  return readIds().map((id) => Number(id));
}

export function isFavoriteStored(productId) {
  const id = Number(productId);
  return getFavoriteIds().includes(id);
}

export function addFavoriteId(productId) {
  const id = Number(productId);
  const ids = getFavoriteIds();

  if (ids.includes(id)) return;

  writeIds([...ids, id]);
}

export function removeFavoriteId(productId) {
  const id = Number(productId);
  const ids = getFavoriteIds().filter((item) => item !== id);
  writeIds(ids);
}

export function clearFavoriteIds() {
  localStorage.removeItem(FAVORITES_KEY);
  emit();
}

export function subscribeFavorites(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
