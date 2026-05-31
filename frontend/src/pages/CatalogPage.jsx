import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "../styles/catalog-page.css";

import { getProducts, getProductFilters } from "../api/products";
import ProductCard from "../components/ProductCard";
import CatalogFilters from "../components/CatalogFilters";
import CatalogSort from "../components/CatalogSort";
import Pagination from "../components/Pagination";

import allModelsImage from "../assets/images/category-all-models.png";
import charactersImage from "../assets/images/category-characters.png";
import animalsImage from "../assets/images/category-animals.png";
import techImage from "../assets/images/category-tech.png";
import environmentImage from "../assets/images/category-environment.png";

const CATEGORY_CARDS = [
  { slug: "", title: "Все модели", image: allModelsImage },
  { slug: "personazhi", title: "Персонажи", image: charactersImage },
  { slug: "zhivotnye", title: "Животные", image: animalsImage },
  { slug: "tehnika", title: "Техника", image: techImage },
  { slug: "okruzhenie", title: "Окружение", image: environmentImage },
];

function parseBool(val) {
  if (val === "true") return true;
  if (val === "false") return false;
  return null;
}

function buildParamsFromSearchParams(sp) {
  const params = {};

  const q = sp.get("q");
  const category = sp.getAll("category");
  const model_format = sp.get("model_format");
  const geometry_type = sp.get("geometry_type");
  const poly_style = sp.get("poly_style");
  const topology_type = sp.get("topology_type");
  const has_uv = sp.get("has_uv");
  const has_textures = sp.get("has_textures");
  const is_free = sp.get("is_free");
  const min_polygons = sp.get("min_polygons");
  const max_polygons = sp.get("max_polygons");
  const ordering = sp.get("ordering");
  const page = sp.get("page");

  if (q) params.q = q;
  if (category.length) params.category = category;
  if (model_format) params.model_format = model_format;
  if (geometry_type) params.geometry_type = geometry_type;
  if (poly_style) params.poly_style = poly_style;
  if (topology_type) params.topology_type = topology_type;

  if (has_uv !== null) {
    const b = parseBool(has_uv);
    if (b !== null) params.has_uv = b;
  }

  if (has_textures !== null) {
    const b = parseBool(has_textures);
    if (b !== null) params.has_textures = b;
  }

  if (is_free !== null) {
    const b = parseBool(is_free);
    if (b !== null) params.is_free = b;
  }

  if (min_polygons) params.min_polygons = min_polygons;
  if (max_polygons) params.max_polygons = max_polygons;

  params.ordering = ordering || "newest";
  params.page = page || 1;

  return params;
}

function findLabel(options, value) {
  return options?.find((item) => item.value === value)?.label || value;
}

