import { useEffect, useRef, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useSeo } from '../context/SeoContext'
import { useSEO } from '../utils/seo'
import { toWebp } from '../utils/image'

const GOL_DARAH = ['A', 'B', 'AB', 'O']

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function toDateInput(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

export default function MyDataPage() {
  const seo = useSeo()
  const { user, updateUser } = useAuth()

  useSEO({
    path: '/data-saya',
    title: 'Data Saya',
    description:
      'Perbarui data diri jemaat GBI Philadelphia Life Center (GBI PLC): nama, alamat, kontak, dan foto.',
    keywords: seo.keywords,
  })

  const [form, setForm] = useState({
    name: '',
    email: '',
    alamat: '',
    no_HP: '',
    gol_darah: '',
    tgl_lahir: '',
    facebook: '',
    instagram: '',
  })
  const [photoFile, setPhotoFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const blobUrlRef = useRef(null)

  useEffect(() => {
    if (!user?.id) return
    api
      .get(`/myprofile/${user.id}/edit`)
      .then((res) => {
        const data = res.data.data
        setForm({
          name: data.name || '',
          email: data.email || '',
          alamat: data.alamat || '',
          no_HP: data.no_HP || '',
          gol_darah: data.gol_darah || '',
          tgl_lahir: toDateInput(data.tgl_lahir),
          facebook: data.facebook || '',
          instagram: data.instagram || '',
        })
        setPreview(data.photo_url || '')
      })
      .catch((err) => setError(err.response?.data?.message || 'Gagal memuat data Anda.'))
      .finally(() => setLoading(false))
  }, [user?.id])

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
    }
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    // No HP hanya boleh berisi angka: tolak huruf/special karakter saat diketik
    const next = name === 'no_HP' ? value.replace(/\D/g, '') : value
    setForm((f) => ({ ...f, [name]: next }))
    if (name === 'email' && next.includes('@') && !EMAIL_RE.test(next)) {
      setFieldErrors((fe) => ({ ...fe, email: ['Format email tidak valid'] }))
    } else {
      setFieldErrors((fe) => ({ ...fe, [name]: undefined }))
    }
  }

  function handleFile(e) {
    const file = e.target.files?.[0] || null
    setPhotoFile(file)
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
    blobUrlRef.current = file ? URL.createObjectURL(file) : null
    setPreview(blobUrlRef.current || '')
    e.target.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setSuccess(false)

    if ((form.email || '') && !EMAIL_RE.test(form.email)) {
      setFieldErrors({ email: ['Format email tidak valid'] })
      return
    }
    if ((form.no_HP || '') && !/^\d+$/.test(form.no_HP)) {
      setFieldErrors({ no_HP: ['No HP hanya boleh berisi angka'] })
      return
    }

    setSubmitting(true)

    const body = new FormData()
    for (const [key, value] of Object.entries(form)) {
      if (value) body.append(key, value)
    }
    body.append('facebook', form.facebook || '')
    body.append('instagram', form.instagram || '')

    if (photoFile) {
      const baseName = (form.name || 'foto')
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^A-Za-z0-9_-]/g, '_')
      try {
        const webp = await toWebp(photoFile, 215)
        if (webp) {
          body.append('filename', webp, `${baseName}.webp`)
        } else {
          body.append('filename', photoFile)
        }
      } catch {
        body.append('filename', photoFile)
      }
    }

    try {
      await api.put(`/myprofile/${user.id}`, body)
      if (photoFile) {
        const res = await api.get(`/myprofile/${user.id}/edit`)
        updateUser(res.data.data)
      } else {
        updateUser({ name: form.name, email: form.email })
      }
      setSuccess(true)
    } catch (err) {
      const data = err.response?.data
      if (data?.errors) setFieldErrors(data.errors)
      setError(data?.message || 'Gagal menyimpan data. Silakan periksa kembali.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="register">
      <div className="container container--wide">
        <div className="section-head">
          <div>
            <span className="section-head__eyebrow">Akun Saya</span>
            <h1 className="section-title">Data Saya</h1>
          </div>
        </div>

        {success && <div className="alert alert--success">Data berhasil diperbarui.</div>}
        {error && <div className="alert alert--error">{error}</div>}

        {loading ? (
          <p className="muted">Memuat data…</p>
        ) : (
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
                {fieldErrors.alamat && (
                  <small className="field__error">{fieldErrors.alamat[0]}</small>
                )}
              </label>

              <label className="field">
                <span>No. HP *</span>
                <input
                  type="tel"
                  name="no_HP"
                  value={form.no_HP}
                  onChange={handleChange}
                  placeholder="08xxxxxxxxxx"
                  inputMode="numeric"
                  pattern="[0-9]*"
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

              <div className="field field--full">
                <label className="register__photo-label">
                  <span>Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture={/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ? 'user' : undefined}
                    onChange={handleFile}
                  />
                </label>

                <div className="register__photo">
                  {preview ? (
                    <img src={preview} alt="Pratinjau foto" />
                  ) : (
                    <span className="register__photo-placeholder">Belum ada foto</span>
                  )}
                </div>
              </div>
            </div>

            <div className="register__actions">
              <button type="submit" className="btn btn--primary" disabled={submitting}>
                {submitting ? 'Menyimpan…' : 'Simpan Data'}
              </button>
              <p className="muted register__hint">Data ini yang ditampilkan kepada gereja.</p>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}