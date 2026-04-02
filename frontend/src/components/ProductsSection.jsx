import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import { getProducts } from "../api/products";
import "../styles/products-section.css";

export default function ProductsSection({ title, ordering }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const data = await getProducts({ ordering, page: 1 });
        const results = Array.isArray(data?.results) ? data.results : [];
        if (mounted) setItems(results.slice(0, 4));
      } catch (e) {
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [ordering]);

  return (
    <section className="products-section">
      <div className="products-section__header">
        <h2 className="text-h3 products-section__title">{title}</h2>
      </div>

      {loading ? (
        <div className="text-p2 products-section__loading">Загрузка…</div>
      ) : (
        <div className="products-section__grid">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
