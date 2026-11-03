import { useSeo } from '../context/SeoContext'

/**
 * Floating Action Button (FAB) WhatsApp.
 * Tombol bulat melayang di pojok kanan bawah layar dan tetap terlihat
 * saat halaman di-scroll (position: fixed).
 *
 * Nomor tujuan diambil dari tabel database tbl_seo_settings
 * (field "telephone") lewat SeoContext -> GET /api/seo.
 *
 * Link wa.me hanya menerima digit internasional tanpa "+", maka
 * nomor telepon disanitasi: buang semua non-digit, dan "0" awal
 * (format lokal) diganti prefix 62 (Indonesia).
 */
function toWhatsAppNumber(raw = '') {
  const digits = String(raw).replace(/\D/g, '')
  if (!digits) return ''
  return digits.startsWith('0') ? `62${digits.slice(1)}` : digits
}

export default function WhatsAppFab() {
  const seo = useSeo()
  const number = toWhatsAppNumber(seo.church.telephone)
  const message = encodeURIComponent(
    'Halo, saya ingin bertanya tentang GBI Philadelphia Life Center.'
  )

  // Jangan render tombol bila nomor belum diisi di tbl_seo_settings
  if (!number) return null

  return (
    <a
      className="wa-fab"
      href={`https://wa.me/${number}?text=${message}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Hubungi kami via WhatsApp"
      title="Hubungi kami via WhatsApp"
    >
      <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
        <path d="M16 .8C7.6.8.8 7.6.8 16c0 2.7.7 5.3 2 7.6L.8 31.2l7.8-2c2.2 1.2 4.8 1.9 7.4 1.9 8.4 0 15.2-6.8 15.2-15.2S24.4.8 16 .8Zm0 27.6c-2.3 0-4.6-.6-6.5-1.8l-.5-.3-4.6 1.2 1.2-4.5-.3-.5A12.4 12.4 0 0 1 3.6 16C3.6 9.3 9.2 3.6 16 3.6S28.4 9.3 28.4 16 22.8 28.4 16 28.4Zm7-9.5c-.4-.2-2.3-1.1-2.6-1.3-.4-.1-.7-.2-1 .2-.3.4-1 1.3-1.2 1.5-.2.3-.4.3-.8.1-.4-.2-1.5-.6-2.9-1.8-1.1-1-1.8-2.2-2-2.6-.2-.4 0-.6.2-.8l.6-.7c.2-.2.3-.4.4-.7.1-.3.1-.5 0-.7-.1-.2-1-2.3-1.3-3.2-.3-.8-.7-.7-1-.7h-.9c-.3 0-.7.1-1.1.5-.4.4-1.5 1.4-1.5 3.4s1.5 4 1.7 4.2c.2.3 2.9 4.5 7 6.3 1 .4 1.7.7 2.3.9 1 .3 1.9.3 2.6.2.8-.1 2.3-1 2.7-1.9.3-.9.3-1.7.2-1.9-.1-.2-.4-.3-.7-.5Z" />
      </svg>
    </a>
  )
}
