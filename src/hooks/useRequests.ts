import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api'
import type { ChangeRequest } from '@/types/api'

export function useRequests(familyId?: string) {
  return useQuery<ChangeRequest[]>({
    queryKey: ['requests', familyId],
    queryFn: () =>
      api.get(`/families/${familyId}/requests`).then((r) => r.data),
    enabled: !!familyId,
  })
}

export function useCreateRequest(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: {
      type: 'ONE_TIME' | 'PERMANENT'
      originalDate?: string
      requestedDate: string
      requestedDateTo?: string
      childId?: string
      reason?: string
    }) =>
      api.post(`/families/${familyId}/requests`, dto).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['requests', familyId] })
    },
  })
}

export function useRespondRequest(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      action,
      counterDate,
      counterReason,
    }: {
      id: string
      action: 'ACCEPTED' | 'DECLINED' | 'COUNTER_PROPOSED'
      counterDate?: string
      counterReason?: string
    }) =>
      api
        .patch(`/families/${familyId}/requests/${id}/respond`, {
          action,
          counterDate,
          counterReason,
        })
        .then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['requests', familyId] })
      // Calendar re-validation so approved swaps show immediately
      void qc.invalidateQueries({ queryKey: ['custody-events'] })
      void qc.invalidateQueries({ queryKey: ['calendar-events'] })
    },
  })
}
