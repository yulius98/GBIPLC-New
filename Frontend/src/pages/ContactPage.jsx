import { useMemo } from 'react'
import { useSeo } from '../context/SeoContext'
import useServiceSchedules from '../hooks/useServiceSchedules'
import { useSEO } from '../utils/seo'
import { buildChurchJsonLd } from '../utils/churchJsonLd'

const buildWaLink = (number, message) =>
  `https://wa.me/${number}?text=${encodeURIComponent(message)}`

export default function ContactPage() {
  const seo = useSeo()
  const { schedules, rawSchedules } = useServiceSchedules()
  const church = seo.church

  // Nomor yang ditampilkan: telepon, atau nomor WhatsApp bila telepon kosong
  const displayPhone = church.telephone || (church.whatsapp ? `+${church.whatsapp}` : '')

  const addressQuery = useMemo(() => {
    const a = church.address
    return [a.streetAddress, `${a.addressLocality}, ${a.addressRegion} ${a.postalCode}`]
      .filter(Boolean)
      .join(', ')
  }, [church.address])

  const mapsEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    addressQuery,
  )}&t=&z=16&ie=UTF8&iwloc=&output=embed`

  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    addressQuery,
  )}`

  const waLink = buildWaLink(
    church.whatsapp,
    `Halo, saya ingin bertanya tentang ${church.name}.`,
  )

  // Jadwal dari tabel tbl_service_schedules (fallback ke setting SEO
  // bila tabel masih kosong). Format: "Minggu, 10.00–12.00 WIB"
  const schedule = useMemo(
    () =>
      schedules.map((item) => ({
        label: item.name,
        value: [item.day, item.time && `${item.time} WIB`].filter(Boolean).join(', '),
      })),
    [schedules],
  )

  const contactJsonLd = useMemo(
    () => buildChurchJsonLd(seo, '/kontak', rawSchedules),
    [seo, rawSchedules],
  )

  useSEO({
    path: '/kontak',
    title: 'Kontak & Kunjungan',
    description: `Kunjungi atau hubungi ${church.name} di ${church.address.streetAddress}, ${church.address.addressLocality}. ${
      schedule[0] ? `${schedule[0].label}: ${schedule[0].value}. ` : ''
    }WhatsApp ${displayPhone}.`,
    keywords: seo.keywords,
    jsonLd: contactJsonLd,
  })

  return (
    <div className="contact">
      <section className="contact__hero">
        <span className="section-head__eyebrow">Hubungi Kami</span>
        <h1>Kunjungi {church.name}</h1>
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
                <strong>{church.name}</strong>
                <br />
                {church.address.streetAddress}
                <br />
                {church.address.addressLocality}, {church.address.addressRegion}
                {church.address.postalCode ? ` ${church.address.postalCode}` : ''}
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
              <p className="contact-card__whatsapp">{displayPhone}</p>
              <a
                className="btn btn--primary"
                href={waLink}
                target="_blank"
                rel="noreferrer"
              >
                Chat WhatsApp
              </a>
            </section>

            {schedule.length > 0 && (
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
            )}
          </div>

          <div className="contact__map-card card">
            <iframe
              className="contact__map"
              src={mapsEmbedUrl}
              title={`Peta lokasi ${church.name}`}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
