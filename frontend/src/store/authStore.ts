import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import type { User } from '@/types'

interface AuthState {
  session: Session | null
  user: User | null
  isLoading: boolean
  setSession: (session: Session | null) => void
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: true,
  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  clear: () => {
    localStorage.clear()
    set({ session: null, user: null, isLoading: false })
  }
}))
