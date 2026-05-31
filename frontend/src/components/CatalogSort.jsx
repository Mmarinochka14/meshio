import { useEffect, useRef, useState } from "react";
import "../styles/catalog-sort.css";

export default function CatalogSort({ value, options, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);
  const items = options?.length
    ? options
    : [{ value: "newest", label: "Сначала новые" }];
  const current = items.find((item) => item.value === value) || items[0];

  useEffect(() => {
    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function handleSelect(nextValue) {
    onChange(nextValue);
    setIsOpen(false);
  }

  return (
    <div className="catalog-sort" ref={rootRef}>
      <span className="catalog-sort__label text-p2">Сортировка:</span>

      <button
        type="button"
        className={`catalog-sort__button text-p2 ${isOpen ? "is-open" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{current.label}</span>
        <span className="catalog-sort__chevron" />
      </button>

      {isOpen ? (
        <div className="catalog-sort__menu" role="listbox">
          {items.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`catalog-sort__option text-p2 ${
                opt.value === value ? "is-active" : ""
              }`}
              onClick={() => handleSelect(opt.value)}
              role="option"
              aria-selected={opt.value === value}
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
