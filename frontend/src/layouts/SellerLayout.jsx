import { useState } from "react";
import SellerHeader from "../components/SellerHeader";
import Footer from "../components/Footer";

export default function SellerLayout({ children }) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  return (
    <>
      <SellerHeader onOpenUploadModal={() => setIsUploadOpen(true)} />
      <main>{children}</main>
      <Footer />

      {isUploadOpen ? (
        <div style={{ display: "none" }}>upload modal placeholder</div>
      ) : null}
    </>
  );
}
