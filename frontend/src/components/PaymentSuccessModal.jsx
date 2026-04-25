import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "./modals/Modal";
import "../styles/payment-success-modal.css";

import { downloadProduct } from "../api/products";

function formatPrice(value) {
  return `${Number(value || 0)} ₽`;
}

export default function PaymentSuccessModal({ isOpen, onClose, successData }) {
  const navigate = useNavigate();
  const [isDownloading, setIsDownloading] = useState(false);
  const [hasAutoDownloaded, setHasAutoDownloaded] = useState(false);

  const order = successData?.order || null;
  const items = Array.isArray(successData?.items) ? successData.items : [];

  const productIds = useMemo(() => {
    return items.map((item) => item.product_id).filter(Boolean);
  }, [items]);

  useEffect(() => {
    if (!isOpen) {
      setHasAutoDownloaded(false);
      setIsDownloading(false);
      return;
    }

    async function autoDownloadSingle() {
      if (productIds.length !== 1 || hasAutoDownloaded) return;

      try {
        setIsDownloading(true);
        const data = await downloadProduct(productIds[0]);
        const url = data?.download_url;

        if (url) {
          window.location.href = url;
          setHasAutoDownloaded(true);
        }
      } catch (e) {
        console.error("Не удалось автоматически скачать модель", e);
      } finally {
        setIsDownloading(false);
      }
    }

    autoDownloadSingle();
  }, [isOpen, productIds, hasAutoDownloaded]);

  async function handleDownloadAll() {
    if (productIds.length === 0) return;

    try {
      setIsDownloading(true);

      for (const productId of productIds) {
        const data = await downloadProduct(productId);
        const url = data?.download_url;

        if (url) {
          window.open(url, "_blank", "noopener,noreferrer");
        }
      }
    } catch (e) {
      console.error("Не удалось скачать модели", e);
    } finally {
      setIsDownloading(false);
    }
  }

  function handleGoToMyModels() {
    onClose?.();
    navigate("/my-models");
  }

  function handleContinueShopping() {
    onClose?.();
    navigate("/catalog");
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      panelClassName="modal__panel--payment-success"
    >
      <div className="payment-success-modal">
        <div className="payment-success-modal__icon">✓</div>

        <h2 className="payment-success-modal__title text-h2">
          Оплата прошла успешно
        </h2>

        <p className="payment-success-modal__text text-p2">
          Модели добавлены в раздел “Мои модели” и готовы к скачиванию.
        </p>

        <div className="payment-success-modal__meta text-p2">
          Заказ #{order?.order_id || "—"} · {formatPrice(order?.total_price)}
        </div>

        {items.length > 0 ? (
          <div className="payment-success-modal__list">
            {items.map((item) => (
              <div
                key={item.product_id}
                className="payment-success-modal__list-item"
              >
                <span className="text-p3">{item.title}</span>
                <span className="text-p3">{formatPrice(item.price)}</span>
              </div>
            ))}
          </div>
        ) : null}

        <div className="payment-success-modal__actions">
          <button
            type="button"
            className="payment-success-modal__primary text-p2"
            onClick={handleGoToMyModels}
          >
            Перейти в “Мои модели”
          </button>

          <button
            type="button"
            className="payment-success-modal__secondary text-p2"
            onClick={handleContinueShopping}
          >
            Продолжить покупки
          </button>
        </div>

        <div className="payment-success-modal__actions payment-success-modal__actions--single">
          <button
            type="button"
            className="payment-success-modal__download text-p2"
            onClick={handleDownloadAll}
            disabled={isDownloading}
          >
            {productIds.length === 1
              ? isDownloading
                ? "Скачивание..."
                : "Скачать модель"
              : isDownloading
                ? "Скачивание..."
                : "Скачать модели"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
