import { useEffect, useState } from "react";
import "../styles/weekly-models-section.css";
import { getProducts } from "../api/products";
import ProductCard from "./ProductCard";

export default function WeeklyModelsSection() {
  const [models, setModels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadWeeklyModels() {
      try {
        setIsLoading(true);
        // В бэке нет "popular", поэтому временно берём топ по рейтингу
        const data = await getProducts({ ordering: "rating_desc", page: 1 });
        const results = Array.isArray(data?.results) ? data.results : [];
        if (mounted) setModels(results.slice(0, 4));
      } catch (e) {
        if (mounted) setModels([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadWeeklyModels();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="weekly-models-section">
      <div className="weekly-models-section__container">
        <h2 className="weekly-models-section__title text-h2">Модели недели</h2>

        {isLoading ? (
          <div className="weekly-models-section__state text-p2">Загрузка…</div>
        ) : (
          <div className="weekly-models-section__grid">
            {models.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
