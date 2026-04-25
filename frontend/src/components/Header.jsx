import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getUser, isAuthenticated, subscribe } from "./auth/authStore";

import homeIcon from "../assets/icons/home.svg";
import logoIcon from "../assets/icons/logo.svg";
import catalogIcon from "../assets/icons/catalog.svg";
import searchIcon from "../assets/icons/search.svg";
import modelsIcon from "../assets/icons/models.svg";
import favoriteIcon from "../assets/icons/favorite.svg";
import cartIcon from "../assets/icons/cart.svg";
import loginIcon from "../assets/icons/login.svg";
import userIcon from "../assets/icons/user.svg";

import { getCartCount } from "../api/cart";
import { getGuestCartCount, subscribeCart } from "./cart/cartStore";
import { getMyFavorites } from "../api/products";
import { getFavoriteIds, subscribeFavorites } from "./favorites/favoritesStore";

export default function Header({
  onLoginClick,
  onOpenSellerModal,
  isAdmin = false,
}) {
  const navigate = useNavigate();

  const [, forceUpdate] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const [favoritesPulse, setFavoritesPulse] = useState(false);
  const [favoritesReady, setFavoritesReady] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const authed = isAuthenticated();
  const user = getUser();
  const userName = user?.username || "Профиль";
  const isBuyer = user?.role === "buyer";
  const isSeller = user?.role === "seller";
  const isAdminUser = user?.role === "admin";

  const isAdminMode = isAdmin || isAdminUser;
  const canUseBuyerActions = !isAdminMode && (isBuyer || !authed);

  useEffect(() => {
    let mounted = true;

    async function syncCartCount() {
      if (authed && isBuyer && !isAdminMode) {
        try {
          const data = await getCartCount();
          if (mounted) setCartCount(Number(data?.count || 0));
        } catch {
          if (mounted) setCartCount(0);
        }
      } else if (!authed) {
        if (mounted) setCartCount(getGuestCartCount());
      } else {
        if (mounted) setCartCount(0);
      }
    }

    syncCartCount();

    const unsubCart = subscribeCart(() => {
      syncCartCount();
    });

    const unsubAuth = subscribe(() => {
      syncCartCount();
    });

    return () => {
      mounted = false;
      unsubCart();
      unsubAuth();
    };
  }, [authed, isBuyer, isAdminMode]);

  useEffect(() => {
    let mounted = true;
    let pulseTimer = null;

    async function syncFavoritesCount() {
      const currentUser = getUser();
      const authedNow = isAuthenticated();

      let nextCount = 0;

      if (authedNow && currentUser?.role === "buyer" && !isAdminMode) {
        try {
          const data = await getMyFavorites();
          const items = Array.isArray(data?.results) ? data.results : [];
          nextCount = items.length;
        } catch {
          nextCount = 0;
        }
      } else if (!authedNow) {
        nextCount = getFavoriteIds().length;
      } else {
        nextCount = 0;
      }

      if (!mounted) return;

      setFavoritesCount((prevCount) => {
        if (favoritesReady && nextCount > prevCount) {
          setFavoritesPulse(true);

          if (pulseTimer) clearTimeout(pulseTimer);

          pulseTimer = setTimeout(() => {
            setFavoritesPulse(false);
          }, 450);
        }

        return nextCount;
      });

      if (!favoritesReady) {
        setFavoritesReady(true);
      }
    }

    syncFavoritesCount();

    const unsubFavorites = subscribeFavorites(() => {
      syncFavoritesCount();
    });

    const unsubAuth = subscribe(() => {
      syncFavoritesCount();
    });

    return () => {
      mounted = false;
      unsubFavorites();
      unsubAuth();
      if (pulseTimer) clearTimeout(pulseTimer);
    };
  }, [favoritesReady, isAdminMode]);

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

  function handleProfileClickPath() {
    if (isAdminUser) return "/admin/profile";
    if (isSeller) return "/seller/profile";
    return "/buyer/profile";
  }

  function handleModelsPath() {
    if (isSeller) return "/seller/models";
    return "/my-models";
  }

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  return (
    <>
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
                <Link to="/about" className="header__nav-link">
                  О нас
                </Link>

                <Link to="/contacts" className="header__nav-link">
                  Контакты
                </Link>

                <Link to="/faq" className="header__nav-link">
                  Q&amp;A
                </Link>

                {!authed && (
                  <button
                    type="button"
                    className="header__nav-link header__nav-link--button"
                    onClick={onOpenSellerModal}
                  >
                    Стать продавцом
                  </button>
                )}

                {isSeller && !isAdminMode && (
                  <Link to="/seller/models" className="header__nav-link">
                    Кабинет продавца
                  </Link>
                )}

                {isAdminMode && (
                  <Link to="/admin/products" className="header__nav-link">
                    Панель администратора
                  </Link>
                )}
              </nav>

              {authed ? (
                <Link
                  to={handleProfileClickPath()}
                  className="header__auth-btn"
                >
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
                <img
                  src={catalogIcon}
                  alt=""
                  className="header__catalog-icon"
                />
                <span>Каталог</span>
              </Link>

              <Link to="/" className="header__logo-mobile">
                <img
                  src={logoIcon}
                  alt="Meshio"
                  className="header__logo-image"
                />
              </Link>

              <form className="header__search" onSubmit={handleSearchSubmit}>
                <img src={searchIcon} alt="" className="header__search-icon" />
                <input
                  type="text"
                  placeholder="Поиск"
                  className="header__search-input"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
              </form>

              <button
                type="button"
                className={`header__burger ${isMobileMenuOpen ? "is-open" : ""}`}
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                aria-label="Открыть меню"
              >
                <span />
                <span />
                <span />
              </button>

              {isAdminMode ? (
                <div className="header__admin-actions">
                  <Link to="/admin/products" className="header__admin-back-btn">
                    К заявкам
                  </Link>
                </div>
              ) : (
                <div className="header__actions">
                  <Link to={handleModelsPath()} className="header__action">
                    <img
                      src={modelsIcon}
                      alt=""
                      className="header__action-icon"
                    />
                    <span className="header__action-label">Мои модели</span>
                  </Link>

                  {canUseBuyerActions && (
                    <Link
                      to="/favorites"
                      className={`header__action header__action--favorite ${
                        favoritesPulse ? "header__action--favorite-pulse" : ""
                      }`}
                    >
                      <img
                        src={favoriteIcon}
                        alt=""
                        className="header__action-icon"
                      />
                      <span className="header__action-label">Избранное</span>

                      {favoritesCount > 0 && (
                        <span
                          className={`header__favorite-badge text-p3 ${
                            favoritesPulse
                              ? "header__favorite-badge--pulse"
                              : ""
                          }`}
                        >
                          {favoritesCount}
                        </span>
                      )}
                    </Link>
                  )}

                  {canUseBuyerActions && (
                    <Link
                      to="/cart"
                      className="header__action header__action--cart"
                    >
                      <img
                        src={cartIcon}
                        alt=""
                        className="header__action-icon"
                      />
                      <span className="header__action-label">Корзина</span>

                      {cartCount > 0 && (
                        <span className="header__cart-badge text-p3">
                          {cartCount}
                        </span>
                      )}
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div
        className={`mobile-menu-overlay ${isMobileMenuOpen ? "is-open" : ""}`}
        onClick={closeMobileMenu}
      />

      <aside className={`mobile-menu ${isMobileMenuOpen ? "is-open" : ""}`}>
        <div className="mobile-menu__head">
          <div className="mobile-menu__title text-h4">Меню</div>
          <button
            type="button"
            className="mobile-menu__close"
            onClick={closeMobileMenu}
            aria-label="Закрыть меню"
          >
            ×
          </button>
        </div>

        <div className="mobile-menu__list">
          <Link
            to="/"
            className="mobile-menu__link text-p1"
            onClick={closeMobileMenu}
          >
            Главная
          </Link>

          <Link
            to="/catalog"
            className="mobile-menu__link text-p1"
            onClick={closeMobileMenu}
          >
            Каталог
          </Link>

          <Link
            to="/about"
            className="mobile-menu__link text-p1"
            onClick={closeMobileMenu}
          >
            О нас
          </Link>

          <Link
            to="/contacts"
            className="mobile-menu__link text-p1"
            onClick={closeMobileMenu}
          >
            Контакты
          </Link>

          <Link
            to="/faq"
            className="mobile-menu__link text-p1"
            onClick={closeMobileMenu}
          >
            Q&amp;A
          </Link>

          {authed ? (
            <Link
              to={handleProfileClickPath()}
              className="mobile-menu__link text-p1"
              onClick={closeMobileMenu}
            >
              Профиль
            </Link>
          ) : (
            <button
              type="button"
              className="mobile-menu__link mobile-menu__link--button text-p1"
              onClick={() => {
                closeMobileMenu();
                onLoginClick?.();
              }}
            >
              Войти
            </button>
          )}

          {!authed && (
            <button
              type="button"
              className="mobile-menu__cta text-p1"
              onClick={() => {
                closeMobileMenu();
                onOpenSellerModal?.();
              }}
            >
              Стать продавцом
            </button>
          )}

          {isSeller && !isAdminMode && (
            <Link
              to="/seller/models"
              className="mobile-menu__link text-p1"
              onClick={closeMobileMenu}
            >
              Кабинет продавца
            </Link>
          )}

          {isAdminMode && (
            <Link
              to="/admin/products"
              className="mobile-menu__link text-p1"
              onClick={closeMobileMenu}
            >
              Панель администратора
            </Link>
          )}
        </div>
      </aside>

      {!isAdminMode && (
        <nav className="mobile-bottom-nav">
          <Link to="/" className="mobile-bottom-nav__item">
            <img
              src={homeIcon}
              alt=""
              className="mobile-bottom-nav__icon mobile-bottom-nav__icon--home"
            />
            <span className="mobile-bottom-nav__label">Главная</span>
          </Link>

          <Link to={handleModelsPath()} className="mobile-bottom-nav__item">
            <img src={modelsIcon} alt="" className="mobile-bottom-nav__icon" />
            <span className="mobile-bottom-nav__label">Модели</span>
          </Link>

          <Link
            to="/cart"
            className="mobile-bottom-nav__item mobile-bottom-nav__item--badge"
          >
            <img src={cartIcon} alt="" className="mobile-bottom-nav__icon" />
            <span className="mobile-bottom-nav__label">Корзина</span>
            {cartCount > 0 && (
              <span className="mobile-bottom-nav__badge text-p3">
                {cartCount}
              </span>
            )}
          </Link>
        </nav>
      )}
    </>
  );
}
