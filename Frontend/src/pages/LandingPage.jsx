import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { MEDIA_URL } from '../api/client'
import { useSeo } from '../context/SeoContext'
import useServiceSchedules from '../hooks/useServiceSchedules'
import useTentang from '../hooks/useTentang'
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
  const { rawSchedules } = useServiceSchedules();
  const { tentang, pelayanan, loading: pelayananLoading } = useTentang();

  const churchJsonLd = useMemo(
    () => buildChurchJsonLd(seo, "/", rawSchedules),
    [seo, rawSchedules],
  );

  useSEO({
    path: "/",
    title: seo.defaultTitle,
    description: seo.defaultDescription,
    keywords: seo.keywords,
    jsonLd: churchJsonLd,
  });

  const [carousel, setCarousel] = useState([]);
  const [pastorNote, setPastorNote] = useState(null);
  const [noteUnavailable, setNoteUnavailable] = useState(false);
  const [events, setEvents] = useState([]);
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

    // Saat Teduh: tabel kosong memang dibalas backend dengan 404 (normal),
    // sedangkan kegagalan non-404 (mis. backend sedang restart saat dev dengan
    // node --watch) dicoba ulang beberapa kali dulu; kalau tetap gagal,
    // tampilkan pesan santai, bukan error.
    let cancelled = false;
    const timers = [];
    const delays = [0, 1500, 4000];

    const loadPastorNote = (attempt = 0) => {
      api
        .get("/pastornote")
        .then((res) => {
          if (!cancelled) setPastorNote(res.data.data || null);
        })
        .catch((err) => {
          if (cancelled) return;
          if (err.response?.status === 404) return; // memang belum ada data
          if (attempt + 1 < delays.length) {
            timers.push(setTimeout(() => loadPastorNote(attempt + 1), delays[attempt + 1]));
            return;
          }
          setNoteUnavailable(true);
        });
    };

    loadPastorNote();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  // Rotasi slide ditangani internal oleh komponen HeroCarousel.

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
            <p className="muted">
              {noteUnavailable
                ? "Saat teduh belum tersedia, coba muat ulang halaman."
                : "Belum ada saat teduh."}
            </p>
          )}
        </section>

        {/* Section 3: Pelayanan Kami — data tbl_tentang_kami_pelayanan via /api/tentang */}
        {!pelayananLoading && pelayanan.length > 0 && (
          <section className="landing__section">
            <div className="section-head">
              <div>
                <span className="section-head__eyebrow">Pelayanan Kami</span>
                <h2 className="section-title">
                  {tentang.pelayanan_judul || "Yang Kami Lakukan Bersama"}
                </h2>
              </div>
              <Link to="/tentang" className="btn btn--soft">
                Lihat Semua
              </Link>
            </div>
            <div className="youth__programs">
              {pelayanan.map((m) => (
                <article className="card program-card" key={m.id ?? m.judul}>
                  <div className="program-card__icon">{m.icon}</div>
                  <h3>{m.judul}</h3>
                  <p className="muted">{m.frekuensi}</p>
                  <p>{m.deskripsi}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Section 4: Event Gereja */}
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
