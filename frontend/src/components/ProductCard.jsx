import { Link } from "react-router-dom";
import "../styles/product-card.css";

import favoriteIcon from "../assets/icons/favorite.svg";
import cartIcon from "../assets/icons/cart.svg";
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

export default function ProductCard({
  product,
  isFavorite = false,
  isInCart = false,
  onToggleFavorite,
  onAddToCart,
  onDownload,
}) {
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
  } = product || {};

  const previewSrc = main_preview_url
    ? main_preview_url.startsWith("http")
      ? main_preview_url
      : `http://127.0.0.1:8000${main_preview_url}`
    : "";

  const tags = [
    model_format ? model_format.toUpperCase() : null,
    has_textures ? "PBR" : null,
    has_uv ? "UV" : null,
    poly_style
      ? poly_style
          .replaceAll("_", "-")
          .replace(/\b\w/g, (char) => char.toUpperCase())
      : null,
  ].filter(Boolean);

  const isFree = Number(price || 0) === 0;

  function handleFavoriteClick(event) {
    event.preventDefault();
    event.stopPropagation();
    onToggleFavorite?.(product);
  }

  function handleMainActionClick(event) {
    event.preventDefault();
    event.stopPropagation();

    if (isFree) {
      onDownload?.(product);
      return;
    }

    onAddToCart?.(product);
  }

  return (
    <Link to={`/products/${id}`} className="product-card">
      <div className="product-card__media">
        <button
          type="button"
          className={`product-card__favorite ${
            isFavorite ? "product-card__favorite--active" : ""
          }`}
          onClick={handleFavoriteClick}
          aria-label={
            isFavorite ? "Убрать из избранного" : "Добавить в избранное"
          }
        >
          <img
            src={favoriteIcon}
            alt=""
            className="product-card__favorite-icon"
          />
        </button>

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

        <button
          type="button"
          className={`product-card__cart-btn text-p2 ${
            isInCart && !isFree ? "product-card__cart-btn--active" : ""
          } ${isFree ? "product-card__cart-btn--download" : ""}`}
          onClick={handleMainActionClick}
        >
          <img
            src={isFree ? downloadIcon : cartIcon}
            alt=""
            className="product-card__cart-icon"
          />
          <span>
            {isFree ? "Скачать" : isInCart ? "В корзине" : "В корзину"}
          </span>
        </button>

        <div className="product-card__mobile-actions">
          <button
            type="button"
            className={`product-card__mobile-main-btn ${
              isInCart && !isFree ? "product-card__mobile-main-btn--active" : ""
            } ${isFree ? "product-card__mobile-main-btn--download" : ""}`}
            onClick={handleMainActionClick}
            aria-label={isFree ? "Скачать" : "Добавить в корзину"}
          >
            <img
              src={isFree ? downloadIcon : cartIcon}
              alt=""
              className="product-card__mobile-main-icon"
            />
          </button>

          <button
            type="button"
            className={`product-card__mobile-favorite-btn ${
              isFavorite ? "product-card__mobile-favorite-btn--active" : ""
            }`}
            onClick={handleFavoriteClick}
            aria-label={
              isFavorite ? "Убрать из избранного" : "Добавить в избранное"
            }
          >
            <img
              src={favoriteIcon}
              alt=""
              className="product-card__mobile-favorite-icon"
            />
          </button>
        </div>
      </div>
    </Link>
  );
}
