import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api'
import type { FamilySettings, UserSettings } from '@/types/api'

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
