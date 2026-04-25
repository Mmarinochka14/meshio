import apiClient from "./client";

export async function getMyCart() {
  const response = await apiClient.get("/products/cart/");
  return response.data;
}

export async function getCartCount() {
  const response = await apiClient.get("/products/cart/count/");
  return response.data;
}

export async function addToCartRequest(productId) {
  const response = await apiClient.post("/products/cart/add/", {
    product_id: productId,
  });
  return response.data;
}

export async function removeFromCartRequest(productId) {
  const response = await apiClient.post("/products/cart/remove/", {
    product_id: productId,
  });
  return response.data;
}

export async function mergeCartRequest(productIds) {
  const response = await apiClient.post("/products/cart/merge/", {
    product_ids: productIds,
  });
  return response.data;
}

export async function getCheckoutPreview() {
  const response = await apiClient.get("/products/checkout/preview/");
  return response.data;
}

export async function payCheckout(paymentMethod) {
  const response = await apiClient.post("/products/checkout/pay/", {
    payment_method: paymentMethod,
  });
  return response.data;
}

export async function getProductCheckoutPreview(productId) {
  const response = await apiClient.get(
    `/products/${productId}/checkout/preview/`,
  );
  return response.data;
}

export async function payProductCheckout(productId, paymentMethod) {
  const response = await apiClient.post(
    `/products/${productId}/checkout/pay/`,
    {
      payment_method: paymentMethod,
    },
  );
  return response.data;
}
