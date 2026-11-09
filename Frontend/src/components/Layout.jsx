import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import MobileTabBar from './MobileTabBar'
import { IconHome, IconCalendar, IconUsers, IconBook, IconCake, IconDashboard, IconLogout } from './Icons'

/* Tab bar bawah untuk halaman user (Agenda & Profil) */
const TAB_BAR = [
  { to: '/', label: 'Beranda', icon: IconHome, end: true },
  { to: '/events', label: 'Agenda', icon: IconCalendar },
  { to: '/profile', label: 'Profil', icon: IconUsers },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  // Pengurus & pendeta sama-sama punya akses panel admin
  const isAdminRole = user?.role === 'pengurus' || user?.role === 'pendeta'

  function buildSheetRows() {
    const rows = []
    if (isAdminRole) {
      rows.push({ to: '/dashboard', label: 'Dashboard', icon: <IconDashboard size={20} /> })
    }
    rows.push(
      { to: '/gemar-alkitab', label: 'Gemar Alkitab', icon: <IconBook size={20} /> },
      { to: '/happy-bday', label: "Happy B'day", icon: <IconCake size={20} /> },
      { type: 'sep' },
      { label: 'Keluar', icon: <IconLogout size={20} />, danger: true, onClick: handleLogout },
    )
    return rows
  }

  return (
    <div className="layout">
      <header className="navbar">
        <NavLink to="/" className="navbar__brand">
          <span className="navbar__brand-mark">GBI</span>
          GBI PLC
        </NavLink>
        {/* Menu atas hanya untuk desktop; di layar kecil semuanya di tab bar bawah */}
        <nav className="navbar__links">
          <NavLink to="/">Beranda</NavLink>
          <NavLink to="/events">Agenda</NavLink>
          <NavLink to="/profile">Profil</NavLink>
          {user?.role === 'jemaat' && (
            <>
              <NavLink to="/gemar-alkitab">Gemar Alkitab</NavLink>
              <NavLink to="/happy-bday">Happy B'day</NavLink>
            </>
          )}
          {isAdminRole && <NavLink to="/dashboard">Dashboard</NavLink>}
        </nav>
        <div className="navbar__user">
          {user && (
            <button type="button" className="btn btn--ghost" onClick={handleLogout}>
              Keluar ({user.name})
            </button>
          )}
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>

      {/* SEMUA menu mobile hidup di sini (bottom tab bar + sheet) */}
      <MobileTabBar
        tabs={TAB_BAR}
        account={user ? { name: user.name, role: user.role } : null}
        rows={buildSheetRows()}
      />
    </div>
  )
}
