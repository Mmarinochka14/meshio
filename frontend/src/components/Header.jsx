import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { getUser, isAuthenticated, logout, subscribe } from "./auth/authStore";

import AdminHeader from "./AdminHeader";
import SellerHeader from "./SellerHeader";
import ConfirmModal from "./ConfirmModal";

import homeIcon from "../assets/icons/home.svg";
import logoIcon from "../assets/icons/logo.svg";
import catalogIcon from "../assets/icons/catalog.svg";
import searchIcon from "../assets/icons/search.svg";
import modelsIcon from "../assets/icons/models.svg";
import favoriteIcon from "../assets/icons/favorite.svg";
import cartIcon from "../assets/icons/cart.svg";
import loginIcon from "../assets/icons/login.svg";
import userIcon from "../assets/icons/user.svg";
import logoutIcon from "../assets/icons/logout.svg";

import { getCartCount } from "../api/cart";
import { getGuestCartCount, subscribeCart } from "./cart/cartStore";
import { getMyFavorites } from "../api/products";
import {
  getFavoriteIds,
  setFavoriteIds,
  subscribeFavorites,
} from "./favorites/favoritesStore";

function areSameIds(firstIds, secondIds) {
  const first = [...firstIds].map(String).sort();
  const second = [...secondIds].map(String).sort();

  if (first.length !== second.length) return false;

  return first.every((id, index) => id === second[index]);
}

