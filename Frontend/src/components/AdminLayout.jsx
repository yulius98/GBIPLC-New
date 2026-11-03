import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  IconDashboard,
  IconCalendar,
  IconBook,
  IconChurch,
  IconHeart,
  IconSettings,
  IconGlobeExternal,
  IconLogout,
} from './Icons'

const MENU = [
  { to: '/dashboard', label: 'Dashboard', icon: <IconDashboard size={18} /> },
  { to: '/dashboard/kegiatan', label: 'Kegiatan', icon: <IconCalendar size={18} /> },
  { to: '/dashboard/saat-teduh', label: 'Saat Teduh', icon: <IconBook size={18} /> },
  { to: '/dashboard/ibadah-raya', label: 'Ibadah Raya', icon: <IconChurch size={18} /> },
  { to: '/dashboard/kunjungan', label: 'Kunjungan', icon: <IconHeart size={18} /> },
  { to: '/dashboard/setting', label: 'Setting', icon: <IconSettings size={18} /> },
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
            <span className="admin__menu-icon"><IconGlobeExternal size={18} /></span>
            Lihat Situs
          </NavLink>
          <button type="button" className="admin__menu-item admin__menu-item--button" onClick={handleLogout}>
            <span className="admin__menu-icon"><IconLogout size={18} /></span>
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
