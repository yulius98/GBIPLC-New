import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({ baseURL: API_URL })

// Auth kini lewat httpOnly cookie yang disetel server saat login.
// Browser otomatis mengirim cookie untuk request /api yang sama-origin
// (dev: proxy Vite; produksi: proxy nginx), dan mengirimnya lintas-origin
// karena withCredentials diaktifkan.
axios.defaults.withCredentials = true
api.defaults.withCredentials = true

// Token dari localStorage tidak lagi dipakai; tinggalkan sekadar bersih-bersih.
if (typeof localStorage !== 'undefined' && localStorage.getItem('gbipc_token')) {
  localStorage.removeItem('gbipc_token')
}

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('gbipc_user')
      
	const isSessionCheck = error.config?.url == '/user'
	if (!isSessionCheck && window.location.pathname !== '/login') {
            window.location.href = '/login'
        }
    }
    return Promise.reject(error)
  },
)

// Base URL media (upload). Vite mem-proxy /uploads ke backend saat development.
export const MEDIA_URL = API_URL.startsWith('http') ? API_URL.replace(/\/api$/, '') : ''

export default api
