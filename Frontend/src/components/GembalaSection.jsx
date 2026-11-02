import { useEffect, useState } from 'react'
import api from '../api/client'

/**
 * Seksi "Data Gembala" untuk halaman admin Setting (singleton).
 * API: GET /admin/gembala (load), PUT /admin/gembala (simpan).
 * Footer publik membaca data ini dari /api/gembala.
 */
export default function GembalaSection() {
  const [form, setForm] = useState({ nama_gembala: '', wakil_gembala: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    api
      .get('/admin/gembala')
      .then((res) => {
        const data = res.data?.data || {}
        setForm({
          nama_gembala: data.nama_gembala || '',
          wakil_gembala: data.wakil_gembala || '',
        })
      })
      .catch((err) =>
        setError(err.response?.data?.message || 'Gagal memuat data gembala.'),
      )
      .finally(() => setLoading(false))
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setNotice('')
    setError('')
    if (!form.nama_gembala.trim()) {
      setError('Nama gembala wajib diisi.')
      return
    }
    setSaving(true)
    try {
      const { data } = await api.put('/admin/gembala', form)
      setNotice(data?.message || 'Data gembala berhasil disimpan.')
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan data gembala.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="card settings-section">
      <h3 className="settings-section__title">Data Gembala</h3>
      {error && <div className="alert alert--error">{error}</div>}
      {notice && <div className="alert alert--success">{notice}</div>}
      {loading ? (
        <p className="muted">Memuat…</p>
      ) : (
        <form className="settings-section__grid" onSubmit={handleSubmit}>
          <label className="field">
            <span>Nama Gembala</span>
            <input
              type="text"
              name="nama_gembala"
              value={form.nama_gembala}
              onChange={handleChange}
              placeholder="Pdm. Nama Gembala"
            />
          </label>
          <label className="field">
            <span>Nama Wakil Gembala</span>
            <input
              type="text"
              name="wakil_gembala"
              value={form.wakil_gembala}
              onChange={handleChange}
              placeholder="Pdm. Nama Wakil Gembala"
            />
          </label>
          <div className="admin-form__actions">
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Menyimpan…' : 'Simpan'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
