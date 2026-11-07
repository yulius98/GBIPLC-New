import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useSeo } from '../context/SeoContext'
import useServiceSchedules from '../hooks/useServiceSchedules'
import useDataGembala from '../hooks/useDataGembala'
import WhatsAppFab from './WhatsAppFab'
import MapFab from './MapFab'
import MobileTabBar from './MobileTabBar'
import {
  IconHome,
  IconChurch,
  IconGroup,
  IconLifeGroup,
  IconGlobe,
  IconUsers,
  IconBook,
  IconCake,
  IconDashboard,
  IconUserPlus,
  IconArrowRight,
  IconLogout,
} from './Icons'

/**
 * Link akun sesuai role di navbar/footer publik (desktop):
 * jemaat → kelola data diri, pengurus → panel admin, tamu → registrasi.
 */
function AccountNav({ role, onClick = () => {} }) {
  if (role === 'jemaat') {
    return (
      <NavLink to="/data-saya" onClick={onClick}>
        Data Saya
      </NavLink>
    )
  }
  if (role === 'pengurus') {
    return (
      <NavLink to="/dashboard" onClick={onClick}>
        Dashboard
      </NavLink>
    )
  }
  return (
    <NavLink to="/register" onClick={onClick}>
      Registrasi
    </NavLink>
  )
}

/* Tab bar bawah — 4 tujuan utama + tombol Menu (sheet berisi sisanya) */
const TAB_BAR = [
  { to: '/', label: 'Beranda', icon: IconHome, end: true },
  { to: '/ibadah-raya', label: 'Ibadah', icon: IconChurch },
  { to: '/youth', label: 'Youth', icon: IconGroup },
  { to: '/life-group', label: 'Life Group', icon: IconLifeGroup },
]

/* Halaman & aksi yang muncul di sheet menu mobile */
const SHEET_PAGES = [
  { to: '/ibadah-raya', label: 'Ibadah Raya', icon: IconChurch },
  { to: '/youth', label: 'Youth', icon: IconGroup },
  { to: '/life-group', label: 'Life Group', icon: IconLifeGroup },
  { to: '/tentang', label: 'Tentang Kami', icon: IconGlobe },
  { to: '/kontak', label: 'Kontak', icon: IconUsers },
]

