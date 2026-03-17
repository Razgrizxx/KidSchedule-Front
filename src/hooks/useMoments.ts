import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api'
import type { Moment } from '@/types/api'

export function useMoments(familyId?: string) {
  return useQuery<Moment[]>({
    queryKey: ['moments', familyId],
    queryFn: () => api.get(`/moments/${familyId}`).then((r) => r.data),
    enabled: !!familyId,
  })
}

export function useUploadMoment(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) =>
      api.post(`/moments/${familyId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['moments', familyId] })
    },
  })
}
