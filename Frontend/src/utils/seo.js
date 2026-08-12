import { useEffect } from 'react'
import { useSeo } from '../context/SeoContext'

function upsertMeta(attr, key, content) {
  const selector = `meta[${attr}="${key}"]`
  if (!content) {
    document.head.querySelector(selector)?.remove()
    return
  }
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertCanonical(href) {
  let link = document.head.querySelector('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', href)
}

/**
 * Kelola tag SEO per halaman (SPA): title, description, keywords, canonical,
 * robots, Open Graph / Twitter Card, dan JSON-LD.
 */
export function useSEO({
  title,
  description,
  keywords,
  path = '/',
  jsonLd = null,
  noindex = false,
} = {}) {
  const seo = useSeo()
  useEffect(() => {
    const fullTitle = title
      ? title.includes(seo.siteName)
        ? title
        : `${title} | ${seo.siteName}`
      : seo.siteName
    const desc = description || seo.defaultDescription
    const canonicalUrl = new URL(path, seo.siteUrl).href
    const ogImage = seo.ogImage || `${seo.siteUrl}/favicon.svg`

    document.title = fullTitle

    upsertMeta('name', 'description', desc)
    upsertMeta('name', 'keywords', keywords)
    upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow')

    upsertCanonical(canonicalUrl)

    upsertMeta('property', 'og:title', fullTitle)
    upsertMeta('property', 'og:description', desc)
    upsertMeta('property', 'og:type', 'website')
    upsertMeta('property', 'og:url', canonicalUrl)
    upsertMeta('property', 'og:site_name', seo.siteName)
    upsertMeta('property', 'og:locale', seo.locale)
    upsertMeta('property', 'og:image', ogImage)

    upsertMeta('name', 'twitter:card', 'summary')
    upsertMeta('name', 'twitter:title', fullTitle)
    upsertMeta('name', 'twitter:description', desc)

    if (jsonLd) {
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.dataset.seoJsonLd = 'true'
      script.textContent = JSON.stringify(jsonLd)
      document.head.appendChild(script)
    }

    return () => {
      document.head
        .querySelectorAll('script[data-seo-jsonld]')
        .forEach((el) => el.remove())
    }
  }, [title, description, keywords, path, jsonLd, noindex, seo])
}
