import { useEffect, useMemo, useState } from 'react'
import api from '../api/client'
import { useSeo } from '../context/SeoContext'
import { useSEO } from '../utils/seo'

function formatBirthday(value) {
  return new Date(value).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function monthIndex(value) {
  return new Date(value).getMonth()
}

function dayOfMonth(value) {
  return new Date(value).getDate()
}

function BdayCard({ member, isToday }) {
  return (
    <article className={`card bday-card ${isToday ? 'bday-card--today' : ''}`}>
      {member.photo_url ? (
        <img className="bday-card__avatar" src={member.photo_url} alt={member.name} />
      ) : (
        <div className="bday-card__avatar bday-card__avatar--placeholder">
          {(member.name || '?').charAt(0).toUpperCase()}
        </div>
      )}
      <div className="bday-card__body">
        <h3>{member.name}</h3>
        <p className="muted">{formatBirthday(member.tgl_lahir)}</p>
        {isToday && <span className="bday-card__badge">Hari ini!</span>}
      </div>
    </article>
  )
}

export default function HappyBdayPage() {
  const seo = useSeo()
  const [members, setMembers] = useState([])
  const [error, setError] = useState('')

  useSEO({
    path: '/happy-bday',
    title: 'Happy Birthday',
    description:
      'Selamat ulang tahun kepada jemaat GBI Philadelphia Life Center (GBI PLC) yang berulang tahun bulan ini dan bulan lalu.',
    keywords: seo.keywords,
  })

  useEffect(() => {
    api
      .get('/birthday', { params: { months: 2 } })
      .then((res) => setMembers(res.data?.data || []))
      .catch((err) => {
        if (err.response?.status === 404) {
          setMembers([])
        } else {
          setError(err.response?.data?.message || 'Gagal memuat data ulang tahun.')
        }
      })
  }, [])

  const { current, previous } = useMemo(() => {
    const nowMonth = new Date().getMonth()
    const prevMonth = (nowMonth - 1 + 12) % 12
    const today = new Date().getDate()

    const sortByDay = (list) =>
      [...list].sort((a, b) => dayOfMonth(a.tgl_lahir) - dayOfMonth(b.tgl_lahir))

    const current = sortByDay(
      members.filter((m) => monthIndex(m.tgl_lahir) === nowMonth).map((m) => ({
        ...m,
        isToday: dayOfMonth(m.tgl_lahir) === today,
      })),
    )
    const previous = sortByDay(members.filter((m) => monthIndex(m.tgl_lahir) === prevMonth))

    return { current, previous }
  }, [members])

  const monthLabel = (index) =>
    new Date(new Date().getFullYear(), index, 1).toLocaleDateString('id-ID', {
      month: 'long',
    })

  return (
    <div className="bday">
      <section className="bday__hero">
        <span className="section-head__eyebrow">Merayakan Bersama</span>
        <h1>Happy Birthday!</h1>
        <p className="muted">
          Mendoakan dan merayakan jemaat yang berulang tahun bulan ini dan bulan lalu. Tuhan
          memberkati Anda.
        </p>
      </section>

      <div className="container container--wide">
        {error && <div className="alert alert--error">{error}</div>}

        {current.length === 0 && previous.length === 0 && !error && (
          <p className="muted">Belum ada jemaat yang berulang tahun pada bulan ini dan bulan lalu.</p>
        )}

        {current.length > 0 && (
          <section className="landing__section">
            <div className="section-head">
              <div>
                <span className="section-head__eyebrow">{monthLabel(new Date().getMonth())}</span>
                <h2 className="section-title">Bulan Ini</h2>
              </div>
            </div>
            <div className="bday__grid">
              {current.map((m) => (
                <BdayCard key={m.id} member={m} isToday={m.isToday} />
              ))}
            </div>
          </section>
        )}

        {previous.length > 0 && (
          <section className="landing__section">
            <div className="section-head">
              <div>
                <span className="section-head__eyebrow">
                  {monthLabel((new Date().getMonth() - 1 + 12) % 12)}
                </span>
                <h2 className="section-title">Bulan Lalu</h2>
              </div>
            </div>
            <div className="bday__grid">
              {previous.map((m) => (
                <BdayCard key={m.id} member={m} isToday={false} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}