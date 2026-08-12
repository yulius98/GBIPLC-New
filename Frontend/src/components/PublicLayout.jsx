import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSeo } from '../context/SeoContext'

export default function PublicLayout() {
  const { user, logout } = useAuth()
  const seo = useSeo()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  const navClass = `navbar navbar--public ${scrolled ? 'navbar--scrolled' : ''}`

  return (
    <div className="layout layout--public">
      <header className={navClass}>
        <NavLink to="/" className="navbar__brand" onClick={() => setMenuOpen(false)}>
          <span className="navbar__brand-mark">GBI</span>
          GBI PLC
        </NavLink>
        <nav className={`navbar__links ${menuOpen ? 'navbar__links--open' : ''}`}>
          <NavLink to="/ibadah-raya" onClick={() => setMenuOpen(false)}>
            Ibadah Raya
          </NavLink>
          <NavLink to="/youth" onClick={() => setMenuOpen(false)}>
            Youth
          </NavLink>
          <NavLink to="/life-group" onClick={() => setMenuOpen(false)}>
            Life Group
          </NavLink>
          <NavLink to="/register" onClick={() => setMenuOpen(false)}>
            Registrasi
          </NavLink>
        </nav>
        <div className="navbar__user">
          {user ? (
            <>
              <NavLink to="/profile" className="navbar__user-name">
                {user.name}
              </NavLink>
              <button type="button" className="btn btn--ghost" onClick={handleLogout}>
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
                <NavLink to="/register">Registrasi</NavLink>
                <NavLink to="/login">Login</NavLink>
              </div>
            </div>
            <div>
              <p className="footer__title">Ibadah</p>
              <div className="footer__links">
                <NavLink to="/ibadah-raya">Ibadah Raya Minggu</NavLink>
                <NavLink to="/youth">Youth Ministry</NavLink>
                <NavLink to="/">Saat Teduh</NavLink>
              </div>
            </div>
            <div>
              <p className="footer__title">Kontak</p>
              <div className="footer__links">
                <span className="footer__text">{seo.church.address.streetAddress}</span>
                <span className="footer__text">
                  {seo.church.address.addressLocality}, {seo.church.address.addressRegion}{' '}
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
            &copy; {new Date().getFullYear()} GBI Philadelphia Life Center. Dibuat dengan
            kasih.
          </div>
        </div>
      </footer>
    </div>
  )
}
