import { useEffect, useState } from "react";
import "../../styles/admin.css";
import apiClient from "../../api/client";
import { buildMediaUrl } from "../../api/url";
import ConfirmModal from "../../components/ConfirmModal";

function normalizePreview(url) {
  return buildMediaUrl(url);
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

function getStatusClass(status) {
  if (status === "published") return "is-published";
  if (status === "pending_review") return "is-pending";
  if (status === "rejected") return "is-rejected";
  if (status === "archived") return "is-archived";
  if (status === "draft") return "is-draft";
  return "";
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [moderationModal, setModerationModal] = useState(null);
  const [rejectComment, setRejectComment] = useState("");

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

  function openApproveModal(product) {
    setModerationModal({ type: "approve", product });
    setRejectComment("");
    setStatusMessage("");
  }

  function openRejectModal(product) {
    setModerationModal({ type: "reject", product });
    setRejectComment(product.moderation_comment || "");
    setStatusMessage("");
  }

  function closeModerationModal() {
    setModerationModal(null);
    setRejectComment("");
  }

  async function handleApprove(productId) {
    setStatusMessage("");

    try {
      await apiClient.patch(`/products/${productId}/moderate/`, {
        status: "published",
        moderation_comment: "",
      });

      setProducts((prev) =>
        prev.map((item) =>
          item.id === productId
            ? { ...item, status: "published", moderation_comment: "" }
            : item,
        ),
      );
      setStatusMessage("Товар одобрен.");
      closeModerationModal();
      await loadProducts();
    } catch (e) {
      console.error("Не удалось опубликовать товар", e);
      setStatusMessage("Не удалось опубликовать товар.");
    }
  }

  async function handleReject(productId) {
    const comment = rejectComment.trim();

    setStatusMessage("");

    try {
      await apiClient.patch(`/products/${productId}/moderate/`, {
        status: "rejected",
        moderation_comment: comment,
      });

      setProducts((prev) =>
        prev.map((item) =>
          item.id === productId
            ? { ...item, status: "rejected", moderation_comment: comment }
            : item,
        ),
      );
      setStatusMessage("Товар отклонен.");
      closeModerationModal();
      await loadProducts();
    } catch (e) {
      console.error("Не удалось отклонить товар", e);
      setStatusMessage("Не удалось отклонить товар.");
    }
  }

  if (isLoading) {
    return <div className="admin__state text-p2">Загрузка...</div>;
  }

  return (
    <section className="admin-products-page">
      <div className="admin__header">
        <h1 className="admin__title text-h2">Модерация товаров</h1>
      </div>

      {statusMessage ? (
        <div className={`admin__notice ${statusMessage.startsWith("Не удалось") ? "admin__notice--error" : "admin__notice--success"} text-p2`}>
          {statusMessage}
        </div>
      ) : null}

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
            const isPublished = product.status === "published";
            const isRejected = product.status === "rejected";

            return (
              <article key={product.id} className="admin__card">
                <div className="admin__card-preview">
                  <div className={`admin__card-badge admin__status-badge text-p3 ${getStatusClass(product.status)}`}>
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

                  <div className={`admin__actions ${isPublished || isRejected ? "admin__actions--single" : ""}`}>
                    {!isPublished ? (
                      <button
                        type="button"
                        className="admin__approve text-p2"
                        onClick={() => openApproveModal(product)}
                      >
                        Одобрить
                      </button>
                    ) : null}

                    {!isRejected ? (
                      <button
                        type="button"
                        className="admin__reject text-p2"
                        onClick={() => openRejectModal(product)}
                      >
                        Отклонить
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(moderationModal)}
        title={
          moderationModal?.type === "approve"
            ? "Одобрить модель?"
            : "Отклонить модель?"
        }
        description={
          moderationModal?.type === "approve"
            ? "Модель станет опубликованной и будет доступна в каталоге."
            : "Модель будет снята с публикации. Укажите причину, чтобы продавец понял, что исправить."
        }
        confirmText={moderationModal?.type === "approve" ? "Одобрить" : "Отклонить"}
        cancelText="Отмена"
        danger={moderationModal?.type === "reject"}
        commentLabel={moderationModal?.type === "reject" ? "Комментарий модератора" : ""}
        commentValue={rejectComment}
        commentPlaceholder="Например: некачественная модель или нарушены требования"
        onCommentChange={moderationModal?.type === "reject" ? setRejectComment : undefined}
        confirmDisabled={
          moderationModal?.type === "reject" && rejectComment.trim().length === 0
        }
        onClose={closeModerationModal}
        onConfirm={() =>
          moderationModal?.type === "approve"
            ? handleApprove(moderationModal.product.id)
            : handleReject(moderationModal.product.id)
        }
      />
    </section>
  );
}
