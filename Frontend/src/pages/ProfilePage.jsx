import { useEffect, useState } from 'react'
import api, { MEDIA_URL } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?.id) return
    api
      .get(`/myprofile/${user.id}`)
      .then((res) => setProfile(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Gagal memuat profil.'))
  }, [user?.id])

  if (!user) return null

  const data = profile || user

  const rows = [
    ['Email', data.email || '-'],
    ['Alamat', data.alamat || '-'],
    ['No. HP', data.no_HP || '-'],
    ['Golongan darah', data.gol_darah || '-'],
    ['Tanggal lahir', data.tgl_lahir ? new Date(data.tgl_lahir).toLocaleDateString('id-ID') : '-'],
    ['Instagram', data.instagram || '-'],
    ['Facebook', data.facebook || '-'],
    ['Role', data.role === 'pengurus' ? 'Pengurus' : 'Jemaat'],
  ]

  return (
    <div className="profile">
      <h2 className="section-title">Profil</h2>
      {error && <div className="alert alert--error">{error}</div>}
      <div className="card profile__card">
        <div className="profile__header">
          {data.photo_url ? (
            <img
              src={`${MEDIA_URL}${data.photo_url}`}
              alt={data.name}
              className="profile__photo"
            />
          ) : (
            <div className="profile__photo profile__photo--placeholder">
              {data.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3>{data.name}</h3>
            <p className="muted">{data.email || 'tanpa email'}</p>
          </div>
        </div>
        <dl className="profile__rows">
          {rows.map(([label, value]) => (
            <div className="profile__row" key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
