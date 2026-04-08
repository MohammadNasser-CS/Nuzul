import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { authService } from '../services/auth'

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
            // Ensure user exists in our backend DB
            await authService.registerInBackend()
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
