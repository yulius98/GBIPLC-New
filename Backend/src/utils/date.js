import dayjs from 'dayjs';
const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

/**
 * Format tanggal seperti Laravel translatedFormat('d F Y') dengan locale 'id'.
 * Contoh: "05 Agustus 2026"
 * @param {Date|string} date
 * @returns {string}
 */
function formatIndonesianDate(date) {
  const d = dayjs(date);
  const day = d.date();
  const month = INDONESIAN_MONTHS[d.month()];
  const year = d.year();
  return `${day} ${month} ${year}`;
}

/**
 * Hitung selisih hari antara dua tanggal (floor), mirip Carbon::diffInDays.
 * @param {Date|string} from
 * @param {Date|string} to
 * @returns {number}
 */
function diffInDays(from, to) {
  const start = dayjs(from).startOf('day');
  const end = dayjs(to).startOf('day');
  return end.diff(start, 'day');
}

export { formatIndonesianDate, diffInDays };
