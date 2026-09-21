export const MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

export function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function dateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function isoToKey(iso) {
  return dateKey(new Date(iso))
}

export function formatShortDate(value) {
  const d = value instanceof Date ? value : parseKey(value)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatLongDate(value) {
  if (!value) return "";
  const key = isoToKey(value); // aman untuk "2026-09-20" maupun "2026-09-20T00:00:00Z"
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d); // pakai konstruktor lokal, hindari geser timezone
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}
