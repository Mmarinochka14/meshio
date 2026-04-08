export default function ContactsInfoSection() {
  return (
    <section className="contacts-info-section">
      <div className="contacts-info-section__container">
        <div className="contacts-info-section__grid">
          <article className="contacts-info-card">
            <div className="contacts-info-card__icon">✉</div>
            <h3 className="contacts-info-card__title text-h4">
              Поддержка по email
            </h3>
            <p className="contacts-info-card__text text-p2">
              По вопросам платформы, заказов, моделей и публикации работ.
            </p>
            <a
              href="mailto:support@meshio.ru"
              className="contacts-info-card__link text-p2"
            >
              support@meshio.ru
            </a>
          </article>

          <article className="contacts-info-card contacts-info-card--gradient">
            <div className="contacts-info-card__icon">✦</div>
            <h3 className="contacts-info-card__title text-h4">
              Новости Meshio
            </h3>
            <p className="contacts-info-card__text text-p2">
              Следите за обновлениями платформы, новыми функциями просмотра и
              возможностями работы с текстурами.
            </p>
            <button
              type="button"
              className="contacts-info-card__button text-p3"
            >
              Подписаться
            </button>
          </article>

          <article className="contacts-info-card">
            <div className="contacts-info-card__icon">⌁</div>
            <h3 className="contacts-info-card__title text-h4">
              Для авторов моделей
            </h3>
            <p className="contacts-info-card__text text-p2">
              Если вы хотите размещать 3D-модели на платформе, свяжитесь с нами
              для уточнения условий публикации и модерации.
            </p>
            <span className="contacts-info-card__meta text-p3">
              Раздел для продавцов и авторов
            </span>
          </article>
        </div>
      </div>
    </section>
  );
}
