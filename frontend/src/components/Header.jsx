import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getUser, isAuthenticated, subscribe } from "./auth/authStore";

import logoIcon from "../assets/icons/logo.svg";
import catalogIcon from "../assets/icons/catalog.svg";
import searchIcon from "../assets/icons/search.svg";
import modelsIcon from "../assets/icons/models.svg";
import favoriteIcon from "../assets/icons/favorite.svg";
import cartIcon from "../assets/icons/cart.svg";
import loginIcon from "../assets/icons/login.svg";
import userIcon from "../assets/icons/user.svg";

export default function Header({ onLoginClick }) {
  // подписка на изменения authStore, чтобы хедер обновлялся сразу после логина
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const unsub = subscribe(() => forceUpdate((x) => x + 1));
    return unsub;
  }, []);

  const authed = isAuthenticated();
  const user = getUser();
  const userName = user?.username || "Профиль";

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

            {authed ? (
              <Link to="/buyer/profile" className="header__auth-btn">
                <img src={userIcon} alt="" className="header__auth-icon" />
                <span>{userName}</span>
              </Link>
            ) : (
              <button
                type="button"
                className="header__auth-btn"
                onClick={onLoginClick}
              >
                <img src={loginIcon} alt="" className="header__auth-icon" />
                <span>Войти</span>
              </button>
            )}
          </div>

          <div className="header__bottom-row">
            <Link to="/catalog" className="header__catalog-btn">
              <img src={catalogIcon} alt="" className="header__catalog-icon" />
              <span>Каталог</span>
            </Link>

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
