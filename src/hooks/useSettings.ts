import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api'
import type { FamilySettings, UserSettings } from '@/types/api'
import { useAuthStore } from '@/store/authStore'

// ── Phone verification ────────────────────────────────────────────────────────

export function useSendPhoneCode() {
  return useMutation({
    mutationFn: (phone: string) =>
      api.post('/auth/phone/send', { phone }).then((r) => r.data),
  })
}

export function useVerifyPhone() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  return useMutation({
    mutationFn: ({ phone, code }: { phone: string; code: string }) =>
      api.post('/auth/phone/verify', { phone, code }).then((r) => r.data),
    onSuccess: () => {
      // Mark the stored user as verified without requiring a new login
      if (user && token) setAuth({ ...user, isVerified: true }, token)
    },
  })
}

// ── Google Calendar integration ───────────────────────────────────────────────

export function useGoogleStatus() {
  return useQuery<{ connected: boolean }>({
    queryKey: ['googleStatus'],
    queryFn: () => api.get('/auth/google/status').then((r) => r.data),
  })
}

export function useGoogleAuthUrl() {
  return useMutation({
    mutationFn: () => api.get<{ url: string }>('/auth/google/url').then((r) => r.data.url),
  })
}

export function useGoogleDisconnect() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete('/auth/google/disconnect').then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['googleStatus'] })
    },
  })
}

export function useGoogleSync(familyId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      api.get<{ synced: number }>(`/auth/google/sync/${familyId}`).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['googleStatus'] })
    },
  })
}

export function useExportCalendar(familyId?: string) {
  return useMutation({
    mutationFn: (cleanup: boolean) =>
      api
        .post<{ synced: number; custodySynced: number }>(
          `/auth/google/export/${familyId}`,
          { cleanup },
        )
        .then((r) => r.data),
  })
}

export function useFamilySettings(familyId?: string) {
  return useQuery<FamilySettings>({
    queryKey: ['familySettings', familyId],
    queryFn: () =>
      api.get(`/families/${familyId}/settings`).then((r) => r.data),
    enabled: !!familyId,
  })
}

export function useUpdateFamilySettings(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: Partial<FamilySettings>) =>
      api.patch(`/families/${familyId}/settings`, dto).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['familySettings', familyId] })
    },
  })
}

export function useUserSettings() {
  return useQuery<UserSettings>({
    queryKey: ['userSettings'],
    queryFn: () => api.get('/users/me/settings').then((r) => r.data),
  })
}

export function useUpdateUserSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: Partial<UserSettings>) =>
      api.patch('/users/me/settings', dto).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['userSettings'] })
    },
  })
}
