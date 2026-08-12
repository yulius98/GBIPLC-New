import { createContext, useContext, useEffect, useState } from 'react'
import api, { MEDIA_URL } from '../api/client'
import defaultSeo from '../config/seo'

/**
 * Petakan baris flat tbl_seo_settings dari API menjadi bentuk config SEO
 * yang dipakai komponen (seperti config/seo.js). Nilai kosong dikembalikan
 * ke default agar situs tetap berfungsi bila setting belum diisi.
 */
function mapToConfig(row = {}) {
  const s = (key) => (row[key] === undefined || row[key] === null ? '' : String(row[key]))
  const ogImage = s('og_image')
  return {
    siteName: s('site_name') || defaultSeo.siteName,
    siteNameShort: s('site_name_short') || defaultSeo.siteNameShort,
    siteUrl: s('site_url') || defaultSeo.siteUrl,
    locale: s('locale') || defaultSeo.locale,
    defaultTitle: s('default_title') || defaultSeo.defaultTitle,
    defaultDescription: s('default_description') || defaultSeo.defaultDescription,
    keywords: s('keywords') || defaultSeo.keywords,
    ogImage: ogImage ? `${MEDIA_URL}/uploads/${ogImage}` : defaultSeo.ogImage,
    church: {
      name: s('church_name') || defaultSeo.church.name,
      alternateName: s('church_alternate_name') || defaultSeo.church.alternateName,
      description: s('church_description') || defaultSeo.church.description,
      telephone: s('telephone') || defaultSeo.church.telephone,
      whatsapp: s('whatsapp') || defaultSeo.church.whatsapp,
      address: {
        streetAddress: s('street_address') || defaultSeo.church.address.streetAddress,
        addressLocality: s('address_locality') || defaultSeo.church.address.addressLocality,
        addressRegion: s('address_region') || defaultSeo.church.address.addressRegion,
        postalCode: s('postal_code') || defaultSeo.church.address.postalCode,
        addressCountry: s('address_country') || defaultSeo.church.address.addressCountry,
      },
      service: {
        name: s('service_name') || defaultSeo.church.service.name,
        dayOfWeek: s('day_of_week') || defaultSeo.church.service.dayOfWeek,
        opens: s('opens') || defaultSeo.church.service.opens,
        closes: s('closes') || defaultSeo.church.service.closes,
      },
      social: {
        instagram: s('instagram'),
        facebook: s('facebook'),
      },
    },
  }
}

const SeoContext = createContext(defaultSeo)

export function SeoProvider({ children }) {
  const [seo, setSeo] = useState(defaultSeo)

  useEffect(() => {
    api
      .get('/seo')
      .then((res) => setSeo(mapToConfig(res.data?.data)))
      .catch(() => {})
  }, [])

  return <SeoContext.Provider value={seo}>{children}</SeoContext.Provider>
}

export function useSeo() {
  return useContext(SeoContext)
}
