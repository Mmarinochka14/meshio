import "../styles/privacy-page.css";

export default function PrivacyPage() {
  return (
    <section className="privacy-page">
      <div className="privacy-page__container">
        <header className="privacy-page__header">
          <h1 className="privacy-page__title text-h2">
            Политика конфиденциальности
          </h1>
          <p className="privacy-page__lead text-p2">
            Meshio хранит только те данные, которые нужны для регистрации,
            покупок, публикации моделей и обратной связи.
          </p>
        </header>

        <div className="privacy-page__content">
          <section className="privacy-page__block">
            <h2 className="privacy-page__heading text-h3">Какие данные мы собираем</h2>
            <p className="text-p2">
              Имя пользователя, email, пароль в защищенном виде, данные профиля,
              информацию о заказах, избранном, комментариях, отзывах и моделях,
              которые продавец загружает на платформу.
            </p>
          </section>

          <section className="privacy-page__block">
            <h2 className="privacy-page__heading text-h3">Зачем это нужно</h2>
            <p className="text-p2">
              Эти данные помогают входить в аккаунт, восстанавливать пароль,
              показывать личный кабинет, оформлять покупки, хранить историю
              моделей и поддерживать работу магазина продавца.
            </p>
          </section>

          <section className="privacy-page__block">
            <h2 className="privacy-page__heading text-h3">Безопасность</h2>
            <p className="text-p2">
              Пароли не хранятся открытым текстом. Доступ к личным разделам
              защищен авторизацией, а служебные файлы и настройки базы данных не
              публикуются во фронтенде.
            </p>
          </section>

          <section className="privacy-page__block">
            <h2 className="privacy-page__heading text-h3">Связь</h2>
            <p className="text-p2">
              По вопросам удаления или изменения данных можно написать на
              example11@gmail.com.
            </p>
          </section>
        </div>
      </div>
    </section>
  );
}
