import "../styles/seller-model-card.css";
import { buildMediaUrl } from "../api/url";
import { useNavigate } from "react-router-dom";

function getTagList(product) {
  const tags = [];

  if (product?.has_textures) tags.push("PBR");
  if (product?.model_format) tags.push(product.model_format.toUpperCase());
  if (product?.has_uv) tags.push("UV");

  if (product?.poly_style) {
    tags.push(
      product.poly_style
        .replaceAll("_", "-")
        .replace(/\b\w/g, (char) => char.toUpperCase()),
    );
  }

  return tags.slice(0, 4);
}

function getStatusLabel(status) {
  if (status === "published") return "Опубликовано";
  if (status === "pending_review") return "На модерации";
  if (status === "draft") return "Черновик";
  if (status === "archived") return "В архиве";
  if (status === "rejected") return "Отклонено";
  return status || "Без статуса";
}

function getStatusClass(status) {
  if (status === "published") return "is-published";
  if (status === "pending_review") return "is-pending";
  if (status === "draft") return "is-draft";
  if (status === "archived") return "is-archived";
  if (status === "rejected") return "is-rejected";
  return "";
}

export default function SellerModelCard({
  product,
  onEdit,
  onDelete,
  onArchive,
  onSendToReview,
}) {
  const navigate = useNavigate();
  const rawPreview =
    product?.main_preview_url ||
    product?.preview_url ||
    product?.main_preview ||
    "";

  const previewSrc = buildMediaUrl(rawPreview);

  const tags = getTagList(product);
  const displayTitle = product?.title || "Название модели";
  const status = product?.status || "";
  const statusLabel = getStatusLabel(status);
  const statusClass = getStatusClass(status);
  const isPublished = status === "published" && product?.id;

  function handleCardClick() {
    if (isPublished) {
      navigate(`/products/${product.id}`);
    }
  }

  function stopCardNavigation(event) {
    event.stopPropagation();
  }

  return (
    <article
      className={`seller-model-card ${isPublished ? "is-clickable" : ""}`}
      onClick={handleCardClick}
    >
      <div className="seller-model-card__image-wrap">
        <div className="seller-model-card__status-row">
          <span className={`seller-model-card__status text-p3 ${statusClass}`}>
            {statusLabel}
          </span>
        </div>

        <div className="seller-model-card__image">
          {previewSrc ? (
            <img src={previewSrc} alt={displayTitle} />
          ) : (
            <span className="seller-model-card__placeholder text-p3">
              Preview
            </span>
          )}
        </div>
      </div>

      <div className="seller-model-card__content">
        <h3 className="seller-model-card__title text-p1">{displayTitle}</h3>

        {tags.length > 0 && (
          <div className="seller-model-card__tags">
            {tags.map((item) => (
              <span key={item} className="seller-model-card__tag text-p3">
                {item}
              </span>
            ))}
          </div>
        )}

        <div className="seller-model-card__actions seller-model-card__actions--grid">
          <button
            type="button"
            className="seller-model-card__edit text-p2"
            onClick={(event) => {
              stopCardNavigation(event);
              onEdit(product);
            }}
          >
            Редактировать
          </button>

          {status === "published" ? (
            <button
              type="button"
              className="seller-model-card__secondary text-p2"
              onClick={(event) => {
                stopCardNavigation(event);
                onArchive(product);
              }}
            >
              Снять с публикации
            </button>
          ) : null}

          {(status === "draft" ||
            status === "archived" ||
            status === "rejected") && (
            <button
              type="button"
              className="seller-model-card__secondary text-p2"
              onClick={(event) => {
                stopCardNavigation(event);
                onSendToReview(product);
              }}
            >
              {status === "rejected"
                ? "Отправить повторно"
                : "Отправить на модерацию"}
            </button>
          )}

          {(status === "draft" ||
            status === "archived" ||
            status === "rejected") && (
            <button
              type="button"
              className="seller-model-card__delete text-p2"
              onClick={(event) => {
                stopCardNavigation(event);
                onDelete(product);
              }}
            >
              Удалить
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
