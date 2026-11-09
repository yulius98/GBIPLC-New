import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="loading">Memuat…</div>
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  // role bisa berupa string tunggal ("pengurus") atau array (["pengurus", "pendeta"])
  const allowed = Array.isArray(role) ? role : role ? [role] : null
  if (allowed && !allowed.includes(user.role)) return <Navigate to="/" replace />

  return children
}
