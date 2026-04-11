import axios from 'axios'
import { supabase } from '../lib/supabase'

const api = axios.create({
  // In dev: VITE_API_BASE_URL is unset → '/api/v1' is proxied by Vite to localhost:8000
  // In production: VITE_API_BASE_URL=https://your-app.onrender.com
  baseURL: `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/v1`,
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
