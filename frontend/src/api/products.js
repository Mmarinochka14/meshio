import apiClient from "./client";

export async function getProducts(params = {}) {
  const response = await apiClient.get("/products/", { params });
  return response.data;
}

export async function getProductFilters() {
  const response = await apiClient.get("/products/filters/");
  return response.data;
}

export async function getProductById(productId) {
  const response = await apiClient.get(`/products/${productId}/`);
  return response.data;
}

export async function getViewerUrl(productId) {
  const response = await apiClient.get(`/products/${productId}/viewer-url/`);
  return response.data;
}

export async function downloadProduct(productId) {
  const response = await apiClient.get(`/products/${productId}/download/`);
  return response.data;
}

export async function purchaseProduct(productId) {
  const response = await apiClient.post(`/products/purchase/`, {
    product_id: productId,
  });
  return response.data;
}

export async function addToFavorites(productId) {
  const response = await apiClient.post(`/products/favorites/add/`, {
    product_id: productId,
  });
  return response.data;
}

export async function removeFromFavorites(productId) {
  const response = await apiClient.post(`/products/favorites/remove/`, {
    product_id: productId,
  });
  return response.data;
}

export async function generateTexture(productId, prompt) {
  const token = localStorage.getItem("meshio_token");

  const response = await fetch(
    `http://127.0.0.1:8000/api/products/${productId}/generate-texture/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({ prompt }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.detail || "Не удалось сгенерировать текстуру.");
  }

  return data;
}

export async function getProductsByIds(productIds) {
  const response = await apiClient.post("/products/by-ids/", {
    product_ids: productIds,
  });
  return response.data;
}

export async function getMyFavorites() {
  const response = await apiClient.get("/products/favorites/");
  return response.data;
}

export async function getProductComments(productId) {
  const response = await apiClient.get(`/products/${productId}/comments/`);
  return response.data;
}

export async function addProductComment(productId, text) {
  const response = await apiClient.post(`/products/${productId}/comment/`, {
    text,
  });
  return response.data;
}

export async function getMyPurchasedProducts() {
  const response = await apiClient.get("/products/my-models/");
  return response.data;
}

export async function getMyProductsRequest(params = {}) {
  const res = await apiClient.get("/products/my/", { params });
  return res.data;
}

export async function deleteProductRequest(productId) {
  const res = await apiClient.delete(`/products/${productId}/delete/`);
  return res.data;
}
