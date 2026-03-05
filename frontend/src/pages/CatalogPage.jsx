import { useEffect, useState } from "react";

import ProductCard from "../components/ProductCard";
import { getProducts } from "../api/products";

export default function CatalogPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const data = await getProducts();
        setProducts(data.results || []);
      } catch (err) {
        console.error(err);
        setError("Не удалось загрузить каталог.");
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  if (loading) {
    return <div className="page-state">Загрузка каталога...</div>;
  }

  if (error) {
    return <div className="page-state">{error}</div>;
  }

  return (
    <main className="catalog-page">
      <section className="catalog-page__header">
        <h1 className="catalog-page__title">Каталог 3D-моделей</h1>
      </section>

      <section className="catalog-grid">
        {products.length > 0 ? (
          products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          <div className="page-state">Товары пока не найдены.</div>
        )}
      </section>
    </main>
  );
}
