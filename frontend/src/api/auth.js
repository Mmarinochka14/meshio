import apiClient from "./client";
import { setToken, setUser } from "../components/auth/authStore";

// ВАЖНО: логин по username
export async function loginRequest(username, password) {
  const res = await apiClient.post("/users/login/", { username, password });

  const token = res.data?.token || "";
  const user = res.data?.user || null;

  if (token) setToken(token);
  if (user) setUser(user);

  return user;
}

export async function registerRequest(payload) {
  // payload: { username, email, password, password_confirm, role }
  const res = await apiClient.post("/users/register/", payload);

  const token = res.data?.token || "";
  const user = res.data?.user || null;

  if (token) setToken(token);
  if (user) setUser(user);

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

export async function changePasswordRequest(old_password, new_password) {
  const res = await apiClient.post("/users/me/change-password/", {
    old_password,
    new_password,
  });
  return res.data;
}
