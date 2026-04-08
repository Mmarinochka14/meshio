const GUEST_CART_KEY = "meshio_guest_cart";

const listeners = new Set();

function notify() {
  listeners.forEach((fn) => fn());
}

function readGuestCart() {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(Number) : [];
  } catch {
    return [];
  }
}

function writeGuestCart(ids) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(ids));
  notify();
}

export function subscribeCart(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getGuestCartIds() {
  return readGuestCart();
}

export function getGuestCartProductIds() {
  return readGuestCart();
}

export function getGuestCartCount() {
  return readGuestCart().length;
}

export function isInGuestCart(productId) {
  return readGuestCart().includes(Number(productId));
}

export function addToGuestCart(productId) {
  const ids = readGuestCart();
  const normalized = Number(productId);

  if (!ids.includes(normalized)) {
    writeGuestCart([...ids, normalized]);
    return true;
  }

  notify();
  return false;
}

export function removeFromGuestCart(productId) {
  const normalized = Number(productId);
  const ids = readGuestCart().filter((id) => id !== normalized);
  writeGuestCart(ids);
}

export function clearGuestCart() {
  localStorage.removeItem(GUEST_CART_KEY);
  notify();
}

export function isBuyerAuthenticated() {
  try {
    const token = localStorage.getItem("meshio_token") || "";
    const rawUser = localStorage.getItem("meshio_user");
    const user = rawUser ? JSON.parse(rawUser) : null;

    return Boolean(token) && user?.role === "buyer";
  } catch {
    return false;
  }
}
