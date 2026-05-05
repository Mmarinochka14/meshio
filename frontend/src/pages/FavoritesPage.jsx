import { useEffect, useState } from "react";
import "../styles/favorites-page.css";

import ProductCard from "../components/ProductCard";
import {
  addToFavorites,
  getMyFavorites,
  getProductsByIds,
  removeFromFavorites,
} from "../api/products";
import { getUser, isAuthenticated } from "../components/auth/authStore";
import {
  addFavoriteId,
  getFavoriteIds,
  removeFavoriteId,
  subscribeFavorites,
} from "../components/favorites/favoritesStore";

export default function FavoritesPage() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadFavorites() {
      try {
        setIsLoading(true);

        const authed = isAuthenticated();
        const user = getUser();

        if (authed && user?.role === "buyer") {
          const data = await getMyFavorites();
          const items = Array.isArray(data?.results) ? data.results : [];

          if (!mounted) return;

          setProducts(items.map((item) => item.product).filter(Boolean));
          return;
        }

        const ids = getFavoriteIds();

        if (ids.length === 0) {
          if (!mounted) return;
          setProducts([]);
          return;
        }

        const data = await getProductsByIds(ids);
        const items = Array.isArray(data?.results) ? data.results : [];

        if (!mounted) return;

        setProducts(items);
      } catch (error) {
        console.error("Не удалось загрузить избранное", error);

        if (!mounted) return;

        setProducts([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadFavorites();

    const unsubFavorites = subscribeFavorites(() => {
      loadFavorites();
    });

    return () => {
      mounted = false;
      unsubFavorites();
    };
  }, []);

  async function handleToggleFavorite(product, nextFavorite) {
    if (!product?.id) return;

    const authed = isAuthenticated();
    const user = getUser();

    try {
      if (authed && user?.role === "buyer") {
        if (nextFavorite) {
          await addToFavorites(product.id);
        } else {
          await removeFromFavorites(product.id);
          setProducts((prev) => prev.filter((item) => item.id !== product.id));
        }

        return;
      }

      const productId = String(product.id);

      if (nextFavorite) {
        addFavoriteId(productId);
      } else {
        removeFavoriteId(productId);
        setProducts((prev) => prev.filter((item) => item.id !== product.id));
      }
    } catch (error) {
      console.error("Не удалось обновить избранное", error);
    }
  }

  return (
    <section className="favorites-page">
      <div className="favorites-page__container">
        <div className="favorites-page__header">
          <h1 className="favorites-page__title text-h2">Избранное</h1>
          <div className="favorites-page__divider" />
        </div>

        {isLoading ? (
          <div className="page-state">Загрузка…</div>
        ) : products.length === 0 ? (
          <div className="page-state">В избранном пока ничего нет</div>
        ) : (
          <div className="favorites-page__grid">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isFavorite={true}
                forceFavoriteActive={true}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
