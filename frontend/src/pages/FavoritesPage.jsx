import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/favorites-page.css";
import { syncFavoritesFromProducts } from "../components/favorites/favoritesStore";
import heartIcon from "../assets/icons/favorite.svg";

import {
  getUser,
  isAuthenticated,
  subscribe,
} from "../components/auth/authStore";
import { openAuthModal } from "../components/auth/openAuthModal";
import { getMyFavorites } from "../api/products";
import NewModelsSection from "../components/NewModelsSection";
import ProductCard from "../components/ProductCard";

export default function FavoritesPage() {
  const [, forceUpdate] = useState(0);

  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = subscribe(() => forceUpdate((x) => x + 1));
    return unsub;
  }, []);

  const authed = isAuthenticated();
  const user = getUser();
  const userRole = user?.role || "";
  const isBuyer = userRole === "buyer";

  useEffect(() => {
    if (!authed) {
      openAuthModal("login");
      setIsLoading(false);
      setError("Войдите в аккаунт, чтобы посмотреть избранное.");
      return;
    }

    if (!isBuyer) {
      setIsLoading(false);
      setError("Избранное доступно только покупателю.");
      return;
    }

    let mounted = true;

    async function loadFavorites() {
      try {
        setIsLoading(true);
        setError("");

        const data = await getMyFavorites();
        if (!mounted) return;

        const results = Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data)
            ? data
            : [];

        setItems(results);
        syncFavoritesFromProducts(results.map((item) => item.product));

        setItems(results);
      } catch (err) {
        if (!mounted) return;
        setError("Не удалось загрузить избранное.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadFavorites();

    return () => {
      mounted = false;
    };
  }, [authed, isBuyer]);

  return (
    <section className="favorites-page">
      <div className="favorites-page__container">
        <h1 className="favorites-page__title text-h2">Избранное</h1>
        <div className="favorites-page__divider" />

        {isLoading ? (
          <div className="favorites-page__state text-p2">Загрузка...</div>
        ) : error ? (
          <div className="favorites-page__state text-p2">{error}</div>
        ) : items.length === 0 ? (
          <div className="favorites-page__empty">
            <div className="favorites-page__empty-icon-wrap">
              <img
                src={heartIcon}
                alt=""
                className="favorites-page__empty-icon"
              />
            </div>

            <h2 className="favorites-page__empty-title text-h3">
              В избранном пока пусто
            </h2>

            <p className="favorites-page__empty-text text-p2">
              Сохраняйте интересные модели, чтобы быстро вернуться к ним позже.
            </p>

            <Link
              to="/catalog"
              className="favorites-page__empty-button text-p2"
            >
              Перейти в каталог
            </Link>
          </div>
        ) : (
          <div className="favorites-page__grid">
            {items.map((item) => (
              <ProductCard
                key={item.product.id}
                product={{
                  ...item.product,
                  is_favorite: true,
                }}
                forceFavoriteActive
              />
            ))}
          </div>
        )}
      </div>

      <NewModelsSection />
    </section>
  );
}
