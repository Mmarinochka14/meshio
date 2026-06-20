import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/cart-page.css";
import { buildMediaUrl } from "../api/url";

import trashIcon from "../assets/icons/delete.svg";
import cartIcon from "../assets/icons/cart.svg";
import { getMyCart, removeFromCartRequest } from "../api/cart";
import { getUser } from "../components/auth/authStore";
import {
  getGuestCartProductIds,
  removeFromGuestCart,
  subscribeCart,
} from "../components/cart/cartStore";
import NewModelsSection from "../components/NewModelsSection";
import CheckoutModal from "../components/CheckoutModal";
import PaymentSuccessModal from "../components/PaymentSuccessModal";

import { getProductsByIds } from "../api/products";

function formatPrice(value) {
  const price = Number(value || 0);
  return price === 0 ? "Бесплатно" : `${price} ₽`;
}

export default function CartPage() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const currentUser = getUser();
  const isBuyer = currentUser?.role === "buyer";

  useEffect(() => {
    let mounted = true;

    async function loadCart() {
      try {
        setIsLoading(true);
        setError("");

        if (isBuyer) {
          const data = await getMyCart();
          if (!mounted) return;

          const backendItems = Array.isArray(data?.items) ? data.items : [];
          setItems(
            backendItems.map((item) => ({
              id: item.id,
              product: item.product,
              source: "backend",
            })),
          );
          return;
        }

        const guestIds = getGuestCartProductIds();

        if (guestIds.length === 0) {
          if (mounted) setItems([]);
          return;
        }

        const data = await getProductsByIds(guestIds);
        const guestProducts = Array.isArray(data?.results) ? data.results : [];

        if (!mounted) return;

        setItems(
          guestProducts.map((product) => ({
            id: product.id,
            product,
            source: "guest",
          })),
        );
      } catch (err) {
        if (!mounted) return;
        setError("Не удалось загрузить корзину.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadCart();

    const unsubCart = subscribeCart(() => {
      if (!isBuyer) {
        loadCart();
      }
    });

    return () => {
      mounted = false;
      unsubCart();
    };
  }, [isBuyer]);

  async function handleRemove(item) {
    try {
      setError("");

      if (item.source === "backend") {
        await removeFromCartRequest(item.product.id);
      } else {
        removeFromGuestCart(item.product.id);
      }

      setItems((prev) =>
        prev.filter((cartItem) => cartItem.product.id !== item.product.id),
      );
    } catch (err) {
      setError("Не удалось удалить товар из корзины.");
    }
  }

  function handleCheckoutClick() {
    if (isBuyer) {
      setIsCheckoutOpen(true);
      return;
    }

    window.dispatchEvent(
      new CustomEvent("meshio:open-auth-modal", {
        detail: { step: "login", role: "buyer" },
      }),
    );
  }

  function handleCheckoutSuccess(data) {
    setItems([]);
    setSuccessData(data);
  }

  const totalItems = items.length;

  const totalPrice = useMemo(() => {
    return items.reduce((sum, item) => {
      return sum + Number(item.product?.price || 0);
    }, 0);
  }, [items]);

  return (
    <>
      <section className="cart-page">
        <div className="cart-page__container">
          <h1 className="cart-page__title text-h2">Корзина</h1>
          <div className="cart-page__divider" />

          {isLoading ? (
            <div className="cart-page__state text-p2">Загрузка...</div>
          ) : items.length === 0 ? (
            <div className="cart-page__empty">
              <div className="cart-page__empty-icon-wrap">
                <img src={cartIcon} alt="" className="cart-page__empty-icon" />
              </div>

              <h2 className="cart-page__empty-title text-h3">
                Ваша корзина пуста
              </h2>

              <p className="cart-page__empty-text text-p2">
                Добавьте понравившиеся платные модели в корзину, чтобы вернуться
                к ним позже и перейти к покупке.
              </p>

              <Link to="/catalog" className="cart-page__empty-button text-p2">
                Перейти в каталог
              </Link>
            </div>
          ) : (
            <div className="cart-page__layout">
              <div className="cart-page__list">
                {items.map((item) => {
                  const product = item.product;

                  const rawPreview =
                    product.thumbnail_url ||
                    product.main_preview_url ||
                    product.preview_url ||
                    product.preview ||
                    "";

                  const previewSrc = buildMediaUrl(rawPreview);

                  const tags = [
                    product.model_format
                      ? product.model_format.toUpperCase()
                      : null,
                    product.has_textures ? "PBR" : null,
                    product.has_uv ? "UV" : null,
                    product.poly_style
                      ? product.poly_style
                          .replace("_", "-")
                          .replace(/\b\w/g, (char) => char.toUpperCase())
                      : null,
                  ].filter(Boolean);

                  return (
                    <article
                      key={`${item.source}-${product.id}`}
                      className="cart-page__item"
                    >
                      <Link
                        to={`/products/${product.id}`}
                        className="cart-page__item-media"
                      >
                        {previewSrc ? (
                          <img
                            src={previewSrc}
                            alt={product.title}
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="cart-page__item-placeholder text-p3">
                            Preview
                          </div>
                        )}
                      </Link>

                      <div className="cart-page__item-main">
                        <div className="cart-page__item-top">
                          <div>
                            <Link
                              to={`/products/${product.id}`}
                              className="cart-page__item-title text-h4"
                            >
                              {product.title}
                            </Link>

                            <div className="cart-page__item-price text-h3">
                              {formatPrice(product.price)}
                            </div>
                          </div>

                          <button
                            type="button"
                            className="cart-page__remove"
                            onClick={() => handleRemove(item)}
                            aria-label="Удалить из корзины"
                          >
                            <img src={trashIcon} alt="" />
                          </button>
                        </div>

                        {tags.length > 0 ? (
                          <div className="cart-page__item-tags">
                            {tags.map((tag) => (
                              <span
                                key={tag}
                                className="cart-page__item-tag text-p3"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        <p className="cart-page__item-description text-p2">
                          {product.description ||
                            "Описание модели пока не добавлено."}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>

              <aside className="cart-page__summary">
                <div className="cart-page__summary-card">
                  <h2 className="cart-page__summary-title text-h3">
                    Сводка заказа
                  </h2>

                  <div className="cart-page__summary-row">
                    <span className="text-p2">Количество товаров</span>
                    <span className="text-p2">{totalItems}</span>
                  </div>

                  <div className="cart-page__summary-row">
                    <span className="text-p2">Итого</span>
                    <span className="text-h3">{totalPrice} ₽</span>
                  </div>

                  <button
                    type="button"
                    className="cart-page__summary-button text-p2"
                    onClick={handleCheckoutClick}
                  >
                    {isBuyer ? "Перейти к оплате" : "Войти для оплаты"}
                  </button>

                  <p className="cart-page__summary-note text-p3">
                    Заказ будет подтверждён в модальном окне оплаты.
                  </p>

                  {!isBuyer ? (
                    <p className="cart-page__summary-note text-p3">
                      Для оформления заказа потребуется вход в аккаунт
                      покупателя.
                    </p>
                  ) : null}

                  {error ? (
                    <p className="cart-page__summary-note text-p3">{error}</p>
                  ) : null}
                </div>
              </aside>
            </div>
          )}
        </div>

        <NewModelsSection />
      </section>

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={handleCheckoutSuccess}
        mode="cart"
      />

      <PaymentSuccessModal
        isOpen={Boolean(successData)}
        onClose={() => setSuccessData(null)}
        successData={successData}
      />
    </>
  );
}
