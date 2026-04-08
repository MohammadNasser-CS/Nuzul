import { supabase } from '../lib/supabase'
import type { User } from '../types'
import api from './api'

export const authService = {
  signInWithEmail: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),

  signUpWithEmail: (email: string, password: string) =>
    supabase.auth.signUp({ email, password }),

  signInWithGoogle: () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    }),

  signOut: () => supabase.auth.signOut(),

  getSession: () => supabase.auth.getSession(),

  /** Register the Supabase user in our own backend DB (call once after signup). */
  registerInBackend: () => api.post<User>('/auth/register'),

  getMe: () => api.get<User>('/auth/me'),

  updateMe: (data: Partial<Pick<User, 'full_name' | 'avatar_url'>>) =>
    api.patch<User>('/auth/me', data),
}