function buildActiveFilterChips(searchParams, meta) {
  const chips = [];
  const categories = meta?.categories || [];

  searchParams.getAll("category").forEach((slug) => {
    const category = categories.find((item) => item.slug === slug);
    chips.push({
      key: `category:${slug}`,
      label: category?.name || slug,
      remove: { key: "category", value: slug },
    });
  });

  [
    ["model_format", "Формат", meta?.formats],
    ["poly_style", "Геометрия", meta?.poly_styles],
    ["topology_type", "Топология", meta?.topology_types],
  ].forEach(([key, label, options]) => {
    const value = searchParams.get(key);
    if (value) {
      chips.push({
        key,
        label: `${label}: ${findLabel(options, value)}`,
        remove: { key },
      });
    }
  });

  [
    ["is_free", "Бесплатные"],
    ["has_uv", "UV"],
    ["has_textures", "Текстуры"],
  ].forEach(([key, label]) => {
    if (searchParams.get(key) === "true") {
      chips.push({ key, label, remove: { key } });
    }
  });

  const minPolygons = searchParams.get("min_polygons");
  const maxPolygons = searchParams.get("max_polygons");

  if (minPolygons || maxPolygons) {
    chips.push({
      key: "polygons",
      label: `Полигоны: ${minPolygons || "0"}-${maxPolygons || "∞"}`,
      remove: { keys: ["min_polygons", "max_polygons"] },
    });
  }

  return chips;
}

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [filtersMeta, setFiltersMeta] = useState(null);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const params = useMemo(
    () => buildParamsFromSearchParams(searchParams),
    [searchParams],
  );

  useEffect(() => {
    let mounted = true;

    async function loadFilters() {
      try {
        const meta = await getProductFilters();
        if (mounted) setFiltersMeta(meta);
      } catch (e) {
        if (mounted) setFiltersMeta(null);
      }
    }

    loadFilters();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadProducts() {
      try {
        setIsLoading(true);
        const res = await getProducts(params);
        if (mounted) setData(res);
      } catch (e) {
        if (mounted) setData(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadProducts();

    return () => {
      mounted = false;
    };
  }, [params]);

  useEffect(() => {
    if (!isFiltersOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isFiltersOpen]);

  function applyQuery(next) {
    const sp = new URLSearchParams(searchParams);

    Object.entries(next).forEach(([key, value]) => {
      sp.delete(key);

      if (
        value === null ||
        value === undefined ||
        value === "" ||
        value === false
      ) {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item !== "" && item !== null && item !== undefined) {
            sp.append(key, String(item));
          }
        });
        return;
      }

      sp.set(key, String(value));
    });

    if (!("page" in next)) sp.delete("page");

    setSearchParams(sp);
  }

  function handleApplyFilters(nextFilters) {
    applyQuery(nextFilters);
    setIsFiltersOpen(false);
  }

  function handleResetFilters() {
    setSearchParams({});
    setIsFiltersOpen(false);
  }

  const results = Array.isArray(data?.results) ? data.results : [];
  const totalCount = data?.count || 0;
  const currentPage = Number(searchParams.get("page") || 1);
  const activeFilterChips = useMemo(
    () => buildActiveFilterChips(searchParams, filtersMeta),
    [searchParams, filtersMeta],
  );

  function removeFilter(remove) {
    const sp = new URLSearchParams(searchParams);

    if (remove.keys) {
      remove.keys.forEach((key) => sp.delete(key));
    } else if (remove.value) {
      const nextValues = sp
        .getAll(remove.key)
        .filter((value) => value !== remove.value);
      sp.delete(remove.key);
      nextValues.forEach((value) => sp.append(remove.key, value));
    } else {
      sp.delete(remove.key);
    }

    sp.delete("page");
    setSearchParams(sp);
  }

  function toggleCategoryCard(slug) {
    const sp = new URLSearchParams(searchParams);
    sp.delete("page");

    if (!slug) {
      sp.delete("category");
      setSearchParams(sp);
      return;
    }

    const categories = sp.getAll("category");
    const isActive = categories.includes(slug);
    const nextCategories = isActive
      ? categories.filter((item) => item !== slug)
      : [...categories, slug];

    sp.delete("category");
    nextCategories.forEach((item) => sp.append("category", item));
    setSearchParams(sp);
  }

  return (
    <div className="catalog-page">
      <div className="catalog-page__container">
        <div className="catalog-page__header">
          <h1 className="catalog-page__title text-h2">Каталог</h1>
          <div className="catalog-page__divider" />
        </div>

        <div className="catalog-page__categories">
          {CATEGORY_CARDS.map((category) => {
            const isActive = category.slug
              ? searchParams.getAll("category").includes(category.slug)
              : searchParams.getAll("category").length === 0;

            return (
              <button
                key={category.title}
                type="button"
                className={`catalog-page__category-card ${
                  isActive ? "is-active" : ""
                }`}
                onClick={() => toggleCategoryCard(category.slug)}
              >
                <span className="catalog-page__category-title text-p2">
                  {category.title}
                </span>
                <img
                  src={category.image}
                  alt=""
                  className="catalog-page__category-image"
                />
              </button>
            );
          })}
        </div>

        <div className="catalog-page__promo">
          <div className="catalog-page__promo-main">
            <span className="catalog-page__promo-kicker text-p3">
              Новые поступления
            </span>
            <h2 className="catalog-page__promo-title text-h3">
              Свежие 3D-модели для быстрых прототипов
            </h2>
          </div>

          <button
            type="button"
            className="catalog-page__promo-action text-p2"
            onClick={() => applyQuery({ ordering: "newest" })}
          >
            Смотреть новинки
          </button>
        </div>

        <div className="catalog-page__top-row">
          <div className="catalog-page__summary text-p3">
            {isLoading
              ? "Ищем модели..."
              : `${totalCount} ${totalCount === 1 ? "модель" : "моделей"}`}
          </div>

          <div className="catalog-page__top-controls">
            <CatalogSort
              value={searchParams.get("ordering") || "newest"}
              options={filtersMeta?.sort_options || []}
              onChange={(ordering) => applyQuery({ ordering })}
            />

            <button
              type="button"
              className="catalog-page__mobile-filters-btn text-p2"
              onClick={() => setIsFiltersOpen(true)}
            >
              Фильтры
            </button>
          </div>
        </div>

        {activeFilterChips.length > 0 ? (
          <div className="catalog-page__active-filters">
            <span className="catalog-page__active-filters-label text-p3">
              Активные фильтры
            </span>

            {activeFilterChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                className="catalog-page__filter-chip text-p3"
                onClick={() => removeFilter(chip.remove)}
              >
                <span>{chip.label}</span>
                <span className="catalog-page__filter-chip-x">×</span>
              </button>
            ))}

            <button
              type="button"
              className="catalog-page__filter-reset text-p3"
              onClick={() => setSearchParams({})}
            >
              Сбросить всё
            </button>
          </div>
        ) : null}

        <div className="catalog-page__layout">
          <aside className="catalog-page__filters">
            <CatalogFilters
              meta={filtersMeta}
              searchParams={searchParams}
              onApply={(nextFilters) => applyQuery(nextFilters)}
              onReset={() => setSearchParams({})}
            />
          </aside>

          <main className="catalog-page__content">
            {isLoading ? (
              <div className="catalog-page__skeleton-grid">
                {Array.from({ length: 6 }, (_, index) => (
                  <div key={index} className="catalog-page__skeleton-card" />
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="page-state">Ничего не найдено</div>
            ) : (
              <>
                <div className="catalog-page__grid">
                  {results.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                <Pagination
                  count={totalCount}
                  page={currentPage}
                  pageSize={12}
                  onPageChange={(p) => applyQuery({ page: p })}
                />
              </>
            )}
          </main>
        </div>
      </div>

      {isFiltersOpen && (
        <>
          <div
            className="catalog-page__filters-backdrop"
            onClick={() => setIsFiltersOpen(false)}
          />

          <div className="catalog-page__filters-sheet">
            <div className="catalog-page__filters-sheet-header">
              <h2 className="catalog-page__filters-sheet-title text-h3">
                Фильтры
              </h2>

              <button
                type="button"
                className="catalog-page__filters-close"
                onClick={() => setIsFiltersOpen(false)}
                aria-label="Закрыть фильтры"
              >
                ×
              </button>
            </div>

            <CatalogFilters
              meta={filtersMeta}
              searchParams={searchParams}
              onApply={handleApplyFilters}
              onReset={handleResetFilters}
            />
          </div>
        </>
      )}
    </div>
  );
}
