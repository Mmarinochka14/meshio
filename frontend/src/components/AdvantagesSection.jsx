import "../styles/advantages-section.css";

import advViewIcon from "../assets/icons/adv-view.svg";
import advAiIcon from "../assets/icons/adv-ai.svg";
import advCatalogIcon from "../assets/icons/adv-catalog.svg";
import advBuyIcon from "../assets/icons/adv-buy.svg";

export default function AdvantagesSection() {
  const advantages = [
    {
      number: "01",
      title: "Интерактивный 3D-просмотр",
      text: "Оценивайте модель прямо в браузере: вращение, режимы UV и wireframe (если доступны).",
      icon: advViewIcon,
    },
    {
      number: "02",
      title: "Генерация текстур с ИИ",
      text: "Меняйте внешний вид модели с помощью нейросети и сразу проверяйте результат в 3D.",
      icon: advAiIcon,
    },
    {
      number: "03",
      title: "Широкий ассортимент",
      text: "Подборки по категориям и стилям: low-poly, mid-poly, high-poly — под любую задачу.",
      icon: advCatalogIcon,
    },
    {
      number: "04",
      title: "Покупка и скачивание",
      text: "Бесплатные модели доступны сразу, платные — после покупки. Скачивание в один клик.",
      icon: advBuyIcon,
    },
  ];

  return (
    <section className="advantages-section">
      <div className="advantages-section__container">
        <h3 className="advantages-section__title text-h3">Преимущества</h3>

        <div className="advantages-section__grid">
          {advantages.map((item) => (
            <article key={item.number} className="advantages-section__card">
              <div className="advantages-section__top">
                <span className="advantages-section__number text-h2">
                  {item.number}
                </span>

                <div className="advantages-section__icon-wrap">
                  <img
                    src={item.icon}
                    alt=""
                    className="advantages-section__icon"
                  />
                </div>
              </div>

              <div className="advantages-section__content">
                <h3 className="advantages-section__card-title text-h4">
                  {item.title}
                </h3>

                <p className="advantages-section__text text-p2">{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
