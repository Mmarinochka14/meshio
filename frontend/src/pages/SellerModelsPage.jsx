import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../styles/seller-models-page.css";

import Pagination from "../components/Pagination";
import uploadIcon from "../assets/icons/upload.svg";
import { isAuthenticated } from "../components/auth/authStore";
import SellerModelCard from "../components/SellerModelCard";
import SellerModelsFilters from "../components/SellerModelsFilters";
import {
  archiveProductRequest,
  deleteProductRequest,
  getMyProductsRequest,
  getProductFilters,
  sendProductToReviewRequest,
} from "../api/products";

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
  const poly_style = sp.get("poly_style");
  const topology_type = sp.get("topology_type");
  const has_uv = sp.get("has_uv");
  const has_textures = sp.get("has_textures");
  const min_polygons = sp.get("min_polygons");
  const max_polygons = sp.get("max_polygons");
  const ordering = sp.get("ordering");
  const page = sp.get("page");

  if (q) params.q = q;
  if (category.length) params.category = category;
  if (model_format) params.model_format = model_format;
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

  if (min_polygons) params.min_polygons = min_polygons;
  if (max_polygons) params.max_polygons = max_polygons;

  params.ordering = ordering || "newest";
  params.page = page || 1;

  return params;
}

export default function SellerModelsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isLoading, setIsLoading] = useState(true);
  const [metaLoading, setMetaLoading] = useState(true);

  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const [pageData, setPageData] = useState({
    count: 0,
    next: null,
    previous: null,
  });

  const statusTab = searchParams.get("status_tab") || "all";

  const params = useMemo(
    () => buildParamsFromSearchParams(searchParams),
    [searchParams],
  );

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    let mounted = true;

    async function loadMeta() {
      try {
        setMetaLoading(true);

        const data = await getProductFilters();

        if (mounted) {
          setMeta(data);
        }
      } catch (e) {
        console.error("Не удалось загрузить фильтры", e);

        if (mounted) {
          setMeta(null);
        }
      } finally {
        if (mounted) {
          setMetaLoading(false);
        }
      }
    }

    loadMeta();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadProducts() {
      try {
        setIsLoading(true);

        const data = await getMyProductsRequest(params);

        if (!mounted) return;

        setProducts(data?.results || []);
        setPageData({
          count: data?.count || 0,
          next: data?.next || null,
          previous: data?.previous || null,
        });
      } catch (e) {
        console.error("Не удалось загрузить модели продавца", e);

        if (!mounted) return;

        setProducts([]);
        setPageData({
          count: 0,
          next: null,
          previous: null,
        });
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      mounted = false;
    };
  }, [params]);

  useEffect(() => {
    function handleRefresh() {
      loadProductsManually();
    }

    window.addEventListener("seller-products-updated", handleRefresh);

    return () => {
      window.removeEventListener("seller-products-updated", handleRefresh);
    };
  }, [params]);

  async function loadProductsManually() {
    try {
      setIsLoading(true);

      const data = await getMyProductsRequest(params);

      setProducts(data?.results || []);
      setPageData({
        count: data?.count || 0,
        next: data?.next || null,
        previous: data?.previous || null,
      });
    } catch (e) {
      console.error("Не удалось обновить модели продавца", e);
    } finally {
      setIsLoading(false);
    }
  }

  function handleOpenUpload() {
    window.dispatchEvent(new CustomEvent("open-seller-upload-modal"));
  }

  function handleEdit(product) {
    window.dispatchEvent(
      new CustomEvent("open-seller-edit-modal", {
        detail: { product },
      }),
    );
  }

  async function handleArchive(product) {
    const ok = window.confirm(`Снять с публикации модель "${product.title}"?`);
    if (!ok) return;

    setStatusMessage("");

    try {
      await archiveProductRequest(product.id);
      await loadProductsManually();
    } catch (e) {
      console.error(e);
      setStatusMessage("Не удалось снять модель с публикации.");
    }
  }

  async function handleDelete(product) {
    const ok = window.confirm(`Удалить модель "${product.title}"?`);
    if (!ok) return;

    setStatusMessage("");

    try {
      await deleteProductRequest(product.id);

      setProducts((prev) => prev.filter((item) => item.id !== product.id));
      setPageData((prev) => ({
        ...prev,
        count: Math.max(0, prev.count - 1),
      }));
    } catch (e) {
      console.error(e);
      setStatusMessage("Не удалось удалить модель.");
    }
  }

  async function handleSendToReview(product) {
    setStatusMessage("");

    try {
      await sendProductToReviewRequest(product.id);
      await loadProductsManually();
    } catch (e) {
      console.error(e);

      const msg =
        e?.response?.data?.detail || "Не удалось отправить модель на модерацию";

      setStatusMessage(msg);
    }
  }

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

    if (!("page" in next)) {
      sp.delete("page");
    }

    setSearchParams(sp);
  }

  function setStatusTab(nextStatus) {
    const sp = new URLSearchParams(searchParams);

    if (nextStatus === "all") {
      sp.delete("status_tab");
    } else {
      sp.set("status_tab", nextStatus);
    }

    sp.delete("page");
    setSearchParams(sp);
  }

  function handleApplyFilters(nextFilters) {
    applyQuery(nextFilters);
    setIsFiltersOpen(false);
  }

  function handleResetFilters() {
    const next = new URLSearchParams();

    const currentQuery = searchParams.get("q") || "";

    if (statusTab !== "all") {
      next.set("status_tab", statusTab);
    }

    if (currentQuery) {
      next.set("q", currentQuery);
    }

    setSearchParams(next);
    setIsFiltersOpen(false);
  }

  const filteredProducts = useMemo(() => {
    if (statusTab === "all") return products;

    return products.filter((product) => product.status === statusTab);
  }, [products, statusTab]);

  const currentQuery = searchParams.get("q") || "";

  return (
    <section className="seller-models-page">
      <div className="seller-models-page__container">
        <div className="seller-models-page__top">
          <h1 className="seller-models-page__title text-h2">
            {currentQuery ? `Поиск по моделям: ${currentQuery}` : "Мои модели"}
          </h1>

          <button
            type="button"
            className="seller-models-page__upload-btn text-p2"
            onClick={handleOpenUpload}
          >
            <img
              src={uploadIcon}
              alt=""
              className="seller-models-page__upload-icon"
            />
            <span>Загрузить модель</span>
          </button>
        </div>

        <div className="seller-models-page__divider" />

        {statusMessage ? (
          <div className="seller-models-page__notice text-p2">
            {statusMessage}
          </div>
        ) : null}

        <div className="seller-models-page__tabs">
          <button
            type="button"
            className={`seller-models-page__tab text-p2 ${
              statusTab === "all" ? "is-active" : ""
            }`}
            onClick={() => setStatusTab("all")}
          >
            Все
          </button>

          <button
            type="button"
            className={`seller-models-page__tab text-p2 ${
              statusTab === "published" ? "is-active" : ""
            }`}
            onClick={() => setStatusTab("published")}
          >
            Опубликованные
          </button>

          <button
            type="button"
            className={`seller-models-page__tab text-p2 ${
              statusTab === "pending_review" ? "is-active" : ""
            }`}
            onClick={() => setStatusTab("pending_review")}
          >
            На модерации
          </button>

          <button
            type="button"
            className={`seller-models-page__tab text-p2 ${
              statusTab === "draft" ? "is-active" : ""
            }`}
            onClick={() => setStatusTab("draft")}
          >
            Черновики
          </button>

          <button
            type="button"
            className={`seller-models-page__tab text-p2 ${
              statusTab === "archived" ? "is-active" : ""
            }`}
            onClick={() => setStatusTab("archived")}
          >
            Архив
          </button>

          <button
            type="button"
            className={`seller-models-page__tab text-p2 ${
              statusTab === "rejected" ? "is-active" : ""
            }`}
            onClick={() => setStatusTab("rejected")}
          >
            Отклонённые
          </button>
        </div>

        <button
          type="button"
          className={`seller-models-page__filters-toggle ${
            isFiltersOpen ? "is-open" : ""
          }`}
          onClick={() => setIsFiltersOpen((prev) => !prev)}
        >
          <span className="seller-models-page__filters-toggle-text text-p2">
            Фильтры
          </span>

          <span className="seller-models-page__filters-toggle-arrow" />
        </button>

        <div className="seller-models-page__layout">
          <aside
            className={`seller-models-page__sidebar ${
              isFiltersOpen ? "is-open" : ""
            }`}
          >
            {metaLoading ? (
              <div className="seller-models-page__sidebar-state text-p2">
                Загрузка фильтров...
              </div>
            ) : (
              <SellerModelsFilters
                meta={meta}
                searchParams={searchParams}
                onApply={handleApplyFilters}
                onReset={handleResetFilters}
              />
            )}
          </aside>

          <main className="seller-models-page__content">
            {isLoading ? (
              <div className="seller-models-page__state text-p2">
                Загрузка...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="seller-models-page__empty">
                <div className="seller-models-page__empty-title text-h3">
                  Ничего не найдено
                </div>

                <div className="seller-models-page__empty-text text-p2">
                  В этом разделе пока нет моделей.
                </div>
              </div>
            ) : (
              <>
                <div className="seller-models-page__grid">
                  {filteredProducts.map((product) => (
                    <SellerModelCard
                      key={product.id}
                      product={product}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onArchive={handleArchive}
                      onSendToReview={handleSendToReview}
                    />
                  ))}
                </div>

                <div className="seller-models-page__bottom">
                  <div className="seller-models-page__count text-p3">
                    Всего моделей: {pageData.count}
                  </div>

                  <Pagination
                    count={pageData.count}
                    page={Number(searchParams.get("page") || 1)}
                    pageSize={12}
                    onPageChange={(p) => applyQuery({ page: p })}
                  />
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </section>
  );
}
