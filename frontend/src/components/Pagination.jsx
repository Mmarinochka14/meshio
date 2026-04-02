import "../styles/pagination.css";

function buildPages(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set([1, total, current]);

  // рядом с текущей
  pages.add(current - 1);
  pages.add(current + 1);

  // чуть больше “окна”, чтобы выглядело приятно
  pages.add(2);
  pages.add(total - 1);

  const list = Array.from(pages)
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const withDots = [];
  for (let i = 0; i < list.length; i++) {
    withDots.push(list[i]);
    if (i < list.length - 1 && list[i + 1] - list[i] > 1) {
      withDots.push("dots-" + i);
    }
  }
  return withDots;
}

export default function Pagination({
  count,
  page,
  pageSize = 12,
  onPageChange,
}) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  if (totalPages <= 1) return null;

  const items = buildPages(page, totalPages);

  return (
    <div className="pagination">
      {items.map((item) => {
        if (typeof item === "string" && item.startsWith("dots")) {
          return (
            <div key={item} className="pagination__dots text-p2">
              …
            </div>
          );
        }

        const p = item;
        const isActive = p === page;

        return (
          <button
            key={p}
            type="button"
            className={`pagination__btn text-p2 ${isActive ? "is-active" : ""}`}
            onClick={() => onPageChange(p)}
            disabled={isActive}
          >
            {p}
          </button>
        );
      })}
    </div>
  );
}
