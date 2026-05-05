import Modal from "./Modal";
import "../../styles/seller-start-modal.css";

import profileIcon from "../../assets/icons/user.svg";
import uploadIcon from "../../assets/icons/upload.svg";
import moderationIcon from "../../assets/icons/sertificate.svg";
import payoutIcon from "../../assets/icons/money.svg";

export default function SellerStartModal({
  isOpen,
  onClose,
  onCreateSellerProfile,
}) {
  function handleCreateSellerProfile() {
    onClose?.();
    onCreateSellerProfile?.();
  }

  const steps = [
    {
      number: "01",
      title: "Создание профиля",
      text: "Заполните данные продавца и создайте профиль для публикации своих 3D-моделей на платформе.",
      icon: profileIcon,
    },
    {
      number: "02",
      title: "Загрузка модели",
      text: "Добавьте модель, превью и описание. После этого товар можно отправить на проверку.",
      icon: uploadIcon,
    },
    {
      number: "03",
      title: "Модерация",
      text: "Команда Meshio проверит карточку товара, корректность данных и готовность модели к публикации.",
      icon: moderationIcon,
    },
    {
      number: "04",
      title: "Продажи и выплаты",
      text: "После публикации модель становится доступной покупателям, а вы можете отслеживать продажи и выплаты.",
      icon: payoutIcon,
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      panelClassName="modal__panel--seller-start"
    >
      <div className="seller-start-modal">
        <h2 className="seller-start-modal__title text-h2">Стать продавцом</h2>

        <div className="seller-start-modal__divider" />

        <p className="seller-start-modal__intro text-h4">
          Публикуйте свои 3D-модели, настраивайте при помощи ИИ и получайте
          выплаты. Все остальное мы возьмем на себя.
        </p>

        <h3 className="seller-start-modal__subtitle text-h4">
          Как это работает?
        </h3>

        <div className="seller-start-modal__grid">
          {steps.map((step) => (
            <article key={step.number} className="seller-start-modal__card">
              <div className="seller-start-modal__card-top">
                <span className="seller-start-modal__number text-h2">
                  {step.number}
                </span>

                <div className="seller-start-modal__icon-wrap">
                  <img
                    src={step.icon}
                    alt=""
                    className="seller-start-modal__icon"
                  />
                </div>
              </div>

              <h4 className="seller-start-modal__card-title text-h4">
                {step.title}
              </h4>

              <p className="seller-start-modal__card-text text-p2">
                {step.text}
              </p>
            </article>
          ))}
        </div>

        <div className="seller-start-modal__actions">
          <button
            type="button"
            className="seller-start-modal__button text-p1"
            onClick={handleCreateSellerProfile}
          >
            Создать профиль продавца
          </button>
        </div>
      </div>
    </Modal>
  );
}
