import "../styles/about-section.css";

export default function AboutSection() {
  const stats = [
    {
      value: "10 000+",
      labelTop: "3D-моделей",
      labelBottom: "в каталоге",
    },
    {
      value: "5+",
      labelTop: "Поддерживаемых",
      labelBottom: "форматов",
    },
    {
      value: "100+",
      labelTop: "Продавцов",
      labelBottom: "",
    },
    {
      value: "24/7",
      labelTop: "Доступ",
      labelBottom: "к платформе",
    },
  ];

  return (
    <section className="about-section">
      <div className="about-section__container">
        <h2 className="about-section__title text-h2">О нас</h2>

        <div className="about-section__divider" />

        <div className="about-section__grid">
          <div className="about-section__main-card">
            <h3 className="about-section__brand text-h1">MESHIO</h3>

            <h4 className="about-section__subtitle text-h3">
              Платформа для покупки и продажи 3D-моделей
              <br />с возможностью генерации текстур
            </h4>

            <p className="about-section__text text-p2">
              Meshio — это онлайн-маркетплейс цифровых 3D-моделей,
              предназначенный для дизайнеров, разработчиков и 3D-художников.
              Платформа позволяет просматривать, настраивать и приобретать
              готовые 3D-ассеты для использования в различных проектах.
            </p>
          </div>

          <div className="about-section__stats-grid">
            {stats.map((item, index) => (
              <article key={index} className="about-section__stat-card">
                <div className="about-section__stat-value text-h2">
                  {item.value}
                </div>
                <div className="about-section__stat-label text-p1">
                  <span>{item.labelTop}</span>
                  {item.labelBottom ? <span>{item.labelBottom}</span> : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
