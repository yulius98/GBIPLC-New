import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user?.role !== 'pengurus') return
    api
      .get(`/dashboard/${user.id}`)
      .then((res) => setStats(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Gagal memuat statistik.'))
  }, [user?.id, user?.role])

  if (user?.role !== 'pengurus') {
    return <div className="alert alert--error">Halaman ini khusus pengurus.</div>
  }

  const cards = stats
    ? [
        ['Total Jemaat', stats.jumlah_jemaat],
        ['Jemaat Baru (1 bulan)', stats.jumlah_jemaat_baru],
      ]
    : []

  return (
    <div className="admin-page">
      <div className="admin-page__head">
        <h2 className="section-title">Dashboard{stats?.username ? ` — ${stats.username}` : ''}</h2>
      </div>

      {error && <div className="alert alert--error">{error}</div>}
      {!stats && !error && <p className="muted">Memuat statistik…</p>}

      <div className="stat-grid">
        {cards.map(([label, value]) => (
          <div className="card stat" key={label}>
            <div className="stat__value">{value ?? 0}</div>
            <div className="stat__label">{label}</div>
          </div>
        ))}
      </div>

      <div className="admin-quick">
        <Link to="/dashboard/kegiatan" className="card admin-quick__item">
          <strong>Kelola Kegiatan</strong>
          <small>Tambah, ubah, hapus kegiatan jemaat</small>
        </Link>
        <Link to="/dashboard/saat-teduh" className="card admin-quick__item">
          <strong>Kelola Saat Teduh</strong>
          <small>Atur jadwal renungan harian</small>
        </Link>
        <Link to="/dashboard/ibadah-raya" className="card admin-quick__item">
          <strong>Kelola Ibadah Raya</strong>
          <small>Atur jadwal & link ibadah</small>
        </Link>
        <Link to="/dashboard/kunjungan" className="card admin-quick__item">
          <strong>Kelola Kunjungan</strong>
          <small>Catat kunjungan jemaat</small>
        </Link>
      </div>
    </div>
  )
}
