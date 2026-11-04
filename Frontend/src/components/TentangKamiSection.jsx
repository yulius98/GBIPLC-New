import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import api from '../api/client'

const EMPTY_TEXT_FORM = {
  judul: '',
  sub_judul: '',
  lede: '',
  paragraf_1: '',
  paragraf_2: '',
  selayang_judul: '',
  pelayanan_judul: '',
}

const EMPTY_CARD_FORM = {
  icon: '',
  judul: '',
  frekuensi: '',
  deskripsi: '',
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
 * Seksi "Tentang Kami" untuk halaman admin Setting:
 * 1. Teks halaman (singleton) via GET/PUT /admin/tentang.
 * 2. Kartu pelayanan (multi-row, tabel CRUD) via /admin/tentang-pelayanan —
 *    kartu ini yang tampil di halaman publik /tentang.
 */
export default function TentangKamiSection() {
  return (
    <>
      <TentangKamiTextForm />
      <PelayananCardsSection />
    </>
  )
}

// ---------- Teks halaman (singleton) ----------

function TentangKamiTextForm() {
  const [textForm, setTextForm] = useState(EMPTY_TEXT_FORM)
  const [textLoading, setTextLoading] = useState(true)
  const [textSaving, setTextSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    api
      .get('/admin/tentang')
      .then((res) => {
        const data = res.data?.data?.tentang || {}
        const next = {}
        for (const key of Object.keys(EMPTY_TEXT_FORM)) next[key] = data[key] ?? ''
        setTextForm(next)
      })
      .catch((err) =>
        setError(err.response?.data?.message || 'Gagal memuat konten Tentang Kami.'),
      )
      .finally(() => setTextLoading(false))
  }, [])

  function handleTextChange(e) {
    const { name, value } = e.target
    setTextForm((f) => ({ ...f, [name]: value }))
  }

  async function handleTextSubmit(e) {
    e.preventDefault()
    setNotice('')
    setError('')
    setTextSaving(true)
    try {
      const { data } = await api.put('/admin/tentang', textForm)
      setNotice(data?.message || 'Konten Tentang Kami berhasil disimpan.')
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan konten Tentang Kami.')
    } finally {
      setTextSaving(false)
    }
  }

  return (
    <section className="card settings-section">
      <h3 className="settings-section__title">Tentang Kami</h3>

      {error && <div className="alert alert--error">{error}</div>}
      {notice && <div className="alert alert--success">{notice}</div>}

      {textLoading ? (
        <p className="muted">Memuat…</p>
      ) : (
        <form
          className="settings-section__grid settings-section__grid--single"
          onSubmit={handleTextSubmit}
        >
          <label className="field">
            <span>Judul</span>
            <input
              type="text"
              name="judul"
              value={textForm.judul}
              onChange={handleTextChange}
              placeholder="Mengenal GBI Philadelphia Life Center"
            />
          </label>
          <label className="field">
            <span>Sub Judul</span>
            <textarea
              name="sub_judul"
              rows={2}
              value={textForm.sub_judul}
              onChange={handleTextChange}
            />
          </label>
          <label className="field">
            <span>Judul Seksi Siapa Kami</span>
            <input
              type="text"
              name="selayang_judul"
              value={textForm.selayang_judul}
              onChange={handleTextChange}
              placeholder="Sebuah Keluarga Iman di Yogyakarta"
            />
          </label>
          <label className="field">
            <span>Siapa Kami (Pengantar)</span>
            <textarea name="lede" rows={3} value={textForm.lede} onChange={handleTextChange} />
          </label>
          <label className="field">
            <span>Siapa Kami (Paragraf 1)</span>
            <textarea
              name="paragraf_1"
              rows={4}
              value={textForm.paragraf_1}
              onChange={handleTextChange}
            />
          </label>
          <label className="field">
            <span>Siapa Kami (Paragraf 2)</span>
            <textarea
              name="paragraf_2"
              rows={4}
              value={textForm.paragraf_2}
              onChange={handleTextChange}
            />
          </label>
          <label className="field">
            <span>Judul Seksi Pelayanan</span>
            <input
              type="text"
              name="pelayanan_judul"
              value={textForm.pelayanan_judul}
              onChange={handleTextChange}
              placeholder="Yang Kami Lakukan Bersama"
            />
            <small className="muted">
              Kartu pelayanan di bawah judul ini dikelola pada card “Kartu Pelayanan”.
            </small>
          </label>
          <div className="admin-form__actions">
            <button type="submit" className="btn btn--primary" disabled={textSaving}>
              {textSaving ? 'Menyimpan…' : 'Simpan'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}

// ---------- Kartu Pelayanan (multi-row CRUD) ----------

function PelayananCardsSection() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_CARD_FORM)
  const [saving, setSaving] = useState(false)

  async function load() {
    setError('')
    try {
      const { data } = await api.get('/admin/tentang-pelayanan', { params: { pageSize: 100 } })
      setItems(data.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat kartu pelayanan.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function openAdd() {
    setEditing(null)
    setForm({ ...EMPTY_CARD_FORM })
    setNotice('')
    setError('')
    setModalOpen(true)
  }

  function openEdit(item) {
    setEditing(item)
    setForm({
      icon: item.icon || '',
      judul: item.judul || '',
      frekuensi: item.frekuensi || '',
      deskripsi: item.deskripsi || '',
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
    e.stopPropagation() // cegah submit event "bocor" ke <form> teks Tentang Kami
    setNotice('')
    setError('')
    for (const key of Object.keys(EMPTY_CARD_FORM)) {
      if (!form[key].trim()) {
        setError('Semua kolom kartu pelayanan wajib diisi.')
        return
      }
    }
    setSaving(true)
    try {
      const payload = { ...form }
      if (editing) {
        await api.put(`/admin/tentang-pelayanan/${editing.id}`, payload)
        setNotice('Kartu pelayanan berhasil diperbarui.')
      } else {
        await api.post('/admin/tentang-pelayanan', payload)
        setNotice('Kartu pelayanan berhasil ditambahkan.')
      }
      setModalOpen(false)
      setEditing(null)
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan kartu pelayanan.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Hapus kartu "${item.judul}"?`)) return
    setError('')
    setNotice('')
    try {
      await api.delete(`/admin/tentang-pelayanan/${item.id}`)
      setNotice('Kartu pelayanan berhasil dihapus.')
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus kartu pelayanan.')
    }
  }

  return (
    <section className="card settings-section">
      <div className="settings-section__head">
        <div>
          <h3 className="settings-section__title">Kartu Pelayanan</h3>
          <p className="muted">Kartu yang tampil di seksi “Pelayanan” halaman Tentang.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={openAdd}>
          <IconPlus />
          Tambah Kartu
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
                <th>Icon</th>
                <th>Judul</th>
                <th>Frekuensi</th>
                <th>Deskripsi</th>
                <th className="admin-table__actions">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="muted">
                    Belum ada kartu pelayanan.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.icon}</td>
                    <td>{item.judul}</td>
                    <td>{item.frekuensi}</td>
                    <td>{item.deskripsi}</td>
                    <td className="admin-table__actions">
                      <button
                        type="button"
                        className="btn btn--ghost btn--icon"
                        title="Edit kartu"
                        aria-label={`Edit ${item.judul}`}
                        onClick={() => openEdit(item)}
                      >
                        <IconEdit />
                      </button>
                      <button
                        type="button"
                        className="btn btn--danger btn--icon"
                        title="Hapus kartu"
                        aria-label={`Hapus ${item.judul}`}
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
          // Portal ke <body>: modal tidak berada di dalam <form> Tentang Kami
          // (nested form tidak valid di HTML — submit event bisa nyasar)
          <div className="modal-overlay" onClick={close}>
            <div className="modal modal--form" onClick={(e) => e.stopPropagation()}>
              <div className="modal__head">
                <h3>{editing ? 'Edit Kartu' : 'Tambah Kartu'} Pelayanan</h3>
                <button type="button" className="modal__close" onClick={close} aria-label="Tutup">
                  ×
                </button>
              </div>
              <div className="modal__body">
                <form onSubmit={handleSubmit} className="admin-form">
                  <label className="field">
                    <span>Icon *</span>
                    <input
                      type="text"
                      name="icon"
                      value={form.icon}
                      onChange={handleChange}
                      placeholder="IR / ST / YM / LG"
                      maxLength={4}
                      required
                    />
                    <small className="muted">Singkatan singkat, mis. 2 huruf.</small>
                  </label>
                  <label className="field">
                    <span>Judul *</span>
                    <input
                      type="text"
                      name="judul"
                      value={form.judul}
                      onChange={handleChange}
                      placeholder="Ibadah Raya"
                      required
                    />
                  </label>
                  <label className="field">
                    <span>Frekuensi *</span>
                    <input
                      type="text"
                      name="frekuensi"
                      value={form.frekuensi}
                      onChange={handleChange}
                      placeholder="Setiap Minggu, 10.00 WIB"
                      required
                    />
                  </label>
                  <label className="field">
                    <span>Deskripsi *</span>
                    <textarea
                      name="deskripsi"
                      rows={3}
                      value={form.deskripsi}
                      onChange={handleChange}
                      placeholder="Perayaan bersama keluarga besar GBI PLC…"
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
