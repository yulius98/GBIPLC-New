import { useMemo } from 'react'
import { useSeo } from '../context/SeoContext'
import { useSEO } from '../utils/seo'
import { buildChurchJsonLd } from "../utils/churchJsonLd";

export default function ContactPage() {
  const seo = useSeo()

  const addressQuery = useMemo(() => {
    const a = seo.church.address
    return [a.streetAddress, `${a.addressLocality}, ${a.addressRegion} ${a.postalCode}`]
      .filter(Boolean)
      .join(', ')
  }, [seo])

  const mapsEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    addressQuery,
  )}&t=&z=16&ie=UTF8&iwloc=&output=embed`

  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    addressQuery,
  )}`

  const waLink = `https://wa.me/${seo.church.whatsapp}?text=${encodeURIComponent(
    'Halo, saya ingin bertanya tentang GBI Philadelphia Life Center.',
  )}`

  const contactJsonLd = useMemo(() => buildChurchJsonLd(seo, "/kontak"), [seo]);

  useSEO({
    path: '/kontak',
    title: 'Kontak & Kunjungan',
    description: `Kunjungi atau hubungi ${seo.church.name} di ${seo.church.address.streetAddress}, ${seo.church.address.addressLocality}. Ibadah Raya setiap Minggu pukul ${seo.church.service.opens} WIB. WhatsApp ${seo.church.telephone}.`,
    keywords: seo.keywords,
    jsonLd: contactJsonLd,
  })

  const schedule = [
    { label: 'Ibadah Raya', value: 'Minggu, 10.00 WIB' },
    { label: 'Youth Ministry', value: 'Sabtu, 16.00 WIB' },
    { label: 'Sekolah Minggu', value: 'Minggu, 10.00 WIB' },
  ]

  return (
    <div className="contact">
      <section className="contact__hero">
        <span className="section-head__eyebrow">Hubungi Kami</span>
        <h1>Kunjungi GBI Philadelphia Life Center</h1>
        <p className="muted">
          Kami senang menyambut Anda dan keluarga. Datanglah ke ibadah raya atau
          hubungi kami melalui WhatsApp — kami siap melayani.
        </p>
      </section>

      <div className="container container--wide">
        <div className="contact__grid">
          <div className="contact__info">
            <section className="card contact-card">
              <h2>Alamat Gereja</h2>
              <p className="contact-card__address">
                <strong>{seo.church.name}</strong>
                <br />
                {seo.church.address.streetAddress}
                <br />
                {seo.church.address.addressLocality},{" "}
                {seo.church.address.addressRegion}
                {seo.church.address.postalCode
                  ? ` ${seo.church.address.postalCode}`
                  : ""}
              </p>
              <a
                className="btn btn--ghost contact-card__maps"
                href={mapsLink}
                target="_blank"
                rel="noreferrer"
              >
                Lihat di Google Maps
              </a>
            </section>

            <section className="card contact-card">
              <h2>WhatsApp</h2>
              <p className="contact-card__whatsapp">{seo.church.telephone}</p>
              <a
                className="btn btn--primary"
                href={waLink}
                target="_blank"
                rel="noreferrer"
              >
                Chat WhatsApp
              </a>
            </section>

            <section className="card contact-card">
              <h2>Jadwal Ibadah</h2>
              <dl className="contact-card__rows">
                {schedule.map((row) => (
                  <div className="contact-card__row" key={row.label}>
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="card contact-card">
              <h2>Konsultasi / Pelayanan</h2>
              <p className="contact-card__text">
                Butuh dukungan doa, konseling, atau ingin bergabung dalam
                pelayanan? Tim pelayanan kami siap membantu Anda pada jam kerja
                gereja.
              </p>
              <a
                className="btn btn--primary"
                href={waLink}
                target="_blank"
                rel="noreferrer"
              >
                Kirim Pesan
              </a>
            </section>
          </div>

          <div className="contact__map-card card">
            <iframe
              className="contact__map"
              src={mapsEmbedUrl}
              title={`Peta lokasi ${seo.church.name}`}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </div>
  );
}