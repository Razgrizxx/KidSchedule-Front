import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api'
import type { MediationSession, MediationStats, MediationMessage, ResolutionProposal } from '@/types/api'

export function useMediationStats(familyId?: string) {
  return useQuery<MediationStats>({
    queryKey: ['mediation-stats', familyId],
    queryFn: () => api.get(`/families/${familyId}/mediation/stats`).then((r) => r.data),
    enabled: !!familyId,
  })
}

export function useMediationSessions(familyId?: string) {
  return useQuery<MediationSession[]>({
    queryKey: ['mediation-sessions', familyId],
    queryFn: () => api.get(`/families/${familyId}/mediation`).then((r) => r.data),
    enabled: !!familyId,
  })
}

export function useMediationSession(familyId?: string, sessionId?: string) {
  return useQuery<MediationSession>({
    queryKey: ['mediation-session', familyId, sessionId],
    queryFn: () =>
      api.get(`/families/${familyId}/mediation/${sessionId}`).then((r) => r.data),
    enabled: !!familyId && !!sessionId,
    // No polling — real-time updates handled by useAppSocket (new_mediation_message)
  })
}

export function useCreateSession(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: { topic: string }) =>
      api.post(`/families/${familyId}/mediation`, dto).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mediation-sessions', familyId] })
      qc.invalidateQueries({ queryKey: ['mediation-stats', familyId] })
    },
  })
}

export function useSendMessage(familyId: string, sessionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: { content: string }) =>
      api
        .post(`/families/${familyId}/mediation/${sessionId}/messages`, dto)
        .then((r) => r.data as MediationMessage),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mediation-session', familyId, sessionId] })
    },
  })
}

export function useAskAI(familyId: string, sessionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      api
        .post(`/families/${familyId}/mediation/${sessionId}/ask-ai`)
        .then((r) => r.data as MediationMessage),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mediation-session', familyId, sessionId] })
    },
  })
}

export function useProposeResolution(familyId: string, sessionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: { summary: string }) =>
      api
        .post(`/families/${familyId}/mediation/${sessionId}/propose`, dto)
        .then((r) => r.data as ResolutionProposal),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mediation-session', familyId, sessionId] })
    },
  })
}

export function useRespondProposal(familyId: string, sessionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ proposalId, action }: { proposalId: string; action: 'ACCEPTED' | 'REJECTED' }) =>
      api
        .patch(
          `/families/${familyId}/mediation/${sessionId}/proposals/${proposalId}/respond`,
          { action },
        )
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mediation-session', familyId, sessionId] })
      qc.invalidateQueries({ queryKey: ['mediation-sessions', familyId] })
      qc.invalidateQueries({ queryKey: ['mediation-stats', familyId] })
    },
  })
}

export function useEscalate(familyId: string, sessionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      api
        .patch(`/families/${familyId}/mediation/${sessionId}/escalate`)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mediation-session', familyId, sessionId] })
      qc.invalidateQueries({ queryKey: ['mediation-sessions', familyId] })
      qc.invalidateQueries({ queryKey: ['mediation-stats', familyId] })
    },
  })
}

export function useCourtReport(familyId?: string, sessionId?: string, enabled = false) {
  return useQuery({
    queryKey: ['court-report', familyId, sessionId],
    queryFn: () =>
      api
        .get(`/families/${familyId}/mediation/${sessionId}/court-report`)
        .then((r) => r.data),
    enabled: !!familyId && !!sessionId && enabled,
  })
}
