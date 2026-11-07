import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import MobileTabBar from './MobileTabBar'
import {
  IconDashboard,
  IconCalendar,
  IconBook,
  IconChurch,
  IconHeart,
  IconGroup,
  IconLifeGroup,
  IconSettings,
  IconUsers,
  IconGlobeExternal,
  IconLogout,
} from './Icons'

/* Tab tetap di bar: 3 tujuan paling sering + tombol Menu (sheet sisanya) */
const TAB_BAR = [
  { to: '/dashboard', label: 'Dashboard', icon: IconDashboard, end: true },
  { to: '/dashboard/users', label: 'User', icon: IconUsers },
  { to: '/dashboard/setting', label: 'Setting', icon: IconSettings },
]

/* Menu lengkap panel admin (untuk sheet mobile) */
const ADMIN_PAGES = [
  { to: '/dashboard/kegiatan', label: 'Kegiatan', icon: IconCalendar },
  { to: '/dashboard/saat-teduh', label: 'Saat Teduh', icon: IconBook },
  { to: '/dashboard/ibadah-raya', label: 'Ibadah Raya', icon: IconChurch },
  { to: '/dashboard/kunjungan', label: 'Kunjungan', icon: IconHeart },
  { to: '/dashboard/youth', label: 'Youth', icon: IconGroup },
  { to: '/dashboard/life-group', label: 'Life Group', icon: IconLifeGroup },
  { to: '/dashboard/users', label: 'Kelola User', icon: IconUsers },
  { to: '/dashboard/setting', label: 'Setting', icon: IconSettings },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  function buildSheetRows() {
    const rows = ADMIN_PAGES.map((page) => ({
      to: page.to,
      label: page.label,
      icon: <page.icon size={20} />,
    }))
    rows.push(
      { type: 'sep' },
      { to: '/', label: 'Lihat Situs', icon: <IconGlobeExternal size={20} /> },
      { type: 'sep' },
      { label: 'Keluar', icon: <IconLogout size={20} />, danger: true, onClick: handleLogout },
    )
    return rows
  }

  return (
    <div className="admin">
      {/* Sidebar desktop — CSS menyembunyikannya di layar kecil */}
      <aside className="admin__sidebar">
        <NavLink to="/dashboard" className="admin__brand">
          <span className="admin__brand-mark">GBI</span>
          <span className="admin__brand-text">
            <strong>GBI PLC</strong>
            <small>Panel Pengurus</small>
          </span>
        </NavLink>

        <nav className="admin__menu">
          {ADMIN_PAGES.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `admin__menu-item${isActive ? ' is-active' : ''}`}
            >
              <span className="admin__menu-icon"><item.icon size={18} /></span>
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

      {/* SEMUA menu admin di layar kecil hidup di sini (bottom bar + sheet) */}
      <MobileTabBar
        tabs={TAB_BAR}
        account={user ? { name: user.name, role: user.role } : null}
        rows={buildSheetRows()}
      />
    </div>
  )
}
