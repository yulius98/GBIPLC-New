import { useEffect, useState } from 'react'
import api from '../api/client'
import { useSeo } from '../context/SeoContext'
import { useSEO } from '../utils/seo'

function PassageCard({ title, passage }) {
  if (!passage || !passage.data) {
    return (
      <article className="card passage-card">
        <h3>{title}</h3>
        <p className="muted">Tidak ada bacaan untuk hari ini.</p>
      </article>
    )
  }

  const { reference, audioUrl = [], content = [] } = passage.data

  return (
    <article className="card passage-card">
      <div className="passage-card__head">
        <div>
          <h3>{title}</h3>
          <p className="muted">{reference}</p>
        </div>
      </div>

      {audioUrl.length > 0 && (
        <div className="passage-card__audio">
          {audioUrl.map((url) => (
            <audio key={url} controls preload="none" src={url}>
              Audio tidak didukung browser Anda.
            </audio>
          ))}
        </div>
      )}

      {content.length > 0 ? (
        <ol className="verse-list">
          {content.map((v) => (
            <li className="verse-item" key={v.verse}>
              <span className="verse-item__num">{v.verse}</span>
              <span className="verse-item__text">{v.text}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="muted">Isi bacaan sedang disiapkan.</p>
      )}
    </article>
  )
}

export default function GemarAlkitabPage() {
  const seo = useSeo()
  const [reading, setReading] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useSEO({
    path: '/gemar-alkitab',
    title: 'Gemar Alkitab',
    description:
      'Bacaan Alkitab harian pagi dan malam untuk jemaat GBI Philadelphia Life Center (GBI PLC).',
    keywords: seo.keywords,
  })

  async function load() {
    try {
      const res = await api.get('/reading/today')
      setReading(res.data)
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat bacaan hari ini.')
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleStartToday() {
    setSaving(true)
    setError('')
    try {
      const today = new Date().toISOString().slice(0, 10)
      await api.put('/reading/start-date', { start_date: today })
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengatur tanggal mulai bacaan.')
    } finally {
      setSaving(false)
    }
  }

  const progress = reading?.progress || null
  const progressPct = progress?.total_days
    ? Math.min(100, Math.round(((progress.current_day - 1) / progress.total_days) * 100))
    : 0

  return (
    <div className="reading">
      <section className="reading__hero">
        <span className="section-head__eyebrow">Bacaan Harian</span>
        <h1>Gemar Alkitab</h1>
        <p className="muted">
          {reading?.date || 'Bacaan pagi dan malam'} — biasakan membaca firman Tuhan setiap hari.
        </p>
      </section>

      <div className="container container--wide">
        {error && <div className="alert alert--error">{error}</div>}

        {progress && (
          <section className="card reading__progress">
            <div className="reading__progress-info">
              <span className="reading__progress-label">
                Hari ke-{progress.current_day} dari {progress.total_days}
              </span>
              <span className="reading__progress-pct">{progressPct}%</span>
            </div>
            <div className="reading__progress-bar">
              <div className="reading__progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </section>
        )}

        <div className="reading__tools">
          <button type="button" className="btn btn--soft" onClick={handleStartToday} disabled={saving}>
            {saving ? 'Menyimpan…' : 'Mulai Bacaan dari Hari Ini'}
          </button>
        </div>

        <section className="landing__section">
          <div className="section-head">
            <div>
              <span className="section-head__eyebrow">Renungan Pagi</span>
              <h2 className="section-title">Bacaan Pagi</h2>
            </div>
          </div>
          <PassageCard title="Bacaan Pagi" passage={reading?.morning} />
        </section>

        <section className="landing__section">
          <div className="section-head">
            <div>
              <span className="section-head__eyebrow">Renungan Malam</span>
              <h2 className="section-title">Bacaan Malam</h2>
            </div>
          </div>
          <PassageCard title="Bacaan Malam" passage={reading?.evening} />
        </section>
      </div>
    </div>
  )
}