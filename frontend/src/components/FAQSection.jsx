import { useState } from "react";
import "../styles/faq-section.css";

export default function FAQSection({ variant = "home" }) {
  const [openId, setOpenId] = useState("q1");

  const items = [
    {
      id: "q1",
      question:
        "Нужно ли устанавливать дополнительное программное обеспечение?",
      answer:
        "Нет. Просмотр 3D-моделей и базовая настройка материалов доступны прямо в браузере. Для дальнейшей работы со скачанными файлами может понадобиться 3D-редактор, например Blender.",
    },
    {
      id: "q2",
      question: "В каких форматах доступны 3D-модели?",
      answer:
        "Формат зависит от конкретного товара и указывается в карточке модели. На платформе поддерживаются популярные форматы, включая GLB, GLTF, FBX, OBJ и другие.",
    },
    {
      id: "q3",
      question: "Как происходит скачивание модели после покупки?",
      answer:
        "После успешной покупки модель становится доступной для скачивания в личном кабинете пользователя. Бесплатные модели можно скачать сразу.",
    },
    {
      id: "q4",
      question: "Кто может стать продавцом на платформе?",
      answer:
        "Подать заявку на размещение моделей может любой пользователь. Перед публикацией товары проходят модерацию, а аккаунт продавца — подтверждение.",
    },
  ];

  return (
    <section
      className={`faq-section ${variant === "page" ? "faq-section--page" : ""}`}
    >
      <div className="faq-section__container">
        {variant === "page" ? (
          <h1 className="faq-section__title text-h2">
            Часто задаваемые вопросы
          </h1>
        ) : (
          <h3 className="faq-section__title text-h3">
            Часто задаваемые вопросы
          </h3>
        )}

        <div className="faq-section__divider" />

        <div className="faq-section__list">
          {items.map((item) => {
            const isOpen = openId === item.id;

            return (
              <article
                key={item.id}
                className={`faq-section__item ${isOpen ? "is-open" : ""}`}
              >
                <button
                  type="button"
                  className="faq-section__button"
                  onClick={() => setOpenId(isOpen ? "" : item.id)}
                >
                  <span className="faq-section__question text-p1">
                    {item.question}
                  </span>

                  <span className="faq-section__toggle text-p1">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>

                {isOpen && (
                  <div className="faq-section__answer text-p2">
                    {item.answer}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
