import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { authService } from '../services/auth'
import { useAuthStore } from '../store/authStore'
import { getPostLoginRoute } from '../hooks/useAuth'

/**
 * Supabase redirects here after Google OAuth.
 * After confirming the session, we call /auth/me and follow the
 * profile-completion decision tree to send the user to the right page.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const { setUser } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        navigate('/login', { replace: true })
        return
      }
      try {
        const res = await authService.getMe()
        setUser(res.data)
        navigate(getPostLoginRoute(res.data), { replace: true })
      } catch {
        navigate('/login', { replace: true })
      }
    })
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-400 text-sm">Signing you in…</p>
    </div>
  )
}