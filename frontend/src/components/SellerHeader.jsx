import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getUser, subscribe } from "./auth/authStore";
import "../styles/seller-header.css";
import logoIcon from "../assets/icons/logo.svg";
import searchIcon from "../assets/icons/search.svg";
import uploadIcon from "../assets/icons/upload.svg";
import userIcon from "../assets/icons/user.svg";

export default function SellerHeader({ onOpenUploadModal }) {
  const navigate = useNavigate();

  const [, forceUpdate] = useState(0);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    const unsub = subscribe(() => forceUpdate((x) => x + 1));
    return unsub;
  }, []);

  const user = getUser();
  const userName = user?.username || "Профиль";

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
    <header className="seller-header">
      <div className="seller-header__container">
        <div className="seller-header__logo-side">
          <Link to="/seller/models" className="seller-header__logo">
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
                Q&A
              </Link>

              <Link to="/" className="seller-header__nav-link">
                Вернуться в маркет
              </Link>
            </nav>

            <Link to="/seller/profile" className="seller-header__auth-btn">
              <img src={userIcon} alt="" className="seller-header__auth-icon" />
              <span>{userName}</span>
            </Link>
          </div>

          <div className="seller-header__bottom-row">
            <button
              type="button"
              className="seller-header__upload-btn"
              onClick={onOpenUploadModal}
            >
              <img
                src={uploadIcon}
                alt=""
                className="seller-header__upload-icon"
              />
              <span>Загрузить</span>
            </button>

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
          </div>
        </div>
      </div>
    </header>
  );
}
