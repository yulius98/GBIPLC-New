import { useEffect, useMemo, useState } from 'react'
import api from '../api/client'
import DatePicker from '../components/DatePicker'
import { formatLongDate, isoToKey } from '../utils/date'
import { useSeo } from '../context/SeoContext'
import { useSEO } from '../utils/seo'

function getYouTubeId(url) {
  if (!url) return null
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  )
  return match ? match[1] : null
}

function isPdf(url) {
  return /\.pdf$/i.test(url || '')
}

function uniqueDates(items, field) {
  return [...new Set(items.map((x) => isoToKey(x[field])))]
    .sort()
    .reverse()
}

export default function IbadahRayaPage() {
  const seo = useSeo()
  const [materi, setMateri] = useState([])
  const [ibadah, setIbadah] = useState([])
  const [materiDate, setMateriDate] = useState('')
  const [ibadahDate, setIbadahDate] = useState('')
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/materi-kotbah/available').catch(() => null),
      api.get('/ibadahraya/available').catch(() => null),
    ])
      .then(([m, i]) => {
        setMateri(m?.data?.data || [])
        setIbadah(i?.data?.data || [])
      })
      .catch((err) => setError(err.response?.data?.message || 'Gagal memuat data.'))
  }, [])

  const materiDates = useMemo(() => uniqueDates(materi, 'tgl_kotbah'), [materi])
  const ibadahDates = useMemo(() => uniqueDates(ibadah, 'tgl_ibadah'), [ibadah])

  const eventJsonLd = useMemo(() => {
    const first = ibadah[0]
    if (!first) return null
    return {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: first.ibadah_ke ? `Ibadah Raya ${first.ibadah_ke}` : 'Ibadah Raya',
      startDate: first.tgl_ibadah,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: {
        '@type': 'Place',
        name: seo.church.name,
        address: { '@type': 'PostalAddress', ...seo.church.address },
      },
      url: `${seo.siteUrl}/ibadah-raya`,
      description: 'Ibadah Raya mingguan GBI Philadelphia Life Center di Yogyakarta.',
    }
  }, [ibadah, seo])

  useSEO({
    path: '/ibadah-raya',
    title: 'Ibadah Raya & Materi Kotbah',
    description:
      'Jadwal Ibadah Raya GBI Philadelphia Life Center di Yogyakarta setiap Minggu pukul 10.00 WIB, materi kotbah yang dapat diunduh, dan video rekaman ibadah.',
    keywords: seo.keywords,
    jsonLd: eventJsonLd,
  })

  useEffect(() => {
    if (!materiDate && materiDates.length) setMateriDate(materiDates[0])
    if (!ibadahDate && ibadahDates.length) setIbadahDate(ibadahDates[0])
  }, [materiDates, ibadahDates, materiDate, ibadahDate])

  const materiResults = useMemo(
    () => materi.filter((m) => isoToKey(m.tgl_kotbah) === materiDate),
    [materi, materiDate],
  )

  const ibadahResults = useMemo(
    () => ibadah.filter((x) => isoToKey(x.tgl_ibadah) === ibadahDate),
    [ibadah, ibadahDate],
  )

  function handlePreview(item) {
    if (isPdf(item.materi_kotbah_url)) {
      setPreview(item)
    } else {
      window.open(item.materi_kotbah_url, '_blank', 'noopener')
    }
  }

  return (
    <div className="ibadah-raya">
      <div className="container container--wide">
        <div className="section-head">
          <div>
            <span className="section-head__eyebrow">Persekutuan</span>
            <h1 className="section-title">Ibadah Raya</h1>
          </div>
        </div>

        {error && <div className="alert alert--error">{error}</div>}

        {/* Section 1: Materi Kotbah */}
        <section className="landing__section">
          <div className="section-head">
            <div>
              <span className="section-head__eyebrow">Sumber Bacaan</span>
              <h2 className="section-title">Materi Kotbah</h2>
            </div>
          </div>

          <div className="picker-row">
            <DatePicker
              value={materiDate}
              onChange={setMateriDate}
              highlightDates={materiDates}
              placeholder="Pilih tanggal kotbah"
            />
            {materiDates.length > 0 && (
              <div className="date-chips">
                {materiDates.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`date-chip ${d === materiDate ? 'date-chip--active' : ''}`}
                    onClick={() => setMateriDate(d)}
                  >
                    {formatLongDate(d).split(', ')[1] || formatLongDate(d)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="section-result">
            {materiDate && materiResults.length === 0 && (
              <p className="muted">Tidak ada materi kotbah pada tanggal ini.</p>
            )}
            <div className="materi-list">
              {materiResults.map((m) => (
                <article className="card materi-item" key={m.id}>
                  <div className="materi-item__info">
                    <h3>{m.judul || 'Materi Kotbah'}</h3>
                    <p className="muted">{formatLongDate(m.tgl_kotbah)}</p>
                  </div>
                  <div className="materi-item__actions">
                    <button
                      type="button"
                      className="btn btn--ghost"
                      disabled={!m.materi_kotbah_url}
                      onClick={() => handlePreview(m)}
                    >
                      Lihat
                    </button>
                    <a
                      href={`/api/materi-kotbah/download/${m.id}`}
                      className="btn btn--primary"
                    >
                      Download
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Section 2: Ibadah Raya */}
        <section className="landing__section">
          <div className="section-head">
            <div>
              <span className="section-head__eyebrow">Video Ibadah</span>
              <h2 className="section-title">Ibadah Raya</h2>
            </div>
          </div>

          <div className="picker-row">
            <DatePicker
              value={ibadahDate}
              onChange={setIbadahDate}
              highlightDates={ibadahDates}
              placeholder="Pilih tanggal ibadah"
            />
            {ibadahDates.length > 0 && (
              <div className="date-chips">
                {ibadahDates.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`date-chip ${d === ibadahDate ? 'date-chip--active' : ''}`}
                    onClick={() => setIbadahDate(d)}
                  >
                    {formatLongDate(d).split(', ')[1] || formatLongDate(d)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="section-result">
            {ibadahDate && ibadahResults.length === 0 && (
              <p className="muted">Tidak ada ibadah raya pada tanggal ini.</p>
            )}
            <div className="ibadah-list">
              {ibadahResults.map((x) => {
                const videoId = getYouTubeId(x.link_ibadah)
                return (
                  <article className="card ibadah-card" key={x.id}>
                    <div className="ibadah-card__meta">
                      <h3>
                        Ibadah Raya
                        {x.ibadah_ke ? ` — ${x.ibadah_ke}` : ''}
                      </h3>
                      <p className="muted">{formatLongDate(x.tgl_ibadah)}</p>
                    </div>
                    {videoId ? (
                      <div className="ibadah-raya__video">
                        <iframe
                          src={`https://www.youtube.com/embed/${videoId}`}
                          title="Ibadah Raya"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : x.link_ibadah ? (
                      <div className="ibadah-card__link">
                        <p className="muted">
                          Video tidak bisa diputar langsung di sini.
                        </p>
                        <a
                          href={x.link_ibadah}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn--primary"
                        >
                          Tonton di YouTube
                        </a>
                      </div>
                    ) : (
                      <p className="muted">Belum ada link video untuk ibadah ini.</p>
                    )}
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      </div>

      {/* Modal preview materi kotbah */}
      {preview && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setPreview(null)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__head">
              <h3>{preview.judul || 'Materi Kotbah'}</h3>
              <button
                type="button"
                className="modal__close"
                aria-label="Tutup"
                onClick={() => setPreview(null)}
              >
                ×
              </button>
            </div>
            <div className="modal__body">
              <iframe src={preview.materi_kotbah_url} title="Pratinjau materi kotbah" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
