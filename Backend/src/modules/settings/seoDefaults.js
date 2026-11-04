/**
 * Nilai default Setting SEO (tabel tbl_seo_settings, singleton id=1).
 *
 * SINGLE SOURCE OF TRUTH — dipakai oleh:
 * - modules/settings/settings.controller.js (auto-create baris saat GET /api/seo
 *   bila belum ada, serta nilai awal pada PUT /api/admin/seo)
 * - prisma/seed.js (bootstrap baris saat setup database baru)
 *
 * TIDAK berisi og_image (diisi null / path upload terpisah oleh pemanggil).
 */
const DEFAULT_SEO = {
  site_name: 'GBI Philadelphia Life Center',
  site_name_short: 'GBI PLC',
  site_url: 'https://philadelphialifecenter.com',
  locale: 'id_ID',
  default_title: 'GBI Philadelphia Life Center — Gereja di Yogyakarta',
  default_description:
    'GBI Philadelphia Life Center (GBI PLC) adalah gereja Bethel di Yogyakarta. Ibadah Raya setiap Minggu pukul 10.00 WIB, Saat Teduh harian, materi kotbah, Youth Ministry, dan Life Group.',
  keywords:
    'gereja, GBI, gereja di jogja, gereja di Yogyakarta, gereja di sleman, kotbah, ibadah raya, materi kotbah, saat teduh, GBI PLC, philadelphia life center',
  church_name: 'GBI Philadelphia Life Center',
  church_alternate_name: 'GBI PLC',
  church_description:
    'Gereja Bethel Indonesia (GBI) Philadelphia Life Center di Yogyakarta yang melayani Ibadah Raya, Youth Ministry, dan Life Group.',
  telephone: '+6285336618852',
  whatsapp: '6285336618852',
  street_address: 'Jl. Babarsari No.45, Janti, Caturtunggal, Kec. Depok',
  address_locality: 'Sleman',
  address_region: 'Daerah Istimewa Yogyakarta',
  postal_code: '55281',
  address_country: 'ID',
  service_name: 'Ibadah Raya',
  day_of_week: 'Sunday',
  opens: '10:00',
  closes: '12:00',
  instagram: '',
  facebook: '',
};

export default DEFAULT_SEO;
