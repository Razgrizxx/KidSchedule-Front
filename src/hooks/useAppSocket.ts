import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { getSocket, disconnectSocket } from '@/socket'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/hooks/use-toast'
import type { MediationMessage, ResolutionProposal } from '@/types/api'

interface Notification {
  type: string
  payload: Record<string, unknown>
}

export function useAppSocket(familyId: string | undefined) {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const { pathname } = useLocation()

  // 1. Connect once on login, disconnect on logout
  useEffect(() => {
    if (!user) {
      disconnectSocket()
      return
    }
    getSocket()
  }, [user])

  // 2. Join family room whenever familyId becomes available
  useEffect(() => {
    if (!familyId || !user) return
    const socket = getSocket()

    function joinRoom() {
      socket.emit('join_family', familyId)
    }

    if (socket.connected) {
      joinRoom()
    } else {
      socket.once('connect', joinRoom)
    }

    return () => {
      socket.off('connect', joinRoom)
    }
  }, [familyId, user])

  // 3. Global event listeners
  useEffect(() => {
    if (!user) return
    const socket = getSocket()
    const onMediation = pathname.includes('/mediation')
    const onMessages = pathname.includes('/messages')

    // ── Regular chat message → toast when not on messages page ──────────────
    function onNewMessage(message: { content: string; sender?: { firstName: string } }) {
      if (!onMessages) {
        toast({
          title: `New message from ${message.sender?.firstName ?? 'Co-parent'}`,
          description: message.content.slice(0, 80),
        })
      }
    }

    // ── Mediation message → toast when not on mediation page ────────────────
    function onNewMediationMessage({ sessionId, message }: { sessionId: string; message: MediationMessage }) {
      qc.setQueryData(
        ['mediation-session', familyId, sessionId],
        (old: { messages?: MediationMessage[] } | undefined) => {
          if (!old) return old
          if (old.messages?.some((m) => m.id === message.id)) return old
          return { ...old, messages: [...(old.messages ?? []), message] }
        },
      )
      void qc.invalidateQueries({ queryKey: ['mediation-session', familyId, sessionId] })

      if (!onMediation) {
        const who = message.isAI ? 'AI Mediator' : (message.sender?.firstName ?? 'Co-parent')
        toast({
          title: `Mediation — new message from ${who}`,
          description: message.content.slice(0, 80),
        })
      }
    }

    // ── New proposal submitted ───────────────────────────────────────────────
    function onNewProposal({ sessionId, proposal }: { sessionId: string; proposal: ResolutionProposal }) {
      qc.setQueryData(
        ['mediation-session', familyId, sessionId],
        (old: { proposals?: ResolutionProposal[] } | undefined) => {
          if (!old) return old
          if (old.proposals?.some((p) => p.id === proposal.id)) return old
          return { ...old, proposals: [...(old.proposals ?? []), proposal] }
        },
      )
      void qc.invalidateQueries({ queryKey: ['mediation-session', familyId, sessionId] })

      toast({
        title: 'New Resolution Proposal',
        description: `${proposal.proposer?.firstName ?? 'Co-parent'} proposed: "${proposal.summary.slice(0, 60)}${proposal.summary.length > 60 ? '…' : ''}"`,
      })
    }

    // ── Proposal accepted / rejected ─────────────────────────────────────────
    function onProposalResponse({
      sessionId,
      proposalId,
      status,
      sessionStatus,
    }: {
      sessionId: string
      proposalId: string
      status: 'ACCEPTED' | 'REJECTED'
      sessionStatus?: string
    }) {
      qc.setQueryData(
        ['mediation-session', familyId, sessionId],
        (old: { proposals?: ResolutionProposal[]; status?: string } | undefined) => {
          if (!old) return old
          return {
            ...old,
            status: sessionStatus ?? old.status,
            proposals: old.proposals?.map((p) =>
              p.id === proposalId ? { ...p, status } : p,
            ),
          }
        },
      )
      void qc.invalidateQueries({ queryKey: ['mediation-session', familyId, sessionId] })
      void qc.invalidateQueries({ queryKey: ['mediation-sessions', familyId] })
      void qc.invalidateQueries({ queryKey: ['mediation-stats', familyId] })

      toast({
        title: status === 'ACCEPTED' ? 'Proposal Accepted ✓' : 'Proposal Rejected',
        description:
          status === 'ACCEPTED'
            ? 'Both parties reached an agreement. Session resolved.'
            : 'Co-parent rejected the proposal. You can submit a new one.',
      })
    }

    // ── Generic notifications (request updates, etc.) ────────────────────────
    function onNotification(n: Notification) {
      if (n.type === 'REQUEST_UPDATED') {
        const status = n.payload.status as string
        const label =
          status === 'ACCEPTED' ? 'accepted ✓' : status === 'DECLINED' ? 'declined' : 'updated'
        toast({ title: `Change Request ${label}`, description: 'Your custody change request was responded to.' })
        void qc.invalidateQueries({ queryKey: ['requests', familyId] })
        void qc.invalidateQueries({ queryKey: ['custody-events'] })
        void qc.invalidateQueries({ queryKey: ['calendar-events'] })
      }
      if (n.type === 'MEDIATION_RESOLVED') {
        void qc.invalidateQueries({ queryKey: ['mediation-sessions', familyId] })
        void qc.invalidateQueries({ queryKey: ['mediation-stats', familyId] })
      }
    }

    socket.on('new_message', onNewMessage)
    socket.on('new_mediation_message', onNewMediationMessage)
    socket.on('new_mediation_proposal', onNewProposal)
    socket.on('new_mediation_proposal_response', onProposalResponse)
    socket.on('notification', onNotification)

    return () => {
      socket.off('new_message', onNewMessage)
      socket.off('new_mediation_message', onNewMediationMessage)
      socket.off('new_mediation_proposal', onNewProposal)
      socket.off('new_mediation_proposal_response', onProposalResponse)
      socket.off('notification', onNotification)
    }
  }, [user, familyId, pathname, qc])
}
