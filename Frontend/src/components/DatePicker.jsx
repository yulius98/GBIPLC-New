import { useEffect, useRef, useState } from 'react'
import { MONTHS, dateKey, formatShortDate, parseKey } from '../utils/date'

const WEEKDAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

export default function DatePicker({ value, onChange, highlightDates = [], placeholder = 'Pilih tanggal' }) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(() => (value ? parseKey(value) : new Date()))
  const rootRef = useRef(null)

  useEffect(() => {
    function onDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const highlight = new Set(highlightDates)
  const todayKey = dateKey(new Date())

  function goMonth(delta) {
    setView((v) => new Date(v.getFullYear(), v.getMonth() + delta, 1))
  }

  const cells = []
  const firstWeekday = new Date(view.getFullYear(), view.getMonth(), 1).getDay()
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate()
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null)
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push(new Date(view.getFullYear(), view.getMonth(), d))
  }

  return (
    <div className="datepicker" ref={rootRef}>
      <button
        type="button"
        className={`datepicker__trigger ${value ? 'datepicker__trigger--filled' : ''}`}
        onClick={() => setOpen((o) => !o)}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M8 2v4M16 2v4M3 9h18" />
        </svg>
        <span>{value ? formatShortDate(value) : placeholder}</span>
      </button>

      {open && (
        <div className="datepicker__panel">
          <div className="datepicker__header">
            <button
              type="button"
              className="datepicker__nav"
              onClick={() => goMonth(-1)}
              aria-label="Bulan sebelumnya"
            >
              ‹
            </button>
            <span className="datepicker__label">
              {MONTHS[view.getMonth()]} {view.getFullYear()}
            </span>
            <button
              type="button"
              className="datepicker__nav"
              onClick={() => goMonth(1)}
              aria-label="Bulan berikutnya"
            >
              ›
            </button>
          </div>

          <div className="datepicker__weekdays">
            {WEEKDAYS.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>

          <div className="datepicker__grid">
            {cells.map((d, i) => {
              if (!d) return <span key={`empty-${i}`} />
              const key = dateKey(d)
              const selected = key === value
              const today = key === todayKey
              const hasData = highlight.has(key)
              return (
                <button
                  key={key}
                  type="button"
                  className={[
                    'datepicker__day',
                    selected ? 'datepicker__day--selected' : '',
                    today ? 'datepicker__day--today' : '',
                    hasData ? 'datepicker__day--has' : '',
                  ].join(' ')}
                  onClick={() => {
                    onChange(key)
                    setOpen(false)
                  }}
                >
                  {d.getDate()}
                  {hasData && <span className="datepicker__dot" />}
                </button>
              )
            })}
          </div>

          <div className="datepicker__legend">
            <span className="datepicker__legend-item">
              <span className="datepicker__dot" /> Ada jadwal
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
