import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api'
import type { ChangeRequest } from '@/types/api'

export function useRequests(familyId?: string) {
  return useQuery<ChangeRequest[]>({
    queryKey: ['requests', familyId],
    queryFn: () => api.get(`/requests/${familyId}`).then((r) => r.data),
    enabled: !!familyId,
  })
}

export function useRespondRequest(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string
      action: 'accept' | 'decline'
      counterDate?: string
      counterReason?: string
    }) => api.patch(`/requests/${id}/${action}`).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['requests', familyId] })
    },
  })
}
