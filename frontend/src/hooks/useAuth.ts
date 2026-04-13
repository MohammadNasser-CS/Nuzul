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
 * WHY onAuthStateChange(INITIAL_SESSION) instead of getSession() directly?
 *   In production, the stored access token is often expired on page refresh.
 *   Supabase silently refreshes it, holding an internal async lock during the
 *   refresh. Calling getSession() while that lock is held (even indirectly via
 *   the Axios request interceptor) tries to acquire the same lock → deadlock →
 *   the await never resolves → setLoading(false) is never called → spinner
 *   freezes forever.
 *
 *   The safe pattern:
 *     1. Use onAuthStateChange INITIAL_SESSION for initialization — Supabase
 *        guarantees this fires exactly once on load with the resolved session.
 *     2. Wrap any API calls (getMe) in setTimeout(0) to escape the lock context
 *        before calling the Axios interceptor which calls getSession() again.
 *     3. Handle subsequent events (SIGNED_IN, TOKEN_REFRESHED, SIGNED_OUT)
 *        the same way.
 */
export function useAuthBootstrap() {
  const { setSession, setUser, setLoading, clear } = useAuthStore()

  useEffect(() => {
    let alive = true // guard against state updates after unmount

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!alive) return

      // ── Initial load (page refresh or first visit) ──────────────────────────
      // INITIAL_SESSION fires exactly once when the listener is registered.
      // Supabase has already resolved/refreshed the token by this point.
      if (event === 'INITIAL_SESSION') {
        setSession(session)
        if (!session) {
          // No stored session — user is not logged in, unblock immediately.
          setLoading(false)
          return
        }
        // setTimeout(0) escapes the Supabase lock before calling getMe(),
        // which calls getSession() internally via the Axios interceptor.
        setTimeout(async () => {
          if (!alive) return
          try {
            const res = await authService.getMe()
            if (alive) setUser(res.data)
          } catch {
            if (alive) setUser(null)
          } finally {
            if (alive) setLoading(false)
          }
        }, 0)
        return
      }

      // ── Subsequent auth changes ─────────────────────────────────────────────
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
