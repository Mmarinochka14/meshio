import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  addProductComment,
  addToFavorites,
  downloadProduct,
  generateTexture,
  getProductById,
  getProductComments,
  removeFromFavorites,
} from "../api/products";
import { addToCartRequest } from "../api/cart";
import { getToken, getUser } from "../components/auth/authStore";
import { openAuthModal } from "../components/auth/openAuthModal";
import {
  addToGuestCart,
  isBuyerAuthenticated,
  isInGuestCart,
  subscribeCart,
} from "../components/cart/cartStore";

import {
  addFavoriteId,
  getFavoriteIds,
  removeFavoriteId,
  subscribeFavorites,
} from "../components/favorites/favoritesStore";

import ProductPageViewerPanel from "../components/ProductPageViewerPanel";
import CheckoutModal from "../components/CheckoutModal";
import PaymentSuccessModal from "../components/PaymentSuccessModal";
import ProductsSection from "../components/ProductsSection";

import heartIcon from "../assets/icons/favorite.svg";
import cartIcon from "../assets/icons/cart.svg";
import eyeIcon from "../assets/icons/eye.svg";
import commentIcon from "../assets/icons/comment.svg";
import starIcon from "../assets/icons/star.svg";
import starEmptyIcon from "../assets/icons/star-empty.svg";

import "../styles/product-page.css";
import { buildProductMediaProxyUrl } from "../api/url";

const MATERIAL_PRESET_VALUES = {
  original: {
    color: "#d7d7dd",
    roughness: 0.55,
    metalness: 0.05,
    opacity: 1,
    emissive: "#000000",
  },
  plastic: {
    color: "#d7d7dd",
    roughness: 0.55,
    metalness: 0.05,
    opacity: 1,
    emissive: "#000000",
  },
  metal: {
    color: "#8f949c",
    roughness: 0.28,
    metalness: 0.92,
    opacity: 1,
    emissive: "#000000",
  },
  wood: {
    color: "#8a5a3b",
    roughness: 0.82,
    metalness: 0.03,
    opacity: 1,
    emissive: "#000000",
  },
  rubber: {
    color: "#2a2a2d",
    roughness: 0.96,
    metalness: 0.02,
    opacity: 1,
    emissive: "#000000",
  },
  ceramic: {
    color: "#f1efe8",
    roughness: 0.35,
    metalness: 0.02,
    opacity: 1,
    emissive: "#000000",
  },
  glass: {
    color: "#dbeeff",
    roughness: 0.05,
    metalness: 0,
    opacity: 0.28,
    emissive: "#000000",
  },
  fabric: {
    color: "#5b4b66",
    roughness: 0.93,
    metalness: 0.01,
    opacity: 1,
    emissive: "#000000",
  },
  custom: {
    color: "#d7d7dd",
    roughness: 0.55,
    metalness: 0.05,
    opacity: 1,
    emissive: "#000000",
  },
};

function formatPrice(value) {
  const price = Number(value || 0);
  return price === 0 ? "Бесплатно" : `${price} ₽`;
}

