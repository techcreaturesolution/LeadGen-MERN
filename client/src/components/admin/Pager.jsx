export default function Pager({ page, total, limit, onPage }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-end gap-2 text-sm">
      <button type="button" className="btn-secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Prev
      </button>
      <span>
        {page} / {pages}
      </span>
      <button type="button" className="btn-secondary" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Next
      </button>
    </div>
  );
}
