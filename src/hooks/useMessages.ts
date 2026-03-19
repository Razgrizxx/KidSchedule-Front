import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api'
import type { Message } from '@/types/api'

interface MessagesResponse {
  messages: Message[]
  nextCursor: string | null
}

interface ChainVerification {
  isValid: boolean
  totalMessages: number
  violations: string[]
}

export function useMessages(familyId?: string) {
  return useQuery<MessagesResponse>({
    queryKey: ['messages', familyId],
    queryFn: () =>
      api.get(`/families/${familyId}/messages`).then((r) => r.data),
    enabled: !!familyId,
    refetchInterval: 5000,
  })
}

export function useSendMessage(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (content: string) =>
      api
        .post(`/families/${familyId}/messages`, { content })
        .then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['messages', familyId] })
    },
  })
}

export function useMarkMessagesRead(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      api
        .post(`/families/${familyId}/messages/mark-read`)
        .then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['messages', familyId] })
    },
  })
}

export function useVerifyChain(familyId?: string) {
  return useQuery<ChainVerification>({
    queryKey: ['messages-chain', familyId],
    queryFn: () =>
      api
        .get(`/families/${familyId}/messages/verify-chain`)
        .then((r) => r.data),
    enabled: !!familyId,
    staleTime: 60_000,
  })
}
