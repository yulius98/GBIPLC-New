import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gbipc_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('gbipc_token')
      localStorage.removeItem('gbipc_user')
      if (window.location.pathname !== '/login') window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

// Base URL media (upload). Vite mem-proxy /uploads ke backend saat development.
export const MEDIA_URL = API_URL.startsWith('http') ? API_URL.replace(/\/api$/, '') : ''

export default api
