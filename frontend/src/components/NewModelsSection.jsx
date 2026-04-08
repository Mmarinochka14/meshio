import { useEffect, useState } from "react";
import "../styles/new-models-section.css";
import { getProducts } from "../api/products";
import ProductCard from "./ProductCard";

export default function NewModelsSection() {
  const [models, setModels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadNewModels() {
      try {
        setIsLoading(true);
        const data = await getProducts({ ordering: "newest", page: 1 });
        const results = Array.isArray(data?.results) ? data.results : [];
        if (mounted) setModels(results.slice(0, 4));
      } catch (e) {
        if (mounted) setModels([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadNewModels();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="new-models-section">
      <div className="new-models-section__container">
        <h3 className="new-models-section__title text-h3">Новинки</h3>

        {isLoading ? (
          <div className="new-models-section__state text-p2">Загрузка…</div>
        ) : (
          <div className="new-models-section__grid">
            {models.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
