import { useEffect, useState } from 'react'
import api, { MEDIA_URL } from '../api/client'

export default function EventsPage() {
  const [events, setEvents] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/event')
      .then((res) => setEvents(res.data.data || []))
      .catch((err) => setError(err.response?.data?.message || 'Gagal memuat agenda.'))
  }, [])

  return (
    <div className="events">
      <h2 className="section-title">Agenda</h2>
      {error && <div className="alert alert--error">{error}</div>}
      {events.length === 0 && !error && <p className="muted">Belum ada agenda.</p>}
      <div className="event-list">
        {events.map((ev) => (
          <article className="card event" key={ev.id}>
            {ev.filename && (
              <img
                src={`${MEDIA_URL}/uploads/${ev.filename}`}
                alt={ev.keterangan}
                className="event__image"
              />
            )}
            <div className="event__body">
              <h3>{ev.keterangan}</h3>
              <p className="muted">
                {ev.tgl_event
                  ? new Date(ev.tgl_event).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : '-'}
              </p>
              {ev.isi_event && <p>{ev.isi_event}</p>}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
