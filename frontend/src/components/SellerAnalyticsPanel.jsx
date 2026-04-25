import { useEffect, useState } from "react";
import "../styles/seller-analytics-panel.css";
import { getSellerAnalyticsRequest } from "../api/products";

function formatMoney(value) {
  const num = Number(value || 0);
  return `${num.toLocaleString("ru-RU")} ₽`;
}

function getMaxValue(items, key) {
  if (!items.length) return 1;
  return Math.max(...items.map((item) => Number(item[key] || 0)), 1);
}

function getStatusLabel(statusKey) {
  if (statusKey === "published") return "Опубликованные";
  if (statusKey === "pending_review") return "На модерации";
  if (statusKey === "draft") return "Черновики";
  if (statusKey === "archived") return "Архив";
  if (statusKey === "rejected") return "Отклонённые";
  return statusKey;
}

export default function SellerAnalyticsPanel() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadAnalytics() {
      try {
        setIsLoading(true);
        const response = await getSellerAnalyticsRequest();
        if (mounted) setData(response);
      } catch (e) {
        console.error("Не удалось загрузить аналитику продавца", e);
        if (mounted) setData(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadAnalytics();
    return () => {
      mounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="seller-analytics-panel">
        <div className="seller-analytics-panel__state text-p2">
          Загрузка аналитики...
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="seller-analytics-panel">
        <div className="seller-analytics-panel__state text-p2">
          Не удалось загрузить аналитику
        </div>
      </div>
    );
  }

  const summary = data.summary || {};
  const statusCounts = data.status_counts || {};
  const topProducts = Array.isArray(data.top_products) ? data.top_products : [];

  const maxSales = getMaxValue(topProducts, "sales_count");

  return (
    <div className="seller-analytics-panel">
      <div className="seller-analytics-panel__cards">
        <div className="seller-analytics-panel__card seller-analytics-panel__card--accent">
          <div className="seller-analytics-panel__card-label text-p2">
            Общая выручка
          </div>
          <div className="seller-analytics-panel__card-value text-h2">
            {formatMoney(summary.total_revenue)}
          </div>
        </div>

        <div className="seller-analytics-panel__card">
          <div className="seller-analytics-panel__card-label text-p2">
            Всего продаж
          </div>
          <div className="seller-analytics-panel__card-value text-h2">
            {summary.total_sales || 0}
          </div>
        </div>

        <div className="seller-analytics-panel__card">
          <div className="seller-analytics-panel__card-label text-p2">
            Всего просмотров
          </div>
          <div className="seller-analytics-panel__card-value text-h2">
            {summary.total_views || 0}
          </div>
        </div>

        <div className="seller-analytics-panel__card">
          <div className="seller-analytics-panel__card-label text-p2">
            Средний рейтинг
          </div>
          <div className="seller-analytics-panel__card-value text-h2">
            {Number(summary.average_rating || 0).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="seller-analytics-panel__grid">
        <div className="seller-analytics-panel__block seller-analytics-panel__block--wide">
          <div className="seller-analytics-panel__block-title text-h3">
            Топ моделей по продажам
          </div>

          {topProducts.length === 0 ? (
            <div className="seller-analytics-panel__empty text-p2">
              Пока нет данных для аналитики
            </div>
          ) : (
            <div className="seller-analytics-panel__chart">
              {topProducts.map((product) => {
                const barHeight = `${Math.max(
                  12,
                  (Number(product.sales_count || 0) / maxSales) * 100,
                )}%`;

                return (
                  <div
                    key={product.id}
                    className="seller-analytics-panel__chart-item"
                  >
                    <div
                      className="seller-analytics-panel__chart-bar"
                      style={{ height: barHeight }}
                      title={`${product.title}: ${product.sales_count || 0}`}
                    />
                    <div className="seller-analytics-panel__chart-value text-p3">
                      {product.sales_count || 0}
                    </div>
                    <div className="seller-analytics-panel__chart-label text-p3">
                      {product.title}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="seller-analytics-panel__block">
          <div className="seller-analytics-panel__block-title text-h3">
            Топ модели
          </div>

          {topProducts.length === 0 ? (
            <div className="seller-analytics-panel__empty text-p2">
              Пока нет моделей
            </div>
          ) : (
            <div className="seller-analytics-panel__top-list">
              {topProducts.slice(0, 3).map((product) => (
                <div
                  key={product.id}
                  className="seller-analytics-panel__top-item"
                >
                  <div className="seller-analytics-panel__top-preview">
                    {product.main_preview_url ? (
                      <img src={product.main_preview_url} alt={product.title} />
                    ) : (
                      <span className="text-p3">Preview</span>
                    )}
                  </div>

                  <div className="seller-analytics-panel__top-content">
                    <div className="seller-analytics-panel__top-title text-p2">
                      {product.title}
                    </div>
                    <div className="seller-analytics-panel__top-meta text-p3">
                      Продажи: {product.sales_count || 0}
                    </div>
                    <div className="seller-analytics-panel__top-meta text-p3">
                      Просмотры: {product.views_count || 0}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="seller-analytics-panel__block">
          <div className="seller-analytics-panel__block-title text-h3">
            Статусы моделей
          </div>

          <div className="seller-analytics-panel__status-list">
            {Object.entries(statusCounts).map(([key, value]) => (
              <div key={key} className="seller-analytics-panel__status-row">
                <span className="seller-analytics-panel__status-label text-p2">
                  {getStatusLabel(key)}
                </span>
                <span className="seller-analytics-panel__status-value text-p2">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="seller-analytics-panel__block">
          <div className="seller-analytics-panel__block-title text-h3">
            Дополнительные показатели
          </div>

          <div className="seller-analytics-panel__metrics-list">
            <div className="seller-analytics-panel__metric-row">
              <span className="text-p2">Всего моделей</span>
              <span className="text-p2">{summary.total_products || 0}</span>
            </div>

            <div className="seller-analytics-panel__metric-row">
              <span className="text-p2">Избранное</span>
              <span className="text-p2">{summary.total_favorites || 0}</span>
            </div>

            <div className="seller-analytics-panel__metric-row">
              <span className="text-p2">Отзывы</span>
              <span className="text-p2">{summary.total_reviews || 0}</span>
            </div>

            <div className="seller-analytics-panel__metric-row">
              <span className="text-p2">Комментарии</span>
              <span className="text-p2">{summary.total_comments || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