export default function Header({
  onLoginClick,
  onOpenSellerModal,
  onOpenUploadModal,
}) {
  const navigate = useNavigate();

  const [, forceUpdate] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const [favoritesPulse, setFavoritesPulse] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const favoritesReadyRef = useRef(false);
  const favoritesPulseTimerRef = useRef(null);

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

  useEffect(() => {
    let mounted = true;

    async function syncCartCount() {
      if (authed && isBuyer) {
        try {
          const data = await getCartCount();

          if (mounted) {
            setCartCount(Number(data?.count || 0));
          }
        } catch {
          if (mounted) {
            setCartCount(0);
          }
        }

        return;
      }

      if (!authed) {
        if (mounted) {
          setCartCount(getGuestCartCount());
        }

        return;
      }

      if (mounted) {
        setCartCount(0);
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
  }, [authed, isBuyer]);

  useEffect(() => {
    let mounted = true;

    function updateFavoritesCount(nextCount) {
      if (!mounted) return;

      setFavoritesCount((prevCount) => {
        if (favoritesReadyRef.current && nextCount > prevCount) {
          setFavoritesPulse(true);

          if (favoritesPulseTimerRef.current) {
            clearTimeout(favoritesPulseTimerRef.current);
          }

          favoritesPulseTimerRef.current = setTimeout(() => {
            setFavoritesPulse(false);
          }, 450);
        }

        return nextCount;
      });

      favoritesReadyRef.current = true;
    }

    async function syncFavoritesFromApi() {
      const currentUser = getUser();
      const authedNow = isAuthenticated();

      if (!authedNow) {
        updateFavoritesCount(getFavoriteIds().length);
        return;
      }

      if (currentUser?.role !== "buyer") {
        updateFavoritesCount(0);
        return;
      }

      try {
        const data = await getMyFavorites();
        const items = Array.isArray(data?.results) ? data.results : [];

        const apiFavoriteIds = items
          .map((item) => item?.product?.id || item?.product_id || item?.id)
          .filter(Boolean)
          .map(String);

        const currentFavoriteIds = getFavoriteIds();

        if (!areSameIds(apiFavoriteIds, currentFavoriteIds)) {
          setFavoriteIds(apiFavoriteIds);
        }

        updateFavoritesCount(apiFavoriteIds.length);
      } catch {
        updateFavoritesCount(getFavoriteIds().length);
      }
    }

    syncFavoritesFromApi();

    const unsubFavorites = subscribeFavorites(() => {
      updateFavoritesCount(getFavoriteIds().length);
    });

    const unsubAuth = subscribe(() => {
      syncFavoritesFromApi();
    });

    return () => {
      mounted = false;
      unsubFavorites();
      unsubAuth();

      if (favoritesPulseTimerRef.current) {
        clearTimeout(favoritesPulseTimerRef.current);
      }
    };
  }, []);

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

  function handleMobileLoginClick() {
    closeMobileMenu();

    if (typeof onLoginClick === "function") {
      onLoginClick();
    }
  }

  function handleMobileSellerClick() {
    closeMobileMenu();

    if (typeof onOpenSellerModal === "function") {
      onOpenSellerModal();
    }
  }

  function handleLogoutClick() {
    closeMobileMenu();
    setIsLogoutModalOpen(true);
  }

  function handleConfirmLogout() {
    logout();
    setIsLogoutModalOpen(false);
    navigate("/");
  }

  if (isAdminUser) {
    return <AdminHeader />;
  }

  if (isSeller) {
    return <SellerHeader onOpenUploadModal={onOpenUploadModal} />;
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

                {!authed ? (
                  <button
                    type="button"
                    className="header__nav-link header__nav-link--button"
                    onClick={onOpenSellerModal}
                  >
                    Стать продавцом
                  </button>
                ) : null}
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
                className={`header__burger ${
                  isMobileMenuOpen ? "is-open" : ""
                }`}
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                aria-label="Открыть меню"
              >
                <span />
                <span />
                <span />
              </button>

              <div className="header__actions">
                <Link to={handleModelsPath()} className="header__action">
                  <img
                    src={modelsIcon}
                    alt=""
                    className="header__action-icon"
                  />
                  <span className="header__action-label">Мои модели</span>
                </Link>

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

                  {favoritesCount > 0 ? (
                    <span className="header__badge">{favoritesCount}</span>
                  ) : null}
                </Link>

                <Link
                  to="/cart"
                  className="header__action header__action--cart"
                >
                  <img src={cartIcon} alt="" className="header__action-icon" />
                  <span className="header__action-label">Корзина</span>

                  {cartCount > 0 ? (
                    <span className="header__badge">{cartCount}</span>
                  ) : null}
                </Link>
              </div>
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
          {authed ? (
            <Link
              to={handleProfileClickPath()}
              className="mobile-menu__profile"
              onClick={closeMobileMenu}
            >
              <span className="mobile-menu__avatar">
                {userName[0]?.toUpperCase() || "M"}
              </span>

              <span className="mobile-menu__profile-info">
                <span className="mobile-menu__profile-name text-p1">
                  {userName}
                </span>
                <span className="mobile-menu__profile-role text-p3">
                  Покупатель
                </span>
              </span>
            </Link>
          ) : (
            <button
              type="button"
              className="mobile-menu__login text-p1"
              onClick={handleMobileLoginClick}
            >
              <img src={loginIcon} alt="" className="mobile-menu__link-icon" />
              <span>Войти</span>
            </button>
          )}

          <Link
            to="/catalog"
            className="mobile-menu__link text-p1"
            onClick={closeMobileMenu}
          >
            <img src={catalogIcon} alt="" className="mobile-menu__link-icon" />
            <span>Каталог</span>
          </Link>

          <Link
            to={handleModelsPath()}
            className="mobile-menu__link text-p1"
            onClick={closeMobileMenu}
          >
            <img src={modelsIcon} alt="" className="mobile-menu__link-icon" />
            <span>Мои модели</span>
          </Link>

          <Link
            to="/favorites"
            className="mobile-menu__link text-p1"
            onClick={closeMobileMenu}
          >
            <img src={favoriteIcon} alt="" className="mobile-menu__link-icon" />
            <span>Избранное</span>

            {favoritesCount > 0 ? (
              <span className="mobile-menu__badge">{favoritesCount}</span>
            ) : null}
          </Link>

          <Link
            to="/cart"
            className="mobile-menu__link text-p1"
            onClick={closeMobileMenu}
          >
            <img src={cartIcon} alt="" className="mobile-menu__link-icon" />
            <span>Корзина</span>

            {cartCount > 0 ? (
              <span className="mobile-menu__badge">{cartCount}</span>
            ) : null}
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

          {!authed ? (
            <button
              type="button"
              className="mobile-menu__seller text-p1"
              onClick={handleMobileSellerClick}
            >
              Стать продавцом
            </button>
          ) : null}

          {authed ? (
            <button
              type="button"
              className="mobile-menu__logout text-p1"
              onClick={handleLogoutClick}
            >
              <img src={logoutIcon} alt="" className="mobile-menu__link-icon" />
              <span>Выйти</span>
            </button>
          ) : null}
        </div>
      </aside>

      <nav className="mobile-bottom-nav">
        <NavLink to="/" className="mobile-bottom-nav__item">
          <img
            src={homeIcon}
            alt=""
            className="mobile-bottom-nav__icon mobile-bottom-nav__icon--home"
          />
          <span className="mobile-bottom-nav__label">Главная</span>
        </NavLink>

        <NavLink to={handleModelsPath()} className="mobile-bottom-nav__item">
          <img src={modelsIcon} alt="" className="mobile-bottom-nav__icon" />
          <span className="mobile-bottom-nav__label">Модели</span>
        </NavLink>

        <NavLink to="/cart" className="mobile-bottom-nav__item">
          <img src={cartIcon} alt="" className="mobile-bottom-nav__icon" />
          <span className="mobile-bottom-nav__label">Корзина</span>

          {cartCount > 0 ? (
            <span className="mobile-bottom-nav__badge">{cartCount}</span>
          ) : null}
        </NavLink>
      </nav>

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        title="Выйти из аккаунта?"
        description="Вы уверены, что хотите выйти из аккаунта?"
        confirmText="Выйти"
        cancelText="Отмена"
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </>
  );
}
