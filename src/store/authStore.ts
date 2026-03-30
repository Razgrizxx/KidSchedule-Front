import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppearanceTheme, TimeFormat } from '@/types/api'

export interface AuthUser {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  isVerified: boolean
}

export interface CaregiverData {
  name: string
  familyId: string | null
  permissions: {
    canViewCalendar: boolean
    canViewHealthInfo: boolean
    canViewEmergencyContacts: boolean
    canViewAllergies: boolean
  }
  children: { id: string; firstName: string; lastName: string; color: string }[]
}

interface AuthState {
  // Parent auth
  user: AuthUser | null
  token: string | null

  // Caregiver access
  caregiverToken: string | null
  caregiverData: CaregiverData | null

  // Derived access mode
  accessMode: 'parent' | 'caregiver' | 'none'

  // Settings
  appearance: AppearanceTheme
  timeFormat: TimeFormat

  // Actions
  setAuth: (user: AuthUser, token: string) => void
  logout: () => void
  setCaregiverAccess: (token: string, data: CaregiverData) => void
  clearCaregiverAccess: () => void
  setAppearance: (appearance: AppearanceTheme) => void
  setTimeFormat: (timeFormat: TimeFormat) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      caregiverToken: null,
      caregiverData: null,
      accessMode: 'none',
      appearance: 'FRIENDLY',
      timeFormat: 'TWELVE_HOUR',

      setAuth: (user, token) =>
        set({ user, token, accessMode: 'parent', caregiverToken: null, caregiverData: null }),

      logout: () =>
        set({
          user: null,
          token: null,
          caregiverToken: null,
          caregiverData: null,
          accessMode: 'none',
          appearance: 'FRIENDLY',
          timeFormat: 'TWELVE_HOUR',
        }),

      setCaregiverAccess: (caregiverToken, caregiverData) =>
        set({ caregiverToken, caregiverData, accessMode: 'caregiver', user: null, token: null }),

      clearCaregiverAccess: () =>
        set({ caregiverToken: null, caregiverData: null, accessMode: 'none' }),

      setAppearance: (appearance) => set({ appearance }),
      setTimeFormat: (timeFormat) => set({ timeFormat }),
    }),
    { name: 'kidschedule-auth' },
  ),
)
