import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useSeo } from '../context/SeoContext'
import useServiceSchedules from '../hooks/useServiceSchedules'
import useDataGembala from '../hooks/useDataGembala'
import WhatsAppFab from './WhatsAppFab'
import MapFab from './MapFab'

export default function PublicLayout() {
  const { user, logout } = useAuth()
  const seo = useSeo()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
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
      visitorId =
        crypto?.randomUUID?.() ??
        `v-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
      localStorage.setItem('gbipc_visitor_id', visitorId)
    }

    api.post('/visits', { visitor_id: visitorId }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sekali per sesi
  }, [])

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  const navClass = `navbar navbar--public ${scrolled ? 'navbar--scrolled' : ''}`

  return (
    <div className="layout layout--public">
      <header className={navClass}>
        <NavLink
          to="/"
          className="navbar__brand"
          onClick={() => setMenuOpen(false)}
        >
          <span className="navbar__brand-mark">GBI</span>
          GBI PLC
        </NavLink>
        <nav
          className={`navbar__links ${menuOpen ? "navbar__links--open" : ""}`}
        >
          <NavLink to="/ibadah-raya" onClick={() => setMenuOpen(false)}>
            Ibadah Raya
          </NavLink>
          <NavLink to="/youth" onClick={() => setMenuOpen(false)}>
            Youth
          </NavLink>
          <NavLink to="/life-group" onClick={() => setMenuOpen(false)}>
            Life Group
          </NavLink>
          <NavLink to="/tentang" onClick={() => setMenuOpen(false)}>
            Tentang
          </NavLink>
          <NavLink to="/kontak" onClick={() => setMenuOpen(false)}>
            Kontak
          </NavLink>
          {user?.role === 'jemaat' && (
            <>
              <NavLink to="/gemar-alkitab" onClick={() => setMenuOpen(false)}>
                Gemar Alkitab
              </NavLink>
              <NavLink to="/happy-bday" onClick={() => setMenuOpen(false)}>
                Happy B'day
              </NavLink>
            </>
          )}
          {user?.role === 'jemaat' ? (
            <NavLink to="/data-saya" onClick={() => setMenuOpen(false)}>
              Data Saya
            </NavLink>
          ) : (
            <NavLink to="/register" onClick={() => setMenuOpen(false)}>
              Registrasi
            </NavLink>
          )}
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
        <button
          type="button"
          className="navbar__toggle"
          aria-label="Buka menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            {menuOpen ? (
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>
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
                {user?.role === 'jemaat' ? (
                <NavLink to="/data-saya">Data Saya</NavLink>
              ) : (
                <NavLink to="/register">Registrasi</NavLink>
              )}
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

      <WhatsAppFab />
      <MapFab />
    </div>
  );
}
