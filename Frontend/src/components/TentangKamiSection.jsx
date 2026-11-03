import { useEffect, useState } from 'react'
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

/**
 * Seksi "Tentang Kami" untuk halaman admin Setting:
 * hanya teks halaman (singleton) via GET/PUT /admin/tentang.
 * Kartu pelayanan ditampilkan di halaman publik /tentang
 * (dari seed migrasi tbl_tentang_kami_pelayanan).
 */
export default function TentangKamiSection() {
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
