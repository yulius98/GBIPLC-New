import { useEffect, useState } from 'react'
import api, { MEDIA_URL } from '../api/client'
import { toWebp } from '../utils/image'
import { uploadFileInChunks } from '../utils/chunkUpload'
import Pagination from './Pagination'

function toDateInput(value) {
  if (!value) return ''
  const s = String(value)
  return s.slice(0, 10)
}

// Render input sesuai tipe field. Dipisah dari AdminCrudPage agar tidak ada
// rantai ternary bersarang di JSX (S3358).
function FieldInput({ field, value, options, editing, onChange, onFileChange, onToggle }) {
  if (field.type === 'textarea') {
    return (
      <textarea
        name={field.name}
        value={value || ''}
        onChange={onChange}
        placeholder={field.placeholder}
        rows={field.rows || 3}
        style={field.minHeight ? { minHeight: field.minHeight } : undefined}
        required={field.required}
      />
    )
  }
  if (field.type === 'select') {
    return (
      <select name={field.name} value={value || ''} onChange={onChange} required={field.required}>
        <option value="">{field.placeholder || 'Pilih…'}</option>
        {(options[field.name] || field.options || []).map((opt) => {
          const optValue = typeof opt === 'object' ? opt.value : opt
          const optLabel = typeof opt === 'object' ? opt.label : opt
          return (
            <option key={optValue} value={optValue}>
              {optLabel}
            </option>
          )
        })}
      </select>
    )
  }
  if (field.type === 'file') {
    return (
      <>
        <input type="file" name={field.name} accept={field.accept} onChange={onFileChange} />
        {editing?.[field.oldFileKey || field.name] && (
          <small className="muted">File lama: {editing[field.oldFileKey || field.name]}</small>
        )}
      </>
    )
  }
  if (field.type === 'checkbox') {
    return <input type="checkbox" name={field.name} checked={Boolean(value)} onChange={onToggle} />
  }
  return (
    <input
      type={field.type || 'text'}
      name={field.name}
      value={value || ''}
      onChange={onChange}
      placeholder={field.placeholder}
      min={field.min}
      required={field.required}
    />
  )
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
  // Progres upload bertahap (0..1); null = tidak sedang mengunggah file besar.
  const [uploadProgress, setUploadProgress] = useState(null)

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

  function handleToggle(e) {
    const { name, checked } = e.target
    setForm((f) => ({ ...f, [name]: checked }))
  }

  // Siapkan nilai untuk satu field file: unggah bertahap untuk dokumen besar,
  // konversi WebP untuk gambar, atau kirim berkas apa adanya.
  async function prepareFileValue(field, value) {
    const isImage = (value.type || '').startsWith('image/')
    if (field.chunked && !isImage) {
      // Dokumen besar (PDF/PPT): unggah bertahap, lalu kirim hanya path
      // hasilnya sebagai teks. Gambar tetap lewat upload biasa di bawah.
      try {
        const uploaded = await uploadFileInChunks(value, {
          onProgress: setUploadProgress,
        })
        return uploaded.filename
      } catch (uploadErr) {
        uploadErr.fieldName = field.name
        throw uploadErr
      }
    }
    if (field.webp && isImage) {
      // Konversi hanya untuk gambar; video diunggah apa adanya
      const blob = await toWebp(value, field.maxSizeKB || 250)
      if (blob) {
        const baseName = String(value.name || 'gambar').replace(/\.[^.]+$/, '')
        return new File([blob], `${baseName}.webp`, { type: 'image/webp' })
      }
    }
    return value
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setNotice('')
    setFieldErrors({})

    const errors = {}
    for (const field of fields) {
      // Checkbox boolean tidak ikut validasi "required" (false bukan berarti kosong)
      if (field.required && field.type !== 'checkbox' && !form[field.name]) {
        errors[field.name] = [`${field.label} wajib diisi`]
      }
      // File wajib hanya saat menambah data baru (saat edit, file lama dipertahankan)
      if (field.type === 'file' && field.requiredCreate && !editing && !(form[field.name] instanceof File)) {
        errors[field.name] = [`${field.label} wajib dipilih`]
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
        // Proses semua field file di luar loop agar tidak ada `await` di dalam
        // loop (S9382). Urutan append FormData tidak memengaruhi multer.
        const preparedFiles = new Map()
        await Promise.all(
          fields
            .filter((f) => f.type === 'file' && form[f.name] instanceof File)
            .map(async (field) => {
              preparedFiles.set(field.name, await prepareFileValue(field, form[field.name]))
            }),
        )
        for (const field of fields) {
          const value = form[field.name]
          if (field.type === 'file') {
            if (preparedFiles.has(field.name)) {
              payload.append(field.name, preparedFiles.get(field.name))
            }
          } else if (field.type === 'checkbox') {
            // Kirim eksplisit agar backend bisa membedakan true/false
            payload.append(field.name, value ? 'true' : 'false')
          } else if (value !== '' && value != null) {
            payload.append(field.name, field.type === 'number' ? Number(value) : value)
          }
        }
      } else {
        payload = {}
        for (const field of fields) {
          const value = form[field.name]
          if (field.type === 'checkbox') {
            payload[field.name] = Boolean(value)
          } else if (value !== '' && value != null) {
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
      else if (err.fieldName) {
        // Gagal saat upload bertahap: tampilkan di bawah field file di dalam modal.
        setFieldErrors({
          [err.fieldName]: [data?.message || err.message || 'Gagal mengunggah file.'],
        })
      } else setError(data?.message || 'Gagal menyimpan data.')
    } finally {
      setSubmitting(false)
      setUploadProgress(null)
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

  let submitLabel = 'Simpan'
  if (submitting) {
    submitLabel =
      uploadProgress !== null
        ? `Mengunggah ${Math.round(uploadProgress * 100)}%…`
        : 'Menyimpan…'
  }

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
                    <FieldInput
                      field={field}
                      value={form[field.name]}
                      options={options}
                      editing={editing}
                      onChange={handleChange}
                      onFileChange={handleFile}
                      onToggle={handleToggle}
                    />
                    {fieldErrors[field.name] && (
                      <small className="field__error">{fieldErrors[field.name][0]}</small>
                    )}
                    {field.hint && <small className="muted">{field.hint}</small>}
                  </label>
                ))}

                {uploadProgress !== null && (
                  <div>
                    <progress value={uploadProgress} max={1} style={{ width: '100%' }} />
                    <small className="muted">
                      Mengunggah file… {Math.round(uploadProgress * 100)}% (jangan tutup halaman ini)
                    </small>
                  </div>
                )}

                <div className="admin-form__actions">
                  <button type="button" className="btn btn--ghost" onClick={close}>
                    Batal
                  </button>
                  <button type="submit" className="btn btn--primary" disabled={submitting}>
                    {submitLabel}
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
