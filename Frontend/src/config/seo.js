// Konfigurasi SEO terpusat untuk GBI Philadelphia Life Center.
// Ubah nilai di file ini bila ada data resmi (mis. domain, sosmed) yang baru.

const seo = {
  siteName: 'GBI Philadelphia Life Center',
  siteNameShort: 'GBI PLC',
  // Sementara pakai devprox.my.id selama philadelphialifecenter.com belum aktif.
  // Ganti balik ke domain asli + setup redirect saat sudah live lagi.
  siteUrl: 'https://philadelphialifecenter.devprox.my.id',
  locale: 'id_ID',
  defaultTitle: 'GBI Philadelphia Life Center — Gereja di Yogyakarta',
  defaultDescription:
    'GBI Philadelphia Life Center (GBI PLC) adalah gereja Bethel di Yogyakarta. Ibadah Raya setiap Minggu pukul 10.00 WIB, Saat Teduh harian, materi kotbah, Youth Ministry, dan Life Group.',
  keywords:
    'gereja, GBI, gereja di jogja, gereja di Yogyakarta, gereja di sleman, kotbah, ibadah raya, materi kotbah, saat teduh, GBI PLC, philadelphia life center',
  // Gambar Open Graph (relatif /uploads/...). Kosong = pakai favicon.svg.
  ogImage: '',

  church: {
    name: 'GBI Philadelphia Life Center',
    alternateName: 'GBI PLC',
    description:
      'Gereja Bethel Indonesia (GBI) Philadelphia Life Center di Yogyakarta yang melayani Ibadah Raya, Youth Ministry, dan Life Group.',
    telephone: '+6285336618852',
    whatsapp: '6285336618852',
    address: {
      streetAddress: 'Jl. Babarsari No.45, Janti, Caturtunggal, Kec. Depok',
      addressLocality: 'Sleman',
      addressRegion: 'Daerah Istimewa Yogyakarta',
      postalCode: '55281',
      addressCountry: 'ID',
    },
    service: {
      name: 'Ibadah Raya',
      dayOfWeek: 'Sunday',
      opens: '10:00',
      closes: '12:00',
    },
    // Isi saat akun resmi tersedia; dikosongkan agar link palsu tidak ter-embuat.
    social: {
      instagram: '',
      facebook: '',
    },
  },
}

export default seo
