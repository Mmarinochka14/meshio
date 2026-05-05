import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getUser, logout, subscribe } from "./auth/authStore";
import ConfirmModal from "./ConfirmModal";
import "../styles/seller-header.css";

import logoIcon from "../assets/icons/logo.svg";
import searchIcon from "../assets/icons/search.svg";
import uploadIcon from "../assets/icons/upload.svg";
import userIcon from "../assets/icons/user.svg";
import homeIcon from "../assets/icons/home.svg";
import modelsIcon from "../assets/icons/models.svg";
import logoutIcon from "../assets/icons/logout.svg";
import catalogIcon from "../assets/icons/catalog.svg";
import notificationIcon from "../assets/icons/notification.svg";

export default function SellerHeader({ onOpenUploadModal }) {
  const navigate = useNavigate();

  const [, forceUpdate] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    const unsub = subscribe(() => forceUpdate((x) => x + 1));
    return unsub;
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isMobileMenuOpen]);

  const user = getUser();
  const userName = user?.username || "Профиль";

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  function handleLogout() {
    closeMobileMenu();
    setIsLogoutModalOpen(true);
  }

  function handleConfirmLogout() {
    logout();
    navigate("/");
  }

  function handleUploadClick() {
    closeMobileMenu();

    if (typeof onOpenUploadModal === "function") {
      onOpenUploadModal();
      return;
    }

    navigate("/seller/models");
  }

  function handleSearchSubmit(event) {
    event.preventDefault();

    const value = searchValue.trim();

    if (!value) {
      navigate("/seller/models");
      return;
    }

    navigate(`/seller/models?q=${encodeURIComponent(value)}`);
  }

  return (
    <>
      <header className="seller-header">
        <div className="seller-header__container">
          <div className="seller-header__logo-side">
            <Link to="/" className="seller-header__logo">
              <img
                src={logoIcon}
                alt="Meshio"
                className="seller-header__logo-image"
              />
            </Link>
          </div>

          <div className="seller-header__content">
            <div className="seller-header__top-row">
              <nav className="seller-header__nav">
                <Link to="/about" className="seller-header__nav-link">
                  О нас
                </Link>

                <Link to="/contacts" className="seller-header__nav-link">
                  Контакты
                </Link>

                <Link to="/faq" className="seller-header__nav-link">
                  Q&amp;A
                </Link>
              </nav>

              <Link to="/seller/profile" className="seller-header__auth-btn">
                <img
                  src={userIcon}
                  alt=""
                  className="seller-header__auth-icon"
                />
                <span>{userName}</span>
              </Link>
            </div>

            <div className="seller-header__bottom-row">
              <button
                type="button"
                className="seller-header__upload-btn"
                onClick={handleUploadClick}
              >
                <img
                  src={uploadIcon}
                  alt=""
                  className="seller-header__upload-icon"
                />
                <span>Загрузить</span>
              </button>

              <Link to="/" className="seller-header__mobile-logo">
                <img
                  src={logoIcon}
                  alt="Meshio"
                  className="seller-header__mobile-logo-image"
                />
              </Link>

              <form
                className="seller-header__search"
                onSubmit={handleSearchSubmit}
              >
                <img
                  src={searchIcon}
                  alt=""
                  className="seller-header__search-icon"
                />
                <input
                  type="text"
                  placeholder="Поиск"
                  className="seller-header__search-input"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
              </form>

              <button
                type="button"
                className={`seller-header__burger ${
                  isMobileMenuOpen ? "is-open" : ""
                }`}
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                aria-label="Открыть меню"
              >
                <span />
                <span />
                <span />
              </button>

              <div className="seller-header__actions">
                <NavLink
                  to="/seller/models"
                  className={({ isActive }) =>
                    `seller-header__action ${isActive ? "is-active" : ""}`
                  }
                >
                  <img
                    src={modelsIcon}
                    alt=""
                    className="seller-header__action-icon"
                  />
                  <span className="seller-header__action-label">Модели</span>
                </NavLink>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div
        className={`seller-mobile-menu-overlay ${
          isMobileMenuOpen ? "is-open" : ""
        }`}
        onClick={closeMobileMenu}
      />

      <aside
        className={`seller-mobile-menu ${isMobileMenuOpen ? "is-open" : ""}`}
      >
        <div className="seller-mobile-menu__head">
          <div className="seller-mobile-menu__title text-h4">Меню</div>

          <button
            type="button"
            className="seller-mobile-menu__close"
            onClick={closeMobileMenu}
            aria-label="Закрыть меню"
          >
            ×
          </button>
        </div>

        <div className="seller-mobile-menu__list">
          <button
            type="button"
            className="seller-mobile-menu__upload text-p1"
            onClick={handleUploadClick}
          >
            <img
              src={uploadIcon}
              alt=""
              className="seller-mobile-menu__link-icon seller-mobile-menu__upload-icon"
            />
            <span>Загрузить модель</span>
          </button>

          <Link
            to="/seller/profile"
            className="seller-mobile-menu__link text-p1"
            onClick={closeMobileMenu}
          >
            <img
              src={userIcon}
              alt=""
              className="seller-mobile-menu__link-icon"
            />
            <span>Личный кабинет</span>
          </Link>

          <Link
            to="/seller/models"
            className="seller-mobile-menu__link text-p1"
            onClick={closeMobileMenu}
          >
            <img
              src={modelsIcon}
              alt=""
              className="seller-mobile-menu__link-icon"
            />
            <span>Мои модели</span>
          </Link>

          <Link
            to="/"
            className="seller-mobile-menu__link text-p1"
            onClick={closeMobileMenu}
          >
            <img
              src={homeIcon}
              alt=""
              className="seller-mobile-menu__link-icon"
            />
            <span>Вернуться в маркет</span>
          </Link>

          <Link
            to="/about"
            className="seller-mobile-menu__link text-p1"
            onClick={closeMobileMenu}
          >
            <img
              src={catalogIcon}
              alt=""
              className="seller-mobile-menu__link-icon"
            />
            <span>О нас</span>
          </Link>

          <Link
            to="/contacts"
            className="seller-mobile-menu__link text-p1"
            onClick={closeMobileMenu}
          >
            <img
              src={notificationIcon}
              alt=""
              className="seller-mobile-menu__link-icon"
            />
            <span>Контакты</span>
          </Link>

          <Link
            to="/faq"
            className="seller-mobile-menu__link text-p1"
            onClick={closeMobileMenu}
          >
            <img
              src={notificationIcon}
              alt=""
              className="seller-mobile-menu__link-icon"
            />
            <span>Q&amp;A</span>
          </Link>

          <button
            type="button"
            className="seller-mobile-menu__logout text-p1"
            onClick={handleLogout}
          >
            <img
              src={logoutIcon}
              alt=""
              className="seller-mobile-menu__link-icon seller-mobile-menu__logout-icon"
            />
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      <nav className="seller-mobile-bottom-nav">
        <NavLink to="/" className="seller-mobile-bottom-nav__item">
          <img
            src={homeIcon}
            alt=""
            className="seller-mobile-bottom-nav__icon seller-mobile-bottom-nav__icon--home"
          />
          <span className="seller-mobile-bottom-nav__label">Главная</span>
        </NavLink>

        <button
          type="button"
          className="seller-mobile-bottom-nav__item seller-mobile-bottom-nav__item--action"
          onClick={handleUploadClick}
        >
          <span className="seller-mobile-bottom-nav__plus">+</span>
          <span className="seller-mobile-bottom-nav__label">Добавить</span>
        </button>

        <NavLink to="/seller/models" className="seller-mobile-bottom-nav__item">
          <img
            src={modelsIcon}
            alt=""
            className="seller-mobile-bottom-nav__icon"
          />
          <span className="seller-mobile-bottom-nav__label">Модели</span>
        </NavLink>
      </nav>

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        title="Выйти из аккаунта?"
        description="Вы уверены, что хотите выйти из аккаунта продавца?"
        confirmText="Выйти"
        cancelText="Отмена"
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </>
  );
}
