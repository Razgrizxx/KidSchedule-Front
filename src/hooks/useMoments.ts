import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api'
import type { Moment } from '@/types/api'

export function useMoments(familyId?: string) {
  return useQuery<Moment[]>({
    queryKey: ['moments', familyId],
    queryFn: () => api.get(`/families/${familyId}/moments`).then((r) => r.data),
    enabled: !!familyId,
  })
}

export function useCreateMoment(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) =>
      api.post(`/families/${familyId}/moments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['moments', familyId] })
    },
  })
}

export function useDeleteMoment(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (momentId: string) =>
      api.delete(`/families/${familyId}/moments/${momentId}`).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['moments', familyId] })
    },
  })
}

/** Inject Cloudinary f_auto,q_auto transformations into a Cloudinary URL */
export function cloudinaryOptimized(url: string, width = 800): string {
  if (!url.includes('res.cloudinary.com')) return url
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`)
}
