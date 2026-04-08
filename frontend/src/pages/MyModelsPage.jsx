import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import CatalogFilters from "../components/CatalogFilters";
import MyModelCard from "../components/MyModelCard";
import {
  downloadProduct,
  getMyPurchasedProducts,
  getProductFilters,
} from "../api/products";

import "../styles/catalog-page.css";

function matchesFilters(product, filters) {
  if (filters.category && product.category?.slug !== filters.category) {
    return false;
  }

  if (filters.model_format && product.model_format !== filters.model_format) {
    return false;
  }

  if (filters.poly_style && product.poly_style !== filters.poly_style) {
    return false;
  }

  if (
    filters.topology_type &&
    product.topology_type !== filters.topology_type
  ) {
    return false;
  }

  if (filters.has_uv === "true" && !product.has_uv) {
    return false;
  }

  if (filters.has_textures === "true" && !product.has_textures) {
    return false;
  }

  if (filters.min_polygons) {
    if (Number(product.polygon_count || 0) < Number(filters.min_polygons)) {
      return false;
    }
  }

  if (filters.max_polygons) {
    if (Number(product.polygon_count || 0) > Number(filters.max_polygons)) {
      return false;
    }
  }

  return true;
}

export default function MyModelsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [meta, setMeta] = useState(null);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadPage() {
      try {
        setIsLoading(true);
        setError("");

        const [filtersData, purchasedData] = await Promise.all([
          getProductFilters(),
          getMyPurchasedProducts(),
        ]);

        if (!mounted) return;

        setMeta(filtersData);

        const results = Array.isArray(purchasedData?.results)
          ? purchasedData.results
          : Array.isArray(purchasedData)
            ? purchasedData
            : [];

        const products = results.map((item) => item.product).filter(Boolean);

        setItems(products);
      } catch (err) {
        if (!mounted) return;
        setError(
          err?.response?.data?.detail || "Не удалось загрузить ваши модели.",
        );
        setItems([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadPage();

    return () => {
      mounted = false;
    };
  }, []);

  const filters = useMemo(
    () => ({
      category: searchParams.get("category") || "",
      model_format: searchParams.get("model_format") || "",
      poly_style: searchParams.get("poly_style") || "",
      topology_type: searchParams.get("topology_type") || "",
      has_uv: searchParams.get("has_uv") || "",
      has_textures: searchParams.get("has_textures") || "",
      min_polygons: searchParams.get("min_polygons") || "",
      max_polygons: searchParams.get("max_polygons") || "",
    }),
    [searchParams],
  );

  const filteredItems = useMemo(() => {
    return items.filter((product) => matchesFilters(product, filters));
  }, [items, filters]);

  function handleApply(nextFilters) {
    const params = new URLSearchParams();

    Object.entries(nextFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    setSearchParams(params);
  }

  function handleReset() {
    setSearchParams(new URLSearchParams());
  }

  async function handleDownload(product) {
    try {
      const data = await downloadProduct(product.id);
      const url = data?.download_url;

      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error("Не удалось скачать модель", err);
    }
  }

  return (
    <section className="catalog-page">
      <div className="catalog-page__container">
        <div className="catalog-page__top">
          <h1 className="catalog-page__title text-h2">Мои модели</h1>
          <p className="catalog-page__subtitle text-p2">
            Купленные модели, доступные для повторного скачивания.
          </p>
        </div>

        <div className="catalog-page__layout">
          <aside className="catalog-page__sidebar">
            <CatalogFilters
              meta={meta}
              searchParams={searchParams}
              onApply={handleApply}
              onReset={handleReset}
            />
          </aside>

          <div className="catalog-page__content">
            {isLoading ? (
              <div className="catalog-page__state text-p2">Загрузка...</div>
            ) : error ? (
              <div className="catalog-page__state text-p2">{error}</div>
            ) : filteredItems.length === 0 ? (
              <div className="catalog-page__state text-p2">
                Пока нет купленных моделей.
              </div>
            ) : (
              <div className="catalog-page__grid">
                {filteredItems.map((product) => (
                  <MyModelCard
                    key={product.id}
                    product={product}
                    onDownload={handleDownload}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
