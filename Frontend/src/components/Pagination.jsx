export default function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (total === 0) return null

  const pages = []
  const from = Math.max(1, page - 2)
  const to = Math.min(totalPages, page + 2)
  for (let i = from; i <= to; i += 1) pages.push(i)

  return (
    <div className="pagination">
      <div className="pagination__info">
        Menampilkan {total === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} dari {total}
      </div>
      <div className="pagination__controls">
        <button
          type="button"
          className="btn btn--ghost"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Sebelumnya
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            className={`btn btn--ghost pagination__page${p === page ? ' is-active' : ''}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          className="btn btn--ghost"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Berikutnya
        </button>
      </div>
      <label className="pagination__size">
        Per halaman
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          {[10, 25, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
