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
    mutationFn: (dto: { email: string; sendEmail?: boolean }) =>
      api.post(`/families/${familyId}/invite`, dto).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['family', familyId] })
      void qc.invalidateQueries({ queryKey: ['families'] })
    },
  })
}

export interface InvitationPreview {
  familyId: string
  familyName: string
  inviterName: string
  email: string
}

export function useVerifyInvitation(token: string | null) {
  return useQuery<InvitationPreview>({
    queryKey: ['invitation', token],
    queryFn: () =>
      api.get(`/families/invitations/${token}/verify`).then((r) => r.data),
    enabled: !!token,
    retry: false,
  })
}

export function useAcceptInvitation() {
  return useMutation({
    mutationFn: (token: string) =>
      api.post(`/families/invitations/${token}/accept`).then((r) => r.data),
  })
}

export interface CreateCaregiverDto {
  name: string
  email?: string
  relationship?: string
  visibility: 'SHARED' | 'PRIVATE'
  linkExpiry: 'SEVEN_DAYS' | 'THIRTY_DAYS' | 'NINETY_DAYS' | 'ONE_YEAR' | 'NEVER'
  canViewCalendar: boolean
  canViewHealthInfo: boolean
  canViewEmergencyContacts: boolean
  canViewAllergies: boolean
  sendEmail?: boolean
}

export function useAddCaregiver(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateCaregiverDto) =>
      api.post(`/families/${familyId}/caregivers`, dto).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['caregivers', familyId] })
    },
  })
}

export type UpdateCaregiverDto = Partial<Omit<CreateCaregiverDto, 'sendEmail'>>

export function useUpdateCaregiver(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...dto }: UpdateCaregiverDto & { id: string }) =>
      api.patch(`/families/${familyId}/caregivers/${id}`, dto).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['caregivers', familyId] })
    },
  })
}

export function useRemoveCaregiver(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/families/${familyId}/caregivers/${id}`).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['caregivers', familyId] })
    },
  })
}
