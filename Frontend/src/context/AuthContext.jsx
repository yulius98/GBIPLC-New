import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('gbipc_user'))
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('gbipc_token')
    if (!token) {
      setLoading(false)
      return
    }
    api
      .get('/user')
      .then((res) => {
        setUser(res.data.user)
        localStorage.setItem('gbipc_user', JSON.stringify(res.data.user))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    const { data } = await api.post('/login', { email, password })
    localStorage.setItem('gbipc_token', data.access_token)
    const me = await api.get('/user')
    setUser(me.data.user)
    localStorage.setItem('gbipc_user', JSON.stringify(me.data.user))
    return me.data.user
  }

  function logout() {
    api.post('/logout').catch(() => {})
    localStorage.removeItem('gbipc_token')
    localStorage.removeItem('gbipc_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
