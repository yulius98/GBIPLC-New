import { useEffect, useState } from 'react'
import api, { MEDIA_URL } from '../api/client'
import { useSeo } from '../context/SeoContext'
import { useSEO } from '../utils/seo'
import { buildChurchJsonLd } from "../utils/churchJsonLd";
import HeroCarousel from "../components/HeroCarousel";

function formatDate(value) {
  return new Date(value).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function LandingPage() {
  const seo = useSeo();

  useSEO({
    path: "/",
    title: seo.defaultTitle,
    description: seo.defaultDescription,
    keywords: seo.keywords,
    jsonLd: buildChurchJsonLd(seo),
  });

  const [carousel, setCarousel] = useState([]);
  const [pastorNote, setPastorNote] = useState(null);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  // const [slide, setSlide] = useState(0)

  useEffect(() => {
    api
      .get("/carousel")
      .then((res) => setCarousel(res.data.data || []))
      .catch(() => {});

    api
      .get("/event")
      .then((res) => setEvents(res.data.data || []))
      .catch(() => {});

    api
      .get("/pastornote")
      .then((res) => setPastorNote(res.data.data || null))
      .catch((err) => {
        if (err.response?.status !== 404) {
          setError(err.response?.data?.message || "Gagal memuat saat teduh.");
        }
      });
  }, []);

  useEffect(() => {
    if (carousel.length <= 1) return;
    const timer = setInterval(
      () => setSlide((s) => (s + 1) % carousel.length),
      5000,
    );
    return () => clearInterval(timer);
  }, [carousel.length]);

  return (
    <div className="landing">
      <h1 className="visually-hidden">{seo.siteName}</h1>
      {/* Section 1: Carousel (hero full-width) */}
      {carousel.length > 0 ? (
        <HeroCarousel
          slides={carousel
            .filter((item) => item.filename)
            .map((item) => ({
              id: item.id,
              title: item.tema,
              description: item.description,
              image: `${MEDIA_URL}/uploads/${item.filename}`,
            }))}
        />
      ) : (
        <section className="hero-slider hero-slider--landing">
          <div className="slide slide--active slide__caption">
            <h1>Selamat datang di GBI PLC</h1>
            <p>Gereja Bethel Indonesia Philadelphia Life Center</p>
          </div>
        </section>
      )}

      <div className="container container--wide">
        {error && <div className="alert alert--error">{error}</div>}

        {/* Section 2: Saat Teduh */}
        <section className="landing__section">
          <div className="section-head">
            <div>
              <span className="section-head__eyebrow">Renungan</span>
              <h2 className="section-title">
                Saat Teduh{" "}
                {pastorNote?.tgl_note
                  ? `— ${formatDate(pastorNote.tgl_note)}`
                  : ""}
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
                    {ev.isi_event && (
                      <p className="event-card__desc">{ev.isi_event}</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
