import { useEffect, useMemo, useState } from "react";
import "../styles/seller-models-filters.css";

function spGet(searchParams, key) {
  const value = searchParams.get(key);
  return value === null ? "" : value;
}

function spGetBool(searchParams, key) {
  const value = searchParams.get(key);

  if (value === "true") return true;
  if (value === "false") return false;

  return false;
}

function FilterBlock({ title, name, collapsed, onToggle, children }) {
  const isCollapsed = Boolean(collapsed[name]);

  return (
    <div
      className={`seller-models-filters__block ${
        isCollapsed ? "is-collapsed" : ""
      }`}
    >
      <button
        type="button"
        className="seller-models-filters__block-head"
        onClick={() => onToggle(name)}
      >
        <span className="seller-models-filters__block-title text-p2">
          {title}
        </span>

        <span className="seller-models-filters__block-arrow" />
      </button>

      <div className="seller-models-filters__block-body">{children}</div>
    </div>
  );
}

export default function SellerModelsFilters({
  meta,
  searchParams,
  onApply,
  onReset,
}) {
  const initial = useMemo(
    () => ({
      has_uv: spGetBool(searchParams, "has_uv"),
      has_textures: spGetBool(searchParams, "has_textures"),

      category: searchParams.getAll("category"),
      model_format: spGet(searchParams, "model_format"),
      poly_style: spGet(searchParams, "poly_style"),
      topology_type: spGet(searchParams, "topology_type"),

      min_polygons: spGet(searchParams, "min_polygons"),
      max_polygons: spGet(searchParams, "max_polygons"),
    }),
    [searchParams],
  );

  const [draft, setDraft] = useState(initial);

  const [collapsed, setCollapsed] = useState({
    category: false,
    features: false,
    format: false,
    geometry: true,
    topology: true,
    polygons: true,
  });

  useEffect(() => {
    setDraft(initial);
  }, [initial]);

  const categories = meta?.categories || [];
  const formats = meta?.formats || [];
  const polyStyles = meta?.poly_styles || [];
  const topologyTypes = meta?.topology_types || [];

  function toggleBlock(name) {
    setCollapsed((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  }

  function setField(name, value) {
    setDraft((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function toggleBool(name) {
    setDraft((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
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
      has_uv: draft.has_uv ? "true" : "",
      has_textures: draft.has_textures ? "true" : "",

      category: draft.category,
      model_format: draft.model_format || "",
      poly_style: draft.poly_style || "",
      topology_type: draft.topology_type || "",

      min_polygons: draft.min_polygons || "",
      max_polygons: draft.max_polygons || "",
    });
  }

  function handleReset() {
    const cleanDraft = {
      has_uv: false,
      has_textures: false,

      category: [],
      model_format: "",
      poly_style: "",
      topology_type: "",

      min_polygons: "",
      max_polygons: "",
    };

    setDraft(cleanDraft);
    onReset();
  }

  return (
    <div className="seller-models-filters">
      <div className="seller-models-filters__header">
        <h3 className="seller-models-filters__title text-h3">Фильтры</h3>
      </div>

      <FilterBlock
        title="Категория"
        name="category"
        collapsed={collapsed}
        onToggle={toggleBlock}
      >
        <div className="seller-models-filters__list">
          {categories.length > 0 ? (
            categories.map((category) => (
              <label
                key={category.slug}
                className="seller-models-filters__check"
              >
                <input
                  type="checkbox"
                  checked={draft.category.includes(category.slug)}
                  onChange={() => handleCategoryToggle(category.slug)}
                  className="seller-models-filters__check-input"
                />

                <span className="seller-models-filters__check-box" />

                <span className="seller-models-filters__check-label text-p2">
                  {category.name}
                </span>
              </label>
            ))
          ) : (
            <div className="seller-models-filters__empty text-p3">
              Категории не найдены
            </div>
          )}
        </div>
      </FilterBlock>

      <FilterBlock
        title="Характеристики"
        name="features"
        collapsed={collapsed}
        onToggle={toggleBlock}
      >
        <div className="seller-models-filters__switches">
          <div className="seller-models-filters__switch">
            <span className="text-p2">UV-развертка</span>

            <button
              type="button"
              className={`seller-models-filters__switch-btn ${
                draft.has_uv ? "is-on" : ""
              }`}
              onClick={() => toggleBool("has_uv")}
              aria-pressed={draft.has_uv}
            >
              <span className="seller-models-filters__switch-dot" />
            </button>
          </div>

          <div className="seller-models-filters__switch">
            <span className="text-p2">Текстуры</span>

            <button
              type="button"
              className={`seller-models-filters__switch-btn ${
                draft.has_textures ? "is-on" : ""
              }`}
              onClick={() => toggleBool("has_textures")}
              aria-pressed={draft.has_textures}
            >
              <span className="seller-models-filters__switch-dot" />
            </button>
          </div>
        </div>
      </FilterBlock>

      <FilterBlock
        title="Формат"
        name="format"
        collapsed={collapsed}
        onToggle={toggleBlock}
      >
        <div className="seller-models-filters__list">
          {formats.length > 0 ? (
            formats.map((format) => (
              <label
                key={format.value}
                className="seller-models-filters__check"
              >
                <input
                  type="checkbox"
                  checked={draft.model_format === format.value}
                  onChange={() =>
                    setField(
                      "model_format",
                      draft.model_format === format.value ? "" : format.value,
                    )
                  }
                  className="seller-models-filters__check-input"
                />

                <span className="seller-models-filters__check-box" />

                <span className="seller-models-filters__check-label text-p2">
                  {format.label}
                </span>
              </label>
            ))
          ) : (
            <div className="seller-models-filters__empty text-p3">
              Форматы не найдены
            </div>
          )}
        </div>
      </FilterBlock>

      <FilterBlock
        title="Тип геометрии"
        name="geometry"
        collapsed={collapsed}
        onToggle={toggleBlock}
      >
        <div className="seller-models-filters__list">
          {polyStyles.length > 0 ? (
            polyStyles.map((polyStyle) => (
              <label
                key={polyStyle.value}
                className="seller-models-filters__check"
              >
                <input
                  type="checkbox"
                  checked={draft.poly_style === polyStyle.value}
                  onChange={() =>
                    setField(
                      "poly_style",
                      draft.poly_style === polyStyle.value
                        ? ""
                        : polyStyle.value,
                    )
                  }
                  className="seller-models-filters__check-input"
                />

                <span className="seller-models-filters__check-box" />

                <span className="seller-models-filters__check-label text-p2">
                  {polyStyle.label}
                </span>
              </label>
            ))
          ) : (
            <div className="seller-models-filters__empty text-p3">
              Типы геометрии не найдены
            </div>
          )}
        </div>
      </FilterBlock>

      <FilterBlock
        title="Топология"
        name="topology"
        collapsed={collapsed}
        onToggle={toggleBlock}
      >
        <div className="seller-models-filters__list">
          {topologyTypes.length > 0 ? (
            topologyTypes.map((topologyType) => (
              <label
                key={topologyType.value}
                className="seller-models-filters__check"
              >
                <input
                  type="checkbox"
                  checked={draft.topology_type === topologyType.value}
                  onChange={() =>
                    setField(
                      "topology_type",
                      draft.topology_type === topologyType.value
                        ? ""
                        : topologyType.value,
                    )
                  }
                  className="seller-models-filters__check-input"
                />

                <span className="seller-models-filters__check-box" />

                <span className="seller-models-filters__check-label text-p2">
                  {topologyType.label}
                </span>
              </label>
            ))
          ) : (
            <div className="seller-models-filters__empty text-p3">
              Типы топологии не найдены
            </div>
          )}
        </div>
      </FilterBlock>

      <FilterBlock
        title="Количество полигонов"
        name="polygons"
        collapsed={collapsed}
        onToggle={toggleBlock}
      >
        <div className="seller-models-filters__range">
          <input
            className="seller-models-filters__range-input text-p2"
            type="number"
            placeholder="min"
            value={draft.min_polygons}
            onChange={(e) => setField("min_polygons", e.target.value)}
          />

          <span className="seller-models-filters__range-sep text-p2">—</span>

          <input
            className="seller-models-filters__range-input text-p2"
            type="number"
            placeholder="max"
            value={draft.max_polygons}
            onChange={(e) => setField("max_polygons", e.target.value)}
          />
        </div>
      </FilterBlock>

      <div className="seller-models-filters__actions">
        <button
          type="button"
          className="seller-models-filters__apply text-p2"
          onClick={handleApply}
        >
          Применить
        </button>

        <button
          type="button"
          className="seller-models-filters__reset text-p2"
          onClick={handleReset}
        >
          Сбросить
        </button>
      </div>
    </div>
  );
}
