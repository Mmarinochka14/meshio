import "../styles/how-it-works-section.css";

import stepChooseIcon from "../assets/icons/step-choose.svg";
import stepViewIcon from "../assets/icons/step-view.svg";
import stepTextureIcon from "../assets/icons/step-texture.svg";
import stepDownloadIcon from "../assets/icons/step-download.svg";

export default function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Выбирай подходящую модель",
      text: "Просматривайте модели прямо в браузере: вращение, масштабирование, режим каркаса и UV-развёртки.",
      icon: stepChooseIcon,
    },
    {
      number: "02",
      title: "Просматривай ее характеристики",
      text: "Просматривайте модели прямо в браузере: вращение, масштабирование, режим каркаса и UV-развёртки.",
      icon: stepViewIcon,
    },
    {
      number: "03",
      title: "Меняй текстуру модели при помощи ИИ",
      text: "Просматривайте модели прямо в браузере: вращение, масштабирование, режим каркаса и UV-развёртки.",
      icon: stepTextureIcon,
    },
    {
      number: "04",
      title: "Оплачивай и скачивай получившуюся модель",
      text: "Просматривайте модели прямо в браузере: вращение, масштабирование, режим каркаса и UV-развёртки.",
      icon: stepDownloadIcon,
    },
  ];

  return (
    <section className="how-it-works-section">
      <div className="how-it-works-section__container">
        <h2 className="how-it-works-section__title text-h2">
          Как работает{" "}
          <span className="how-it-works-section__title-accent">Meshio</span>
        </h2>

        <div className="how-it-works-section__grid">
          {steps.map((step) => (
            <article key={step.number} className="how-it-works-section__card">
              <div className="how-it-works-section__top">
                <span className="how-it-works-section__number text-h2">
                  {step.number}
                </span>

                <div className="how-it-works-section__icon-wrap">
                  <img
                    src={step.icon}
                    alt=""
                    className="how-it-works-section__icon"
                  />
                </div>
              </div>

              <div className="how-it-works-section__content">
                <h3 className="how-it-works-section__card-title text-h4">
                  {step.title}
                </h3>

                <p className="how-it-works-section__text text-p2">
                  {step.text}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
