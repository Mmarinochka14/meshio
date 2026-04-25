import { useEffect, useState } from "react";
import Modal from "./modals/Modal";
import "../styles/rating-modal.css";

import starIcon from "../assets/icons/star.svg";
import starEmptyIcon from "../assets/icons/star-empty.svg";
import { addOrUpdateProductReview } from "../api/products";

export default function RatingModal({
  isOpen,
  onClose,
  productId,
  productTitle,
  initialRating = 0,
  initialText = "",
  onSuccess,
}) {
  const [rating, setRating] = useState(initialRating || 0);
  const [text, setText] = useState(initialText || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setRating(initialRating || 0);
    setText(initialText || "");
    setError("");
    setIsSaving(false);
  }, [isOpen, initialRating, initialText]);

  async function handleSubmit() {
    if (!rating) {
      setError("Поставьте оценку от 1 до 5.");
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      const data = await addOrUpdateProductReview(productId, {
        rating,
        text,
      });

      onSuccess?.(data?.review || null);
      onClose?.();
    } catch (e) {
      setError(
        e?.response?.data?.detail ||
          e?.response?.data?.rating?.[0] ||
          e?.response?.data?.text?.[0] ||
          "Не удалось сохранить оценку.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      panelClassName="modal__panel--rating"
    >
      <div className="rating-modal">
        <h2 className="rating-modal__title text-h2">Оценить модель</h2>

        <p className="rating-modal__subtitle text-p2">
          Поделитесь впечатлением о модели{" "}
          {productTitle ? `«${productTitle}»` : ""}.
        </p>

        <div className="rating-modal__stars">
          {Array.from({ length: 5 }, (_, index) => {
            const value = index + 1;
            const isActive = value <= rating;

            return (
              <button
                key={value}
                type="button"
                className={`rating-modal__star-btn ${isActive ? "is-active" : ""}`}
                onClick={() => setRating(value)}
              >
                <img
                  src={isActive ? starIcon : starEmptyIcon}
                  alt=""
                  className="rating-modal__star-icon"
                />
              </button>
            );
          })}
        </div>

        <label className="rating-modal__field">
          <span className="rating-modal__label text-p3">
            Комментарий к оценке
          </span>

          <textarea
            className="rating-modal__textarea text-p2"
            placeholder="Расскажите, что понравилось в модели, качестве, оптимизации или текстурах"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>

        {error ? (
          <div className="rating-modal__error text-p2">{error}</div>
        ) : null}

        <div className="rating-modal__actions">
          <button
            type="button"
            className="rating-modal__secondary text-p2"
            onClick={onClose}
            disabled={isSaving}
          >
            Отмена
          </button>

          <button
            type="button"
            className="rating-modal__primary text-p2"
            onClick={handleSubmit}
            disabled={isSaving}
          >
            {isSaving ? "Сохранение..." : "Оставить оценку"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
