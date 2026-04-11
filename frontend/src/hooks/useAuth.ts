import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { authService } from '../services/auth'
import type { User } from '../types'

/**
 * Determines where to redirect after we have a User object from /auth/me.
 *
 * Decision tree (from API docs):
 *   role == null                               → /role-selection
 *   role == STUDENT && student_profile == null → /student-info
 *   role == STUDENT && student_profile != null → /dashboard
 *   role == LANDLORD                           → /dashboard
 *   role == ADMIN                              → /dashboard
 */
export function getPostLoginRoute(user: User): string {
  if (!user.role) return '/role-selection'
  if (user.role === 'STUDENT' && !user.student_profile) return '/student-info'
  return '/dashboard'
}

/**
 * Bootstraps Supabase auth state into Zustand.
 * Call this ONCE at the app root (in App.tsx).
 */
export function useAuthBootstrap() {
  const { setSession, setUser, setLoading, clear } = useAuthStore()

  useEffect(() => {
    // 1. Load current session on mount
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session) {
        try {
          // GET /auth/me auto-creates user row on first call — no register needed
          const res = await authService.getMe()
          setUser(res.data)
        } catch {
          setUser(null)
        }
      }
      setLoading(false)
    })

    // 2. Listen for auth changes (login, logout, token refresh)
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)

        if (event === 'SIGNED_IN' && session) {
          try {
            // GET /auth/me auto-creates user row if needed
            const res = await authService.getMe()
            setUser(res.data)
          } catch {
            setUser(null)
          }
        }

        if (event === 'SIGNED_OUT') {
          clear()
        }
      }
    )

    return () => listener.subscription.unsubscribe()
  }, [])
}

/** Simple hook to consume auth state anywhere in the app. */
export function useAuth() {
  return useAuthStore()
}

/**
 * Hook for use inside protected pages that need to redirect
 * if the user hasn't finished their profile setup.
 */
export function useProfileGuard() {
  const { user, isLoading } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoading || !user) return
    const route = getPostLoginRoute(user)
    if (route !== '/dashboard') {
      navigate(route, { replace: true })
    }
  }, [user, isLoading])
}