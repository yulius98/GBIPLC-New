/**
 * Generate JSON-LD structured data (Schema.org Church) dari objek seo
 * yang didapat dari useSeo(). Pakai di halaman mana saja lewat:
 *
 *   const churchJsonLd = useMemo(() => buildChurchJsonLd(seo, '/kontak'), [seo])
 *   useSEO({ ..., jsonLd: churchJsonLd })
 *
 * Bungkus dengan useMemo() di komponen pemanggil supaya tidak generate
 * objek baru tiap render (lihat pola di IbadahRayaPage.jsx / AboutPage.jsx).
 *
 * Referensi schema: https://schema.org/Church
 *
 * @param {object} seo - hasil useSeo()
 * @param {string} path - path halaman ini dipasang, dipakai untuk field "url"
 */
export function buildChurchJsonLd(seo, path = '/') {
  const c = seo.church
  if (!c) return null

  const sameAs = [c.social?.instagram, c.social?.facebook].filter(Boolean)

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
    ...(c.service?.dayOfWeek
      ? {
          openingHoursSpecification: {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: c.service.dayOfWeek,
            opens: c.service.opens,
            closes: c.service.closes,
          },
        }
      : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  }
}