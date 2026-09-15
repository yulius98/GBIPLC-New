import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { useSeo } from '../context/SeoContext'
import { useSEO } from '../utils/seo'
import { toWebp } from '../utils/image'

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
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const isMobile =
    typeof navigator !== 'undefined' &&
    /Android|iPhone|iPad|iPod|IEMobile|Opera Mini|BlackBerry|Windows Phone|Mobile/i.test(
      navigator.userAgent,
    )
  const canUseCamera =
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function'
  const showCameraButton = isMobile && canUseCamera

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const previewUrlRef = useRef(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [])

  useEffect(() => {
    if (!cameraOpen || !streamRef.current || !videoRef.current) return
    videoRef.current.srcObject = streamRef.current
    videoRef.current.play().catch(() => {})
  }, [cameraOpen])

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setFieldErrors((fe) => ({ ...fe, [e.target.name]: undefined }))
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setCameraOpen(false)
    setCameraError('')
  }

  function setSelectedPhoto(file) {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = file ? URL.createObjectURL(file) : null
    setPreviewUrl(previewUrlRef.current || '')
    setPhoto(file)
    if (file && streamRef.current) stopCamera()
  }

  function handleFile(e) {
    setSelectedPhoto(e.target.files?.[0] || null)
    e.target.value = ''
  }

  async function openCamera() {
    setCameraError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      setCameraOpen(true)
    } catch {
      setCameraError('Kamera tidak dapat diakses. Silakan gunakan tombol “Pilih File” untuk unggah foto.')
    }
  }

  function canvasToJpegFile(canvas) {
    const stamp = Date.now()
    const qualities = [0.88, 0.75, 0.6, 0.45]
    const attempt = (i) =>
      new Promise((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(null)
            if (blob.size <= 1900 * 1024 || i === qualities.length - 1) {
              resolve(new File([blob], `kamera-${stamp}.jpg`, { type: 'image/jpeg' }))
            } else {
              resolve(attempt(i + 1))
            }
          },
          'image/jpeg',
          qualities[i],
        )
      })
    return attempt(0)
  }

  async function capturePhoto() {
    const video = videoRef.current
    if (!video || !video.videoWidth || !video.videoHeight) return

    const capScale = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(video.videoWidth * capScale))
    canvas.height = Math.max(1, Math.round(video.videoHeight * capScale))
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)

    const file = await canvasToJpegFile(canvas)
    if (file) setSelectedPhoto(file)
  }

  function cancelCamera() {
    stopCamera()
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

    if (photo) {
      const baseName = (form.name || 'foto')
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^A-Za-z0-9_-]/g, '_')
      try {
        const webp = await toWebp(photo, 215)
        if (webp) body.append('filename', webp, `${baseName}.webp`)
      } catch {
        body.append('filename', photo)
      }
    }

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
              {fieldErrors.password && (
                <small className="field__error">{fieldErrors.password[0]}</small>
              )}
            </label>

            <label className="field">
              <span>Konfirmasi Password *</span>
              <div className="field__input-wrap">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Ulangi password"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className="field__toggle"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  aria-pressed={showConfirmPassword}
                >
                  {showConfirmPassword ? (
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

            <div className="field field--full">
              <label className="register__photo-label">
                <span>Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  capture={isMobile ? 'user' : undefined}
                  onChange={handleFile}
                />
              </label>

              {showCameraButton && (
                <div className="register__camera-tools">
                  <button type="button" className="btn btn--ghost" onClick={openCamera}>
                    Buka Kamera Depan
                  </button>
                </div>
              )}

              {cameraError && <small className="field__error">{cameraError}</small>}

              {cameraOpen && (
                <div className="register__camera">
                  <video ref={videoRef} muted playsInline autoPlay />
                  <div className="register__camera-tools">
                    <button type="button" className="btn btn--primary" onClick={capturePhoto}>
                      Ambil Foto
                    </button>
                    <button type="button" className="btn" onClick={cancelCamera}>
                      Batal
                    </button>
                  </div>
                </div>
              )}

              <div className="register__photo">
                {previewUrl ? (
                  <img src={previewUrl} alt="Pratinjau foto" />
                ) : (
                  <span className="register__photo-placeholder">Belum ada foto</span>
                )}
              </div>
            </div>
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
