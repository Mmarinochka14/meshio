import apiClient from "./client";

export async function getMySupportRequests() {
  const response = await apiClient.get("/products/my/contact-requests/");
  return response.data;
}

export async function getAdminSupportRequests(status = "all") {
  const response = await apiClient.get("/products/admin/contact-requests/", {
    params: { status },
  });
  return response.data;
}

export async function updateAdminSupportRequest(requestId, payload) {
  const response = await apiClient.patch(
    `/products/admin/contact-requests/${requestId}/`,
    payload,
  );
  return response.data;
}
