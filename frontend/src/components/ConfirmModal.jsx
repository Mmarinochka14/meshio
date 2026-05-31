import "../styles/confirm-modal.css";

export default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText = "Подтвердить",
  cancelText = "Отмена",
  onClose,
  onConfirm,
  danger = false,
  commentLabel = "",
  commentValue = "",
  commentPlaceholder = "",
  onCommentChange,
  confirmDisabled = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal" onClick={onClose}>
      <div className="confirm-modal__card" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-modal__title text-h3">{title}</div>
        <div className="confirm-modal__description text-p2">{description}</div>

        {onCommentChange ? (
          <label className="confirm-modal__field">
            {commentLabel ? (
              <span className="confirm-modal__label text-p3">{commentLabel}</span>
            ) : null}
            <textarea
              className="confirm-modal__textarea text-p2"
              value={commentValue}
              onChange={(event) => onCommentChange(event.target.value)}
              placeholder={commentPlaceholder}
            />
          </label>
        ) : null}

        <div className="confirm-modal__actions">
          <button
            type="button"
            className="confirm-modal__secondary text-p2"
            onClick={onClose}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className={`confirm-modal__primary text-p2 ${
              danger ? "is-danger" : ""
            }`}
            onClick={onConfirm}
            disabled={confirmDisabled}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
