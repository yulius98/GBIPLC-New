import { useEffect, useRef, useState } from 'react'
import './HeroCarousel.css'

const AUTOPLAY_MS = 6000
const SWIPE_PX = 50

/**
 * slides: [{ id, title, description, image }]
 *  - title       -> teks judul (di kiri gambar, hanya layar besar)
 *  - description -> teks keterangan; baris baru dipertahankan
 *  - image       -> URL lengkap gambar
 */
export default function HeroCarousel({ slides = [] }) {
  const count = slides.length
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchStartX = useRef(null)

  // Jika jumlah slide berkurang, jangan biarkan index melewati batas
  useEffect(() => {
    if (index >= count) setIndex(0)
  }, [count, index])

  // Autoplay. Bergantung pada `index` agar timer diulang setelah navigasi manual.
  useEffect(() => {
    if (count < 2 || paused) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const timer = setTimeout(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS)
    return () => clearTimeout(timer)
  }, [count, paused, index])

  if (!count) return null

  const go = (i) => setIndex((i + count) % count)

  function onTouchStart(e) {
    touchStartX.current = e.touches[0].clientX
  }

  function onTouchEnd(e) {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(delta) < SWIPE_PX) return
    go(delta < 0 ? index + 1 : index - 1)
  }

  return (
    <section
      className="hero-carousel"
      aria-roledescription="carousel"
      aria-label="Informasi kegiatan gereja"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        className="hero-carousel__viewport"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {slides.map((slide, i) => (
          <article
            key={slide.id ?? i}
            className={`hero-carousel__slide ${i === index ? 'is-active' : ''}`}
            aria-hidden={i !== index}
          >
            <div className="hero-carousel__text">
              {slide.title && <h2 className="hero-carousel__title">{slide.title}</h2>}
              {slide.description && (
                <p className="hero-carousel__desc">{slide.description}</p>
              )}
            </div>

            <div className="hero-carousel__media">
              <img
                src={slide.image}
                alt={slide.title || 'Informasi kegiatan gereja'}
                loading={i === 0 ? 'eager' : 'lazy'}
                draggable={false}
              />
            </div>
          </article>
        ))}
      </div>

      {count > 1 && (
        <div className="hero-carousel__dots">
          {slides.map((slide, i) => (
            <button
              key={slide.id ?? i}
              type="button"
              className={`hero-carousel__dot ${i === index ? 'is-active' : ''}`}
              aria-label={`Slide ${i + 1} dari ${count}`}
              aria-current={i === index}
              onClick={() => go(i)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
