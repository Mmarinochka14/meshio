import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/product-card.css";

import favoriteIcon from "../assets/icons/favorite.svg";
import cartIcon from "../assets/icons/cart.svg";
import downloadIcon from "../assets/icons/download.svg";
import eyeIcon from "../assets/icons/eye.svg";
import commentIcon from "../assets/icons/comment.svg";
import starIcon from "../assets/icons/star.svg";
import starEmptyIcon from "../assets/icons/star-empty.svg";

import { getUser, isAuthenticated } from "./auth/authStore";
import {
  addToFavorites,
  removeFromFavorites,
  downloadProduct,
} from "../api/products";
import { addToCartRequest } from "../api/cart";
import { buildMediaUrl, buildProductMediaProxyUrl } from "../api/url";
import { addToGuestCart, isInGuestCart, subscribeCart } from "./cart/cartStore";
import {
  addFavoriteId,
  getFavoriteIds,
  removeFavoriteId,
  subscribeFavorites,
} from "./favorites/favoritesStore";

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

function getInitialFavorite(product, isFavoriteProp, forceFavoriteActive) {
  if (forceFavoriteActive) return true;
  if (typeof isFavoriteProp === "boolean") return isFavoriteProp;

  if (!product?.id) return false;

  const productId = String(product.id);
  const isInLocalFavorites = getFavoriteIds().includes(productId);

  return Boolean(product?.is_favorite) || isInLocalFavorites;
}

function getInitialCart(product, isInCartProp) {
  if (typeof isInCartProp === "boolean") return isInCartProp;
  if (!product?.id) return false;

  if (!isAuthenticated()) {
    return isInGuestCart(product.id);
  }

  return Boolean(product?.is_in_cart);
}

