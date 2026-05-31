const TOKEN_KEY = "meshio_token";
const USER_KEY = "meshio_user";

const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());

export function applyThemePreference(preferences) {
  if (typeof document === "undefined") return;
  const isDark = preferences?.dark_theme !== false;
  document.body.classList.toggle("theme-light", !isDark);
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
  notify();
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  notify();
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
export function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  applyThemePreference(user?.preferences);
  notify();
}
export function clearUser() {
  localStorage.removeItem(USER_KEY);
  applyThemePreference({ dark_theme: true });
  notify();
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  applyThemePreference({ dark_theme: true });
  notify();
}

applyThemePreference(getUser()?.preferences);
