/**
 * Generate JSON-LD structured data (Schema.org Church) dari objek seo
 * yang didapat dari useSeo(). Pakai di halaman mana saja lewat:
 *
 *   const churchJsonLd = useMemo(
 *     () => buildChurchJsonLd(seo, '/kontak', rawSchedules),
 *     [seo, rawSchedules],
 *   )
 *   useSEO({ ..., jsonLd: churchJsonLd })
 *
 * Bungkus dengan useMemo() di komponen pemanggil supaya tidak generate
 * objek baru tiap render (lihat pola di IbadahRayaPage.jsx / AboutPage.jsx).
 *
 * Referensi schema: https://schema.org/Church
 *
 * @param {object} seo - hasil useSeo()
 * @param {string} path - path halaman ini dipasang, dipakai untuk field "url"
 * @param {Array} [schedules] - baris jadwal ibadah dari useServiceSchedules()
 *   (rawSchedules: { service_name, day_of_week, opens, closes }). Bila diisi,
 *   field openingHoursSpecification berisi array semua jadwal dari tabel
 *   tbl_service_schedules (format waktu asli DB, cth "10:00"); bila tidak,
 *   fallback ke satu jadwal dari setting SEO single-row.
 */
export function buildChurchJsonLd(seo, path = '/', schedules = null) {
  const c = seo.church
  if (!c) return null

  const sameAs = [c.social?.instagram, c.social?.facebook].filter(Boolean)

  // Baris jadwal: dari tbl_service_schedules, atau fallback setting SEO single-row
  const rows = Array.isArray(schedules)
    ? schedules
    : c.service?.dayOfWeek && c.service?.opens
      ? [
          {
            service_name: c.service.name,
            day_of_week: c.service.dayOfWeek,
            opens: c.service.opens,
            closes: c.service.closes,
          },
        ]
      : []

  const openingHoursSpecification = rows
    .filter((s) => s.day_of_week && s.opens)
    .map((s) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: s.day_of_week,
      opens: s.opens,
      ...(s.closes ? { closes: s.closes } : {}),
    }))

  return {
    '@context': 'https://schema.org',
    '@type': 'Church',
    name: c.name,
    alternateName: c.alternateName || undefined,
    description: c.description,
    url: `${seo.siteUrl}${path}`,
    telephone: c.telephone || undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: c.address?.streetAddress,
      addressLocality: c.address?.addressLocality,
      addressRegion: c.address?.addressRegion,
      postalCode: c.address?.postalCode,
      addressCountry: c.address?.addressCountry,
    },
    ...(openingHoursSpecification.length > 0
      ? { openingHoursSpecification }
      : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  }
}