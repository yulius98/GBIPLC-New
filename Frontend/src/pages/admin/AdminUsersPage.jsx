import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import Pagination from '../../components/Pagination'

const ROLE_OPTIONS = [
  { value: 'jemaat', label: 'Jemaat' },
  { value: 'pengurus', label: 'Pengurus' },
  { value: 'pendeta', label: 'Pendeta' },
]

const ROLE_LABEL = Object.fromEntries(ROLE_OPTIONS.map((o) => [o.value, o.label]))

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

const API_PATH = '/admin/users'

/**
 * Menu "Kelola User" (pengurus): daftar user dari tabel `users`.
 * Baris: No | Nama User | Role | Aksi (edit & delete).
 * Edit hanya membuka form role; delete = soft delete.
 * API: GET/PUT/DELETE /admin/users.
 */
export default function AdminUsersPage() {
  const { user: me } = useAuth()
  const [items, setItems] = useState([])
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [role, setRole] = useState('')
  const [saving, setSaving] = useState(false)

  async function requestUsers(params) {
    const { data } = await api.get(API_PATH, { params })
    setItems(data.data || [])
    setTotal(data.meta?.total ?? 0)
  }

  async function load() {
    setLoading(true)
    setError('')
    const params = { page, pageSize }
    const q = query.trim()
    if (q) params.q = q
    try {
      await requestUsers(params)
    } catch (err) {
      // Error tanpa respons = koneksi/servis down (mis. backend restart lewat
      // node --watch saat development) — coba sekali lagi sebelum menyerah.
      try {
        await new Promise((r) => setTimeout(r, 600))
        await requestUsers(params)
      } catch (err2) {
        setError(err2.response?.data?.message || 'Gagal memuat data user.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dipicu perubahan query/page
  }, [page, pageSize, query])

  function openEdit(item) {
    setEditing(item)
    setRole(item.role || '')
    setNotice('')
    setError('')
    setModalOpen(true)
  }

  function close() {
    setModalOpen(false)
    setEditing(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setNotice('')
    setError('')
    if (!role) {
      setError('Role wajib dipilih.')
      return
    }
    setSaving(true)
    try {
      await api.put(`${API_PATH}/${editing.id}`, { role })
      setNotice(`Role ${editing.name} berhasil diubah.`)
      setModalOpen(false)
      setEditing(null)
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengubah role.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Hapus user "${item.name}"?`)) return
    setNotice('')
    setError('')
    try {
      await api.delete(`${API_PATH}/${item.id}`)
      setNotice(`User ${item.name} berhasil dihapus.`)
      if (items.length === 1 && page > 1) setPage(page - 1)
      else await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus user.')
    }
  }

  const offset = (page - 1) * pageSize

  return (
    <div className="admin-page">
      <div className="admin-page__head">
        <h2 className="section-title">Kelola User</h2>
        <input
          className="admin-search"
          type="search"
          placeholder="Cari nama / email…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setPage(1)
          }}
        />
      </div>

      {notice && <div className="alert alert--success">{notice}</div>}
      {error && <div className="alert alert--error">{error}</div>}

      {loading ? (
        <p className="muted">Memuat…</p>
      ) : items.length === 0 ? (
        <div className="card admin-empty">
          <p className="muted">Belum ada data user.</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 56 }}>No</th>
                <th>Nama User</th>
                <th style={{ width: 120 }}>Role</th>
                <th className="admin-table__actions">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => {
                const isSelf = item.id === me?.id
                return (
                  <tr key={item.id}>
                    <td>{offset + i + 1}</td>
                    <td>
                      <strong>{item.name}</strong>
                      {item.email && (
                        <>
                          <br />
                          <small className="muted">{item.email}</small>
                        </>
                      )}
                    </td>
                    <td>{ROLE_LABEL[item.role] || item.role}</td>
                    <td className="admin-table__actions">
                      <button
                        type="button"
                        className="btn btn--ghost btn--icon"
                        title={isSelf ? 'Akun sendiri tidak dapat diedit' : 'Edit role'}
                        aria-label={`Edit role ${item.name}`}
                        disabled={isSelf}
                        onClick={() => openEdit(item)}
                      >
                        <IconEdit />
                      </button>
                      <button
                        type="button"
                        className="btn btn--danger btn--icon"
                        title={isSelf ? 'Akun sendiri tidak dapat dihapus' : 'Hapus user'}
                        aria-label={`Hapus ${item.name}`}
                        disabled={isSelf}
                        onClick={() => handleDelete(item)}
                      >
                        <IconTrash />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && total > pageSize && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size)
            setPage(1)
          }}
        />
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={close}>
          <div className="modal modal--form" onClick={(e) => e.stopPropagation()}>
            <div className="modal__head">
              <h3>Edit Role — {editing.name}</h3>
              <button type="button" className="modal__close" onClick={close} aria-label="Tutup">
                ×
              </button>
            </div>
            <div className="modal__body">
              <form onSubmit={handleSubmit} className="admin-form">
                <label className="field">
                  <span>Role *</span>
                  <select value={role} onChange={(e) => setRole(e.target.value)} required>
                    <option value="">Pilih role…</option>
                    {ROLE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <small className="muted">
                    Role akun saat ini: {ROLE_LABEL[editing.role] || editing.role}.
                  </small>
                </label>

                {error && <div className="alert alert--error">{error}</div>}

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
        </div>
      )}
    </div>
  )
}
