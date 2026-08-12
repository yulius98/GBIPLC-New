import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="layout">
      <header className="navbar">
        <NavLink to="/" className="navbar__brand">
          <span className="navbar__brand-mark">GBI</span>
          GBI PLC
        </NavLink>
        <nav className="navbar__links">
          <NavLink to="/">Beranda</NavLink>
          <NavLink to="/events">Agenda</NavLink>
          <NavLink to="/profile">Profil</NavLink>
          {user?.role === 'pengurus' && <NavLink to="/dashboard">Dashboard</NavLink>}
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
    </div>
  )
}
