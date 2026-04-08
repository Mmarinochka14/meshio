import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/seller-models-page.css";

import { isAuthenticated } from "../components/auth/authStore";
import { getMyProductsRequest, deleteProductRequest } from "../api/products";

function getTagList(product) {
  const tags = [];

  if (product?.has_textures) tags.push("PBR");
  if (product?.model_format) tags.push(product.model_format.toUpperCase());
  if (product?.has_uv) tags.push("UV");
  if (product?.poly_style) tags.push(product.poly_style.replaceAll("_", "-"));

  return tags.slice(0, 4);
}

export default function SellerModelsPage() {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [pageData, setPageData] = useState({
    count: 0,
    next: null,
    previous: null,
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/");
      return;
    }

    loadProducts();
  }, [navigate]);

  async function loadProducts() {
    try {
      setIsLoading(true);
      const data = await getMyProductsRequest();
      setProducts(data?.results || []);
      setPageData({
        count: data?.count || 0,
        next: data?.next || null,
        previous: data?.previous || null,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(productId) {
    const ok = window.confirm("Удалить модель?");
    if (!ok) return;

    try {
      await deleteProductRequest(productId);
      setProducts((prev) => prev.filter((item) => item.id !== productId));
      setPageData((prev) => ({
        ...prev,
        count: Math.max(0, prev.count - 1),
      }));
    } catch (e) {
      alert("Не удалось удалить модель");
    }
  }

  function handleOpenUpload() {
    window.dispatchEvent(new CustomEvent("open-seller-upload-modal"));
  }

  function handleEdit(productId) {
    // потом подключим edit modal / edit page
    console.log("edit product", productId);
  }

  return (
    <section className="seller-models-page">
      <div className="seller-models-page__container">
        <div className="seller-models-page__top">
          <h1 className="seller-models-page__title text-h2">Мои модели</h1>

          <button
            type="button"
            className="seller-models-page__upload-btn text-p2"
            onClick={handleOpenUpload}
          >
            Загрузить модель
          </button>
        </div>

        <div className="seller-models-page__divider" />

        <div className="seller-models-page__layout">
          <aside className="seller-models-page__filters">
            <div className="seller-models-page__filters-card">
              <div className="seller-models-page__filters-title text-h4">
                Фильтры
              </div>

              <div className="seller-models-page__filters-note text-p3">
                Фильтры добьём следующим шагом. Сначала собираем рабочую seller
                страницу и карточки.
              </div>
            </div>
          </aside>

          <main className="seller-models-page__content">
            {isLoading ? (
              <div className="seller-models-page__state text-p2">
                Загрузка...
              </div>
            ) : products.length === 0 ? (
              <div className="seller-models-page__empty">
                <div className="seller-models-page__empty-title text-h3">
                  Пока нет моделей
                </div>
                <div className="seller-models-page__empty-text text-p2">
                  Загрузите первую модель, чтобы она появилась здесь.
                </div>
                <button
                  type="button"
                  className="seller-models-page__upload-btn text-p2"
                  onClick={handleOpenUpload}
                >
                  Загрузить модель
                </button>
              </div>
            ) : (
              <>
                <div className="seller-models-page__grid">
                  {products.map((product) => {
                    const tags = getTagList(product);

                    return (
                      <article key={product.id} className="seller-model-card">
                        <div className="seller-model-card__preview">
                          {product.main_preview_url ? (
                            <img
                              src={product.main_preview_url}
                              alt={product.title}
                              className="seller-model-card__image"
                            />
                          ) : (
                            <div className="seller-model-card__placeholder text-p2">
                              Нет превью
                            </div>
                          )}
                        </div>

                        <div className="seller-model-card__title text-p2">
                          {product.title || "Без названия"}
                        </div>

                        <div className="seller-model-card__tags">
                          {tags.map((tag) => (
                            <span
                              key={tag}
                              className="seller-model-card__tag text-p3"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="seller-model-card__bottom">
                          <button
                            type="button"
                            className="seller-model-card__edit text-p2"
                            onClick={() => handleEdit(product.id)}
                          >
                            Редактировать
                          </button>

                          <button
                            type="button"
                            className="seller-model-card__delete text-p2"
                            onClick={() => handleDelete(product.id)}
                          >
                            🗑
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className="seller-models-page__footer text-p3">
                  Всего моделей: {pageData.count}
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </section>
  );
}
