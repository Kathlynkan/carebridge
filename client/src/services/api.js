// =============================================================
// ONE axios instance for the whole app (Week 5: Axios)
// -------------------------------------------------------------
// Always import this instead of plain axios, so that:
//   - the API base URL is set in one place
//   - the login token is sent automatically
//
//   import api from '@/services/api'
//   const response = await api.get('/sessions', { params: { childId } })
//   const sessions = response.data
// =============================================================
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
})

// Add "Authorization: Bearer <token>" to every request (Week 5: request headers)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cb_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let onUnauthorized = () => {}
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginCall = error.config?.url?.startsWith('/auth/login')
    if (error.response?.status === 401 && !isLoginCall) onUnauthorized()
    return Promise.reject(error)
  },
)

// Turn any axios error into a friendly message for the UI
export function errorMessage(error) {
  return error.response?.data?.message || error.message || 'Something went wrong.'
}

export default api
