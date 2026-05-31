import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {
  getPublicSellerProducts,
  getPublicSellerProfile,
} from "../api/products";
import { buildMediaUrl } from "../api/url";
import ProductCard from "../components/ProductCard";

import "../styles/seller-store-page.css";

function getInitial(value) {
  if (!value) return "M";
  return value[0].toUpperCase();
}

function normalizeImage(url) {
  return buildMediaUrl(url);
}

export default function SellerStorePage() {
  const { id } = useParams();

  const [profileData, setProfileData] = useState(null);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadStore() {
      try {
        setIsLoading(true);
        setError("");

        const [sellerResponse, productsResponse] = await Promise.all([
          getPublicSellerProfile(id),
          getPublicSellerProducts(id),
        ]);

        if (!mounted) return;

        setProfileData(sellerResponse);
        setProducts(
          Array.isArray(productsResponse?.results)
            ? productsResponse.results
            : [],
        );
      } catch (err) {
        if (!mounted) return;
        setError(
          err?.response?.data?.detail || "Не удалось загрузить магазин.",
        );
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadStore();

    return () => {
      mounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <section className="seller-store-page">
        <div className="seller-store-page__container">
          <div className="page-state">Загрузка магазина...</div>
        </div>
      </section>
    );
  }

  if (error || !profileData?.seller) {
    return (
      <section className="seller-store-page">
        <div className="seller-store-page__container">
          <div className="page-state">{error || "Магазин не найден"}</div>
        </div>
      </section>
    );
  }

  const seller = profileData.seller;
  const stats = profileData.stats || {};
  const avatarUrl = normalizeImage(seller.store_avatar_url);
  const bannerUrl = normalizeImage(seller.store_banner_url);
  const storeName = seller.store_name || seller.username || "Магазин Meshio";
  const rating = Number(stats.average_rating || 0).toFixed(2);

  return (
    <section className="seller-store-page">
      <div className="seller-store-page__container">
        <div className="seller-store-page__hero">
          <div
            className="seller-store-page__banner"
            style={bannerUrl ? { backgroundImage: `url(${bannerUrl})` } : undefined}
          />

          <div className="seller-store-page__profile">
            <div className="seller-store-page__avatar">
              {avatarUrl ? (
                <img src={avatarUrl} alt={storeName} />
              ) : (
                <span>{getInitial(storeName)}</span>
              )}
            </div>

            <div className="seller-store-page__main">
              <h1 className="seller-store-page__title text-h2">{storeName}</h1>
              <p className="seller-store-page__username text-p2">
                @{seller.username}
              </p>
              <p className="seller-store-page__description text-p2">
                {seller.store_description ||
                  "Продавец пока не добавил описание магазина."}
              </p>
            </div>

            <div className="seller-store-page__stats">
              <div className="seller-store-page__stat">
                <span className="seller-store-page__stat-main">
                  <span className="seller-store-page__stat-value text-h3">
                    {stats.total_products || 0}
                  </span>
                </span>
                <span className="seller-store-page__stat-label text-p3">
                  моделей
                </span>
              </div>

              <div className="seller-store-page__stat">
                <span className="seller-store-page__stat-main">
                  <span className="seller-store-page__stat-value text-h3">
                    {rating}
                  </span>
                </span>
                <span className="seller-store-page__stat-label text-p3">
                  рейтинг
                </span>
              </div>

              <div className="seller-store-page__stat">
                <span className="seller-store-page__stat-main">
                  <span className="seller-store-page__stat-value text-h3">
                    {stats.total_reviews || 0}
                  </span>
                </span>
                <span className="seller-store-page__stat-label text-p3">
                  отзывов
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="seller-store-page__section">
          <div className="seller-store-page__section-head">
            <h2 className="seller-store-page__section-title text-h3">
              Модели продавца
            </h2>
            <span className="seller-store-page__section-count text-p2">
              {products.length}
            </span>
          </div>

          {products.length > 0 ? (
            <div className="seller-store-page__grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="seller-store-page__empty text-p2">
              У продавца пока нет опубликованных моделей.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
