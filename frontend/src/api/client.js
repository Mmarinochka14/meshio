import axios from "axios";
import { getToken } from "../components/auth/authStore";
import { API_BASE_URL } from "./url";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});

export default apiClient;
