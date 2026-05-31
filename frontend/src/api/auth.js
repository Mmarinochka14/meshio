import apiClient from "./client";
import { setToken, setUser } from "../components/auth/authStore";
import {
  clearFavoriteIds,
  getFavoriteIds,
} from "../components/favorites/favoritesStore";
import {
  clearGuestCart,
  getGuestCartProductIds,
} from "../components/cart/cartStore";
import { mergeCartRequest } from "./cart";
import { mergeFavoritesRequest } from "./products";

export async function loginRequest(username, password) {
  const res = await apiClient.post("/users/login/", { username, password });

  const token = res.data?.token || "";
  const user = res.data?.user || null;

  if (token) setToken(token);
  if (user) setUser(user);

  if (user?.role === "buyer") {
    const guestCartIds = getGuestCartProductIds();

    if (guestCartIds.length > 0) {
      try {
        await mergeCartRequest(guestCartIds);
        clearGuestCart();
      } catch {
        // молча оставляем локальную корзину, если merge не удался
      }
    }

    const guestFavoriteIds = getFavoriteIds();

    if (guestFavoriteIds.length > 0) {
      try {
        await mergeFavoritesRequest(guestFavoriteIds);
        clearFavoriteIds();
      } catch {
        // молча оставляем локальное избранное, если merge не удался
      }
    }
  }

  return user;
}

export async function registerRequest(payload) {
  const res = await apiClient.post("/users/register/", payload);

  const token = res.data?.token || "";
  const user = res.data?.user || null;

  if (token) setToken(token);
  if (user) setUser(user);

  if (user?.role === "buyer") {
    const guestCartIds = getGuestCartProductIds();

    if (guestCartIds.length > 0) {
      try {
        await mergeCartRequest(guestCartIds);
        clearGuestCart();
      } catch {
        // молча оставляем локальную корзину, если merge не удался
      }
    }

    const guestFavoriteIds = getFavoriteIds();

    if (guestFavoriteIds.length > 0) {
      try {
        await mergeFavoritesRequest(guestFavoriteIds);
        clearFavoriteIds();
      } catch {
        // молча оставляем локальное избранное, если merge не удался
      }
    }
  }

  return user;
}

// профиль текущего пользователя
export async function meRequest() {
  const res = await apiClient.get("/users/me/");
  // синхронизируем, чтобы хедер/стор всегда был актуален
  if (res.data) setUser(res.data);
  return res.data;
}

// обновление профиля (нужно, чтобы бэк поддерживал PATCH /users/me/)
export async function updateProfileRequest(payload) {
  const res = await apiClient.patch("/users/me/", payload);
  if (res.data) setUser(res.data);
  return res.data;
}

export async function getPreferencesRequest() {
  const res = await apiClient.get("/users/me/preferences/");
  return res.data;
}

export async function updatePreferencesRequest(payload) {
  const res = await apiClient.patch("/users/me/preferences/", payload);
  const me = await meRequest();
  return me?.preferences || res.data;
}

export async function getNotificationsRequest() {
  const res = await apiClient.get("/users/me/notifications/");
  return res.data;
}

export async function markNotificationReadRequest(id) {
  const res = await apiClient.post(`/users/me/notifications/${id}/read/`);
  return res.data;
}

export async function changePasswordRequest(old_password, new_password) {
  const res = await apiClient.post("/users/me/change-password/", {
    old_password,
    new_password,
  });
  return res.data;
}

export async function requestPasswordReset(email) {
  const res = await apiClient.post("/users/password-reset/", { email });
  return res.data;
}

export async function confirmPasswordReset(email, code, new_password) {
  const res = await apiClient.post("/users/password-reset/confirm/", {
    email,
    code,
    new_password,
  });
  return res.data;
}

export async function getMySellerProfileRequest() {
  const res = await apiClient.get("/users/seller/me/");
  return res.data;
}

export async function updateSellerProfileRequest(payload) {
  const res = await apiClient.patch("/users/seller/me/", payload);
  return res.data;
}

export async function uploadSellerAvatarRequest(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await apiClient.post("/users/seller/me/upload-avatar/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function deleteSellerAvatarRequest() {
  const res = await apiClient.delete("/users/seller/me/delete-avatar/");
  return res.data;
}

export async function uploadSellerBannerRequest(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await apiClient.post("/users/seller/me/upload-banner/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function deleteSellerBannerRequest() {
  const res = await apiClient.delete("/users/seller/me/delete-banner/");
  return res.data;
}
