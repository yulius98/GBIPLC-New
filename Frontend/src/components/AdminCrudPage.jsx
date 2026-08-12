import { useEffect, useState } from 'react'
import api, { MEDIA_URL } from '../api/client'
import { toWebp } from '../utils/image'
import Pagination from './Pagination'

function toDateInput(value) {
  if (!value) return ''
  const s = String(value)
  return s.slice(0, 10)
}

export default function AdminCrudPage({
  title,
  apiPath,
  columns = [],
  fields = [],
  initialForm = {},
  options = {},
  searchKeys = [],
  searchPlaceholder = 'Cari…',
  emptyText = 'Belum ada data.',
}) {
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
  const [form, setForm] = useState(initialForm)
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const params = { page, pageSize }
      const q = query.trim()
      if (q) params.q = q
      const { data } = await api.get(apiPath, { params })
      setItems(data.data || [])
      setTotal(data.meta?.total ?? 0)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiPath, page, pageSize, query])

  function openAdd() {
    setEditing(null)
    setForm({ ...initialForm })
    setFieldErrors({})
    setNotice('')
    setModalOpen(true)
  }

  function openEdit(item) {
    const next = { ...initialForm }
    for (const field of fields) {
      const raw = item?.[field.name]
      next[field.name] = field.type === 'date' ? toDateInput(raw) : raw ?? ''
    }
    setEditing(item)
    setForm(next)
    setFieldErrors({})
    setNotice('')
    setModalOpen(true)
  }

  function close() {
    setModalOpen(false)
    setEditing(null)
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    setFieldErrors((fe) => ({ ...fe, [name]: undefined }))
  }

  function handleFile(e) {
    const { name, files } = e.target
    setForm((f) => ({ ...f, [name]: files?.[0] || null }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setNotice('')
    setFieldErrors({})

    const errors = {}
    for (const field of fields) {
      if (field.required && !form[field.name]) {
        errors[field.name] = [`${field.label} wajib diisi`]
      }
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setSubmitting(true)
    try {
      const hasFile = fields.some((f) => f.type === 'file')
      let payload
      if (hasFile) {
        payload = new FormData()
        for (const field of fields) {
          const value = form[field.name]
          if (field.type === 'file') {
            if (value instanceof File) {
              if (field.webp) {
                const blob = await toWebp(value, field.maxSizeKB || 250)
                const baseName = String(value.name || 'gambar').replace(/\.[^.]+$/, '')
                payload.append(field.name, new File([blob], `${baseName}.webp`, { type: 'image/webp' }))
              } else {
                payload.append(field.name, value)
              }
            }
          } else if (value !== '' && value != null) {
            payload.append(field.name, field.type === 'number' ? Number(value) : value)
          }
        }
      } else {
        payload = {}
        for (const field of fields) {
          const value = form[field.name]
          if (value !== '' && value != null) {
            payload[field.name] = field.type === 'number' ? Number(value) : value
          }
        }
      }

      if (editing) {
        await api.put(`${apiPath}/${editing.id}`, payload)
        setNotice('Data berhasil diperbarui.')
      } else {
        await api.post(apiPath, payload)
        setNotice('Data berhasil ditambahkan.')
      }
      setModalOpen(false)
      await load()
    } catch (err) {
      const data = err.response?.data
      if (data?.errors) setFieldErrors(data.errors)
      else setError(data?.message || 'Gagal menyimpan data.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Hapus data ini?`)) return
    try {
      await api.delete(`${apiPath}/${item.id}`)
      setNotice('Data berhasil dihapus.')
      if (items.length === 1 && page > 1) setPage(page - 1)
      else await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus data.')
    }
  }

  const hasFileField = fields.some((f) => f.type === 'file')

  return (
    <div className="admin-page">
      <div className="admin-page__head">
        <h2 className="section-title">{title}</h2>
        <div className="admin-page__tools">
          {searchKeys.length > 0 && (
            <input
              className="admin-search"
              type="search"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
            />
          )}
          <button type="button" className="btn btn--primary" onClick={openAdd}>
            + Tambah
          </button>
        </div>
      </div>

      {notice && <div className="alert alert--success">{notice}</div>}
      {error && <div className="alert alert--error">{error}</div>}

      {loading ? (
        <p className="muted">Memuat…</p>
      ) : items.length === 0 ? (
        <div className="card admin-empty">
          <p className="muted">{emptyText}</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key} style={col.width ? { width: col.width } : undefined}>
                    {col.label}
                  </th>
                ))}
                <th className="admin-table__actions">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  {columns.map((col) => (
                    <td key={col.key} style={col.width ? { width: col.width } : undefined}>
                      {col.image ? (
                        item[col.key] ? (
                          <img
                            className="admin-thumb"
                            src={`${MEDIA_URL}/uploads/${item[col.key]}`}
                            alt=""
                          />
                        ) : (
                          '—'
                        )
                      ) : col.render ? (
                        col.render(item)
                      ) : (
                        item[col.key] ?? '—'
                      )}
                    </td>
                  ))}
                  <td className="admin-table__actions">
                    <button type="button" className="btn btn--ghost" onClick={() => openEdit(item)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn--danger"
                      onClick={() => handleDelete(item)}
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
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
              <h3>
                {editing ? 'Edit' : 'Tambah'} {title}
              </h3>
              <button type="button" className="modal__close" onClick={close} aria-label="Tutup">
                ×
              </button>
            </div>
            <div className="modal__body">
              <form onSubmit={handleSubmit} className="admin-form">
                {fields.map((field) => (
                  <label className={`field${field.className ? ' ' + field.className : ''}`} key={field.name}>
                    <span>
                      {field.label}
                      {field.required && ' *'}
                    </span>
                    {field.type === 'textarea' ? (
                      <textarea
                        name={field.name}
                        value={form[field.name] || ''}
                        onChange={handleChange}
                        placeholder={field.placeholder}
                        rows={field.rows || 3}
                        style={field.minHeight ? { minHeight: field.minHeight } : undefined}
                        required={field.required}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        name={field.name}
                        value={form[field.name] || ''}
                        onChange={handleChange}
                        required={field.required}
                      >
                        <option value="">{field.placeholder || 'Pilih…'}</option>
                        {(options[field.name] || field.options || []).map((opt) => {
                          const value = typeof opt === 'object' ? opt.value : opt
                          const label = typeof opt === 'object' ? opt.label : opt
                          return (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          )
                        })}
                      </select>
                    ) : field.type === 'file' ? (
                      <>
                        <input
                          type="file"
                          name={field.name}
                          accept={field.accept}
                          onChange={handleFile}
                        />
                        {hasFileField && editing?.[field.name] && (
                          <small className="muted">
                            File lama: {editing[field.name]}
                          </small>
                        )}
                      </>
                    ) : (
                      <input
                        type={field.type || 'text'}
                        name={field.name}
                        value={form[field.name] || ''}
                        onChange={handleChange}
                        placeholder={field.placeholder}
                        min={field.min}
                        required={field.required}
                      />
                    )}
                    {fieldErrors[field.name] && (
                      <small className="field__error">{fieldErrors[field.name][0]}</small>
                    )}
                  </label>
                ))}

                <div className="admin-form__actions">
                  <button type="button" className="btn btn--ghost" onClick={close}>
                    Batal
                  </button>
                  <button type="submit" className="btn btn--primary" disabled={submitting}>
                    {submitting ? 'Menyimpan…' : 'Simpan'}
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
