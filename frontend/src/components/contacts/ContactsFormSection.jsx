import { useState } from "react";

export default function ContactsFormSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    topic: "",
    message: "",
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    console.log("Contacts form submitted:", formData);

    setIsSubmitted(true);

    setFormData({
      name: "",
      email: "",
      topic: "",
      message: "",
    });
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
                name="topic"
                className="contacts-form__input text-p2"
                placeholder="Например: вопрос по публикации модели"
                value={formData.topic}
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
              <button type="submit" className="contacts-form__submit text-p3">
                Отправить сообщение
              </button>
            </div>

            {isSubmitted ? (
              <div className="contacts-form__success text-p3">
                Сообщение отправлено. Для предзащиты можно оставить этот
                интерфейсный сценарий или потом подключить реальный backend.
              </div>
            ) : null}
          </form>
        </div>
      </div>
    </section>
  );
}
