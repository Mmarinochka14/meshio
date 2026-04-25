import "../styles/audience-section.css";

import cartIcon from "../assets/icons/cart.svg";
import moneyIcon from "../assets/icons/money.svg";

export default function AudienceSection() {
  const cards = [
    {
      title: "Покупатели",
      text: "Могут находить, настраивать и приобретать готовые 3D-модели для своих проектов.",
      icon: cartIcon,
    },
    {
      title: "Продавцы",
      text: "Могут размещать и продавать собственные 3D-модели через личный кабинет продавца.",
      icon: moneyIcon,
    },
  ];

  return (
    <section className="audience-section">
      <div className="audience-section__container">
        <h3 className="audience-section__title text-h3">
          Для кого предназначен сервис
        </h3>

        <div className="audience-section__grid">
          {cards.map((card) => (
            <article key={card.title} className="audience-section__card">
              <div className="audience-section__icon-wrap">
                <img
                  src={card.icon}
                  alt=""
                  className="audience-section__icon"
                />
              </div>

              <h4 className="audience-section__card-title text-h4">
                {card.title}
              </h4>

              <p className="audience-section__text text-p2">{card.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
