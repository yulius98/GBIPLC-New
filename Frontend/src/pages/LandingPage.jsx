import { useEffect, useState } from 'react'
import api, { MEDIA_URL } from '../api/client'
import { useSeo } from '../context/SeoContext'
import { useSEO } from '../utils/seo'

function formatDate(value) {
  return new Date(value).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function LandingPage() {
  const seo = useSeo()

  useSEO({
    path: '/',
    title: seo.defaultTitle,
    description: seo.defaultDescription,
    keywords: seo.keywords,
  })

  const [carousel, setCarousel] = useState([])
  const [pastorNote, setPastorNote] = useState(null)
  const [events, setEvents] = useState([])
  const [error, setError] = useState('')
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    api
      .get('/carousel')
      .then((res) => setCarousel(res.data.data || []))
      .catch(() => {})

    api
      .get('/event')
      .then((res) => setEvents(res.data.data || []))
      .catch(() => {})

    api
      .get('/pastornote')
      .then((res) => setPastorNote(res.data.data || null))
      .catch((err) => {
        if (err.response?.status !== 404) {
          setError(err.response?.data?.message || 'Gagal memuat saat teduh.')
        }
      })
  }, [])

  useEffect(() => {
    if (carousel.length <= 1) return
    const timer = setInterval(() => setSlide((s) => (s + 1) % carousel.length), 5000)
    return () => clearInterval(timer)
  }, [carousel.length])

  return (
    <div className="landing">
      {/* Section 1: Carousel (hero full-width) */}
      <section className="hero-slider hero-slider--landing">
        {carousel.length > 0 ? (
          carousel.map((item, i) => (
            <div key={item.id} className={`slide ${i === slide ? 'slide--active' : ''}`}>
              {item.filename && (
                <img src={`${MEDIA_URL}/uploads/${item.filename}`} alt={item.tema} />
              )}
              <div className="slide__caption">
                <h1>{item.tema}</h1>
                {item.description && <p>{item.description}</p>}
              </div>
            </div>
          ))
        ) : (
          <div className="slide slide--active slide__caption">
            <h1>Selamat datang di GBI PLC</h1>
            <p>Gereja Bethel Indonesia Philadelphia Life Center</p>
          </div>
        )}
        {carousel.length > 1 && (
          <div className="slider__dots">
            {carousel.map((item, i) => (
              <button
                key={item.id}
                type="button"
                className={`slider__dot ${i === slide ? 'slider__dot--active' : ''}`}
                aria-label={`Slide ${i + 1}`}
                onClick={() => setSlide(i)}
              />
            ))}
          </div>
        )}
      </section>

      <div className="container container--wide">
        {error && <div className="alert alert--error">{error}</div>}

        {/* Tentang gereja (SEO & NAP) */}
        <section className="landing__section landing__intro">
          <div className="section-head">
            <div>
              <span className="section-head__eyebrow">Selamat datang</span>
              <h2 className="section-title">Gereja di Yogyakarta untuk Keluarga Anda</h2>
            </div>
          </div>
          <div className="intro-grid">
            <article className="card intro-card">
              <h3>{seo.church.name}</h3>
              <p>
                GBI Philadelphia Life Center (GBI PLC) adalah gereja Bethel di Yogyakarta yang
                terbuka bagi setiap keluarga. Kami merayakan{' '}
                <strong>Ibadah Raya setiap Minggu pukul 10.00 WIB</strong>, membagikan{' '}
                <strong>materi kotbah</strong> dan renungan <strong>Saat Teduh</strong> harian,
                serta melayani generasi muda lewat Youth Ministry dan persekutuan Life Group.
              </p>
            </article>
            <article className="card intro-card">
              <h3>Kunjungi Kami</h3>
              <p>{seo.church.address.streetAddress}</p>
              <p>
                {seo.church.address.addressLocality}, {seo.church.address.addressRegion}{' '}
                {seo.church.address.postalCode}
              </p>
              <p>
                WhatsApp:{' '}
                <a href={`https://wa.me/${seo.church.whatsapp}`} target="_blank" rel="noreferrer">
                  +62 853-3661-8852
                </a>
              </p>
            </article>
          </div>
        </section>

        {/* Section 2: Saat Teduh */}
        <section className="landing__section">
          <div className="section-head">
            <div>
              <span className="section-head__eyebrow">Renungan</span>
              <h2 className="section-title">
                Saat Teduh {pastorNote?.tgl_note ? `— ${formatDate(pastorNote.tgl_note)}` : ''}
              </h2>
            </div>
          </div>
          {pastorNote ? (
            <article className="card pastor-note">
              {pastorNote.image_kotbah_url && (
                <img
                  src={pastorNote.image_kotbah_url}
                  alt="Saat Teduh"
                  className="pastor-note__image"
                />
              )}
              <p className="pastor-note__body">{pastorNote.note}</p>
            </article>
          ) : (
            !error && <p className="muted">Belum ada saat teduh.</p>
          )}
        </section>

        {/* Section 3: Event Gereja */}
        <section className="landing__section">
          <div className="section-head">
            <div>
              <span className="section-head__eyebrow">Agenda</span>
              <h2 className="section-title">Event Gereja</h2>
            </div>
          </div>
          {events.length === 0 ? (
            <p className="muted">Belum ada event untuk bulan ini.</p>
          ) : (
            <div className="event-grid">
              {events.map((ev) => (
                <article className="card event-card" key={ev.id}>
                  {ev.filename && (
                    <div className="event-card__media">
                      <img
                        src={`${MEDIA_URL}/uploads/${ev.filename}`}
                        alt={ev.keterangan}
                        className="event-card__image"
                      />
                      {ev.tgl_event && (
                        <span className="event-card__date">
                          {formatDate(ev.tgl_event)}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="event-card__body">
                    <h3>{ev.keterangan}</h3>
                    {ev.isi_event && <p className="event-card__desc">{ev.isi_event}</p>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
