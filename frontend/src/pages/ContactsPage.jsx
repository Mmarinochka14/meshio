import { useState } from "react";
import { getUser } from "../components/auth/authStore";
import "../styles/contacts-page.css";
import { sendContactRequest, subscribeToNewsletter } from "../api/contacts";

export default function ContactsPage() {
  const storedUser = getUser();
  const isUserAuthenticated = Boolean(storedUser);
  const isAdminUser = storedUser?.role === "admin";

  const [contactForm, setContactForm] = useState(() => ({
    name: storedUser?.username || "",
    email: storedUser?.email || "",
    subject: "",
    message: "",
  }));

  const [newsletterEmail, setNewsletterEmail] = useState(
    () => storedUser?.email || "",
  );

  const [contactSuccess, setContactSuccess] = useState("");
  const [contactError, setContactError] = useState("");

  const [newsletterSuccess, setNewsletterSuccess] = useState("");
  const [newsletterError, setNewsletterError] = useState("");

  const [isSendingContact, setIsSendingContact] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  function handleContactChange(event) {
    const { name, value } = event.target;

    setContactForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleContactSubmit(event) {
    event.preventDefault();

    if (isAdminUser) {
      setContactError("Администратор не может отправлять обращения.");
      return;
    }

    setContactSuccess("");
    setContactError("");
    setIsSendingContact(true);

    try {
      const data = await sendContactRequest(contactForm);

      setContactSuccess(data?.detail || "Сообщение отправлено.");
      setContactForm({
        name: storedUser?.username || "",
        email: storedUser?.email || "",
        subject: "",
        message: "",
      });
    } catch (error) {
      const backendErrors = error?.response?.data;

      if (backendErrors && typeof backendErrors === "object") {
        const firstFieldError = Object.values(backendErrors)?.[0];

        if (Array.isArray(firstFieldError) && firstFieldError[0]) {
          setContactError(firstFieldError[0]);
        } else {
          setContactError(
            backendErrors?.detail || "Не удалось отправить сообщение.",
          );
        }
      } else {
        setContactError("Не удалось отправить сообщение.");
      }
    } finally {
      setIsSendingContact(false);
    }
  }

  async function handleNewsletterSubmit(event) {
    event.preventDefault();

    setNewsletterSuccess("");
    setNewsletterError("");
    setIsSubscribing(true);

    try {
      const data = await subscribeToNewsletter(newsletterEmail);

      setNewsletterSuccess(
        data?.detail || "Подписка оформлена. Проверьте почту.",
      );
      setNewsletterEmail(storedUser?.email || "");
    } catch (error) {
      const backendErrors = error?.response?.data;

      if (backendErrors && typeof backendErrors === "object") {
        const firstFieldError = Object.values(backendErrors)?.[0];

        if (Array.isArray(firstFieldError) && firstFieldError[0]) {
          setNewsletterError(firstFieldError[0]);
        } else {
          setNewsletterError(
            backendErrors?.detail || "Не удалось оформить подписку.",
          );
        }
      } else {
        setNewsletterError("Не удалось оформить подписку.");
      }
    } finally {
      setIsSubscribing(false);
    }
  }

  return (
    <section className="contacts-page">
      <div className="contacts-page__container">
        <h1 className="contacts-page__title text-h2">Контакты</h1>
        <div className="contacts-page__divider" />

        <div className="contacts-page__grid">
          <div className="contacts-page__form-card">
            <h2 className="contacts-page__card-title text-h3">
              Форма обратной связи
            </h2>

            {isAdminUser ? (
              <div className="contacts-page__admin-note">
                <p className="text-p2">
                  Администратор не может отправлять обращения через публичную
                  форму.
                </p>
                <p className="text-p3">
                  Для работы с запросами пользователей используйте панель
                  администратора.
                </p>
              </div>
            ) : (
              <form className="contacts-form" onSubmit={handleContactSubmit}>
                <label className="contacts-form__field">
                  <span className="contacts-form__label text-p3">Никнейм</span>
                  <input
                    type="text"
                    name="name"
                    className="contacts-form__input text-p2"
                    placeholder="Введите никнейм"
                    value={contactForm.name}
                    onChange={handleContactChange}
                    readOnly={isUserAuthenticated}
                  />
                </label>

                <label className="contacts-form__field">
                  <span className="contacts-form__label text-p3">
                    Электронная почта
                  </span>
                  <input
                    type="email"
                    name="email"
                    className="contacts-form__input text-p2"
                    placeholder="Введите электронную почту"
                    value={contactForm.email}
                    onChange={handleContactChange}
                    readOnly={isUserAuthenticated}
                  />
                </label>

                <label className="contacts-form__field">
                  <span className="contacts-form__label text-p3">Тема</span>
                  <input
                    type="text"
                    name="subject"
                    className="contacts-form__input text-p2"
                    placeholder="Введите тему сообщения"
                    value={contactForm.subject}
                    onChange={handleContactChange}
                  />
                </label>

                <label className="contacts-form__field">
                  <span className="contacts-form__label text-p3">
                    Сообщение
                  </span>
                  <textarea
                    name="message"
                    className="contacts-form__textarea text-p2"
                    placeholder="Введите сообщение"
                    value={contactForm.message}
                    onChange={handleContactChange}
                  />
                </label>

                <button
                  type="submit"
                  className="contacts-form__submit text-p2"
                  disabled={isSendingContact}
                >
                  {isSendingContact ? "Отправка..." : "Отправить"}
                </button>

                {contactSuccess ? (
                  <p className="contacts-form__success text-p3">
                    {contactSuccess}
                  </p>
                ) : null}

                {contactError ? (
                  <p className="contacts-form__error text-p3">{contactError}</p>
                ) : null}
              </form>
            )}
          </div>

          <div className="contacts-page__right">
            <div className="contacts-page__info-card contacts-page__info-card--center">
              <div className="contacts-page__icon-wrap">
                <span className="contacts-page__icon">✉</span>
              </div>

              <h3 className="contacts-page__info-title text-h3">
                E-mail поддержки
              </h3>

              <p className="contacts-page__info-email text-p1">
                meshio_help@gmail.com
              </p>

              <p className="contacts-page__info-text text-p2">
                Ответим в течение 24 часов
              </p>
            </div>

            <div className="contacts-page__info-card">
              <h3 className="contacts-page__info-title text-h3">
                Новостная рассылка
              </h3>

              <p className="contacts-page__info-text text-p2">
                Подпишитесь на рассылку, чтобы всегда быть в курсе обновлений
                каталога моделей и новых возможностей Meshio
              </p>

              <form
                className="contacts-page__subscribe"
                onSubmit={handleNewsletterSubmit}
              >
                <input
                  type="email"
                  className="contacts-page__subscribe-input text-p2"
                  placeholder="Введите электронную почту"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                />

                <button
                  type="submit"
                  className="contacts-page__subscribe-button text-p2"
                  disabled={isSubscribing}
                >
                  {isSubscribing ? "Отправка..." : "Подписаться"}
                </button>
              </form>

              {newsletterSuccess ? (
                <p className="contacts-form__success text-p3">
                  {newsletterSuccess}
                </p>
              ) : null}

              {newsletterError ? (
                <p className="contacts-form__error text-p3">
                  {newsletterError}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
