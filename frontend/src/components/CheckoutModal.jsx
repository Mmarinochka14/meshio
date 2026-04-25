import { useEffect, useMemo, useState } from "react";
import Modal from "./modals/Modal";
import "../styles/checkout-modal.css";

import mirIcon from "../assets/icons/mir.svg";
import sbpIcon from "../assets/icons/sbp.svg";
import sberpayIcon from "../assets/icons/sberpay.svg";
import cardIcon from "../assets/icons/card.svg";

import {
  getCheckoutPreview,
  getProductCheckoutPreview,
  payCheckout,
  payProductCheckout,
} from "../api/cart";
import { getUser } from "./auth/authStore";

function formatPrice(value) {
  return `${Number(value || 0)} ₽`;
}

function getPaymentIcon(method) {
  if (method === "sbp") return sbpIcon;
  if (method === "sberpay") return sberpayIcon;
  if (method === "bank_card") return mirIcon;
  return cardIcon;
}

function getPaymentLabel(method) {
  if (method === "sbp") return "СБП";
  if (method === "sberpay") return "SberPay";
  if (method === "bank_card") return "Банковская карта";
  return "Оплата";
}

export default function CheckoutModal({
  isOpen,
  onClose,
  onSuccess,
  mode = "cart",
  productId = null,
}) {
  const currentUser = getUser();
  const isBuyer = currentUser?.role === "buyer";

  const [checkout, setCheckout] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState("bank_card");
  const [agreeRules, setAgreeRules] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setCheckout(null);
      setSelectedPayment("bank_card");
      setAgreeRules(false);
      setIsLoading(false);
      setIsPaying(false);
      setError("");
      return;
    }

    let mounted = true;

    async function loadPreview() {
      if (!isBuyer) {
        setError("Для оплаты необходимо войти в аккаунт покупателя.");
        return;
      }

      try {
        setIsLoading(true);
        setError("");

        const data =
          mode === "product" && productId
            ? await getProductCheckoutPreview(productId)
            : await getCheckoutPreview();

        if (!mounted) return;

        setCheckout(data);

        const firstMethod = Array.isArray(data?.payment_methods)
          ? data.payment_methods[0]?.value
          : "bank_card";

        setSelectedPayment(firstMethod || "bank_card");
      } catch (e) {
        if (!mounted) return;
        setError(
          e?.response?.data?.detail ||
            "Не удалось подготовить оформление заказа.",
        );
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadPreview();

    return () => {
      mounted = false;
    };
  }, [isOpen, isBuyer, mode, productId]);

  const paymentMethods = useMemo(() => {
    return Array.isArray(checkout?.payment_methods)
      ? checkout.payment_methods
      : [];
  }, [checkout]);

  async function handlePay() {
    if (!agreeRules || isPaying) return;

    try {
      setIsPaying(true);
      setError("");

      const data =
        mode === "product" && productId
          ? await payProductCheckout(productId, selectedPayment)
          : await payCheckout(selectedPayment);

      onSuccess?.({
        order: data,
        items: Array.isArray(checkout?.items) ? checkout.items : [],
      });

      onClose?.();
    } catch (e) {
      setError(e?.response?.data?.detail || "Не удалось провести оплату.");
    } finally {
      setIsPaying(false);
    }
  }

  function handleAuthOpen() {
    onClose?.();
    window.dispatchEvent(
      new CustomEvent("meshio:open-auth-modal", {
        detail: { step: "login", role: "buyer" },
      }),
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      panelClassName="modal__panel--checkout"
    >
      <div className="checkout-modal">
        <div className="checkout-modal__header">
          <h2 className="checkout-modal__title text-h2">
            {mode === "product" ? "Покупка модели" : "Подтверждение заказа"}
          </h2>
          <p className="checkout-modal__subtitle text-p2">
            Проверьте данные и подтвердите оплату
          </p>
        </div>

        {!isBuyer ? (
          <div className="checkout-modal__state">
            <div className="checkout-modal__state-title text-h4">
              Оформление заказа недоступно
            </div>
            <p className="checkout-modal__state-text text-p2">
              Для оплаты необходимо войти в аккаунт покупателя.
            </p>

            <div className="checkout-modal__actions checkout-modal__actions--auth">
              <button
                type="button"
                className="checkout-modal__secondary-btn text-p2"
                onClick={onClose}
              >
                Отмена
              </button>

              <button
                type="button"
                className="checkout-modal__primary-btn text-p2"
                onClick={handleAuthOpen}
              >
                Войти
              </button>
            </div>
          </div>
        ) : isLoading ? (
          <div className="checkout-modal__state text-p2">Загрузка...</div>
        ) : (
          <>
            {error ? (
              <div className="checkout-modal__error text-p2">{error}</div>
            ) : null}

            <div className="checkout-modal__items">
              {checkout?.items?.map((item) => (
                <div key={item.product_id} className="checkout-modal__item">
                  <div className="checkout-modal__item-media">
                    {item.preview_url ? (
                      <img src={item.preview_url} alt={item.title} />
                    ) : (
                      <div className="checkout-modal__item-placeholder text-p3">
                        Preview
                      </div>
                    )}
                  </div>

                  <div className="checkout-modal__item-main">
                    <div className="checkout-modal__item-top">
                      <div className="checkout-modal__item-title text-p2">
                        {item.title}
                      </div>

                      <div className="checkout-modal__item-price text-p2">
                        {formatPrice(item.price)}
                      </div>
                    </div>

                    {item.tags?.length ? (
                      <div className="checkout-modal__item-tags">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="checkout-modal__item-tag text-p3"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <div className="checkout-modal__section">
              <div className="checkout-modal__section-title text-p1">
                Способ оплаты
              </div>

              <div className="checkout-modal__payments">
                {paymentMethods.map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    className={`checkout-modal__payment-btn ${
                      selectedPayment === method.value ? "is-active" : ""
                    }`}
                    onClick={() => setSelectedPayment(method.value)}
                  >
                    <img
                      src={getPaymentIcon(method.value)}
                      alt=""
                      className="checkout-modal__payment-icon"
                    />
                    <span className="text-p3">
                      {getPaymentLabel(method.value)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="checkout-modal__summary">
              <div className="checkout-modal__summary-row">
                <span className="text-p2">Товаров</span>
                <span className="text-p2">{checkout?.total_items || 0}</span>
              </div>

              <div className="checkout-modal__summary-row">
                <span className="text-p2">Сумма заказа</span>
                <span className="text-p2">
                  {formatPrice(checkout?.total_price)}
                </span>
              </div>

              <div className="checkout-modal__summary-row">
                <span className="text-p2">Комиссия платформы</span>
                <span className="text-p2">
                  {formatPrice(checkout?.platform_fee)}
                </span>
              </div>

              <div className="checkout-modal__summary-row">
                <span className="text-p2">Продавцам</span>
                <span className="text-p2">
                  {formatPrice(checkout?.seller_amount)}
                </span>
              </div>

              <div className="checkout-modal__summary-row checkout-modal__summary-row--total">
                <span className="text-p1">Итого к оплате</span>
                <span className="text-h3">
                  {formatPrice(checkout?.total_price)}
                </span>
              </div>
            </div>

            <label className="checkout-modal__agree">
              <input
                type="checkbox"
                checked={agreeRules}
                onChange={(e) => setAgreeRules(e.target.checked)}
              />
              <span className="text-p3">
                Соглашаюсь с правилами использования торговой площадки
              </span>
            </label>

            <div className="checkout-modal__actions">
              <button
                type="button"
                className="checkout-modal__primary-btn text-p2"
                onClick={handlePay}
                disabled={isPaying || !agreeRules}
              >
                {isPaying ? "Оплата..." : "Оплатить"}
              </button>

              <button
                type="button"
                className="checkout-modal__secondary-btn text-p2"
                onClick={onClose}
                disabled={isPaying}
              >
                Отмена
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
