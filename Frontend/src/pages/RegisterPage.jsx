import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { useSeo } from '../context/SeoContext'
import { useSEO } from '../utils/seo'

const GOL_DARAH = ['A', 'B', 'AB', 'O']

export default function RegisterPage() {
  const seo = useSeo()

  useSEO({
    path: '/register',
    title: 'Pendaftaran Jemaat Baru',
    description:
      'Daftar sebagai jemaat baru GBI Philadelphia Life Center (GBI PLC), gereja di Yogyakarta. Isi data diri Anda dan bergabung dalam keluarga gereja.',
    keywords: seo.keywords,
  })

  const [form, setForm] = useState({
    name: '',
    email: '',
    alamat: '',
    no_HP: '',
    gol_darah: '',
    tgl_lahir: '',
    password: '',
    confirmPassword: '',
    facebook: '',
    instagram: '',
  })
  const [photo, setPhoto] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setFieldErrors((fe) => ({ ...fe, [e.target.name]: undefined }))
  }

  function handleFile(e) {
    setPhoto(e.target.files?.[0] || null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    const localErrors = {}
    if ((form.password || '').length < 8) {
      localErrors.password = ['Password minimal 8 karakter']
    } else if (form.password !== form.confirmPassword) {
      localErrors.confirmPassword = ['Konfirmasi password tidak sama']
    }
    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors)
      return
    }

    setSubmitting(true)

    const body = new FormData()
    for (const [key, value] of Object.entries(form)) {
      if (value) body.append(key, value)
    }
    if (photo) body.append('filename', photo)

    try {
      await api.post('/register', body)
      setSuccess(true)
    } catch (err) {
      const data = err.response?.data
      if (data?.errors) {
        setFieldErrors(data.errors)
      }
      setError(data?.message || 'Registrasi gagal. Silakan periksa kembali data Anda.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="register">
        <div className="container container--wide">
          <div className="card register__success">
            <div className="register__success-mark">✓</div>
            <h2>Pendaftaran Berhasil</h2>
            <p className="muted">
              Terima kasih telah mendaftar sebagai jemaat GBI PLC. Silakan masuk menggunakan email
              dan password yang Anda buat.
            </p>
            <div className="register__success-actions">
              <Link to="/" className="btn btn--ghost">
                Ke Beranda
              </Link>
              <Link to="/login" className="btn btn--primary">
                Masuk
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="register">
      <div className="container container--wide">
        <div className="section-head">
          <div>
            <span className="section-head__eyebrow">Jemaat Baru</span>
            <h1 className="section-title">Registrasi</h1>
          </div>
        </div>

        {error && <div className="alert alert--error">{error}</div>}

        <form className="card register__form" onSubmit={handleSubmit}>
          <div className="register__grid">
            <label className="field">
              <span>Nama Lengkap *</span>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Nama sesuai KTP"
                required
              />
              {fieldErrors.name && <small className="field__error">{fieldErrors.name[0]}</small>}
            </label>

            <label className="field">
              <span>Email *</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="nama@email.com"
                required
              />
              {fieldErrors.email && <small className="field__error">{fieldErrors.email[0]}</small>}
            </label>

            <label className="field">
              <span>Alamat *</span>
              <input
                type="text"
                name="alamat"
                value={form.alamat}
                onChange={handleChange}
                placeholder="Alamat tempat tinggal"
                required
              />
              {fieldErrors.alamat && <small className="field__error">{fieldErrors.alamat[0]}</small>}
            </label>

            <label className="field">
              <span>No. HP *</span>
              <input
                type="tel"
                name="no_HP"
                value={form.no_HP}
                onChange={handleChange}
                placeholder="08xxxxxxxxxx"
                required
              />
              {fieldErrors.no_HP && <small className="field__error">{fieldErrors.no_HP[0]}</small>}
            </label>

            <label className="field">
              <span>Golongan Darah *</span>
              <select name="gol_darah" value={form.gol_darah} onChange={handleChange} required>
                <option value="" disabled>
                  Pilih golongan darah
                </option>
                {GOL_DARAH.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              {fieldErrors.gol_darah && (
                <small className="field__error">{fieldErrors.gol_darah[0]}</small>
              )}
            </label>

            <label className="field">
              <span>Tanggal Lahir *</span>
              <input
                type="date"
                name="tgl_lahir"
                value={form.tgl_lahir}
                onChange={handleChange}
                required
              />
              {fieldErrors.tgl_lahir && (
                <small className="field__error">{fieldErrors.tgl_lahir[0]}</small>
              )}
            </label>

            <label className="field">
              <span>Password *</span>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Minimal 8 karakter"
                required
                minLength={8}
              />
              {fieldErrors.password && (
                <small className="field__error">{fieldErrors.password[0]}</small>
              )}
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
              {fieldErrors.confirmPassword && (
                <small className="field__error">{fieldErrors.confirmPassword[0]}</small>
              )}
            </label>

            <label className="field">
              <span>Instagram</span>
              <input
                type="text"
                name="instagram"
                value={form.instagram}
                onChange={handleChange}
                placeholder="@username"
              />
            </label>

            <label className="field">
              <span>Facebook</span>
              <input
                type="text"
                name="facebook"
                value={form.facebook}
                onChange={handleChange}
                placeholder="Nama akun Facebook"
              />
            </label>

            <label className="field field--full">
              <span>Foto</span>
              <input type="file" accept="image/*" onChange={handleFile} />
            </label>
          </div>

          <div className="register__actions">
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? 'Menyimpan…' : 'Daftar'}
            </button>
            <p className="muted register__hint">
              Sudah punya akun? <Link to="/login">Masuk di sini</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
