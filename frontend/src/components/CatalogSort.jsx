import "../styles/catalog-sort.css";

export default function CatalogSort({ value, options, onChange }) {
  return (
    <div className="catalog-sort">
      <span className="catalog-sort__label text-p2">Сортировка:</span>

      <select
        className="catalog-sort__select text-p2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {(options?.length
          ? options
          : [{ value: "newest", label: "Сначала новые" }]
        ).map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
