import { useEffect } from "react";
import "../../styles/modal.css";

export default function Modal({
  isOpen,
  onClose,
  children,
  panelClassName = "",
}) {
  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(e) {
      if (e.key === "Escape") onClose?.();
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal" onMouseDown={onClose}>
      <div
        className={`modal__panel ${panelClassName}`.trim()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="modal__close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}
