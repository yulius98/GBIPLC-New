import { useEffect, useState } from 'react'
import api from '../api/client'
import { useSeo } from '../context/SeoContext'
import { useSEO } from '../utils/seo'

export default function LifeGroupPage() {
  const seo = useSeo()

  useSEO({
    path: '/life-group',
    title: 'Life Group & Komunitas Sel',
    description:
      'Life Group (komunitas sel) GBI Philadelphia Life Center di Yogyakarta — persekutuan kecil dalam keluarga gereja untuk saling mendoakan dan bertumbuh bersama.',
    keywords: seo.keywords,
  })

  const [groups, setGroups] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/lifegroup')
      .then((res) => setGroups(res.data.data || []))
      .catch((err) => {
        if (err.response?.status !== 404) {
          setError(err.response?.data?.message || 'Gagal memuat life group.')
        }
      })
  }, [])

  return (
    <div className="life-group">
      <div className="container container--wide">
        <div className="section-head">
          <div>
            <span className="section-head__eyebrow">Komunitas Sel</span>
            <h1 className="section-title">Life Group</h1>
          </div>
        </div>

        {error && <div className="alert alert--error">{error}</div>}
        {groups.length === 0 && !error && <p className="muted">Belum ada life group.</p>}

        <div className="life-group__grid">
          {groups.map((g) => (
            <article className="card group-card" key={g.id}>
              <div className="group-card__head">
                <span className="group-card__mark">LG</span>
                <div>
                  <h3>{g.nama_komsel}</h3>
                  <p className="muted">Ketua: {g.ketua_komsel}</p>
                </div>
              </div>
              <dl className="group-card__rows">
                {g.alamat && (
                  <div className="group-card__row">
                    <dt>Alamat</dt>
                    <dd>{g.alamat}</dd>
                  </div>
                )}
                {g.no_telp && (
                  <div className="group-card__row">
                    <dt>No. HP</dt>
                    <dd>{g.no_telp}</dd>
                  </div>
                )}
              </dl>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
