import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getSocket, disconnectSocket } from '@/socket'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/hooks/use-toast'
import type { MediationMessage } from '@/types/api'

interface Notification {
  type: string
  payload: Record<string, unknown>
}

export function useAppSocket(familyId: string | undefined) {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)

  // 1. Connect once on login, disconnect on logout
  useEffect(() => {
    if (!user) {
      disconnectSocket()
      return
    }
    getSocket() // creates + connects if not already alive
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
        const topic = n.payload.topic as string
        toast({ title: 'Mediation Resolved', description: `"${topic}" — both parties reached an agreement.` })
        void qc.invalidateQueries({ queryKey: ['mediation-sessions', familyId] })
        void qc.invalidateQueries({ queryKey: ['mediation-stats', familyId] })
      }
    }

    function onNewMediationMessage({ sessionId, message }: { sessionId: string; message: MediationMessage }) {
      qc.setQueryData(
        ['mediation-session', familyId, sessionId],
        (old: { messages?: MediationMessage[] } | undefined) => {
          if (!old) return old
          if (old.messages?.some((m) => m.id === message.id)) return old
          return { ...old, messages: [...(old.messages ?? []), message] }
        },
      )
    }

    socket.on('notification', onNotification)
    socket.on('new_mediation_message', onNewMediationMessage)

    return () => {
      socket.off('notification', onNotification)
      socket.off('new_mediation_message', onNewMediationMessage)
    }
  }, [user, familyId, qc])
}
