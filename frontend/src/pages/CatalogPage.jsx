import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "../styles/catalog-page.css";

import { getProducts, getProductFilters } from "../api/products";
import ProductCard from "../components/ProductCard";
import CatalogFilters from "../components/CatalogFilters";
import CatalogSort from "../components/CatalogSort";
import Pagination from "../components/Pagination";

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

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [filtersMeta, setFiltersMeta] = useState(null);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const results = Array.isArray(data?.results) ? data.results : [];
  const totalCount = data?.count || 0;
  const currentPage = Number(searchParams.get("page") || 1);

  return (
    <div className="catalog-page">
      <div className="catalog-page__container">
        <div className="catalog-page__header">
          <h1 className="catalog-page__title text-h2">Каталог</h1>
          <div className="catalog-page__divider" />
        </div>

        <div className="catalog-page__top-row">
          <CatalogSort
            value={searchParams.get("ordering") || "newest"}
            options={filtersMeta?.sort_options || []}
            onChange={(ordering) => applyQuery({ ordering })}
          />
        </div>

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
              <div className="page-state">Загрузка…</div>
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
    </div>
  );
}
