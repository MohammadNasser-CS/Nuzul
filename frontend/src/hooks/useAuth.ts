import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { authService } from '../services/auth'
import type { User } from '../types'

export function getPostLoginRoute(user: User): string {
  if (!user.role) return '/role-selection'
  if (user.role === 'STUDENT' && !user.student_profile) return '/student-info'
  return '/dashboard'
}

/**
 * Bootstraps Supabase auth state into Zustand.
 * Call this ONCE at the app root (AppRoutes in App.tsx).
 *
 * WHY NOT onAuthStateChange(INITIAL_SESSION)?
 *   Supabase holds an internal async lock while calling onAuthStateChange
 *   listeners. Any code inside a listener that calls supabase.auth.getSession()
 *   (even indirectly — e.g. through the Axios request interceptor) tries to
 *   acquire the same lock → deadlock → the await never resolves →
 *   setLoading(false) is never called → app is frozen on the loading spinner.
 *
 *   The safe pattern is:
 *     1. Call supabase.auth.getSession() DIRECTLY (no lock held) to initialize.
 *     2. Use onAuthStateChange only for subsequent events (SIGNED_IN,
 *        TOKEN_REFRESHED, SIGNED_OUT), and wrap any further auth calls in
 *        setTimeout(0) to escape the lock context.
 */
export function useAuthBootstrap() {
  const { setSession, setUser, setLoading, clear } = useAuthStore()

  useEffect(() => {
    let alive = true // guard against state updates after unmount

    // ── 1. Initial session check ──────────────────────────────────────────────
    // getSession() auto-refreshes the access token if it is expired, then
    // returns the (possibly renewed) session — safe to call outside a callback.
    const bootstrap = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!alive) return

        setSession(session)

        if (session) {
          // getMe() uses the Axios interceptor which calls getSession() again.
          // That is fine here because we are NOT inside a Supabase callback,
          // so no lock is held.
          const res = await authService.getMe()
          if (alive) setUser(res.data)
        }
      } catch {
        if (alive) setUser(null)
      } finally {
        // Always unlock the UI — this is the only place it must be guaranteed.
        if (alive) setLoading(false)
      }
    }

    bootstrap()

    // ── 2. Subsequent auth changes ────────────────────────────────────────────
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!alive) return

      if (event === 'SIGNED_OUT') {
        clear()
        return
      }

      // Keep the stored session in sync when Supabase silently refreshes it.
      if (event === 'TOKEN_REFRESHED') {
        setSession(session)
        return
      }

      // SIGNED_IN fires after an explicit login action.
      // Use setTimeout(0) to escape the Supabase lock so that getMe() (which
      // calls getSession() via the Axios interceptor) does not deadlock.
      if (event === 'SIGNED_IN') {
        const capturedSession = session
        setTimeout(async () => {
          if (!alive) return
          setSession(capturedSession)
          if (capturedSession) {
            try {
              const res = await authService.getMe()
              if (alive) setUser(res.data)
            } catch {
              if (alive) setUser(null)
            }
          }
        }, 0)
      }
    })

    return () => {
      alive = false
      subscription.unsubscribe()
    }
  }, [])
}

export function useAuth() {
  return useAuthStore()
}

export function useProfileGuard() {
  const { user, isLoading } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoading || !user) return
    const route = getPostLoginRoute(user)
    if (route !== '/dashboard') {
      navigate(route, { replace: true })
    }
  }, [user, isLoading, navigate])
}
