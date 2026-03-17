import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api'
import type { Message } from '@/types/api'

export function useMessages(familyId?: string) {
  return useQuery<Message[]>({
    queryKey: ['messages', familyId],
    queryFn: () => api.get(`/messaging/${familyId}`).then((r) => r.data),
    enabled: !!familyId,
    refetchInterval: 5000,
  })
}

interface SendMessageDto {
  content: string
  familyId: string
}

export function useSendMessage(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: SendMessageDto) =>
      api.post(`/messaging/${familyId}`, dto).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['messages', familyId] })
    },
  })
}
