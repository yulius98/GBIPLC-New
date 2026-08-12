import { useEffect, useState } from 'react'
import api, { MEDIA_URL } from '../api/client'
import { useSeo } from '../context/SeoContext'
import { useSEO } from '../utils/seo'

export default function YouthPage() {
  const seo = useSeo()

  useSEO({
    path: '/youth',
    title: 'Youth Ministry',
    description:
      'Youth Ministry GBI Philadelphia Life Center (GBI PLC) di Yogyakarta — komunitas pemuda gereja yang bertumbuh dalam iman, ibadah, dan persekutuan.',
    keywords: seo.keywords,
  })

  const [programs, setPrograms] = useState([])
  const [schedules, setSchedules] = useState([])
  const [galleries, setGalleries] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/youth/programs').catch(() => null),
      api.get('/youth/schedules').catch(() => null),
      api.get('/youth/galleries').catch(() => null),
    ])
      .then(([p, s, g]) => {
        setPrograms(p?.data?.data || [])
        setSchedules(s?.data?.data || [])
        setGalleries(g?.data?.data || [])
      })
      .catch((err) => setError(err.response?.data?.message || 'Gagal memuat data youth.'))
  }, [])

  const activePrograms = programs.filter((p) => p.is_active !== false)
  const activeSchedules = schedules.filter((s) => s.is_active !== false)

  return (
    <div className="youth">
      <section className="youth__hero">
        <h1>Youth Ministry</h1>
        <p className="muted">
          Bergabunglah dalam komunitas pemuda GBI PLC — bertumbuh dalam iman dan persekutuan.
        </p>
      </section>

      <div className="container container--wide">
        {error && <div className="alert alert--error">{error}</div>}

        {activePrograms.length > 0 && (
          <section className="landing__section">
            <div className="section-head">
              <div>
                <span className="section-head__eyebrow">Apa yang kami kerjakan</span>
                <h2 className="section-title">Program</h2>
              </div>
            </div>
            <div className="youth__programs">
              {activePrograms.map((p) => (
                <article className="card program-card" key={p.id}>
                  <div className="program-card__icon">{p.icon || '✦'}</div>
                  <h3>{p.title}</h3>
                  <p className="muted">{p.frequency}</p>
                  <p>{p.description}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeSchedules.length > 0 && (
          <section className="landing__section">
            <div className="section-head">
              <div>
                <span className="section-head__eyebrow">Kapan & di mana</span>
                <h2 className="section-title">Jadwal</h2>
              </div>
            </div>
            <div className="youth__schedules">
              {activeSchedules.map((s) => (
                <article className="card schedule-card" key={s.id}>
                  <h3>{s.title}</h3>
                  <p className="muted">
                    {s.type === 'special_event' && s.event_date
                      ? new Date(s.event_date).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : s.day_of_week || 'Setiap minggu'}
                    {s.start_time ? ` • ${s.start_time}${s.end_time ? ` - ${s.end_time}` : ''}` : ''}
                  </p>
                  <p>
                    {s.location}
                    {s.location_url && (
                      <>
                        {' '}
                        <a href={s.location_url} target="_blank" rel="noreferrer">
                          (Lihat lokasi)
                        </a>
                      </>
                    )}
                  </p>
                  {s.description && <p className="muted">{s.description}</p>}
                </article>
              ))}
            </div>
          </section>
        )}

        {galleries.length > 0 && (
          <section className="landing__section">
            <div className="section-head">
              <div>
                <span className="section-head__eyebrow">Momen bersama</span>
                <h2 className="section-title">Galeri</h2>
              </div>
            </div>
            <div className="youth__galleries">
              {galleries.map((g) => (
                <figure className="card gallery-card" key={g.id}>
                  {g.type === 'video' ? (
                    <video
                      className="gallery-card__media"
                      src={`${MEDIA_URL}/uploads/${g.file_path}`}
                      poster={g.thumbnail_path ? `${MEDIA_URL}/uploads/${g.thumbnail_path}` : undefined}
                      controls
                      preload="metadata"
                    />
                  ) : (
                    <img
                      className="gallery-card__media"
                      src={`${MEDIA_URL}/uploads/${g.file_path}`}
                      alt={g.title}
                      loading="lazy"
                    />
                  )}
                  <figcaption className="gallery-card__caption">
                    <h3>{g.title}</h3>
                    {g.description && <p className="muted">{g.description}</p>}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        {!error &&
          activePrograms.length === 0 &&
          activeSchedules.length === 0 &&
          galleries.length === 0 && <p className="muted">Belum ada konten youth.</p>}
      </div>
    </div>
  )
}
