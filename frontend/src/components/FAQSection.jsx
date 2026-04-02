import { useState } from "react";
import "../styles/faq-section.css";

export default function FAQSection() {
  const [openId, setOpenId] = useState("q1");

  const items = [
    {
      id: "q1",
      question: "Нужно ли устанавливать дополнительное ПО?",
      answer:
        "Нет. Просмотр моделей доступен в браузере. Для работы с файлами после скачивания может понадобиться 3D-редактор (например, Blender).",
    },
    {
      id: "q2",
      question: "В каких форматах доступны 3D-модели?",
      answer:
        "Формат указан в карточке товара. В каталоге также можно отфильтровать модели по формату (GLB/GLTF/FBX/OBJ и др.).",
    },
    {
      id: "q3",
      question: "Как происходит скачивание модели после покупки?",
      answer:
        "После покупки модель станет доступна для скачивания в личном кабинете. Бесплатные модели можно скачать сразу.",
    },
    {
      id: "q4",
      question: "Кто может стать продавцом на платформе?",
      answer:
        "Любой пользователь. Для публикации товаров продавец проходит подтверждение и модерацию моделей.",
    },
  ];

  return (
    <section className="faq-section">
      <div className="faq-section__container">
        <h3 className="faq-section__title text-h3">Часто задаваемые вопросы</h3>

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
                  <span className="faq-section__question text-p2">
                    {item.question}
                  </span>
                  <span className="faq-section__toggle text-p2">
                    {isOpen ? "—" : "+"}
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