export default function ProductCard({
  product,
  isFavorite,
  forceFavoriteActive = false,
  isInCart,

  isReadonly = false,
  hideFavorite = false,

  readonlyBadge = "Просмотр",
  readonlyText = "Карточка товара",

  onToggleFavorite,
  onAddToCart,
  onDownload,
}) {
  const navigate = useNavigate();

  const [localFavorite, setLocalFavorite] = useState(() =>
    getInitialFavorite(product, isFavorite, forceFavoriteActive),
  );

  const [localInCart, setLocalInCart] = useState(() =>
    getInitialCart(product, isInCart),
  );

  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [isCartJustAdded, setIsCartJustAdded] = useState(false);

  const user = isAuthenticated() ? getUser() : null;

  const isAdminUser = user?.role === "admin";
  const isSellerUser = user?.role === "seller";
  const isBuyerUser = user?.role === "buyer";

  const readonlyMode = isReadonly || isAdminUser || isSellerUser;

  const {
    id,
    title,
    price,
    average_rating,
    views_count,
    comments_count,
    thumbnail_url,
    main_preview_url,
    model_format,
    has_uv,
    has_textures,
    poly_style,
  } = product || {};

  const directPreviewSrc = buildMediaUrl(thumbnail_url || main_preview_url);
  const proxyPreviewSrc = buildProductMediaProxyUrl(id, "thumbnail");
  const [previewSrc, setPreviewSrc] = useState(proxyPreviewSrc || directPreviewSrc);
  const isFree = Number(price || 0) === 0;

  const currentFavorite = forceFavoriteActive
    ? true
    : Boolean(isFavorite) || localFavorite;

  const isControlledCart = typeof isInCart === "boolean";
  const currentInCart = isControlledCart ? Boolean(isInCart) : localInCart;

  useEffect(() => {
    if (!product?.id) {
      setLocalFavorite(false);
      return;
    }

    const productId = String(product.id);
    const isInLocalFavorites = getFavoriteIds().includes(productId);

    setLocalFavorite(
      forceFavoriteActive ||
        Boolean(isFavorite) ||
        Boolean(product?.is_favorite) ||
        isInLocalFavorites,
    );
  }, [product?.id, product?.is_favorite, isFavorite, forceFavoriteActive]);

  useEffect(() => {
    setLocalInCart(getInitialCart(product, isInCart));
  }, [product?.id, product?.is_in_cart, isInCart]);

  useEffect(() => {
    setPreviewSrc(proxyPreviewSrc || directPreviewSrc);
  }, [directPreviewSrc, proxyPreviewSrc]);

  useEffect(() => {
    if (!product?.id) return;

    const productId = String(product.id);

    const unsubscribe = subscribeFavorites(() => {
      setLocalFavorite(getFavoriteIds().includes(productId));
    });

    return unsubscribe;
  }, [product?.id]);

  useEffect(() => {
    if (!product?.id) return;

    const unsubscribe = subscribeCart(() => {
      if (!isAuthenticated()) {
        setLocalInCart(isInGuestCart(product.id));
      }
    });

    return unsubscribe;
  }, [product?.id]);

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

  const readonlyBadgeText = isAdminUser
    ? "Админ"
    : isSellerUser
      ? "Продавец"
      : readonlyBadge;

  const readonlyDescriptionText = isAdminUser
    ? "Просмотр товара"
    : isSellerUser
      ? "Просмотр товара"
      : readonlyText;

  async function handleFavoriteClick(event) {
    event.preventDefault();
    event.stopPropagation();

    if (readonlyMode || hideFavorite || !product?.id || isFavoriteLoading) {
      return;
    }

    const nextFavorite = !currentFavorite;
    const productId = String(product.id);

    try {
      setIsFavoriteLoading(true);

      if (typeof onToggleFavorite === "function") {
        await onToggleFavorite(product, nextFavorite);

        if (nextFavorite) {
          addFavoriteId(productId);
        } else {
          removeFavoriteId(productId);
        }

        setLocalFavorite(nextFavorite);
        return;
      }

      if (!isAuthenticated()) {
        if (nextFavorite) {
          addFavoriteId(productId);
        } else {
          removeFavoriteId(productId);
        }

        setLocalFavorite(nextFavorite);
        return;
      }

      if (!isBuyerUser) {
        return;
      }

      if (nextFavorite) {
        await addToFavorites(product.id);
        addFavoriteId(productId);
      } else {
        await removeFromFavorites(product.id);
        removeFavoriteId(productId);
      }

      setLocalFavorite(nextFavorite);
    } catch (error) {
      console.error("Не удалось обновить избранное", error);
    } finally {
      setIsFavoriteLoading(false);
    }
  }

  async function handleDefaultDownload() {
    const data = await downloadProduct(product.id);
    const url = data?.download_url;

    if (url) {
      window.location.href = url;
    }
  }

  async function handleMainActionClick(event) {
    event.preventDefault();
    event.stopPropagation();

    if (readonlyMode || !product?.id || isCartLoading) return;

    try {
      setIsCartLoading(true);

      if (isFree) {
        if (typeof onDownload === "function") {
          await onDownload(product);
        } else {
          await handleDefaultDownload();
        }

        return;
      }

      if (currentInCart) {
        navigate("/cart");
        return;
      }

      if (typeof onAddToCart === "function") {
        await onAddToCart(product);
        setLocalInCart(true);
        setIsCartJustAdded(true);
        return;
      }

      if (!isAuthenticated()) {
        addToGuestCart(product.id);
        setLocalInCart(true);
        setIsCartJustAdded(true);
        return;
      }

      if (!isBuyerUser) {
        return;
      }

      await addToCartRequest(product.id);
      setLocalInCart(true);
      setIsCartJustAdded(true);
    } catch (error) {
      console.error("Не удалось добавить товар в корзину", error);
    } finally {
      setIsCartLoading(false);
    }
  }

  useEffect(() => {
    if (!isCartJustAdded) return undefined;

    const timeoutId = window.setTimeout(() => {
      setIsCartJustAdded(false);
    }, 650);

    return () => window.clearTimeout(timeoutId);
  }, [isCartJustAdded]);

  return (
    <Link
      to={`/products/${id}`}
      className={`product-card ${readonlyMode ? "is-readonly" : ""}`}
    >
      <div className="product-card__media">
        {isFree ? (
          <div className="product-card__badges">
            <span className="product-card__badge product-card__badge--free text-p3">
              Free
            </span>
          </div>
        ) : null}

        <div className="product-card__image">
          {previewSrc ? (
            <img
              src={previewSrc}
              alt={title || "3D модель"}
              loading="lazy"
              decoding="async"
              onError={() => {
                if (previewSrc !== directPreviewSrc) {
                  setPreviewSrc(directPreviewSrc);
                }
              }}
            />
          ) : (
            <span className="product-card__placeholder text-p3">Preview</span>
          )}
        </div>

        {!hideFavorite && !readonlyMode ? (
          <button
            type="button"
            className={`product-card__favorite ${
              currentFavorite ? "product-card__favorite--active" : ""
            }`}
            onClick={handleFavoriteClick}
            disabled={isFavoriteLoading}
            aria-label={
              currentFavorite ? "Убрать из избранного" : "Добавить в избранное"
            }
          >
            <img
              src={favoriteIcon}
              alt=""
              className="product-card__favorite-icon"
            />
          </button>
        ) : null}
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

        <h3 className="product-card__title text-p1">
          {title || "Без названия"}
        </h3>

        <div className="product-card__price text-h3">{formatPrice(price)}</div>

        {tags.length > 0 ? (
          <div className="product-card__tags">
            {tags.map((item) => (
              <span key={item} className="product-card__tag text-p3">
                {item}
              </span>
            ))}
          </div>
        ) : null}

        {readonlyMode ? (
          <div className="product-card__readonly text-p2">
            <span className="product-card__readonly-badge text-p3">
              {readonlyBadgeText}
            </span>
            <span className="product-card__readonly-text">
              {readonlyDescriptionText}
            </span>
          </div>
        ) : (
          <>
            <button
              type="button"
              className={`product-card__cart-btn text-p2 ${
                currentInCart && !isFree ? "product-card__cart-btn--active" : ""
              } ${isFree ? "product-card__cart-btn--download" : ""} ${
                isCartJustAdded ? "is-just-added" : ""
              }`}
              onClick={handleMainActionClick}
              disabled={isCartLoading}
            >
              <img
                src={isFree ? downloadIcon : cartIcon}
                alt=""
                className="product-card__cart-icon"
              />
              <span>
                {isFree
                  ? "Скачать"
                  : isCartLoading
                    ? "Добавление..."
                    : currentInCart
                      ? "В корзине"
                      : "В корзину"}
              </span>
            </button>

            <div className="product-card__mobile-actions">
              <button
                type="button"
                className={`product-card__mobile-main-btn ${
                  currentInCart && !isFree
                    ? "product-card__mobile-main-btn--active"
                    : ""
                } ${isFree ? "product-card__mobile-main-btn--download" : ""} ${
                  isCartJustAdded ? "is-just-added" : ""
                }`}
                onClick={handleMainActionClick}
                disabled={isCartLoading}
                aria-label={isFree ? "Скачать" : "Добавить в корзину"}
              >
                <img
                  src={isFree ? downloadIcon : cartIcon}
                  alt=""
                  className="product-card__mobile-main-icon"
                />
              </button>

              {!hideFavorite ? (
                <button
                  type="button"
                  className={`product-card__mobile-favorite-btn ${
                    currentFavorite
                      ? "product-card__mobile-favorite-btn--active"
                      : ""
                  }`}
                  onClick={handleFavoriteClick}
                  disabled={isFavoriteLoading}
                  aria-label={
                    currentFavorite
                      ? "Убрать из избранного"
                      : "Добавить в избранное"
                  }
                >
                  <img
                    src={favoriteIcon}
                    alt=""
                    className="product-card__mobile-favorite-icon"
                  />
                </button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </Link>
  );
}
