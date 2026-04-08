import apiClient from "./client";

export async function sendContactRequest(payload) {
  const response = await apiClient.post("/products/contact-requests/", payload);
  return response.data;
}

export async function subscribeToNewsletter(email) {
  const response = await apiClient.post("/products/newsletter/subscribe/", {
    email,
  });
  return response.data;
}