export default function PublicLayout() {
  const { user, logout } = useAuth()
  const seo = useSeo()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const { schedules: scheduleItems } = useServiceSchedules()
  const { gembala } = useDataGembala()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Catat kunjungan pengunjung web (statistik admin).
  // Sekali per sesi browser; dedup per perangkat per hari ditangani server.
  useEffect(() => {
    if (sessionStorage.getItem('gbipc_visit_tracked')) return
    sessionStorage.setItem('gbipc_visit_tracked', '1')

    let visitorId = localStorage.getItem('gbipc_visitor_id')
    if (!visitorId) {
      // CSPRNG (S2245): crypto.randomUUID bila tersedia (secure context),
      // fallback crypto.getRandomValues — keduanya kriptografis, bukan Math.random.
      visitorId =
        crypto?.randomUUID?.() ??
        (function randomVisitorId() {
          const bytes = new Uint8Array(16)
          crypto.getRandomValues(bytes)
          return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
        })()
      localStorage.setItem('gbipc_visitor_id', visitorId)
    }

    api.post('/visits', { visitor_id: visitorId }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sekali per sesi
  }, [])

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  /* Isi sheet menu mobile — dibangun sesuai status & role pengguna */
  function buildSheetRows() {
    const rows = []
    if (user) {
      if (user.role === 'jemaat') {
        rows.push({ to: '/data-saya', label: 'Data Saya', icon: <IconDashboard size={20} /> })
      } else {
        rows.push({ to: '/dashboard', label: 'Dashboard', icon: <IconDashboard size={20} /> })
      }
      rows.push(
        { to: '/gemar-alkitab', label: 'Gemar Alkitab', icon: <IconBook size={20} /> },
        { to: '/happy-bday', label: "Happy B'day", icon: <IconCake size={20} /> },
        { type: 'sep' },
      )
    }
    for (const page of SHEET_PAGES) {
      rows.push({ to: page.to, label: page.label, icon: <page.icon size={20} /> })
    }
    rows.push({ type: 'sep' })
    if (user) {
      rows.push({ label: 'Keluar', icon: <IconLogout size={20} />, danger: true, onClick: handleLogout })
    } else {
      rows.push(
        { to: '/login', label: 'Login', icon: <IconArrowRight size={20} /> },
        { to: '/register', label: 'Registrasi', icon: <IconUserPlus size={20} /> },
      )
    }
    return rows
  }

  const navClass = `navbar navbar--public ${scrolled ? 'navbar--scrolled' : ''}`

  // Logo situs: gambar OG di-upload di Admin → Setting; fallback "GBI" bila kosong
  const logoUrl = seo.ogImage || ''

  return (
    <div className="layout layout--public">
      <header className={navClass}>
        <NavLink to="/" className="navbar__brand">
          <span className="navbar__brand-mark">
            {logoUrl ? (
              <img className="navbar__brand-logo" src={logoUrl} alt={`Logo ${seo.church.name}`} />
            ) : (
              'GBI'
            )}
          </span>{' '}GBI PLC
        </NavLink>
        {/* Di layar kecil, navbar ini disembunyikan CSS — semua menu
            berpindah ke tab bar bawah (MobileTabBar). */}
        <nav className="navbar__links">
          <NavLink to="/ibadah-raya">Ibadah Raya</NavLink>
          <NavLink to="/youth">Youth</NavLink>
          <NavLink to="/life-group">Life Group</NavLink>
          <NavLink to="/tentang">Tentang</NavLink>
          <NavLink to="/kontak">Kontak</NavLink>
          {user && (
            <>
              <NavLink to="/gemar-alkitab">Gemar Alkitab</NavLink>
              <NavLink to="/happy-bday">Happy B'day</NavLink>
            </>
          )}
          <AccountNav role={user?.role} />
        </nav>
        <div className="navbar__user">
          {user ? (
            <>
              <NavLink
                to={user.role === 'jemaat' ? '/data-saya' : '/profile'}
                className="navbar__user-name"
              >
                {user.name}
              </NavLink>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={handleLogout}
              >
                Keluar
              </button>
            </>
          ) : (
            <NavLink to="/login" className="btn btn--primary btn--nav">
              Login
            </NavLink>
          )}
        </div>
      </header>

      <main className="layout-main">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__grid">
            <div>
              <p className="footer__brand">GBI Philadelphia Life Center</p>
              <p className="footer__tagline">
                Rumah bagi setiap keluarga untuk bertumbuh dalam kasih Kristus.
              </p>
            </div>
            <div>
              <p className="footer__title">Jelajahi</p>
              <div className="footer__links">
                <NavLink to="/">Home</NavLink>
                <NavLink to="/ibadah-raya">Ibadah Raya</NavLink>
                <NavLink to="/youth">Youth</NavLink>
                <NavLink to="/life-group">Life Group</NavLink>
                <NavLink to="/tentang">Tentang Kami</NavLink>
                <NavLink to="/kontak">Kontak</NavLink>
                <AccountNav role={user?.role} />
                <NavLink to="/login">Login</NavLink>
              </div>
            </div>
            <div>
              <p className="footer__title">Jadwal Ibadah</p>
              <div className="footer__links">
                {scheduleItems.map((item) => (
                  <span
                    key={`${item.name}-${item.day}-${item.time}`}
                    className="footer__text"
                  >
                    <strong>{item.name}:</strong> {item.day} jam {item.time}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="footer__title">Gembala</p>
              <div className="footer__links">
                <span className="footer__text">
                  Gembala: {gembala.namaGembala}
                </span>
                <span className="footer__text">
                  Wakil Gembala: {gembala.wakilGembala}
                </span>
              </div>
            </div>
            <div>
              <p className="footer__title">Kontak</p>
              <div className="footer__links">
                <span className="footer__text">
                  {seo.church.address.streetAddress}
                </span>
                <span className="footer__text">
                  {seo.church.address.addressLocality},{" "}
                  {seo.church.address.addressRegion}{" "}
                  {seo.church.address.postalCode}
                </span>
                <a
                  href={`https://wa.me/${seo.church.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  +62 853-3661-8852
                </a>
              </div>
            </div>
          </div>
          <div className="footer__bottom">
            &copy; {new Date().getFullYear()} GBI Philadelphia Life Center.
            Dibuat dengan kasih.
          </div>
        </div>
      </footer>

      {/* SEMUA menu mobile hidup di sini (bottom tab bar + sheet) */}
      <MobileTabBar
        tabs={TAB_BAR}
        account={user ? { name: user.name, role: user.role } : null}
        rows={buildSheetRows()}
      />

      <WhatsAppFab />
      <MapFab />
    </div>
  );
}
