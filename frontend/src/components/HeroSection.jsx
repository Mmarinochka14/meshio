import { Link } from "react-router-dom";
import HeroModelCanvas from "./HeroModelCanvas";
import "../styles/hero-section.css";

export default function HeroSection({ onOpenSellerModal }) {
  return (
    <section className="hero">
      <div className="hero__container">
        <div className="hero__content">
          <h1 className="hero__title text-h1">
            Маркетплейс 3D-моделей <br /> для дизайнеров и разработчиков
          </h1>

          <h3 className="hero__subtitle text-h3">
            Просматривайте, настраивайте и покупайте 3D-модели с генерацией
            текстур
          </h3>

          <div className="hero__visual hero__visual--mobile">
            <HeroModelCanvas />
          </div>

          <div className="hero__actions">
            <Link
              to="/catalog"
              className="hero__button hero__button--primary text-p1"
            >
              Перейти в каталог
            </Link>

            <button
              type="button"
              className="hero__button hero__button--secondary text-p1"
              onClick={onOpenSellerModal}
            >
              Стать продавцом
            </button>
          </div>
        </div>

        <div className="hero__visual hero__visual--desktop">
          <HeroModelCanvas />
        </div>
      </div>
    </section>
  );
}
