import { useEffect, useState } from 'react'
import api, { MEDIA_URL } from '../../api/client'

const EMPTY_FORM = {
  site_name: '',
  site_name_short: '',
  site_url: '',
  locale: '',
  default_title: '',
  default_description: '',
  keywords: '',
  church_name: '',
  church_alternate_name: '',
  church_description: '',
  telephone: '',
  whatsapp: '',
  street_address: '',
  address_locality: '',
  address_region: '',
  postal_code: '',
  address_country: '',
  service_name: '',
  day_of_week: '',
  opens: '',
  closes: '',
  instagram: '',
  facebook: '',
}

function Field({ name, label, type = 'text', form, onChange, placeholder, rows, hint }) {
  return (
    <label className="field">
      <span>{label}</span>
      {type === 'textarea' ? (
        <textarea
          name={name}
          value={form[name] || ''}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows || 3}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={form[name] || ''}
          onChange={onChange}
          placeholder={placeholder}
        />
      )}
      {hint && <small className="muted">{hint}</small>}
    </label>
  )
}

export default function AdminSettingPage() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [ogImage, setOgImage] = useState(null)
  const [ogImagePreview, setOgImagePreview] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    api
      .get('/admin/seo')
      .then((res) => {
        const data = res.data?.data || {}
        const next = {}
        for (const key of Object.keys(EMPTY_FORM)) next[key] = data[key] ?? ''
        setForm(next)
        if (data.og_image) setOgImagePreview(`${MEDIA_URL}/uploads/${data.og_image}`)
      })
      .catch((err) => setError(err.response?.data?.message || 'Gagal memuat setting SEO.'))
      .finally(() => setLoading(false))
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  function handleFile(e) {
    const file = e.target.files?.[0] || null
    setOgImage(file)
    setOgImagePreview(file ? URL.createObjectURL(file) : '')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setNotice('')
    setError('')
    setSaving(true)
    try {
      const body = new FormData()
      for (const [key, value] of Object.entries(form)) {
        if (value) body.append(key, value)
      }
      if (ogImage instanceof File) body.append('og_image', ogImage)
      const { data } = await api.put('/admin/seo', body)
      setNotice(data?.message || 'Setting SEO berhasil disimpan.')
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan setting SEO.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-page__head">
          <h2 className="section-title">Setting SEO</h2>
        </div>
        <p className="muted">Memuat…</p>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-page__head">
        <h2 className="section-title">Setting SEO</h2>
      </div>

      {notice && <div className="alert alert--success">{notice}</div>}
      {error && <div className="alert alert--error">{error}</div>}

      <form className="admin-form settings-form" onSubmit={handleSubmit}>
        <section className="card settings-section">
          <h3 className="settings-section__title">Umum</h3>
          <div className="settings-section__grid">
            <Field name="site_name" label="Nama Situs" form={form} onChange={handleChange} />
            <Field name="site_name_short" label="Nama Singkat" form={form} onChange={handleChange} />
            <Field name="site_url" label="URL Situs" form={form} onChange={handleChange} placeholder="https://…" />
            <Field name="locale" label="Locale" form={form} onChange={handleChange} placeholder="id_ID" />
            <Field name="default_title" label="Judul Default" form={form} onChange={handleChange} />
            <Field
              name="default_description"
              label="Deskripsi Default"
              type="textarea"
              rows={4}
              form={form}
              onChange={handleChange}
            />
            <Field
              name="keywords"
              label="Kata Kunci"
              type="textarea"
              rows={3}
              form={form}
              onChange={handleChange}
              hint="Dipisahkan dengan koma."
            />
          </div>
        </section>

        <section className="card settings-section">
          <h3 className="settings-section__title">Gambar Open Graph</h3>
          <div className="settings-section__grid">
            <div className="field">
              <span>Gambar OG</span>
              <input type="file" name="og_image" accept="image/*" onChange={handleFile} />
              {ogImagePreview ? (
                <img className="settings-section__og" src={ogImagePreview} alt="Preview OG" />
              ) : (
                <small className="muted">Belum ada gambar. Kosongkan untuk memakai favicon.svg.</small>
              )}
            </div>
          </div>
        </section>

        <section className="card settings-section">
          <h3 className="settings-section__title">Gereja</h3>
          <div className="settings-section__grid">
            <Field name="church_name" label="Nama Gereja" form={form} onChange={handleChange} />
            <Field name="church_alternate_name" label="Nama Alternatif" form={form} onChange={handleChange} />
            <Field
              name="church_description"
              label="Deskripsi Gereja"
              type="textarea"
              rows={3}
              form={form}
              onChange={handleChange}
            />
            <Field name="telephone" label="Telepon" form={form} onChange={handleChange} />
            <Field name="whatsapp" label="WhatsApp" form={form} onChange={handleChange} hint="Tanpa tanda +, contoh: 62853…" />
            <Field name="street_address" label="Alamat Jalan" form={form} onChange={handleChange} />
            <Field name="address_locality" label="Kota" form={form} onChange={handleChange} />
            <Field name="address_region" label="Provinsi" form={form} onChange={handleChange} />
            <Field name="postal_code" label="Kode Pos" form={form} onChange={handleChange} />
            <Field name="address_country" label="Negara" form={form} onChange={handleChange} placeholder="ID" />
          </div>
        </section>

        <section className="card settings-section">
          <h3 className="settings-section__title">Jadwal Ibadah</h3>
          <div className="settings-section__grid">
            <Field name="service_name" label="Nama Ibadah" form={form} onChange={handleChange} />
            <Field name="day_of_week" label="Hari" form={form} onChange={handleChange} placeholder="Sunday" />
            <Field name="opens" label="Mulai" form={form} onChange={handleChange} placeholder="10:00" />
            <Field name="closes" label="Selesai" form={form} onChange={handleChange} placeholder="12:00" />
          </div>
        </section>

        <section className="card settings-section">
          <h3 className="settings-section__title">Sosial Media</h3>
          <div className="settings-section__grid">
            <Field name="instagram" label="Instagram" form={form} onChange={handleChange} placeholder="https://instagram.com/…" />
            <Field name="facebook" label="Facebook" form={form} onChange={handleChange} placeholder="https://facebook.com/…" />
          </div>
        </section>

        <div className="admin-form__actions">
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? 'Menyimpan…' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  )
}
