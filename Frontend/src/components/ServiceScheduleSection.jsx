import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import api from '../api/client'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const EMPTY_FORM = {
  service_name: '',
  day_of_week: '',
  opens: '',
  closes: '',
}

function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function IconEdit() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

function IconTrash() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}

/**
 * Seksi "Jadwal Ibadah" untuk halaman Setting (CRUD multi-row).
 * API: /admin/schedule (sebelumnya field single-row service_name pada SEO).
 */
export default function ServiceScheduleSection() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  async function load() {
    setError('')
    try {
      const { data } = await api.get('/admin/schedule', { params: { pageSize: 100 } })
      setItems(data.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat jadwal ibadah.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function openAdd() {
    setEditing(null)
    setForm({ ...EMPTY_FORM })
    setNotice('')
    setError('')
    setModalOpen(true)
  }

  function openEdit(item) {
    setEditing(item)
    setForm({
      service_name: item.service_name || '',
      day_of_week: item.day_of_week || '',
      opens: item.opens || '',
      closes: item.closes || '',
    })
    setNotice('')
    setError('')
    setModalOpen(true)
  }

  function close() {
    setModalOpen(false)
    setEditing(null)
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    e.stopPropagation() // cegah submit event "bocor" ke <form> utama SEO di AdminSettingPage
    setNotice('')
    setError('')
    if (!form.service_name || !form.day_of_week || !form.opens || !form.closes) {
      setError('Semua kolom jadwal wajib diisi.')
      return
    }
    setSaving(true)
    try {
      const payload = { ...form }
      if (editing) {
        await api.put(`/admin/schedule/${editing.public_id}`, payload)
        setNotice('Jadwal ibadah berhasil diperbarui.')
      } else {
        await api.post('/admin/schedule', payload)
        setNotice('Jadwal ibadah berhasil ditambahkan.')
      }
      setModalOpen(false)
      setEditing(null)
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan jadwal ibadah.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Hapus jadwal "${item.service_name} (${item.day_of_week})"?`)) return
    setError('')
    setNotice('')
    try {
      await api.delete(`/admin/schedule/${item.public_id}`)
      setNotice('Jadwal ibadah berhasil dihapus.')
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus jadwal ibadah.')
    }
  }

  return (
    <section className="card settings-section">
      <div className="settings-section__head">
        <h3 className="settings-section__title">Jadwal Ibadah</h3>
        <button type="button" className="btn btn--primary" onClick={openAdd}>
          <IconPlus />
          Tambah Jadwal
        </button>
      </div>

      {notice && <div className="alert alert--success">{notice}</div>}
      {error && <div className="alert alert--error">{error}</div>}

      {loading ? (
        <p className="muted">Memuat…</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table schedule-table">
            <thead>
              <tr>
                <th>Nama Ibadah</th>
                <th>Hari</th>
                <th>Mulai</th>
                <th>Selesai</th>
                <th className="admin-table__actions">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="muted">
                    Belum ada jadwal ibadah.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.service_name}</td>
                    <td>{item.day_of_week}</td>
                    <td>{item.opens}</td>
                    <td>{item.closes}</td>
                    <td className="admin-table__actions">
                      <button
                        type="button"
                        className="btn btn--ghost btn--icon"
                        title="Edit jadwal"
                        aria-label={`Edit ${item.service_name}`}
                        onClick={() => openEdit(item)}
                      >
                        <IconEdit />
                      </button>
                      <button
                        type="button"
                        className="btn btn--danger btn--icon"
                        title="Hapus jadwal"
                        aria-label={`Hapus ${item.service_name}`}
                        onClick={() => handleDelete(item)}
                      >
                        <IconTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen &&
        createPortal(
          // Portal ke <body>: modal TIDAK BOLEH berada di dalam <form> settings-form
          // (nested form tidak valid di HTML — submit event bisa nyasar ke form utama)
          <div className="modal-overlay" onClick={close}>
            <div className="modal modal--form" onClick={(e) => e.stopPropagation()}>
              <div className="modal__head">
                <h3>{editing ? 'Edit Jadwal' : 'Tambah Jadwal'} Ibadah</h3>
                <button type="button" className="modal__close" onClick={close} aria-label="Tutup">
                  ×
                </button>
              </div>
              <div className="modal__body">
                <form onSubmit={handleSubmit} className="admin-form">
                  <label className="field">
                    <span>Nama Ibadah *</span>
                    <input
                      type="text"
                      name="service_name"
                      value={form.service_name}
                      onChange={handleChange}
                      placeholder="Ibadah Raya"
                      required
                    />
                  </label>
                  <label className="field">
                    <span>Hari *</span>
                    <select
                      name="day_of_week"
                      value={form.day_of_week}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Pilih hari…</option>
                      {DAYS.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Mulai *</span>
                    <input
                      type="time"
                      name="opens"
                      value={form.opens}
                      onChange={handleChange}
                      required
                    />
                  </label>
                  <label className="field">
                    <span>Selesai *</span>
                    <input
                      type="time"
                      name="closes"
                      value={form.closes}
                      onChange={handleChange}
                      required
                    />
                  </label>

                  <div className="admin-form__actions">
                    <button type="button" className="btn btn--ghost" onClick={close}>
                      Batal
                    </button>
                    <button type="submit" className="btn btn--primary" disabled={saving}>
                      {saving ? 'Menyimpan…' : 'Simpan'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </section>
  )
}
