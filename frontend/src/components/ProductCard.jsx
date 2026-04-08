import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/product-card.css";

import heartIcon from "../assets/icons/favorite.svg";
import cartIcon from "../assets/icons/cart.svg";
import trashIcon from "../assets/icons/delete.svg";
import eyeIcon from "../assets/icons/eye.svg";
import commentIcon from "../assets/icons/comment.svg";
import starIcon from "../assets/icons/star.svg";
import starEmptyIcon from "../assets/icons/star-empty.svg";

import { getToken, getUser } from "./auth/authStore";
import { openAuthModal } from "./auth/openAuthModal";
import { addToFavorites, removeFromFavorites } from "../api/products";
import { addToCartRequest } from "../api/cart";
import {
  addToGuestCart,
  isBuyerAuthenticated,
  isInGuestCart,
  removeFromGuestCart,
  subscribeCart,
} from "./cart/cartStore";
import {
  addFavoriteId,
  isFavoriteStored,
  removeFavoriteId,
  subscribeFavorites,
} from "./favorites/favoritesStore";

export default function ProductCard({ product, forceFavoriteActive = false }) {
  const [isFavorite, setIsFavorite] = useState(
    forceFavoriteActive || Boolean(product?.is_favorite),
  );
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

  const [isInCart, setIsInCart] = useState(false);
  const [isCartLoading, setIsCartLoading] = useState(false);

  const {
    id,
    title,
    price,
    model_format,
    has_uv,
    has_textures,
    poly_style,
    average_rating,
    views_count,
    comments_count,
  } = product;

  const token = getToken();
  const user = getUser();
  const isAuthenticated = Boolean(token);
  const isBuyer = user?.role === "buyer";

  const rawPreview =
    product.main_preview_url || product.preview_url || product.preview || "";

  const previewSrc = rawPreview
    ? rawPreview.startsWith("http")
      ? rawPreview
      : `http://127.0.0.1:8000${rawPreview}`
    : "";

  const displayTitle = title || "Название модели";
  const displayPrice =
    price !== undefined && price !== null ? Number(price) : 0;
  const displayRating =
    average_rating !== undefined && average_rating !== null
      ? Number(average_rating).toFixed(2)
      : "0.00";
  const displayViews =
    views_count !== undefined && views_count !== null ? views_count : 0;
  const displayComments =
    comments_count !== undefined && comments_count !== null
      ? comments_count
      : 0;

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

  const isFree = displayPrice <= 0;
  const backendCartAvailable = isBuyerAuthenticated();

  useEffect(() => {
    setIsFavorite(
      forceFavoriteActive ||
        Boolean(product?.is_favorite) ||
        isFavoriteStored(id),
    );
  }, [forceFavoriteActive, product?.is_favorite, id]);

  useEffect(() => {
    const unsub = subscribeFavorites(() => {
      setIsFavorite(
        forceFavoriteActive ||
          Boolean(product?.is_favorite) ||
          isFavoriteStored(id),
      );
    });

    return unsub;
  }, [forceFavoriteActive, product?.is_favorite, id]);

  useEffect(() => {
    if (!backendCartAvailable) {
      setIsInCart(isInGuestCart(id));
    }
  }, [id, backendCartAvailable]);

  useEffect(() => {
    const unsub = subscribeCart(() => {
      if (!backendCartAvailable) {
        setIsInCart(isInGuestCart(id));
      }
    });

    return unsub;
  }, [id, backendCartAvailable]);

  const handleFavoriteClick = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }

    if (!isBuyer) {
      return;
    }

    try {
      setIsFavoriteLoading(true);

      if (isFavorite) {
        await removeFromFavorites(id);
        removeFavoriteId(id);
        setIsFavorite(false);
      } else {
        await addToFavorites(id);
        addFavoriteId(id);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Не удалось обновить избранное", error);
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  const handleCartClick = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (isFree) return;

    try {
      setIsCartLoading(true);

      if (backendCartAvailable && user?.role === "buyer") {
        if (isInCart) {
          return;
        }

        await addToCartRequest(id);
        setIsInCart(true);
        return;
      }

      if (isInCart) {
        removeFromGuestCart(id);
        setIsInCart(false);
        return;
      }

      addToGuestCart(id);
      setIsInCart(true);
    } catch (error) {
      console.error("Не удалось обновить корзину", error);
    } finally {
      setIsCartLoading(false);
    }
  };

  return (
    <Link to={`/products/${id}`} className="product-card">
      <div className="product-card__media">
        <button
          type="button"
          className={`product-card__favorite ${
            isFavorite ? "product-card__favorite--active" : ""
          }`}
          aria-label="Добавить в избранное"
          onClick={handleFavoriteClick}
          disabled={isFavoriteLoading}
        >
          <img src={heartIcon} alt="" className="product-card__favorite-icon" />
        </button>

        <div className="product-card__image">
          {previewSrc ? (
            <img src={previewSrc} alt={displayTitle} />
          ) : (
            <span className="product-card__placeholder text-p3">Preview</span>
          )}
        </div>
      </div>

      <div className="product-card__content">
        <div className="product-card__stats">
          <div className="product-card__rating-group">
            <img
              src={starIcon}
              alt=""
              className="product-card__stat-icon product-card__stat-icon--star"
            />
            <img
              src={starIcon}
              alt=""
              className="product-card__stat-icon product-card__stat-icon--star"
            />
            <img
              src={starIcon}
              alt=""
              className="product-card__stat-icon product-card__stat-icon--star"
            />
            <img
              src={starIcon}
              alt=""
              className="product-card__stat-icon product-card__stat-icon--star"
            />
            <img
              src={starEmptyIcon}
              alt=""
              className="product-card__stat-icon product-card__stat-icon--star"
            />
            <span className="product-card__stat-value text-p3">
              {displayRating}
            </span>
          </div>

          <div className="product-card__meta-group">
            <div className="product-card__meta-item">
              <img src={eyeIcon} alt="" className="product-card__stat-icon" />
              <span className="product-card__stat-value text-p3">
                {displayViews}
              </span>
            </div>

            <div className="product-card__meta-item">
              <img
                src={commentIcon}
                alt=""
                className="product-card__stat-icon"
              />
              <span className="product-card__stat-value text-p3">
                {displayComments}
              </span>
            </div>
          </div>
        </div>

        <h3 className="product-card__title text-p1">{displayTitle}</h3>

        <div className="product-card__price text-h3">
          {isFree ? "Бесплатно" : `${displayPrice} ₽`}
        </div>

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
            isInCart ? "product-card__cart-btn--active" : ""
          }`}
          onClick={handleCartClick}
          disabled={isCartLoading}
        >
          <img
            src={isInCart ? trashIcon : cartIcon}
            alt=""
            className="product-card__cart-icon"
          />
          <span>
            {isFree
              ? "Скачать"
              : isCartLoading
                ? "Обработка..."
                : isInCart
                  ? "Убрать из корзины"
                  : "В корзину"}
          </span>
        </button>
      </div>
    </Link>
  );
}
