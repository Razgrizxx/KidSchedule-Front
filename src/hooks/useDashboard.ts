import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api'
import type { Family, Child, Caregiver } from '@/types/api'

export function useFamilies() {
  return useQuery<Family[]>({
    queryKey: ['families'],
    queryFn: () => api.get('/families').then((r) => r.data),
  })
}

export function useFamily(familyId?: string) {
  return useQuery<Family>({
    queryKey: ['family', familyId],
    queryFn: () => api.get(`/families/${familyId}`).then((r) => r.data),
    enabled: !!familyId,
  })
}

export function useChildren(familyId?: string) {
  return useQuery<Child[]>({
    queryKey: ['children', familyId],
    queryFn: () => api.get(`/families/${familyId}/children`).then((r) => r.data),
    enabled: !!familyId,
  })
}

export function useCaregivers(familyId?: string) {
  return useQuery<Caregiver[]>({
    queryKey: ['caregivers', familyId],
    queryFn: () => api.get(`/families/${familyId}/caregivers`).then((r) => r.data),
    enabled: !!familyId,
  })
}

export interface CreateChildDto {
  firstName: string
  lastName: string
  dateOfBirth: string
  color: string
}

export function useAddChild(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateChildDto) =>
      api.post(`/families/${familyId}/children`, dto).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['children', familyId] })
      void qc.invalidateQueries({ queryKey: ['family', familyId] })
      void qc.invalidateQueries({ queryKey: ['families'] })
    },
  })
}

export function useInviteMember(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: { email: string }) =>
      api.post(`/families/${familyId}/invite`, dto).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['family', familyId] })
      void qc.invalidateQueries({ queryKey: ['families'] })
    },
  })
}
