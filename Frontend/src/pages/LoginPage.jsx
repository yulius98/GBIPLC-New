import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSEO } from '../utils/seo'

export default function LoginPage() {
  useSEO({
    path: '/login',
    title: 'Login',
    description: 'Masuk ke akun GBI Philadelphia Life Center.',
    noindex: true,
  })

  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const homeFor = (u) => {
    if (u?.role === 'pengurus') return '/dashboard'
    return location.state?.from?.pathname || '/'
  }

  if (user) {
    return <Navigate to={homeFor(user)} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const me = await login(email, password)
      navigate(homeFor(me), { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal. Periksa email dan password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-card__brand">GBI</div>
        <h1>Masuk GBI PLC</h1>
        <p className="muted auth-card__sub">Silakan masuk untuk melanjutkan</p>
        {error && <div className="alert alert--error">{error}</div>}
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            required
            autoFocus
          />
        </label>
        <label className="field field--password">
          <span>Password</span>
          <div className="field__input-wrap">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              className="field__toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.3A9.6 9.6 0 0 1 12 5c5 0 8.5 4 9.5 6.5a2.2 2.2 0 0 1 0 1.6c-.5 1.1-1.3 2.5-2.4 3.7M6.6 6.6C4.2 8.2 2.7 10.3 2.5 10.7a2.2 2.2 0 0 0 0 1.6C3.5 14.8 7 19 12 19c1.2 0 2.3-.3 3.3-.7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="2" />
                </svg>
              )}
            </button>
          </div>
        </label>
        <div className="auth-actions">
          <Link to="/" className="btn btn--primary auth-back" aria-label="Kembali ke beranda">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Kembali
          </Link>
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? 'Memproses…' : 'Masuk'}
          </button>
        </div>
      </form>
    </div>
  )
}
