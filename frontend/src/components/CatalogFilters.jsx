import { useEffect, useMemo, useState } from "react";
import "../styles/catalog-filters.css";

function spGet(searchParams, key) {
  const v = searchParams.get(key);
  return v === null ? "" : v;
}

function spGetBool(searchParams, key) {
  const v = searchParams.get(key);
  if (v === "true") return true;
  if (v === "false") return false;
  return false;
}

export default function CatalogFilters({
  meta,
  searchParams,
  onApply,
  onReset,
}) {
  const initial = useMemo(
    () => ({
      is_free: spGetBool(searchParams, "is_free"),
      has_uv: spGetBool(searchParams, "has_uv"),
      has_textures: spGetBool(searchParams, "has_textures"),

      category: searchParams.getAll("category"),
      model_format: spGet(searchParams, "model_format"),
      geometry_type: spGet(searchParams, "geometry_type"),
      poly_style: spGet(searchParams, "poly_style"),
      topology_type: spGet(searchParams, "topology_type"),

      min_polygons: spGet(searchParams, "min_polygons"),
      max_polygons: spGet(searchParams, "max_polygons"),
    }),
    [searchParams],
  );

  const [draft, setDraft] = useState(initial);

  useEffect(() => {
    setDraft(initial);
  }, [initial]);

  const categories = meta?.categories || [];
  const formats = meta?.formats || [];
  const geometryTypes = meta?.geometry_types || [];
  const polyStyles = meta?.poly_styles || [];
  const topologyTypes = meta?.topology_types || [];

  function setField(name, value) {
    setDraft((prev) => ({ ...prev, [name]: value }));
  }

  function toggleBool(name) {
    setDraft((prev) => ({ ...prev, [name]: !prev[name] }));
  }

  function handleCategoryToggle(slug) {
    setDraft((prev) => {
      const exists = prev.category.includes(slug);

      return {
        ...prev,
        category: exists
          ? prev.category.filter((item) => item !== slug)
          : [...prev.category, slug],
      };
    });
  }

  function handleApply() {
    onApply({
      is_free: draft.is_free ? "true" : "",
      has_uv: draft.has_uv ? "true" : "",
      has_textures: draft.has_textures ? "true" : "",

      category: draft.category,
      model_format: draft.model_format || "",
      geometry_type: draft.geometry_type || "",
      poly_style: draft.poly_style || "",
      topology_type: draft.topology_type || "",

      min_polygons: draft.min_polygons || "",
      max_polygons: draft.max_polygons || "",
    });
  }

  function handleReset() {
    setDraft({
      is_free: false,
      has_uv: false,
      has_textures: false,
      category: [],
      model_format: "",
      geometry_type: "",
      poly_style: "",
      topology_type: "",
      min_polygons: "",
      max_polygons: "",
    });
    onReset();
  }

  return (
    <div className="catalog-filters">
      <div className="catalog-filters__header">
        <h3 className="catalog-filters__title text-h3">Фильтры</h3>
      </div>

      <div className="catalog-filters__block">
        <label className="catalog-filters__check">
          <input
            type="checkbox"
            checked={draft.is_free}
            onChange={() => toggleBool("is_free")}
            className="catalog-filters__check-input"
          />
          <span className="catalog-filters__check-box" />
          <span className="catalog-filters__check-label text-p2">FREE</span>
        </label>
      </div>

      <div className="catalog-filters__block">
        <div className="catalog-filters__block-title text-p2">Категория</div>
        <div className="catalog-filters__list">
          {categories.map((c) => (
            <label key={c.slug} className="catalog-filters__check">
              <input
                type="checkbox"
                checked={draft.category.includes(c.slug)}
                onChange={() => handleCategoryToggle(c.slug)}
                className="catalog-filters__check-input"
              />
              <span className="catalog-filters__check-box" />
              <span className="catalog-filters__check-label text-p2">
                {c.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="catalog-filters__block">
        <label className="catalog-filters__switch">
          <span className="text-p2">UV-развертка</span>
          <button
            type="button"
            className={`catalog-filters__switch-btn ${draft.has_uv ? "is-on" : ""}`}
            onClick={() => toggleBool("has_uv")}
            aria-pressed={draft.has_uv}
          >
            <span className="catalog-filters__switch-dot" />
          </button>
        </label>

        <label className="catalog-filters__switch">
          <span className="text-p2">Текстуры</span>
          <button
            type="button"
            className={`catalog-filters__switch-btn ${draft.has_textures ? "is-on" : ""}`}
            onClick={() => toggleBool("has_textures")}
            aria-pressed={draft.has_textures}
          >
            <span className="catalog-filters__switch-dot" />
          </button>
        </label>
      </div>

      <div className="catalog-filters__block">
        <div className="catalog-filters__block-title text-p2">Формат</div>
        <div className="catalog-filters__list">
          {formats.map((f) => (
            <label key={f.value} className="catalog-filters__check">
              <input
                type="checkbox"
                checked={draft.model_format === f.value}
                onChange={() =>
                  setField(
                    "model_format",
                    draft.model_format === f.value ? "" : f.value,
                  )
                }
                className="catalog-filters__check-input"
              />
              <span className="catalog-filters__check-box" />
              <span className="catalog-filters__check-label text-p2">
                {f.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="catalog-filters__block">
        <div className="catalog-filters__block-title text-p2">
          Тип геометрии
        </div>
        <div className="catalog-filters__list">
          {polyStyles.map((p) => (
            <label key={p.value} className="catalog-filters__check">
              <input
                type="checkbox"
                checked={draft.poly_style === p.value}
                onChange={() =>
                  setField(
                    "poly_style",
                    draft.poly_style === p.value ? "" : p.value,
                  )
                }
                className="catalog-filters__check-input"
              />
              <span className="catalog-filters__check-box" />
              <span className="catalog-filters__check-label text-p2">
                {p.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="catalog-filters__block">
        <div className="catalog-filters__block-title text-p2">Топология</div>
        <div className="catalog-filters__list">
          {topologyTypes.map((t) => (
            <label key={t.value} className="catalog-filters__check">
              <input
                type="checkbox"
                checked={draft.topology_type === t.value}
                onChange={() =>
                  setField(
                    "topology_type",
                    draft.topology_type === t.value ? "" : t.value,
                  )
                }
                className="catalog-filters__check-input"
              />
              <span className="catalog-filters__check-box" />
              <span className="catalog-filters__check-label text-p2">
                {t.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="catalog-filters__block">
        <div className="catalog-filters__block-title text-p2">
          Кол-во полигонов
        </div>

        <div className="catalog-filters__range">
          <input
            className="catalog-filters__range-input"
            type="number"
            placeholder="min"
            value={draft.min_polygons}
            onChange={(e) => setField("min_polygons", e.target.value)}
          />
          <span className="catalog-filters__range-sep text-p2">—</span>
          <input
            className="catalog-filters__range-input"
            type="number"
            placeholder="max"
            value={draft.max_polygons}
            onChange={(e) => setField("max_polygons", e.target.value)}
          />
        </div>
      </div>

      <div className="catalog-filters__actions">
        <button
          type="button"
          className="catalog-filters__apply text-p2"
          onClick={handleApply}
        >
          Применить
        </button>
        <button
          type="button"
          className="catalog-filters__reset text-p2"
          onClick={handleReset}
        >
          Сбросить
        </button>
      </div>
    </div>
  );
}
