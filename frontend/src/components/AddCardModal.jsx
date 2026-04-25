import { useState } from "react";
import "../styles/add-card-modal.css";

export default function AddCardModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState({
    number: "",
    holder: "",
    expiry: "",
    cvv: "",
    brand: "card",
  });

  if (!isOpen) return null;

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function formatCardNumber(value) {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  }

  function formatExpiry(value) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (
      !form.number.trim() ||
      !form.holder.trim() ||
      !form.expiry.trim() ||
      !form.cvv.trim()
    ) {
      return;
    }

    onSubmit(form);

    setForm({
      number: "",
      holder: "",
      expiry: "",
      cvv: "",
      brand: "card",
    });
  }

  return (
    <div className="add-card-modal" onClick={onClose}>
      <div
        className="add-card-modal__card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="add-card-modal__title text-h3">Добавить карту</div>

        <form className="add-card-modal__form" onSubmit={handleSubmit}>
          <label className="add-card-modal__field">
            <span className="text-p3 add-card-modal__label">Тип оплаты</span>
            <select
              className="add-card-modal__input text-p2"
              value={form.brand}
              onChange={(e) => setField("brand", e.target.value)}
            >
              <option value="card">Банковская карта</option>
              <option value="mir">МИР</option>
              <option value="sbp">СБП</option>
              <option value="sber">SberPay</option>
            </select>
          </label>

          <label className="add-card-modal__field">
            <span className="text-p3 add-card-modal__label">Номер карты</span>
            <input
              className="add-card-modal__input text-p2"
              value={form.number}
              onChange={(e) =>
                setField("number", formatCardNumber(e.target.value))
              }
              placeholder="0000 0000 0000 0000"
            />
          </label>

          <label className="add-card-modal__field">
            <span className="text-p3 add-card-modal__label">Имя держателя</span>
            <input
              className="add-card-modal__input text-p2"
              value={form.holder}
              onChange={(e) => setField("holder", e.target.value)}
              placeholder="IVAN IVANOV"
            />
          </label>

          <div className="add-card-modal__row">
            <label className="add-card-modal__field">
              <span className="text-p3 add-card-modal__label">Срок</span>
              <input
                className="add-card-modal__input text-p2"
                value={form.expiry}
                onChange={(e) =>
                  setField("expiry", formatExpiry(e.target.value))
                }
                placeholder="MM/YY"
              />
            </label>

            <label className="add-card-modal__field">
              <span className="text-p3 add-card-modal__label">CVV</span>
              <input
                className="add-card-modal__input text-p2"
                value={form.cvv}
                onChange={(e) =>
                  setField("cvv", e.target.value.replace(/\D/g, "").slice(0, 3))
                }
                placeholder="123"
              />
            </label>
          </div>

          <div className="add-card-modal__actions">
            <button
              type="button"
              className="add-card-modal__secondary text-p2"
              onClick={onClose}
            >
              Отмена
            </button>
            <button type="submit" className="add-card-modal__primary text-p2">
              Добавить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
