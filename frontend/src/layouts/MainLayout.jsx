import { cloneElement, isValidElement, useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AuthModal from "../components/auth/AuthModal";
import SellerStartModal from "../components/modals/SellerStartModal";

export default function MainLayout({ children }) {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialStep, setAuthInitialStep] = useState("login");
  const [authInitialRole, setAuthInitialRole] = useState("");

  const [isSellerModalOpen, setIsSellerModalOpen] = useState(false);

  function openLoginModal() {
    setAuthInitialStep("login");
    setAuthInitialRole("");
    setIsAuthOpen(true);
  }

  function closeAuthModal() {
    setIsAuthOpen(false);
    setAuthInitialStep("login");
    setAuthInitialRole("");
  }

  function openSellerModal() {
    setIsSellerModalOpen(true);
  }

  function closeSellerModal() {
    setIsSellerModalOpen(false);
  }

  function openSellerRegisterFlow() {
    setIsSellerModalOpen(false);
    setAuthInitialStep("registerForm");
    setAuthInitialRole("seller");
    setIsAuthOpen(true);
  }

  useEffect(() => {
    function handleOpenAuthModal(event) {
      const step = event?.detail?.step || "login";
      const role = event?.detail?.role || "";

      setAuthInitialStep(step);
      setAuthInitialRole(role);
      setIsAuthOpen(true);
    }

    window.addEventListener("meshio:open-auth-modal", handleOpenAuthModal);

    return () => {
      window.removeEventListener("meshio:open-auth-modal", handleOpenAuthModal);
    };
  }, []);

  const content = isValidElement(children)
    ? cloneElement(children, { onOpenSellerModal: openSellerModal })
    : children;

  return (
    <>
      <Header
        onLoginClick={openLoginModal}
        onOpenSellerModal={openSellerModal}
      />

      <main>{content}</main>

      <Footer onOpenSellerModal={openSellerModal} />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={closeAuthModal}
        initialStep={authInitialStep}
        initialRole={authInitialRole}
      />

      <SellerStartModal
        isOpen={isSellerModalOpen}
        onClose={closeSellerModal}
        onCreateSellerProfile={openSellerRegisterFlow}
      />
    </>
  );
}
