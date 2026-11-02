import { useEffect, useMemo, useState } from 'react'
import api from '../api/client'
import { useSeo } from '../context/SeoContext'

const DAYS_ID = {
  Sunday: 'Minggu',
  Monday: 'Senin',
  Tuesday: 'Selasa',
  Wednesday: 'Rabu',
  Thursday: 'Kamis',
  Friday: 'Jumat',
  Saturday: 'Sabtu',
}

// Urutan tampil jadwal: Senin s.d. Minggu (sama dengan panel admin Setting)
const DAY_ORDER = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

// "10:00" -> "10.00" (format Indonesia)
const formatTime = (t) => (t ? String(t).trim().replace(':', '.') : '')

function sortSchedules(items) {
  return [...items].sort(
    (a, b) => DAY_ORDER.indexOf(a.day_of_week) - DAY_ORDER.indexOf(b.day_of_week),
  )
}

/**
 * Jadwal ibadah dari tabel tbl_service_schedules (API publik /api/schedule).
 *
 * - Loading: fallback memakai satu jadwal dari setting SEO (tbl_seo_settings)
 *   agar UI tidak kosong, lalu diganti data tabel setelah dimuat.
 * - Tabel kosong / gagal dimuat: tetap tampilkan jadwal dari setting SEO.
 *
 * Return: { schedules: [{ name, day, time }], loading: boolean }
 */
export default function useServiceSchedules() {
  const seo = useSeo()
  // null = masih memuat, [] = tabel kosong / gagal dimuat
  const [schedules, setSchedules] = useState(null)

  useEffect(() => {
    let active = true
    api
      .get('/schedule')
      .then((res) => {
        if (active) setSchedules(Array.isArray(res.data?.data) ? res.data.data : [])
      })
      .catch(() => {
        if (active) setSchedules([])
      })
    return () => {
      active = false
    }
  }, [])

  const rows = useMemo(() => {
    const fromDb = sortSchedules(schedules ?? []).filter(
      (s) => s.service_name && s.day_of_week,
    )
    if (fromDb.length) return fromDb

    const s = seo.church.service
    if (!s?.name || !s?.dayOfWeek) return []
    return [
      {
        service_name: s.name,
        day_of_week: s.dayOfWeek,
        opens: s.opens ?? '',
        closes: s.closes ?? '',
      },
    ]
  }, [schedules, seo.church.service])

  // Versi sudah diformat untuk ditampilkan di UI
  const items = useMemo(
    () =>
      rows.map((r) => {
        const day = DAYS_ID[r.day_of_week] || r.day_of_week
        const time = [r.opens, r.closes].filter(Boolean).map(formatTime).join('–')
        return { name: r.service_name, day, time }
      }),
    [rows],
  )

  return { schedules: items, rawSchedules: rows, loading: schedules === null }
}
