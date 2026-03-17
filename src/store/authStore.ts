import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppearanceTheme, TimeFormat } from '@/types/api'

export interface AuthUser {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  appearance: AppearanceTheme
  timeFormat: TimeFormat
  setAuth: (user: AuthUser, token: string) => void
  logout: () => void
  setAppearance: (appearance: AppearanceTheme) => void
  setTimeFormat: (timeFormat: TimeFormat) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      appearance: 'FRIENDLY',
      timeFormat: 'TWELVE_HOUR',
      setAuth: (user, token) => set({ user, token }),
      logout: () =>
        set({ user: null, token: null, appearance: 'FRIENDLY', timeFormat: 'TWELVE_HOUR' }),
      setAppearance: (appearance) => set({ appearance }),
      setTimeFormat: (timeFormat) => set({ timeFormat }),
    }),
    { name: 'kidschedule-auth' },
  ),
)
