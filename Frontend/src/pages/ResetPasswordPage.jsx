import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import api from '../api/client'
import { useSEO } from '../utils/seo'

export default function ResetPasswordPage() {
  useSEO({
    path: '/reset-password',
    title: 'Reset Password',
    description: 'Ganti password akun GBI Philadelphia Life Center Anda.',
    noindex: true,
  })

  const token = window.location.pathname.split('/').pop()

  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if ((form.password || '').length < 8) {
      setError('Password minimal 8 karakter')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Konfirmasi password tidak sama')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/reset-password', {
        email: form.email,
        token,
        password: form.password,
      })
      setSuccess(true)
    } catch (err) {
      const message = err.response?.data?.message || 'Gagal mereset password. Silakan coba lagi.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-card__brand">GBI</div>
          <h1>Password Diubah</h1>
          <p className="muted auth-card__sub">
            Password Anda berhasil direset. Silakan masuk dengan password baru.
          </p>
          <div className="auth-actions">
            <Link to="/login" className="btn btn--primary">
              Masuk
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-card__brand">GBI</div>
        <h1>Reset Password</h1>
        <p className="muted auth-card__sub">Buat password baru untuk akun Anda.</p>
        {error && <div className="alert alert--error">{error}</div>}
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="nama@email.com"
            required
            autoFocus
          />
        </label>
        <label className="field">
          <span>Password Baru *</span>
          <div className="field__input-wrap">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Minimal 8 karakter"
              required
              minLength={8}
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
        <label className="field">
          <span>Konfirmasi Password *</span>
          <input
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Ulangi password"
            required
            minLength={8}
          />
        </label>
        <div className="auth-actions">
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? 'Menyimpan…' : 'Simpan Password'}
          </button>
        </div>
      </form>
    </div>
  )
}