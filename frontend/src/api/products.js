import apiClient from "./client";

export async function getProducts(params = {}) {
  const response = await apiClient.get("/products/", { params });
  return response.data;
}

export async function getProductById(id) {
  const response = await apiClient.get(`/products/${id}/`);
  return response.data;
}

export async function getProductFilters() {
  const response = await apiClient.get("/products/filters/");
  return response.data;
}
