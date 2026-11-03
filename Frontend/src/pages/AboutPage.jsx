import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useSeo } from "../context/SeoContext";
import useTentang from "../hooks/useTentang";
import { useSEO } from "../utils/seo";

/**
 * Halaman publik /tentang.
 *
 * Seluruh konten (judul, sub judul, paragraf, kartu pelayanan) diambil dari
 * tabel tbl_tentang_kami + tbl_tentang_kami_pelayanan via API /api/tentang
 * (dikelola di Admin → Setting → card "Tentang Kami") — tidak ada hardcode.
 * Metadata SEO tetap dari Setting SEO (tbl_seo_settings).
 */
export default function AboutPage() {
  const seo = useSeo();
  const { tentang, pelayanan } = useTentang();

  const churchJsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "Church",
      name: seo.church.name,
      alternateName: seo.church.alternateName,
      description: tentang.lede || seo.church.description,
      url: `${seo.siteUrl}/tentang`,
      telephone: seo.church.telephone,
      address: {
        "@type": "PostalAddress",
        ...seo.church.address,
      },
      openingHoursSpecification: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: seo.church.service.dayOfWeek,
        opens: seo.church.service.opens,
        closes: seo.church.service.closes,
      },
    }),
    [seo, tentang.lede],
  );

  useSEO({
    path: "/tentang",
    title: "Tentang Kami",
    description: `Tentang ${seo.church.name} (${seo.church.alternateName}) — ${
      tentang.lede || seo.church.description
    }`,
    keywords: seo.keywords,
    jsonLd: churchJsonLd,
  });

  return (
    <div className="about">
      <section className="about__hero">
        <span className="section-head__eyebrow">Tentang Kami</span>
        <h1>{tentang.judul}</h1>
        <p className="muted">{tentang.sub_judul}</p>
      </section>

      <div className="container container--wide">
        <section className="landing__section">
          <div className="section-head">
            <div>
              <span className="section-head__eyebrow">Siapa Kami</span>
              <h2 className="section-title">{tentang.selayang_judul}</h2>
            </div>
          </div>
          <p className="about__lede">{tentang.lede}</p>
          <p className="about__text">{tentang.paragraf_1}</p>
          <p className="about__text">{tentang.paragraf_2}</p>
          <div className="about__actions">
            <Link to="/kontak" className="btn btn--primary">
              Kunjungi Kami
            </Link>
            <Link to="/register" className="btn btn--soft">
              Bergabung dengan Kami
            </Link>
          </div>
        </section>

        <section className="landing__section">
          <div className="section-head">
            <div>
              <span className="section-head__eyebrow">Pelayanan</span>
              <h2 className="section-title">{tentang.pelayanan_judul}</h2>
            </div>
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
      </div>
    </div>
  );
}
