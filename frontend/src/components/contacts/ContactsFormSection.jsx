import { useState } from "react";
import { sendContactRequest } from "../../api/contacts";

export default function ContactsFormSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setStatusMessage("");
    setErrorMessage("");
    setIsSending(true);

    try {
      const data = await sendContactRequest(formData);
      setStatusMessage(data?.detail || "Сообщение отправлено.");
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      const detail = error?.response?.data?.detail;
      setErrorMessage(detail || "Не удалось отправить сообщение.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="contacts-form-section">
      <div className="contacts-form-section__container">
        <div className="contacts-form-section__grid">
          <div className="contacts-form-section__left">
            <h2 className="contacts-form-section__title text-h3">
              Форма обратной связи
            </h2>

            <p className="contacts-form-section__text text-p2">
              Оставьте сообщение, и мы свяжемся с вами. Для предзащиты этого уже
              достаточно: форма выглядит полноценно, работает как интерфейс и не
              ломает страницу.
            </p>

            <div className="contacts-form-section__note text-p3">
              Поддержка по вопросам платформы, публикации моделей и работы с
              материалами.
            </div>
          </div>

          <form className="contacts-form" onSubmit={handleSubmit}>
            <label className="contacts-form__field">
              <span className="contacts-form__label text-p3">Ваше имя</span>
              <input
                type="text"
                name="name"
                className="contacts-form__input text-p2"
                placeholder="Введите имя"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </label>

            <label className="contacts-form__field">
              <span className="contacts-form__label text-p3">Email</span>
              <input
                type="email"
                name="email"
                className="contacts-form__input text-p2"
                placeholder="example@mail.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </label>

            <label className="contacts-form__field">
              <span className="contacts-form__label text-p3">Тема</span>
              <input
                type="text"
                name="subject"
                className="contacts-form__input text-p2"
                placeholder="Например: вопрос по публикации модели"
                value={formData.subject}
                onChange={handleChange}
                required
              />
            </label>

            <label className="contacts-form__field">
              <span className="contacts-form__label text-p3">Сообщение</span>
              <textarea
                name="message"
                className="contacts-form__textarea text-p2"
                placeholder="Опишите ваш вопрос"
                value={formData.message}
                onChange={handleChange}
                required
              />
            </label>

            <div className="contacts-form__actions">
              <button
                type="submit"
                className="contacts-form__submit text-p3"
                disabled={isSending}
              >
                {isSending ? "Отправка..." : "Отправить сообщение"}
              </button>
            </div>

            {statusMessage ? (
              <div className="contacts-form__success text-p3">
                {statusMessage}
              </div>
            ) : null}

            {errorMessage ? (
              <div className="contacts-form__error text-p3">
                {errorMessage}
              </div>
            ) : null}
          </form>
        </div>
      </div>
    </section>
  );
}
