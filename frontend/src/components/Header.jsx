import { Link } from "react-router-dom";

import logoIcon from "../assets/icons/logo.svg";
import catalogIcon from "../assets/icons/catalog.svg";
import searchIcon from "../assets/icons/search.svg";
import modelsIcon from "../assets/icons/models.svg";
import favoriteIcon from "../assets/icons/favorite.svg";
import cartIcon from "../assets/icons/cart.svg";
import loginIcon from "../assets/icons/login.svg";
import userIcon from "../assets/icons/user.svg";

export default function Header() {
  const isAuthenticated = false;
  const userName = "Матвей";

  return (
    <header className="header">
      <div className="header__container">
        <div className="header__logo-side">
          <Link to="/" className="header__logo">
            <img src={logoIcon} alt="Meshio" className="header__logo-image" />
          </Link>
        </div>

        <div className="header__content">
          <div className="header__top-row">
            <nav className="header__nav">
              <Link to="/" className="header__nav-link">
                О нас
              </Link>
              <Link to="/" className="header__nav-link">
                Контакты
              </Link>
              <Link to="/" className="header__nav-link">
                Q&A
              </Link>
              <Link to="/" className="header__nav-link">
                Стать продавцом
              </Link>
            </nav>

            {isAuthenticated ? (
              <Link to="/buyer/profile" className="header__auth-btn">
                <img src={userIcon} alt="" className="header__auth-icon" />
                <span>{userName}</span>
              </Link>
            ) : (
              <Link to="/login" className="header__auth-btn">
                <img src={loginIcon} alt="" className="header__auth-icon" />
                <span>Войти</span>
              </Link>
            )}
          </div>

          <div className="header__bottom-row">
            <button type="button" className="header__catalog-btn">
              <img src={catalogIcon} alt="" className="header__catalog-icon" />
              <span>Каталог</span>
            </button>

            <div className="header__search">
              <img src={searchIcon} alt="" className="header__search-icon" />
              <input
                type="text"
                placeholder="Поиск"
                className="header__search-input"
              />
            </div>

            <div className="header__actions">
              <button type="button" className="header__action">
                <img src={modelsIcon} alt="" className="header__action-icon" />
                <span className="header__action-label">Мои модели</span>
              </button>

              <button type="button" className="header__action">
                <img
                  src={favoriteIcon}
                  alt=""
                  className="header__action-icon"
                />
                <span className="header__action-label">Избранное</span>
              </button>

              <button type="button" className="header__action">
                <img src={cartIcon} alt="" className="header__action-icon" />
                <span className="header__action-label">Корзина</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
