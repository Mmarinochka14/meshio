import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { getUser, logout } from "./auth/authStore";
import ConfirmModal from "./ConfirmModal";
import "../styles/admin-header.css";

import logoIcon from "../assets/icons/logo.svg";
import catalogIcon from "../assets/icons/catalog.svg";
import searchIcon from "../assets/icons/search.svg";
import moderationIcon from "../assets/icons/models.svg";
import usersIcon from "../assets/icons/user.svg";
import requestsIcon from "../assets/icons/notification.svg";
import profileIcon from "../assets/icons/user.svg";
import homeIcon from "../assets/icons/home.svg";
import logoutIcon from "../assets/icons/logout.svg";

const SEARCH_SUGGESTIONS = [
  { label: "Все модели", path: "/catalog", type: "Категория" },
  { label: "Животные", path: "/catalog?category=zhivotnye", type: "Категория" },
  { label: "Архитектура", path: "/catalog?category=arhitektura", type: "Категория" },
  { label: "Персонажи", path: "/catalog?category=personazhi", type: "Категория" },
  { label: "Техника", path: "/catalog?category=tehnika", type: "Категория" },
  { label: "Окружение", path: "/catalog?category=okruzhenie", type: "Категория" },
];

export default function AdminHeader() {
  const navigate = useNavigate();
  const user = getUser();
  const userName = user?.username || "admin";

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCompactHeader, setIsCompactHeader] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isMobileMenuOpen]);

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
    function handleDocumentClick(event) {
      if (!searchRef.current) return;
      if (!searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, []);

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  function handleLogout() {
    closeMobileMenu();
    setIsLogoutModalOpen(true);
  }

  function handleConfirmLogout() {
    logout();
    setIsLogoutModalOpen(false);
    navigate("/");
  }

  function handleSearchSubmit(event) {
    event.preventDefault();

    const value = searchValue.trim();
    const normalized = value.toLowerCase();

    if (!value) {
      navigate("/catalog");
      return;
    }

    const categoryMap = {
      животные: "zhivotnye",
      архитектура: "arhitektura",
      персонажи: "personazhi",
      техника: "tehnika",
      окружение: "okruzhenie",
      предметы: "predmety",
      транспорт: "transport",
      "все модели": "",
    };

    if (normalized in categoryMap) {
      const slug = categoryMap[normalized];

      if (!slug) {
        navigate("/catalog");
        return;
      }

      navigate(`/catalog?category=${slug}`);
      return;
    }

    navigate(`/catalog?q=${encodeURIComponent(value)}`);
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
      <header className={`admin-header ${isCompactHeader ? "is-compact" : ""}`}>
        <div className="admin-header__container">
          <div className="admin-header__logo-side">
            <Link to="/" className="admin-header__logo">
              <img
                src={logoIcon}
                alt="Meshio"
                className="admin-header__logo-image"
              />
            </Link>
          </div>

          <div className="admin-header__content">
            <div className="admin-header__top-row">
              <nav className="admin-header__nav">
                <Link to="/about" className="admin-header__nav-link">
                  О нас
                </Link>

                <Link to="/contacts" className="admin-header__nav-link">
                  Контакты
                </Link>

                <Link to="/faq" className="admin-header__nav-link">
                  Q&amp;A
                </Link>
              </nav>

              <Link to="/admin/profile" className="admin-header__auth-btn">
                <img
                  src={profileIcon}
                  alt=""
                  className="admin-header__auth-icon"
                />
                <span>{userName}</span>
              </Link>
            </div>

            <div className="admin-header__bottom-row">
              <Link to="/catalog" className="admin-header__catalog-btn">
                <img
                  src={catalogIcon}
                  alt=""
                  className="admin-header__catalog-icon"
                />
                <span>Каталог</span>
              </Link>

              <Link to="/" className="admin-header__mobile-logo">
                <img
                  src={logoIcon}
                  alt="Meshio"
                  className="admin-header__mobile-logo-image"
                />
              </Link>

              <form
                className="admin-header__search"
                onSubmit={handleSearchSubmit}
                ref={searchRef}
              >
                <img
                  src={searchIcon}
                  alt=""
                  className="admin-header__search-icon"
                />
                <input
                  type="text"
                  placeholder="Поиск"
                  className="admin-header__search-input"
                  value={searchValue}
                  onChange={(e) => {
                    setSearchValue(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                />
                {isSearchOpen && filteredSuggestions.length > 0 ? (
                  <div className="admin-header__suggestions">
                    {filteredSuggestions.map((item) => (
                      <button
                        key={item.path}
                        type="button"
                        className="admin-header__suggestion"
                        onClick={() => handleSuggestionClick(item.path)}
                      >
                        <span className="admin-header__suggestion-type">{item.type}</span>
                        <span className="admin-header__suggestion-title">{item.label}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </form>

              <button
                type="button"
                className={`admin-header__burger ${
                  isMobileMenuOpen ? "is-open" : ""
                }`}
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                aria-label="Открыть меню"
              >
                <span />
                <span />
                <span />
              </button>

              <div className="admin-header__actions">
                <NavLink
                  to="/admin/profile"
                  className={({ isActive }) =>
                    `admin-header__action admin-header__action--profile ${
                      isActive ? "is-active" : ""
                    }`
                  }
                  title={userName}
                >
                  <img
                    src={profileIcon}
                    alt=""
                    className="admin-header__action-icon"
                  />
                  <span className="admin-header__action-label">Кабинет</span>
                </NavLink>

                <NavLink
                  to="/admin/products"
                  className={({ isActive }) =>
                    `admin-header__action ${isActive ? "is-active" : ""}`
                  }
                >
                  <img
                    src={moderationIcon}
                    alt=""
                    className="admin-header__action-icon"
                  />
                  <span className="admin-header__action-label">Товары</span>
                </NavLink>

                <NavLink
                  to="/admin/users"
                  className={({ isActive }) =>
                    `admin-header__action ${isActive ? "is-active" : ""}`
                  }
                >
                  <img
                    src={usersIcon}
                    alt=""
                    className="admin-header__action-icon"
                  />
                  <span className="admin-header__action-label">Продавцы</span>
                </NavLink>

                <NavLink
                  to="/admin/requests"
                  className={({ isActive }) =>
                    `admin-header__action ${isActive ? "is-active" : ""}`
                  }
                >
                  <img
                    src={requestsIcon}
                    alt=""
                    className="admin-header__action-icon"
                  />
                  <span className="admin-header__action-label">Обращения</span>
                </NavLink>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div
        className={`admin-mobile-menu-overlay ${
          isMobileMenuOpen ? "is-open" : ""
        }`}
        onClick={closeMobileMenu}
      />

      <aside
        className={`admin-mobile-menu ${isMobileMenuOpen ? "is-open" : ""}`}
      >
        <div className="admin-mobile-menu__head">
          <div className="admin-mobile-menu__title text-h4">Меню</div>

          <button
            type="button"
            className="admin-mobile-menu__close"
            onClick={closeMobileMenu}
            aria-label="Закрыть меню"
          >
            ×
          </button>
        </div>

        <div className="admin-mobile-menu__list">
          <Link
            to="/admin/profile"
            className="admin-mobile-menu__link text-p1"
            onClick={closeMobileMenu}
          >
            <img
              src={profileIcon}
              alt=""
              className="admin-mobile-menu__link-icon"
            />
            <span>Личный кабинет</span>
          </Link>

          <Link
            to="/catalog"
            className="admin-mobile-menu__link text-p1"
            onClick={closeMobileMenu}
          >
            <img
              src={catalogIcon}
              alt=""
              className="admin-mobile-menu__link-icon"
            />
            <span>Каталог</span>
          </Link>

          <Link
            to="/admin/products"
            className="admin-mobile-menu__link text-p1"
            onClick={closeMobileMenu}
          >
            <img
              src={moderationIcon}
              alt=""
              className="admin-mobile-menu__link-icon"
            />
            <span>Модерация товаров</span>
          </Link>

          <Link
            to="/admin/users"
            className="admin-mobile-menu__link text-p1"
            onClick={closeMobileMenu}
          >
            <img
              src={usersIcon}
              alt=""
              className="admin-mobile-menu__link-icon"
            />
            <span>Заявки продавцов</span>
          </Link>

          <Link
            to="/admin/requests"
            className="admin-mobile-menu__link text-p1"
            onClick={closeMobileMenu}
          >
            <img
              src={requestsIcon}
              alt=""
              className="admin-mobile-menu__link-icon"
            />
            <span>Обращения</span>
          </Link>

          <Link
            to="/"
            className="admin-mobile-menu__link text-p1"
            onClick={closeMobileMenu}
          >
            <img
              src={homeIcon}
              alt=""
              className="admin-mobile-menu__link-icon"
            />
            <span>Главная</span>
          </Link>

          <div className="admin-mobile-menu__divider" />

          <button
            type="button"
            className="admin-mobile-menu__logout text-p1"
            onClick={handleLogout}
          >
            <img
              src={logoutIcon}
              alt=""
              className="admin-mobile-menu__link-icon admin-mobile-menu__logout-icon"
            />
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      <nav className="admin-mobile-bottom-nav">
        <NavLink to="/" className="admin-mobile-bottom-nav__item">
          <img
            src={homeIcon}
            alt=""
            className="admin-mobile-bottom-nav__icon admin-mobile-bottom-nav__icon--home"
          />
          <span className="admin-mobile-bottom-nav__label">Главная</span>
        </NavLink>

        <NavLink to="/admin/products" className="admin-mobile-bottom-nav__item">
          <img
            src={moderationIcon}
            alt=""
            className="admin-mobile-bottom-nav__icon"
          />
          <span className="admin-mobile-bottom-nav__label">Товары</span>
        </NavLink>

        <NavLink to="/admin/requests" className="admin-mobile-bottom-nav__item">
          <img
            src={requestsIcon}
            alt=""
            className="admin-mobile-bottom-nav__icon"
          />
          <span className="admin-mobile-bottom-nav__label">Обращения</span>
        </NavLink>
      </nav>

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        title="Выйти из аккаунта?"
        description="Вы уверены, что хотите выйти из аккаунта администратора?"
        confirmText="Выйти"
        cancelText="Отмена"
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </>
  );
}
