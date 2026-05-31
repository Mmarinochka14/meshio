import { Link } from "react-router-dom";
import "../styles/product-card.css";
import { buildMediaUrl } from "../api/url";

import downloadIcon from "../assets/icons/download.svg";
import eyeIcon from "../assets/icons/eye.svg";
import commentIcon from "../assets/icons/comment.svg";
import starIcon from "../assets/icons/star.svg";
import starEmptyIcon from "../assets/icons/star-empty.svg";

function formatPrice(value) {
  const price = Number(value || 0);
  return price === 0 ? "Бесплатно" : `${price} ₽`;
}

function renderStars(rating) {
  const normalized = Math.round(Number(rating || 0));
  return Array.from({ length: 5 }, (_, index) =>
    index < normalized ? starIcon : starEmptyIcon,
  );
}

export default function MyModelCard({ product, onDownload, onRate }) {
  const {
    id,
    title,
    price,
    average_rating,
    views_count,
    comments_count,
    main_preview_url,
    model_format,
    has_uv,
    has_textures,
    poly_style,
    my_review,
  } = product;

  const previewSrc = buildMediaUrl(main_preview_url);

  const tags = [
    model_format ? model_format.toUpperCase() : null,
    has_textures ? "PBR" : null,
    has_uv ? "UV" : null,
    poly_style
      ? poly_style
          .replace("_", "-")
          .replace(/\b\w/g, (char) => char.toUpperCase())
      : null,
  ].filter(Boolean);

  return (
    <Link to={`/products/${id}`} className="product-card">
      <div className="product-card__media">
        <div className="product-card__image">
          {previewSrc ? (
            <img src={previewSrc} alt={title} />
          ) : (
            <span className="product-card__placeholder text-p3">Preview</span>
          )}
        </div>
      </div>

      <div className="product-card__content">
        <div className="product-card__stats">
          <div className="product-card__rating-group">
            {renderStars(average_rating).map((icon, index) => (
              <img
                key={index}
                src={icon}
                alt=""
                className="product-card__stat-icon product-card__stat-icon--star"
              />
            ))}
            <span className="product-card__stat-value text-p3">
              {Number(average_rating || 0).toFixed(2)}
            </span>
          </div>

          <div className="product-card__meta-group">
            <div className="product-card__meta-item">
              <img src={eyeIcon} alt="" className="product-card__stat-icon" />
              <span className="product-card__stat-value text-p3">
                {views_count || 0}
              </span>
            </div>

            <div className="product-card__meta-item">
              <img
                src={commentIcon}
                alt=""
                className="product-card__stat-icon"
              />
              <span className="product-card__stat-value text-p3">
                {comments_count || 0}
              </span>
            </div>
          </div>
        </div>

        <h3 className="product-card__title text-p1">{title}</h3>

        <div className="product-card__price text-h3">{formatPrice(price)}</div>

        {tags.length > 0 && (
          <div className="product-card__tags">
            {tags.map((item) => (
              <span key={item} className="product-card__tag text-p3">
                {item}
              </span>
            ))}
          </div>
        )}

        <div className="product-card__my-model-actions">
          <button
            type="button"
            className="product-card__cart-btn product-card__cart-btn--half text-p2"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onDownload?.(product);
            }}
          >
            <img
              src={downloadIcon}
              alt=""
              className="product-card__cart-icon"
            />
            <span>Скачать</span>
          </button>

          <button
            type="button"
            className="product-card__my-model-rate-btn text-p2"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onRate?.(product);
            }}
          >
            <span>{my_review ? "Изменить оценку" : "Оценить"}</span>
          </button>
        </div>
      </div>
    </Link>
  );
}
