import { Link, NavLink } from "react-router-dom";
import { getUser } from "./auth/authStore";
import "../styles/admin-header.css";

import logoIcon from "../assets/icons/logo.svg";
import moderationIcon from "../assets/icons/models.svg";
import usersIcon from "../assets/icons/user.svg";
import requestsIcon from "../assets/icons/notification.svg";
import profileIcon from "../assets/icons/user.svg";

export default function AdminHeader() {
  const user = getUser();
  const userName = user?.username || "Администратор";

  return (
    <header className="admin-header">
      <div className="admin-header__container">
        <div className="admin-header__logo-side">
          <Link to="/admin/products" className="admin-header__logo">
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

              <Link to="/" className="admin-header__nav-link">
                На сайт
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
            <nav className="admin-header__section-nav">
              <NavLink
                to="/admin/products"
                className={({ isActive }) =>
                  `admin-header__section-link ${isActive ? "is-active" : ""}`
                }
              >
                <img
                  src={moderationIcon}
                  alt=""
                  className="admin-header__section-icon"
                />
                <span>Модерация товаров</span>
              </NavLink>

              <NavLink
                to="/admin/users"
                className={({ isActive }) =>
                  `admin-header__section-link ${isActive ? "is-active" : ""}`
                }
              >
                <img
                  src={usersIcon}
                  alt=""
                  className="admin-header__section-icon"
                />
                <span>Заявки продавцов</span>
              </NavLink>

              <NavLink
                to="/admin/requests"
                className={({ isActive }) =>
                  `admin-header__section-link ${isActive ? "is-active" : ""}`
                }
              >
                <img
                  src={requestsIcon}
                  alt=""
                  className="admin-header__section-icon"
                />
                <span>Обращения</span>
              </NavLink>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
