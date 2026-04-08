export function openAuthModal(step = "login", role = "") {
  window.dispatchEvent(
    new CustomEvent("meshio:open-auth-modal", {
      detail: { step, role },
    }),
  );
}
