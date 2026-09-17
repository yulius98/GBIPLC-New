import { Link } from 'react-router-dom'
import { useSeo } from '../context/SeoContext'
import { useSEO } from '../utils/seo'

const ministries = [
  {
    icon: 'IR',
    title: 'Ibadah Raya',
    frequency: 'Setiap Minggu, 10.00 WIB',
    description:
      'Perayaan bersama keluarga besar GBI PLC — menyembah Tuhan, mendengarkan kotbah, dan bertumbuh dalam iman.',
  },
  {
    icon: 'ST',
    title: 'Materi Kotbah & Saat Teduh',
    frequency: 'Mingguan & Harian',
    description:
      'Dapatkan materi kotbah mingguan dan renungan Saat Teduh harian untuk memperdalam perjalanan rohani Anda.',
  },
  {
    icon: 'YM',
    title: 'Youth Ministry',
    frequency: 'Sabtu, 16.00 WIB',
    description:
      'Wadah bagi generasi muda untuk bertumbuh dalam iman, persekutuan, dan pelayanan.',
  },
  {
    icon: 'LG',
    title: 'Life Group',
    frequency: 'Terjadwal',
    description:
      'Persekutuan kecil antar keluarga agar setiap anggota saling menguatkan dan bertumbuh bersama.',
  },
]

export default function AboutPage() {
  const seo = useSeo()

  const churchJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Church',
    name: seo.church.name,
    alternateName: seo.church.alternateName,
    description: seo.church.description,
    url: `${seo.siteUrl}/tentang`,
    telephone: seo.church.telephone,
    address: {
      '@type': 'PostalAddress',
      ...seo.church.address,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: seo.church.service.dayOfWeek,
      opens: seo.church.service.opens,
      closes: seo.church.service.closes,
    },
  }

  useSEO({
    path: '/tentang',
    title: 'Tentang Kami',
    description: `Tentang ${seo.church.name} (GBI PLC) — gereja Bethel di Yogyakarta untuk keluarga. Ibadah Raya setiap Minggu pukul 10.00 WIB, materi kotbah, Saat Teduh, Youth Ministry, dan Life Group.`,
    keywords: seo.keywords,
    jsonLd: churchJsonLd,
  })

  return (
    <div className="about">
      <section className="about__hero">
        <span className="section-head__eyebrow">Tentang Kami</span>
        <h1>Mengenal GBI Philadelphia Life Center</h1>
        <p className="muted">
          Gereja Bethel di Yogyakarta yang terbuka bagi setiap keluarga untuk bertumbuh
          dalam iman dan kasih Kristus.
        </p>
      </section>

      <div className="container container--wide">
        <section className="landing__section">
          <div className="section-head">
            <div>
              <span className="section-head__eyebrow">Siapa Kami</span>
              <h2 className="section-title">Sebuah Keluarga Iman di Jantung Yogyakarta</h2>
            </div>
          </div>
          <p className="about__lede">{seo.church.description}</p>
          <p className="about__text">
            GBI Philadelphia Life Center (GBI PLC) adalah gereja Bethel di Yogyakarta yang
            terbuka bagi setiap keluarga. Kami merayakan{' '}
            <strong>Ibadah Raya setiap Minggu pukul 10.00 WIB</strong>, membagikan{' '}
            <strong>materi kotbah</strong> dan renungan <strong>Saat Teduh</strong> harian,
            serta melayani generasi muda lewat Youth Ministry dan persekutuan Life Group.
          </p>
          <p className="about__text">
            Kami percaya gereja adalah rumah — tempat setiap orang disambut, diperlengkapi,
            dan dikirim untuk menjadi berkat bagi Yogyakarta. Apapun tahap hidup Anda, ada
            tempat bagi Anda dalam keluarga GBI PLC.
          </p>
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
              <h2 className="section-title">Yang Kami Lakukan Bersama</h2>
            </div>
          </div>
          <div className="youth__programs">
            {ministries.map((m) => (
              <article className="card program-card" key={m.title}>
                <div className="program-card__icon">{m.icon}</div>
                <h3>{m.title}</h3>
                <p className="muted">{m.frequency}</p>
                <p>{m.description}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}