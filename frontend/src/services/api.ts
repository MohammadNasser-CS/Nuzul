import axios from 'axios'
import { supabase } from '../lib/supabase'

const api = axios.create({
  baseURL: '/api/v1',   // Vite proxies this to the FastAPI backend in dev
})

// Attach the Supabase JWT to every request automatically
api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Global error handler
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired — sign the user out
      supabase.auth.signOut()
    }
    return Promise.reject(error)
  }
)

export default api