function formatPolyStyle(value) {
  if (!value) return "—";
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function renderStars(rating) {
  const normalized = Math.round(Number(rating || 0));
  return Array.from({ length: 5 }, (_, index) =>
    index < normalized ? starIcon : starEmptyIcon,
  );
}

function getInitial(username) {
  if (!username) return "M";
  return username[0].toUpperCase();
}

function SpecItem({ label, value }) {
  return (
    <div className="product-page__spec-item">
      <span className="product-page__spec-label text-p3">{label}</span>
      <span className="product-page__spec-value text-p3">{value || "—"}</span>
    </div>
  );
}

function StatInline({ icon, value }) {
  return (
    <div className="product-page__inline-meta-item">
      <img src={icon} alt="" className="product-page__stat-icon" />
      <span className="text-p3">{value}</span>
    </div>
  );
}

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [viewerUrl, setViewerUrl] = useState("");
  const [viewMode, setViewMode] = useState("default");
  const [isLoading, setIsLoading] = useState(true);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [error, setError] = useState("");

  const [texturePrompt, setTexturePrompt] = useState("");
  const [generatedTextureUrl, setGeneratedTextureUrl] = useState("");
  const [isGeneratingTexture, setIsGeneratingTexture] = useState(false);

  const [selectedMaterialPreset, setSelectedMaterialPreset] =
    useState("original");
  const [customMaterialColor, setCustomMaterialColor] = useState("#d7d7dd");
  const [customRoughness, setCustomRoughness] = useState(0.55);
  const [customMetalness, setCustomMetalness] = useState(0.05);
  const [customOpacity, setCustomOpacity] = useState(1);
  const [customEmissive, setCustomEmissive] = useState("#000000");

  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [commentSending, setCommentSending] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const token = getToken();
  const user = getUser();

  const isAuthenticated = Boolean(token);
  const isBuyer = user?.role === "buyer";
  const isSeller = user?.role === "seller";
  const isFree = Number(product?.price || 0) === 0;
  const canUseBuyerActions = !isAuthenticated || isBuyer;
  const canUseFavoriteActions = !isAuthenticated || isBuyer;

  const displayRating = Number(product?.average_rating || 0).toFixed(2);
  const displayViews = product?.views_count ?? 0;
  const displayComments = product?.comments_count ?? 0;
  const displayReviews = product?.reviews_count ?? 0;
  const displaySellerRating = Number(
    product?.seller_average_rating ?? product?.average_rating ?? 0,
  ).toFixed(2);
  const displaySellerReviews = product?.seller_reviews_count ?? displayReviews;
  const descriptionText =
    product?.description ||
    "Описание пока не добавлено. Здесь будет текст о назначении модели, ее качестве, применении и особенностях.";
  const shouldCollapseDescription = descriptionText.length > 180;

  const texturePromptSuggestions = [
    "розовый матовый пластик",
    "фиолетовый глянцевый пластик",
    "черная матовая резина",
    "белая керамика",
    "серый шлифованный металл",
    "светлое дерево",
    "темная ткань",
    "зеленый окрашенный металл",
  ];

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setIsLoading(true);
        setError("");

        const detail = await getProductById(id);
        if (!mounted) return;

        setProduct(detail);
        if (!isAuthenticated) {
          setIsFavorite(getFavoriteIds().includes(String(detail?.id)));
        } else if (isBuyer) {
          setIsFavorite(Boolean(detail?.is_favorite));
        } else {
          setIsFavorite(false);
        }
        setViewerUrl(
          detail?.id ? buildProductMediaProxyUrl(detail.id, "viewer") : "",
        );
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.detail || "Не удалось загрузить товар.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [id, canUseBuyerActions]);

  useEffect(() => {
    if (!product) return;

    if (!isBuyerAuthenticated() && !isSeller) {
      setIsInCart(isInGuestCart(product.id));
      return;
    }

    setIsInCart(false);
  }, [product, isSeller]);

  useEffect(() => {
    let mounted = true;

    async function loadComments() {
      try {
        setCommentsLoading(true);
        const data = await getProductComments(id);

        if (!mounted) return;

        const results = Array.isArray(data?.results) ? data.results : [];
        setComments(results);
      } catch {
        if (!mounted) return;
        setComments([]);
      } finally {
        if (mounted) setCommentsLoading(false);
      }
    }

    loadComments();

    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    const unsub = subscribeCart(() => {
      if (product && !isBuyerAuthenticated() && !isSeller) {
        setIsInCart(isInGuestCart(product.id));
      }
    });

    return unsub;
  }, [product, isSeller]);

  useEffect(() => {
    const unsub = subscribeFavorites(() => {
      if (!product) return;

      if (!isAuthenticated) {
        setIsFavorite(getFavoriteIds().includes(String(product.id)));
      }
    });

    return unsub;
  }, [product, isAuthenticated]);

  function applyPresetValues(presetKey) {
    const preset = MATERIAL_PRESET_VALUES[presetKey];
    if (!preset) return;

    setSelectedMaterialPreset(presetKey);
    setCustomMaterialColor(preset.color);
    setCustomRoughness(preset.roughness);
    setCustomMetalness(preset.metalness);
    setCustomOpacity(preset.opacity);
    setCustomEmissive(preset.emissive);
  }

  function handleResetMaterial() {
    applyPresetValues("original");
    setGeneratedTextureUrl("");
  }

  function handleMaterialPresetChange(presetKey) {
    applyPresetValues(presetKey);
  }

  async function handleDownloadFlow() {
    const data = await downloadProduct(id);
    const url = data?.download_url;

    if (!url) {
      throw new Error("Ссылка на скачивание не получена.");
    }

    window.location.href = url;
  }

  async function handlePrimaryAction() {
    try {
      setError("");

      if (isSeller) {
        setError("В режиме продавца покупка недоступна.");
        return;
      }

      if (product?.has_purchase || isFree) {
        await handleDownloadFlow();
        return;
      }

      if (!isAuthenticated) {
        openAuthModal("login");
        return;
      }

      if (!isBuyer) {
        setError("Покупка доступна только пользователю с ролью buyer.");
        return;
      }

      setIsCheckoutOpen(true);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Не удалось выполнить действие.",
      );
    }
  }

  async function handleAddToCart() {
    try {
      setError("");

      if (!product) return;

      if (isSeller) {
        setError("В режиме продавца корзина недоступна.");
        return;
      }

      if (Number(product.price || 0) <= 0) {
        await handleDownloadFlow();
        return;
      }

      setIsCartLoading(true);

      if (isBuyerAuthenticated() && user?.role === "buyer") {
        if (isInCart) {
          navigate("/cart");
          return;
        }

        await addToCartRequest(product.id);
        setIsInCart(true);
        return;
      }

      if (!isAuthenticated) {
        addToGuestCart(product.id);
        setIsInCart(true);
        return;
      }

      setError("Добавление в корзину доступно только покупателю.");
    } catch (err) {
      setError(
        err?.response?.data?.detail || "Не удалось добавить товар в корзину.",
      );
    } finally {
      setIsCartLoading(false);
    }
  }

  async function handleFavoriteClick() {
    try {
      setError("");

      if (!product) return;

      if (isSeller) {
        setError("В режиме продавца избранное недоступно.");
        return;
      }

      setIsFavoriteLoading(true);

      if (!isAuthenticated) {
        const productId = String(product.id);

        if (isFavorite) {
          removeFavoriteId(productId);
          setIsFavorite(false);
        } else {
          addFavoriteId(productId);
          setIsFavorite(true);
        }

        return;
      }

      if (!isBuyer) {
        setError("Избранное доступно только покупателю.");
        return;
      }

      if (isFavorite) {
        await removeFromFavorites(id);
        setIsFavorite(false);
      } else {
        await addToFavorites(id);
        setIsFavorite(true);
      }
    } catch (err) {
      setError(err?.response?.data?.detail || "Не удалось обновить избранное.");
    } finally {
      setIsFavoriteLoading(false);
    }
  }

  async function handleGenerateTexture() {
    try {
      if (!texturePrompt.trim()) {
        setError("Введите промпт для генерации текстуры.");
        return;
      }

      setError("");
      setIsGeneratingTexture(true);

      const data = await generateTexture(id, texturePrompt);
      setGeneratedTextureUrl(data.image_url || data.preview_url || "");

      setSelectedMaterialPreset("custom");
      setViewMode("lighted");
    } catch (err) {
      setError(err?.message || "Не удалось сгенерировать текстуру.");
    } finally {
      setIsGeneratingTexture(false);
    }
  }

  async function handleSendComment() {
    try {
      if (!isAuthenticated) {
        openAuthModal("login");
        return;
      }

      if (!commentText.trim()) {
        setError("Введите текст комментария.");
        return;
      }

      setError("");
      setCommentSending(true);

      const response = await addProductComment(id, commentText.trim());
      const newComment = response?.comment;

      if (newComment) {
        setComments((prev) => [newComment, ...prev]);
        setProduct((prev) =>
          prev
            ? { ...prev, comments_count: (prev.comments_count || 0) + 1 }
            : prev,
        );
      }

      setCommentText("");
    } catch (err) {
      setError(
        err?.response?.data?.detail || "Не удалось отправить комментарий.",
      );
    } finally {
      setCommentSending(false);
    }
  }

  function handleCheckoutSuccess(data) {
    setSuccessData(data);

    setProduct((prev) =>
      prev
        ? {
            ...prev,
            has_purchase: true,
            sales_count: (prev.sales_count || 0) + 1,
          }
        : prev,
    );
  }

  if (isLoading) {
    return (
      <section className="product-page">
        <div className="product-page__container">
          <div className="product-page__state text-p1">Загрузка товара...</div>
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="product-page">
        <div className="product-page__container">
          <div className="product-page__state text-p1">
            {error || "Товар не найден"}
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="product-page">
        <div className="product-page__container">
          <div className="product-page__top-grid">
            <div className="product-page__left-column">
              <ProductPageViewerPanel
                viewerUrl={viewerUrl}
                viewMode={viewMode}
                setViewMode={setViewMode}
                texturePrompt={texturePrompt}
                setTexturePrompt={setTexturePrompt}
                onGenerateTexture={handleGenerateTexture}
                generatedTextureUrl={generatedTextureUrl}
                isGeneratingTexture={isGeneratingTexture}
                texturePromptSuggestions={texturePromptSuggestions}
                selectedMaterialPreset={selectedMaterialPreset}
                setSelectedMaterialPreset={handleMaterialPresetChange}
                customMaterialColor={customMaterialColor}
                setCustomMaterialColor={setCustomMaterialColor}
                customRoughness={customRoughness}
                setCustomRoughness={setCustomRoughness}
                customMetalness={customMetalness}
                setCustomMetalness={setCustomMetalness}
                customOpacity={customOpacity}
                setCustomOpacity={setCustomOpacity}
                customEmissive={customEmissive}
                setCustomEmissive={setCustomEmissive}
                onResetMaterial={handleResetMaterial}
              />
            </div>

            <aside className="product-page__right-column">
              <div className="product-page__sidebar-card">
                <div className="product-page__stats-line">
                  <div className="product-page__rating-inline">
                    {renderStars(product.average_rating).map((icon, index) => (
                      <img
                        key={index}
                        src={icon}
                        alt=""
                        className="product-page__stat-icon product-page__stat-icon--star"
                      />
                    ))}
                    <span className="text-p3">{displayRating}</span>
                    <span className="product-page__reviews-count text-p3">
                      · {displayReviews} оценок
                    </span>
                  </div>

                  <div className="product-page__inline-meta">
                    <StatInline icon={eyeIcon} value={displayViews} />
                    <StatInline icon={commentIcon} value={displayComments} />
                  </div>
                </div>

                <h1 className="product-page__product-title text-h3">
                  {product.title}
                </h1>

                <div className="product-page__price text-h2">
                  {formatPrice(product.price)}
                </div>

                {canUseBuyerActions ? (
                  <div className="product-page__action-stack">
                    <div className="product-page__primary-row">
                      <button
                        type="button"
                        className="product-page__buy-btn text-p2"
                        onClick={handlePrimaryAction}
                      >
                        <img
                          src={cartIcon}
                          alt=""
                          className="product-page__buy-icon"
                        />
                        <span>
                          {product.has_purchase || isFree
                            ? "Скачать модель"
                            : "Купить модель"}
                        </span>
                      </button>

                        <button
                          type="button"
                          className={`product-page__favorite-icon-btn ${
                            isFavorite ? "is-active" : ""
                          }`}
                          onClick={handleFavoriteClick}
                          disabled={isFavoriteLoading}
                          aria-label={
                            isFavorite
                              ? "Удалить из избранного"
                              : "Добавить в избранное"
                          }
                          title={
                            isFavorite
                              ? "Удалить из избранного"
                              : "Добавить в избранное"
                          }
                        >
                          <img
                            src={heartIcon}
                            alt=""
                            className="product-page__favorite-icon"
                          />
                        </button>
                      </div>

                    {!product.has_purchase && !isFree ? (
                      <div className="product-page__secondary-row">
                        <button
                          type="button"
                          className={`product-page__cart-btn text-p2 ${
                            isInCart ? "is-active" : ""
                          }`}
                          onClick={handleAddToCart}
                          disabled={isCartLoading}
                        >
                          <img
                            src={cartIcon}
                            alt=""
                            className="product-page__buy-icon"
                          />
                          <span>
                            {isCartLoading
                              ? "Добавление..."
                              : isInCart
                                ? "Перейти в корзину"
                                : "Добавить в корзину"}
                          </span>
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="product-page__info-block">
                  <h3 className="product-page__subheading text-h4">
                    Характеристики
                  </h3>

                  <div className="product-page__specs-grid">
                    <SpecItem
                      label="Категория"
                      value={product.category?.name}
                    />
                    <SpecItem
                      label="Геометрия"
                      value={formatPolyStyle(
                        product.poly_style || product.geometry_type,
                      )}
                    />
                    <SpecItem
                      label="Формат"
                      value={product.model_format?.toUpperCase() || "—"}
                    />
                    <SpecItem label="Топология" value={product.topology_type} />
                    <SpecItem
                      label="Полигоны"
                      value={product.polygon_count ?? "—"}
                    />
                    <SpecItem
                      label="UV"
                      value={product.has_uv ? "Есть" : "Нет"}
                    />
                    <SpecItem
                      label="Текстуры"
                      value={product.has_textures ? "PBR" : "Нет"}
                    />
                    <SpecItem
                      label="Rigging"
                      value={product.has_rigging ? "Есть" : "Нет"}
                    />
                  </div>
                </div>

                <div className="product-page__info-block">
                  <h3 className="product-page__subheading text-h4">
                    Описание модели
                  </h3>
                  <div
                    className={`product-page__description-card text-p3 ${
                      shouldCollapseDescription && !isDescriptionExpanded
                        ? "is-collapsed"
                        : ""
                    }`}
                  >
                    {descriptionText}
                  </div>
                  {shouldCollapseDescription ? (
                    <button
                      type="button"
                      className="product-page__description-toggle text-p3"
                      onClick={() =>
                        setIsDescriptionExpanded((prev) => !prev)
                      }
                    >
                      {isDescriptionExpanded ? "Свернуть" : "Показать полностью"}
                    </button>
                  ) : null}
                </div>

                <div className="product-page__info-block">
                  <h3 className="product-page__subheading text-h4">Автор</h3>

                  <div className="product-page__author-head">
                    <Link
                      to={
                        product.seller_id
                          ? `/sellers/${product.seller_id}`
                          : "/catalog"
                      }
                      className="product-page__author-avatar product-page__author-avatar--link"
                      aria-label="Открыть магазин продавца"
                    >
                      {getInitial(product.seller_username)}
                    </Link>

                    <div className="product-page__author-main">
                      <Link
                        to={
                          product.seller_id
                            ? `/sellers/${product.seller_id}`
                            : "/catalog"
                        }
                        className="product-page__author-name product-page__author-name--link text-p2"
                      >
                        {product.seller_username || "NeonMesh Studio"}
                      </Link>

                      <div className="product-page__rating-inline">
                        {renderStars(displaySellerRating).map(
                          (icon, index) => (
                            <img
                              key={index}
                              src={icon}
                              alt=""
                              className="product-page__stat-icon product-page__stat-icon--star"
                            />
                          ),
                        )}
                        <span className="text-p3">{displaySellerRating}</span>
                        <span className="product-page__reviews-count text-p3">
                          {displaySellerReviews} оценок
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="product-page__author-card text-p3">
                    Автор публикует 3D-модели для игр, визуализации и
                    интерфейсных сцен. Позже сюда можно вывести описание
                    продавца и другие его товары.
                  </div>
                </div>

                {error && (
                  <div className="product-page__error text-p2">{error}</div>
                )}
              </div>
            </aside>
          </div>

          <div id="comments" className="product-page__section-card">
            <h2 className="product-page__block-title text-h3">
              {comments.length} комментариев
            </h2>

            <div className="product-page__comment-form">
              <div className="product-page__author-avatar">
                {getInitial(user?.username || "Марина")}
              </div>

              <div className="product-page__comment-form-main">
                <textarea
                  className="product-page__comment-textarea text-p2"
                  placeholder="Введите комментарий"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />

                <div className="product-page__comment-actions">
                  <button
                    type="button"
                    className="product-page__small-secondary text-p3"
                    onClick={() => setCommentText("")}
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    className="product-page__small-primary text-p3"
                    onClick={handleSendComment}
                    disabled={commentSending}
                  >
                    {commentSending ? "Отправка..." : "Оставить комментарий"}
                  </button>
                </div>
              </div>
            </div>

            <div className="product-page__comments-list">
              {commentsLoading ? (
                <div className="product-page__state text-p2">
                  Загрузка комментариев...
                </div>
              ) : comments.length === 0 ? (
                <div className="product-page__state text-p2">
                  Пока нет комментариев. Будьте первым.
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="product-page__comment-item">
                    <div className="product-page__author-avatar">
                      {getInitial(comment.username)}
                    </div>

                    <div className="product-page__comment-content">
                      <div className="product-page__comment-name text-p2">
                        {comment.username}
                      </div>
                      <div className="product-page__comment-text text-p3">
                        {comment.text}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <ProductsSection title="Похожие модели" ordering="rating_desc" />
        </div>
      </section>

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={handleCheckoutSuccess}
        mode="product"
        productId={product?.id}
      />

      <PaymentSuccessModal
        isOpen={Boolean(successData)}
        onClose={() => setSuccessData(null)}
        successData={successData}
      />
    </>
  );
}
