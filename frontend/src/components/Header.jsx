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

import { getCartCount } from "../api/cart";
import { getGuestCartCount, subscribeCart } from "./cart/cartStore";

export default function Header({ onLoginClick, onOpenSellerModal }) {
  const [, forceUpdate] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const unsub = subscribe(() => forceUpdate((x) => x + 1));
    return unsub;
  }, []);

  const authed = isAuthenticated();
  const user = getUser();
  const userName = user?.username || "Профиль";
  const isBuyer = user?.role === "buyer";

  useEffect(() => {
    let mounted = true;

    async function syncCartCount() {
      if (authed && isBuyer) {
        try {
          const data = await getCartCount();
          if (mounted) setCartCount(Number(data?.count || 0));
        } catch {
          if (mounted) setCartCount(0);
        }
      } else {
        if (mounted) setCartCount(getGuestCartCount());
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
              <Link to="/about" className="header__nav-link">
                О нас
              </Link>

              <Link to="/contacts" className="header__nav-link">
                Контакты
              </Link>

              <Link to="/faq" className="header__nav-link">
                Q&A
              </Link>

              <button
                type="button"
                className="header__nav-link header__nav-link--button"
                onClick={onOpenSellerModal}
              >
                Стать продавцом
              </button>
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
              <Link to="/my-models" className="header__action">
                <img src={modelsIcon} alt="" className="header__action-icon" />
                <span className="header__action-label">Мои модели</span>
              </Link>

              <Link to="/favorites" className="header__action">
                <img
                  src={favoriteIcon}
                  alt=""
                  className="header__action-icon"
                />
                <span className="header__action-label">Избранное</span>
              </Link>

              <Link to="/cart" className="header__action header__action--cart">
                <img src={cartIcon} alt="" className="header__action-icon" />
                <span className="header__action-label">Корзина</span>

                {cartCount > 0 ? (
                  <span className="header__cart-badge text-p3">
                    {cartCount}
                  </span>
                ) : null}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
