import { useEffect, useState } from "react";
import SellerHeader from "../components/SellerHeader";
import Footer from "../components/Footer";
import AddModelModal from "../components/AddModelModal";
import { getProductFilters } from "../api/products";

export default function SellerLayout({ children }) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingProduct, setEditingProduct] = useState(null);
  const [filtersMeta, setFiltersMeta] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadMeta() {
      try {
        const data = await getProductFilters();
        if (mounted) setFiltersMeta(data);
      } catch (e) {
        if (mounted) setFiltersMeta(null);
      }
    }

    loadMeta();

    function handleOpenCreate() {
      setModalMode("create");
      setEditingProduct(null);
      setIsUploadOpen(true);
    }

    function handleOpenEdit(event) {
      setModalMode("edit");
      setEditingProduct(event.detail?.product || null);
      setIsUploadOpen(true);
    }

    window.addEventListener("open-seller-upload-modal", handleOpenCreate);
    window.addEventListener("open-seller-edit-modal", handleOpenEdit);

    return () => {
      mounted = false;
      window.removeEventListener("open-seller-upload-modal", handleOpenCreate);
      window.removeEventListener("open-seller-edit-modal", handleOpenEdit);
    };
  }, []);

  function handleCloseModal() {
    setIsUploadOpen(false);
    setModalMode("create");
    setEditingProduct(null);
  }

  return (
    <>
      <SellerHeader
        onOpenUploadModal={() => {
          setModalMode("create");
          setEditingProduct(null);
          setIsUploadOpen(true);
        }}
      />
      <main>{children}</main>
      <Footer />

      <AddModelModal
        isOpen={isUploadOpen}
        onClose={handleCloseModal}
        onSuccess={() => {
          setIsUploadOpen(false);
          setModalMode("create");
          setEditingProduct(null);
          window.dispatchEvent(new CustomEvent("seller-products-updated"));
        }}
        filtersMeta={filtersMeta}
        mode={modalMode}
        initialProduct={editingProduct}
      />
    </>
  );
}
