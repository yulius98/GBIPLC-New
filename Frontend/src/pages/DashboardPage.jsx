import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import {
  IconUsers,
  IconUserPlus,
  IconMonitor,
  IconGlobe,
  IconCalendarCheck,
  IconHeart,
  IconBook,
  IconFileText,
  IconGroup,
  IconCake,
  IconArrowRight,
  IconChurch,
  IconSettings,
} from '../components/Icons'

/* Palet infografis — selaras brand (navy & emas) dengan warna pendamping
   yang kontras untuk membedakan tiap metrik. */
const WARNA = {
  navy: '#17324d',
  teal: '#0d9488',
  sky: '#0284c7',
  violet: '#7c5cf0',
  gold: '#b08d4f',
  rose: '#e4626f',
}

const BULAN_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const BULAN_ID_PANJANG = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const HARI_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

const fmt = (n) => Number(n ?? 0).toLocaleString('id-ID')

const labelTanggal = (iso) => {
  const bulan = Number(iso.slice(5, 7)) - 1
  return `${Number(iso.slice(8, 10))} ${BULAN_ID[bulan]}`
}

const labelBulan = (iso) => {
  const bulan = Number(iso.slice(5, 7)) - 1
  return BULAN_ID[bulan]
}

const isoHariIni = () => {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const sapaan = () => {
  const jam = new Date().getHours()
  if (jam < 11) return 'Selamat pagi'
  if (jam < 15) return 'Selamat siang'
  if (jam < 19) return 'Selamat sore'
  return 'Selamat malam'
}

function GrafikPengunjung({ bar }) {
  const max = Math.max(1, ...bar.map((b) => b.jumlah))
  const hariIni = isoHariIni()

  return (
    <div className="dash-chart" role="img" aria-label="Grafik pengunjung website 14 hari terakhir">
      {bar.map((b, i) => {
        const tinggi = Math.max(8, Math.round((b.jumlah / max) * 100))
        const isHariIni = b.tanggal === hariIni
        return (
          <div
            key={b.tanggal}
            className={`dash-bar${isHariIni ? ' is-today' : ''}`}
            style={{ '--dash-h': `${tinggi}%` }}
            title={`${labelTanggal(b.tanggal)} — ${fmt(b.jumlah)} pengunjung`}
          >
            <span className="dash-bar__val">{b.jumlah}</span>
            <i className="dash-bar__col" />
            <span className="dash-bar__lbl">{i % 2 === 0 || isHariIni ? b.tanggal.slice(8, 10) : ''}</span>
          </div>
        )
      })}
    </div>
  )
}

function DonutKomposisi({ data }) {
  const total = data.reduce((sum, d) => sum + d.jumlah, 0)
  if (total === 0) {
    return <p className="dash-empty">Belum ada data anggota.</p>
  }

  // Donut SVG: lingkaran stroke viewBox 0 0 42 42 (keliling ≈ 100 unit
  // berkat r = 15.9155) sehingga persentase langsung jadi dasharray.
  let terpakai = 0
  const segmen = data.map((d) => {
    const pct = (d.jumlah / total) * 100
    const seg = { ...d, pct, offset: 25 - terpakai }
    terpakai += pct
    return seg
  })

  return (
    <div className="dash-donut">
      <div className="dash-donut__ring">
        <svg viewBox="0 0 42 42" role="img" aria-label="Komposisi anggota">
          <circle cx="21" cy="21" r="15.9155" fill="none" stroke="var(--border)" strokeWidth="5" />
          {segmen.map((seg) => (
            seg.pct > 0 && (
              <circle
                key={seg.key}
                cx="21"
                cy="21"
                r="15.9155"
                fill="none"
                stroke={seg.color}
                strokeWidth="5"
                strokeDasharray={`${seg.pct} ${100 - seg.pct}`}
                strokeDashoffset={seg.offset}
              />
            )
          ))}
        </svg>
        <div className="dash-donut__center">
          <strong>{fmt(total)}</strong>
          <span>Anggota</span>
        </div>
      </div>
      <ul className="dash-legend">
        {segmen.map((seg) => (
          <li key={seg.key}>
            <span className="dash-legend__dot" style={{ background: seg.color }} />
            <span className="dash-legend__label">{seg.label}</span>
            <strong>{fmt(seg.jumlah)}</strong>
            <small>{Math.round(seg.pct)}%</small>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user?.role !== 'pengurus') return
    let alive = true
    api
      .get(`/dashboard/${user.id}`)
      .then((res) => {
        if (alive) setStats(res.data.data)
      })
      .catch((err) => {
        if (alive) setError(err.response?.data?.message || 'Gagal memuat statistik.')
      })
    return () => {
      alive = false
    }
  }, [user?.id, user?.role])

  const kartu = useMemo(() => {
    if (!stats) return []
    const k = stats.komposisi ?? {}
    const namaBulan = BULAN_ID_PANJANG[new Date().getMonth()]
    const pctBaru = stats.jumlah_jemaat ? Math.round((stats.jumlah_jemaat_baru / stats.jumlah_jemaat) * 100) : 0
    return [
      {
        label: 'Total Jemaat',
        value: stats.jumlah_jemaat,
        caption: `${fmt(k.pendeta ?? 0)} pendeta · ${fmt(k.pengurus ?? 0)} pengurus`,
        color: WARNA.navy,
        icon: <IconUsers size={26} />,
      },
      {
        label: 'Jemaat Baru',
        value: stats.jumlah_jemaat_baru,
        caption: 'Dalam 30 hari terakhir',
        chip: pctBaru > 0 ? `+${pctBaru}%` : null,
        color: WARNA.teal,
        icon: <IconUserPlus size={26} />,
      },
      {
        label: 'Pengunjung Bulan Ini',
        value: stats.pengunjung_bulan_ini,
        caption: `Kunjungan situs ${namaBulan}`.trim(),
        color: WARNA.sky,
        icon: <IconMonitor size={26} />,
      },
      {
        label: 'Total Pengunjung',
        value: stats.total_pengunjung,
        caption: 'Sejak situs diluncurkan',
        color: WARNA.violet,
        icon: <IconGlobe size={26} />,
      },
    ]
  }, [stats])

  const konten = useMemo(() => {
    if (!stats?.konten) return []
    const kh = stats.konten
    return [
      { label: 'Kegiatan Mendatang', value: kh.kegiatan_mendatang, sub: `${fmt(kh.kegiatan_total)} kegiatan terdaftar`, color: WARNA.sky, icon: <IconCalendarCheck size={22} /> },
      { label: 'Kunjungan Bulan Ini', value: kh.kunjungan_bulan_ini, sub: `${fmt(kh.kunjungan_total)} total kunjungan`, color: WARNA.rose, icon: <IconHeart size={22} /> },
      { label: 'Saat Teduh', value: kh.saat_teduh_total, sub: 'Renungan harian', color: WARNA.teal, icon: <IconBook size={22} /> },
      { label: 'Materi Kotbah', value: kh.materi_kotbah_total, sub: `${fmt(kh.ibadah_raya_mendatang)} ibadah raya mendatang`, color: WARNA.violet, icon: <IconFileText size={22} /> },
      { label: 'Life Group', value: kh.komsel_total, sub: 'Komsel aktif', color: WARNA.navy, icon: <IconGroup size={22} /> },
    ]
  }, [stats])

  const komposisi = useMemo(() => {
    const k = stats?.komposisi ?? { jemaat: 0, pengurus: 0, pendeta: 0 }
    return [
      { key: 'jemaat', label: 'Jemaat', jumlah: k.jemaat ?? 0, color: WARNA.navy },
      { key: 'pengurus', label: 'Pengurus', jumlah: k.pengurus ?? 0, color: WARNA.gold },
      { key: 'pendeta', label: 'Pendeta', jumlah: k.pendeta ?? 0, color: WARNA.teal },
    ]
  }, [stats])

  if (user?.role !== 'pengurus') {
    return <div className="alert alert--error">Halaman ini khusus pengurus.</div>
  }

  const sekarang = new Date()
  const tanggalIndo = sekarang.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  const hariIndo = HARI_ID[sekarang.getDay()]
  const maxKunjungan = Math.max(1, ...(stats?.grafik_kunjungan ?? []).map((b) => b.jumlah))

  return (
    <div className="admin-page">
      {/* Banner sambutan */}
      <section className="dash-hero">
        <div className="dash-hero__text">
          <span className="dash-hero__badge">Panel Pengurus</span>
          <h2>
            {sapaan()}, {stats?.username || user?.name} <span aria-hidden="true">👋</span>
          </h2>
          <p>Berikut ringkasan pelayanan dan perkembangan situs hari ini.</p>
        </div>
        <div className="dash-hero__date" aria-hidden="true">
          <strong>{hariIndo}</strong>
          <span>{tanggalIndo}</span>
        </div>
      </section>

      {error && <div className="alert alert--error">{error}</div>}

      {!stats && !error && (
        <div className="dash-loading" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="dash-loading__card" />
          ))}
        </div>
      )}

      {stats && (
        <>
          {/* Kartu statistik utama */}
          <section className="dash-grid dash-grid--four" aria-label="Statistik utama">
            {kartu.map((c) => (
              <article className="card dash-stat" style={{ '--dash-color': c.color }} key={c.label}>
                <div className="dash-stat__icon">{c.icon}</div>
                <div className="dash-stat__body">
                  <div className="dash-stat__value">{fmt(c.value)}</div>
                  <div className="dash-stat__label">{c.label}</div>
                  <div className="dash-stat__caption">{c.caption}</div>
                </div>
                {c.chip && <span className="dash-stat__chip">{c.chip}</span>}
              </article>
            ))}
          </section>

          {/* Infografis: tren pengunjung + komposisi anggota */}
          <section className="dash-grid dash-grid--charts" aria-label="Infografis">
            <article className="card dash-panel">
              <header className="dash-panel__head">
                <div>
                  <h3 className="dash-panel__title">Pengunjung Website</h3>
                  <p className="dash-panel__sub">14 hari terakhir — satuan orang unik per hari</p>
                </div>
                <span className="dash-panel__chip" style={{ '--dash-color': WARNA.sky }}>
                  {fmt(stats.grafik_pengunjung.reduce((s, b) => s + b.jumlah, 0))} total
                </span>
              </header>
              <GrafikPengunjung bar={stats.grafik_pengunjung} />
            </article>

            <article className="card dash-panel">
              <header className="dash-panel__head">
                <div>
                  <h3 className="dash-panel__title">Komposisi Anggota</h3>
                  <p className="dash-panel__sub">Berdasarkan peran pelayanan</p>
                </div>
                <span className="dash-panel__chip" style={{ '--dash-color': WARNA.navy }}>
                  {fmt(stats.jumlah_jemaat)}
                </span>
              </header>
              <DonutKomposisi data={komposisi} />
            </article>
          </section>

          {/* Detail pelayanan + ulang tahun */}
          <section className="dash-grid dash-grid--charts" aria-label="Ringkasan pelayanan">
            <article className="card dash-panel">
              <header className="dash-panel__head">
                <div>
                  <h3 className="dash-panel__title">Ringkasan Konten & Pelayanan</h3>
                  <p className="dash-panel__sub">Jumlah data yang dikelola melalui panel</p>
                </div>
              </header>
              <div className="dash-tiles">
                {konten.map((t) => (
                  <div className="dash-tile" style={{ '--dash-color': t.color }} key={t.label}>
                    <span className="dash-tile__icon">{t.icon}</span>
                    <div>
                      <div className="dash-tile__value">{fmt(t.value)}</div>
                      <div className="dash-tile__label">{t.label}</div>
                      <small className="dash-tile__sub">{t.sub}</small>
                    </div>
                  </div>
                ))}
              </div>

              <h4 className="dash-minititle">Kunjungan pastoral — 6 bulan terakhir</h4>
              <div className="dash-mini" role="img" aria-label="Grafik kunjungan pastoral 6 bulan terakhir">
                {stats.grafik_kunjungan.map((b) => (
                  <div
                    key={b.bulan}
                    className="dash-mini__col"
                    style={{ '--dash-h': `${Math.max(6, Math.round((b.jumlah / maxKunjungan) * 100))}%` }}
                    title={`${b.jumlah} kunjungan`}
                  >
                    <span className="dash-mini__val">{b.jumlah}</span>
                    <i className="dash-mini__bar" />
                    <span className="dash-mini__lbl">{labelBulan(b.bulan)}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="card dash-panel">
              <header className="dash-panel__head">
                <div>
                  <h3 className="dash-panel__title">Ulang Tahun Mendekat</h3>
                  <p className="dash-panel__sub">30 hari ke depan</p>
                </div>
                <span className="dash-panel__chip" style={{ '--dash-color': WARNA.gold }}>
                  <IconCake size={16} /> {fmt(stats.ultah_mendekat.length)}
                </span>
              </header>
              {stats.ultah_mendekat.length === 0 ? (
                <p className="dash-empty">Tidak ada ulang tahun dalam 30 hari ke depan.</p>
              ) : (
                <ul className="dash-ultah">
                  {stats.ultah_mendekat.map((u) => (
                    <li key={`${u.nama}-${u.tanggal}`}>
                      <span className="dash-ultah__avatar" aria-hidden="true">
                        {u.nama.charAt(0)}
                      </span>
                      <div className="dash-ultah__nama">
                        <strong>{u.nama}</strong>
                        <small>{labelTanggal(u.tanggal)}</small>
                      </div>
                      <span className={`dash-ultah__chip${u.dalam_hari === 0 ? ' is-today' : ''}`}>
                        {u.dalam_hari === 0 ? 'Hari ini!' : `${u.dalam_hari} hari lagi`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </section>

          {/* Menu pintasan */}
          <section aria-label="Menu pintasan">
            <h3 className="dash-minititle dash-minititle--menu">Menu Pintasan</h3>
            <div className="dash-menu">
              <Link to="/dashboard/kegiatan" className="dash-menu__item" style={{ '--dash-color': WARNA.sky }}>
                <span className="dash-menu__icon"><IconCalendarCheck size={22} /></span>
                <div className="dash-menu__text">
                  <strong>Kelola Kegiatan</strong>
                  <small>Tambah, ubah, hapus kegiatan jemaat</small>
                </div>
                <span className="dash-menu__arrow"><IconArrowRight size={16} /></span>
              </Link>
              <Link to="/dashboard/saat-teduh" className="dash-menu__item" style={{ '--dash-color': WARNA.teal }}>
                <span className="dash-menu__icon"><IconBook size={22} /></span>
                <div className="dash-menu__text">
                  <strong>Kelola Saat Teduh</strong>
                  <small>Atur jadwal renungan harian</small>
                </div>
                <span className="dash-menu__arrow"><IconArrowRight size={16} /></span>
              </Link>
              <Link to="/dashboard/ibadah-raya" className="dash-menu__item" style={{ '--dash-color': WARNA.violet }}>
                <span className="dash-menu__icon"><IconChurch size={22} /></span>
                <div className="dash-menu__text">
                  <strong>Kelola Ibadah Raya</strong>
                  <small>Atur jadwal &amp; link ibadah</small>
                </div>
                <span className="dash-menu__arrow"><IconArrowRight size={16} /></span>
              </Link>
              <Link to="/dashboard/kunjungan" className="dash-menu__item" style={{ '--dash-color': WARNA.rose }}>
                <span className="dash-menu__icon"><IconHeart size={22} /></span>
                <div className="dash-menu__text">
                  <strong>Kelola Kunjungan</strong>
                  <small>Catat kunjungan jemaat</small>
                </div>
                <span className="dash-menu__arrow"><IconArrowRight size={16} /></span>
              </Link>
              <Link to="/dashboard/setting" className="dash-menu__item" style={{ '--dash-color': WARNA.gold }}>
                <span className="dash-menu__icon"><IconSettings size={22} /></span>
                <div className="dash-menu__text">
                  <strong>Pengaturan</strong>
                  <small>SEO, data gembala &amp; profil situs</small>
                </div>
                <span className="dash-menu__arrow"><IconArrowRight size={16} /></span>
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
