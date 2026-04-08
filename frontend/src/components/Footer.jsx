import { Link } from "react-router-dom";
import "../styles/footer.css";

import logo from "../assets/icons/logo.svg";
import telegramIcon from "../assets/icons/telegram.svg";
import vkIcon from "../assets/icons/vk.svg";

export default function Footer({ onOpenSellerModal }) {
  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__brand">
          <Link to="/" className="footer__logo" aria-label="На главную">
            <img src={logo} alt="Meshio" className="footer__logo-image" />
          </Link>
        </div>

        <nav className="footer__nav" aria-label="Навигация в футере">
          <div className="footer__column">
            <h3 className="footer__title text-p1">Покупателям</h3>
            <Link to="/catalog" className="footer__link text-p2">
              Каталог моделей
            </Link>
            <Link to="/faq" className="footer__link text-p2">
              Q&amp;A
            </Link>
          </div>

          <div className="footer__column">
            <h3 className="footer__title text-p1">Продавцам</h3>
            <button
              type="button"
              className="footer__link footer__link--button text-p2"
              onClick={onOpenSellerModal}
            >
              Стать продавцом
            </button>
            <Link to="/seller/terms" className="footer__link text-p2">
              Условия сотрудничества
            </Link>
          </div>

          <div className="footer__column">
            <h3 className="footer__title text-p1">О сервисе</h3>
            <Link to="/about" className="footer__link text-p2">
              О нас
            </Link>
            <Link to="/contacts" className="footer__link text-p2">
              Контакты
            </Link>
            <Link to="/privacy" className="footer__link text-p2">
              Политика конфиденциальности
            </Link>
          </div>
        </nav>

        <div className="footer__contacts">
          <div className="footer__socials">
            <a
              href="#"
              className="footer__social"
              aria-label="Telegram"
              onClick={(e) => e.preventDefault()}
            >
              <img src={telegramIcon} alt="" className="footer__social-icon" />
            </a>

            <a
              href="#"
              className="footer__social"
              aria-label="VK"
              onClick={(e) => e.preventDefault()}
            >
              <img src={vkIcon} alt="" className="footer__social-icon" />
            </a>
          </div>

          <a
            href="mailto:example11@gmail.com"
            className="footer__email text-p2"
          >
            example11@gmail.com
          </a>
        </div>
      </div>

      <div className="footer__bottom">
        <p className="footer__copyright text-p3">
          © 2026 Meshio. Все права защищены.
        </p>
      </div>
    </footer>
  );
}
