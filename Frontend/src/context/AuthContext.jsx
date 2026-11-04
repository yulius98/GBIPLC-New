import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('gbipc_user'))
      // Jangan percaya role dari localStorage untuk keputusan sensitif:
      // data pasti diverifikasi ulang ke /user di bawah.
      return stored ?? null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Token ada di httpOnly cookie; cukup tanya server siapa user ini.
    // Cookie tidak ada / kedaluwarsa => 401 => user tetap null.
    api
      .get('/user')
      .then((res) => {
        setUser(res.data.user)
        localStorage.setItem('gbipc_user', JSON.stringify(res.data.user))
      })
      .catch(() => {
        localStorage.removeItem('gbipc_user')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    // Server menyetel httpOnly cookie pada respons login; token tidak
    // dipegang JavaScript sama sekali.
    const me = await api.post('/login', { email, password }).then(() => api.get('/user'))
    setUser(me.data.user)
    localStorage.setItem('gbipc_user', JSON.stringify(me.data.user))
    return me.data.user
  }

  function logout() {
    // POST /logout juga memerintahkan server menghapus cookie httpOnly.
    api.post('/logout').catch(() => {})
    localStorage.removeItem('gbipc_user')
    setUser(null)
  }

  function updateUser(data) {
    if (!data) return
    setUser((prev) => {
      const next = { ...(prev || {}), ...data }
      localStorage.setItem('gbipc_user', JSON.stringify(next))
      return next
    })
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
