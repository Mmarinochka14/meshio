import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AuthModal from "../components/auth/AuthModal";

export default function MainLayout({ children }) {
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <>
      <Header onLoginClick={() => setIsAuthOpen(true)} />
      <main>{children}</main>
      <Footer />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
