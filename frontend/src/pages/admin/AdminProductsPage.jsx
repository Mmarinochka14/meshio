import { useEffect, useState } from "react";
import "../../styles/admin.css";
import apiClient from "../../api/client";

function normalizePreview(url) {
  if (!url) return "";
  return url.startsWith("http") ? url : `http://127.0.0.1:8000${url}`;
}

function formatStatus(status) {
  const map = {
    pending_review: "На модерации",
    published: "Опубликован",
    rejected: "Отклонён",
    archived: "В архиве",
    draft: "Черновик",
  };

  return map[status] || status || "—";
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setIsLoading(true);

      const res = await apiClient.get("/products/moderation-queue/");
      const items = Array.isArray(res.data?.results) ? res.data.results : [];

      setProducts(items);
    } catch (e) {
      console.error("Не удалось загрузить товары на модерации", e);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleApprove(productId) {
    try {
      await apiClient.patch(`/products/${productId}/moderate/`, {
        status: "published",
        moderation_comment: "",
      });

      await loadProducts();
    } catch (e) {
      console.error("Не удалось опубликовать товар", e);
      alert("Не удалось опубликовать товар");
    }
  }

  async function handleReject(productId) {
    const comment = window.prompt("Причина отклонения:", "");

    if (comment === null) return;

    try {
      await apiClient.patch(`/products/${productId}/moderate/`, {
        status: "rejected",
        moderation_comment: comment,
      });

      await loadProducts();
    } catch (e) {
      console.error("Не удалось отклонить товар", e);
      alert("Не удалось отклонить товар");
    }
  }

  if (isLoading) {
    return <div className="admin__state text-p2">Загрузка...</div>;
  }

  return (
    <section className="admin-products-page">
      <div className="admin__header">
        <h1 className="admin__title text-h2">Модерация товаров</h1>
        <div className="admin__subtitle text-p2">
          Здесь администратор проверяет модели перед публикацией.
        </div>
      </div>

      {products.length === 0 ? (
        <div className="admin__empty">
          <div className="admin__empty-title text-h3">
            Сейчас нет товаров на модерации
          </div>
          <div className="admin__empty-text text-p2">
            Когда продавцы отправят новые модели на проверку, они появятся
            здесь.
          </div>
        </div>
      ) : (
        <div className="admin__grid">
          {products.map((product) => {
            const previewSrc = normalizePreview(product.main_preview_url);

            return (
              <article key={product.id} className="admin__card">
                <div className="admin__card-preview">
                  <div className="admin__card-badge text-p3">
                    {formatStatus(product.status)}
                  </div>

                  {previewSrc ? (
                    <img
                      src={previewSrc}
                      alt={product.title}
                      className="admin__card-preview-image"
                    />
                  ) : (
                    <div className="admin__card-preview-placeholder text-p3">
                      Preview
                    </div>
                  )}
                </div>

                <div className="admin__card-body">
                  <div className="admin__card-title text-h4">
                    {product.title || "Без названия"}
                  </div>

                  <div className="admin__card-meta-list">
                    <div className="admin__card-meta text-p2">
                      <span className="admin__card-meta-label">Автор:</span>
                      <span className="admin__card-meta-value">
                        {product.seller_username || "—"}
                      </span>
                    </div>

                    <div className="admin__card-meta text-p2">
                      <span className="admin__card-meta-label">Категория:</span>
                      <span className="admin__card-meta-value">
                        {product.category_name || "—"}
                      </span>
                    </div>

                    <div className="admin__card-meta text-p2">
                      <span className="admin__card-meta-label">Лицензия:</span>
                      <span className="admin__card-meta-value">
                        {product.license_name || "—"}
                      </span>
                    </div>

                    <div className="admin__card-meta text-p2">
                      <span className="admin__card-meta-label">Цена:</span>
                      <span className="admin__card-meta-value">
                        {Number(product.price || 0)} ₽
                      </span>
                    </div>
                  </div>

                  {product.moderation_comment ? (
                    <div className="admin__comment text-p3">
                      <span className="admin__comment-label">Комментарий:</span>
                      <span>{product.moderation_comment}</span>
                    </div>
                  ) : null}

                  <div className="admin__actions">
                    <button
                      type="button"
                      className="admin__approve text-p2"
                      onClick={() => handleApprove(product.id)}
                    >
                      Одобрить
                    </button>

                    <button
                      type="button"
                      className="admin__reject text-p2"
                      onClick={() => handleReject(product.id)}
                    >
                      Отклонить
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
