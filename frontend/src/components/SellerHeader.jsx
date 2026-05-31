import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
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

const SEARCH_SUGGESTIONS = [
  { label: "Все модели", path: "/seller/models", type: "Раздел" },
  { label: "Каталог", path: "/catalog", type: "Раздел" },
  { label: "Персонажи", path: "/catalog?category=personazhi", type: "Категория" },
  { label: "Техника", path: "/catalog?category=tehnika", type: "Категория" },
  { label: "Окружение", path: "/catalog?category=okruzhenie", type: "Категория" },
  { label: "Архитектура", path: "/catalog?category=arhitektura", type: "Категория" },
];

export default function SellerHeader({ onOpenUploadModal }) {
  const navigate = useNavigate();

  const [, forceUpdate] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isCompactHeader, setIsCompactHeader] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const unsub = subscribe(() => forceUpdate((x) => x + 1));
    return unsub;
  }, []);

  useEffect(() => {
    function handleDocumentClick(event) {
      if (!searchRef.current) return;
      if (!searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, []);

  useEffect(() => {
    let frameId = 0;

    function handleScroll() {
      if (frameId) return;

      frameId = window.requestAnimationFrame(() => {
        const scrollTop =
          window.scrollY ||
          window.pageYOffset ||
          document.documentElement.scrollTop ||
          document.body.scrollTop ||
          0;

        setIsCompactHeader(scrollTop > 12);
        frameId = 0;
      });
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("scroll", handleScroll);

      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
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

  const filteredSuggestions = SEARCH_SUGGESTIONS.filter((item) =>
    item.label.toLowerCase().includes(searchValue.trim().toLowerCase()),
  ).slice(0, searchValue.trim() ? 4 : 6);

  function handleSuggestionClick(path) {
    setIsSearchOpen(false);
    setSearchValue("");
    navigate(path);
  }

  return (
    <>
      <header className={`seller-header ${isCompactHeader ? "is-compact" : ""}`}>
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
                ref={searchRef}
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
                  onChange={(e) => {
                    setSearchValue(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                />
                {isSearchOpen && filteredSuggestions.length > 0 ? (
                  <div className="seller-header__suggestions">
                    {filteredSuggestions.map((item) => (
                      <button
                        key={item.path}
                        type="button"
                        className="seller-header__suggestion"
                        onClick={() => handleSuggestionClick(item.path)}
                      >
                        <span className="seller-header__suggestion-type">{item.type}</span>
                        <span className="seller-header__suggestion-title">{item.label}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
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
                  to="/seller/profile"
                  className={({ isActive }) =>
                    `seller-header__action seller-header__action--profile ${
                      isActive ? "is-active" : ""
                    }`
                  }
                  title={userName}
                >
                  <img
                    src={userIcon}
                    alt=""
                    className="seller-header__action-icon"
                  />
                  <span className="seller-header__action-label">Кабинет</span>
                </NavLink>

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
