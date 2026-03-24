import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:3000/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const state = useAuthStore.getState()
  if (state.token) {
    config.headers.Authorization = `Bearer ${state.token}`
  } else if (state.caregiverToken) {
    config.headers['x-caregiver-token'] = state.caregiverToken
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Normalize backend message onto err.message so catch blocks see a plain string
    const data = err.response?.data
    if (data?.message) {
      err.message = Array.isArray(data.message) ? data.message[0] : String(data.message)
    }

    if (err.response?.status === 401) {
      const state = useAuthStore.getState()
      if (state.accessMode === 'parent') {
        state.logout()
      } else if (state.accessMode === 'caregiver') {
        state.clearCaregiverAccess()
      }
    }
    return Promise.reject(err)
  },
)

export default api
