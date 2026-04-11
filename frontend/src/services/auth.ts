import { supabase } from '../lib/supabase'
import type { User, CompleteProfilePayload, CompleteStudentProfilePayload } from '../types'
import api from './api'

export const authService = {
  // ── Supabase Auth ────────────────────────────────────────────────────────────
  signInWithEmail: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),

  signUpWithEmail: (email: string, password: string) =>
    supabase.auth.signUp({ email, password }),

  signInWithGoogle: () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    }),

  signOut: () => {
    supabase.auth.signOut()
    localStorage.removeItem('access_token')
  },

  getSession: () => supabase.auth.getSession(),

  getMe: () => api.get<User>('/auth/me'),

  completeProfile: (data: CompleteProfilePayload) =>
    api.post<User>('/auth/complete-profile', data),

  completeStudentProfile: (data: CompleteStudentProfilePayload) =>
    api.post<User>('/auth/complete-student-profile', data),
}