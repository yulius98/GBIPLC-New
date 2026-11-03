import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSeo } from '../context/SeoContext'

/**
 * Floating Action Button (FAB) Google Map.
 * Tombol bulat melayang di pojok kanan bawah (di atas FAB WhatsApp) dan
 * tetap terlihat saat halaman di-scroll (position: fixed).
 *
 * Klik -> tampilkan map lokasi gereja dalam modal (embed Google Maps,
 * tanpa API key). Alamat diambil dari tabel database tbl_seo_settings
 * (field street_address, address_locality, address_region, postal_code,
 * address_country) lewat SeoContext -> GET /api/seo.
 */
function buildAddress(church = {}) {
  const a = church.address ?? {}
  return [
    a.streetAddress,
    a.addressLocality,
    a.addressRegion,
    a.postalCode,
    a.addressCountry,
  ]
    .filter((part) => part && String(part).trim())
    .join(', ')
}

export default function MapFab() {
  const seo = useSeo()
  const [open, setOpen] = useState(false)
  const church = seo.church
  const fullAddress = buildAddress(church)

  // Tutup modal dengan tombol Escape + kunci scroll body saat terbuka
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  if (!fullAddress) return null

  const mapsQuery = encodeURIComponent(
    [church.name, fullAddress].filter(Boolean).join(' ')
  )
  const embedUrl = `https://www.google.com/maps?q=${mapsQuery}&output=embed&hl=id`
  const externalUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`

  return (
    <>
      <button
        type="button"
        className="map-fab"
        aria-label="Lihat lokasi gereja di peta"
        title="Lihat lokasi gereja di peta"
        onClick={() => setOpen(true)}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2C8.13 2 5 5.13 5 8.99 5 14.24 12 22 12 22s7-7.76 7-13.01C19 5.13 15.87 2 12 2Zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5Z" />
        </svg>
      </button>

      {open &&
        createPortal(
          <div className="modal-overlay" onClick={() => setOpen(false)}>
            <div
              className="modal map-modal"
              role="dialog"
              aria-modal="true"
              aria-label={`Lokasi ${church.name}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal__head">
                <h3>Lokasi {church.name}</h3>
                <button
                  type="button"
                  className="modal__close"
                  onClick={() => setOpen(false)}
                  aria-label="Tutup"
                >
                  ×
                </button>
              </div>
              <div className="map-modal__body">
                <iframe
                  src={embedUrl}
                  title={`Peta lokasi ${church.name}`}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="map-modal__foot">
                <span className="map-modal__address">{fullAddress}</span>
                <a
                  href={externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn--primary"
                >
                  Buka di Google Maps
                </a>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
