import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const MENU = [
  { to: '/dashboard', label: 'Dashboard', icon: '▦' },
  { to: '/dashboard/kegiatan', label: 'Kegiatan', icon: '📅' },
  { to: '/dashboard/saat-teduh', label: 'Saat Teduh', icon: '📖' },
  { to: '/dashboard/ibadah-raya', label: 'Ibadah Raya', icon: '⛪' },
  { to: '/dashboard/kunjungan', label: 'Kunjungan', icon: '🤝' },
  { to: '/dashboard/setting', label: 'Setting', icon: '⚙' },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="admin">
      <aside className="admin__sidebar">
        <NavLink to="/dashboard" className="admin__brand">
          <span className="admin__brand-mark">GBI</span>
          <span className="admin__brand-text">
            <strong>GBI PLC</strong>
            <small>Panel Pengurus</small>
          </span>
        </NavLink>

        <nav className="admin__menu">
          {MENU.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `admin__menu-item${isActive ? ' is-active' : ''}`}
            >
              <span className="admin__menu-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin__sidebar-footer">
          <NavLink to="/" className="admin__menu-item">
            <span className="admin__menu-icon">🌐</span>
            Lihat Situs
          </NavLink>
          <button type="button" className="admin__menu-item admin__menu-item--button" onClick={handleLogout}>
            <span className="admin__menu-icon">↪</span>
            Keluar
          </button>
        </div>
      </aside>

      <div className="admin__main">
        <header className="admin__topbar">
          <h1 className="admin__page-title">Panel Pengurus</h1>
          <div className="admin__user">
            <span className="admin__user-avatar">{(user?.name || 'A').charAt(0)}</span>
            <div>
              <strong>{user?.name}</strong>
              <small>{user?.role}</small>
            </div>
          </div>
        </header>

        <main className="admin__content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
