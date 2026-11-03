import { useEffect, useMemo, useState } from 'react'
import api from '../api/client'

// Nilai fallback: dipakai saat API gagal / tabel kosong agar halaman Tentang
// tidak kosong (sama dengan nilai seed di migrasi tbl_tentang_kami).
const DEFAULT_TENTANG = {
  judul: 'Mengenal GBI Philadelphia Life Center',
  sub_judul:
    'Gereja Bethel di Yogyakarta yang terbuka bagi setiap keluarga untuk bertumbuh dalam iman dan kasih Kristus.',
  lede: 'Gereja Bethel Indonesia (GBI) Philadelphia Life Center di Yogyakarta yang melayani Ibadah Raya, Youth Ministry, dan Life Group.',
  paragraf_1:
    'GBI Philadelphia Life Center (GBI PLC) adalah gereja Bethel di Yogyakarta yang terbuka bagi setiap keluarga. Kami merayakan Ibadah Raya setiap Minggu pukul 10.00 WIB, membagikan materi kotbah dan renungan Saat Teduh harian, serta melayani generasi muda lewat Youth Ministry dan persekutuan Life Group.',
  paragraf_2:
    'Kami percaya gereja adalah rumah — tempat setiap orang disambut, diperlengkapi, dan dikirim untuk menjadi berkat bagi Yogyakarta. Apapun tahap hidup Anda, ada tempat bagi Anda dalam keluarga GBI PLC.',
  selayang_judul: 'Sebuah Keluarga Iman di Yogyakarta',
  pelayanan_judul: 'Yang Kami Lakukan Bersama',
}

// Kartu pelayanan fallback: sama dengan seed migrasi tbl_tentang_kami_pelayanan
const DEFAULT_PELAYANAN = [
  {
    id: 1,
    icon: 'IR',
    judul: 'Ibadah Raya',
    frekuensi: 'Setiap Minggu, 10.00 WIB',
    deskripsi:
      'Perayaan bersama keluarga besar GBI PLC — menyembah Tuhan, mendengarkan kotbah, dan bertumbuh dalam iman.',
  },
  {
    id: 2,
    icon: 'ST',
    judul: 'Materi Kotbah & Saat Teduh',
    frekuensi: 'Mingguan & Harian',
    deskripsi:
      'Dapatkan materi kotbah mingguan dan renungan Saat Teduh harian untuk memperdalam perjalanan rohani Anda.',
  },
  {
    id: 3,
    icon: 'YM',
    judul: 'Youth Ministry',
    frekuensi: 'Sabtu, 16.00 WIB',
    deskripsi:
      'Wadah bagi generasi muda untuk bertumbuh dalam iman, persekutuan, dan pelayanan.',
  },
  {
    id: 4,
    icon: 'LG',
    judul: 'Life Group',
    frekuensi: 'Terjadwal',
    deskripsi:
      'Persekutuan kecil antar keluarga agar setiap anggota saling menguatkan dan bertumbuh bersama.',
  },
]

/**
 * Konten halaman Tentang dari tabel tbl_tentang_kami + tbl_tentang_kami_pelayanan
 * (API publik /api/tentang, kelolanya di Admin → Setting → Tentang Kami).
 *
 * Return: { tentang, pelayanan, loading }
 */
export default function useTentang() {
  const [data, setData] = useState(null)

  useEffect(() => {
    let active = true
    api
      .get('/tentang')
      .then((res) => {
        if (active) setData(res.data?.data || null)
      })
      .catch(() => {
        if (active) setData(null)
      })
    return () => {
      active = false
    }
  }, [])

  return useMemo(() => {
    const tentang = { ...DEFAULT_TENTANG, ...(data?.tentang || {}) }
    const rows = Array.isArray(data?.pelayanan) ? data.pelayanan.filter((p) => p?.judul) : []
    return {
      tentang,
      pelayanan: rows.length ? rows : DEFAULT_PELAYANAN,
      loading: data === null,
    }
  }, [data])
}
