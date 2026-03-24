import { useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useFamilies } from '@/hooks/useDashboard'
import { useMessages } from '@/hooks/useMessages'
import { useRequests } from '@/hooks/useRequests'
import { useMyOrganizations, orgKeys } from '@/hooks/useOrganizations'
import { useMediationSessions } from '@/hooks/useMediation'
import { useExpenses } from '@/hooks/useExpenses'
import { useAuthStore } from '@/store/authStore'
import type { Organization } from '@/types/api'

export type NotificationType = 'message' | 'request' | 'org_join' | 'mediation' | 'expense'

export interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  description: string
  href: string
  count: number
}

export function useNotifications() {
  const user = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  const { data: families } = useFamilies()
  const familyId = families?.[0]?.id

  const { data: messagesData } = useMessages(familyId)
  const { data: requests } = useRequests(familyId)
  const { data: orgs } = useMyOrganizations()
  const { data: mediationSessions } = useMediationSessions(familyId)
  const { data: expenses } = useExpenses(familyId)

  const notifications = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = []

    // 1. Unread messages (not sent by me, not yet READ)
    const messages = messagesData?.messages ?? []
    const unreadMessages = messages.filter(
      (m) => m.senderId !== user?.id && m.status !== 'READ' && !m.isSystemMessage,
    )
    if (unreadMessages.length > 0) {
      items.push({
        id: 'messages',
        type: 'message',
        title: `${unreadMessages.length} unread message${unreadMessages.length > 1 ? 's' : ''}`,
        description: `From ${unreadMessages[unreadMessages.length - 1]?.sender?.firstName ?? 'Co-parent'}`,
        href: '/dashboard/messages',
        count: unreadMessages.length,
      })
    }

    // 2. Pending change requests directed at me
    const pendingRequests = (requests ?? []).filter(
      (r) => r.status === 'PENDING' && r.responderId === user?.id,
    )
    if (pendingRequests.length > 0) {
      items.push({
        id: 'requests',
        type: 'request',
        title: `${pendingRequests.length} custody change request${pendingRequests.length > 1 ? 's' : ''}`,
        description: 'Waiting for your response',
        href: '/dashboard/requests',
        count: pendingRequests.length,
      })
    }

    // 3. Pending org join requests — read from cache if org detail was already loaded
    for (const org of orgs ?? []) {
      if (org.role !== 'OWNER' && org.role !== 'ADMIN') continue
      // Only use already-cached org detail to avoid extra network requests
      const cached = qc.getQueryData<Organization>(orgKeys.detail(org.id))
      const pending = (cached?.members ?? org.members ?? []).filter((m) => m.status === 'PENDING')
      if (pending.length > 0) {
        items.push({
          id: `org-${org.id}`,
          type: 'org_join',
          title: `${pending.length} join request${pending.length > 1 ? 's' : ''} in ${org.name}`,
          description: `${pending[0]?.user?.firstName ?? 'Someone'} wants to join`,
          href: `/dashboard/organizations/${org.id}`,
          count: pending.length,
        })
      }
    }

    // 4. Active mediation sessions
    const activeSessions = (mediationSessions ?? []).filter((s) => s.status === 'ACTIVE')
    if (activeSessions.length > 0) {
      items.push({
        id: 'mediation',
        type: 'mediation',
        title: `${activeSessions.length} active mediation session${activeSessions.length > 1 ? 's' : ''}`,
        description: activeSessions[0]?.topic ?? 'Ongoing discussion',
        href: '/dashboard/mediation',
        count: activeSessions.length,
      })
    }

    // 5. Unsettled expenses where co-parent paid (I owe)
    const unsettledOwed = (expenses ?? []).filter(
      (e) => !e.isSettled && e.paidBy !== user?.id,
    )
    if (unsettledOwed.length > 0) {
      const total = unsettledOwed.reduce((sum, e) => sum + Number(e.amount) * (1 - Number(e.splitRatio ?? 0.5)), 0)
      items.push({
        id: 'expenses',
        type: 'expense',
        title: `${unsettledOwed.length} unsettled expense${unsettledOwed.length > 1 ? 's' : ''}`,
        description: `You owe $${total.toFixed(2)}`,
        href: '/dashboard/expenses',
        count: unsettledOwed.length,
      })
    }

    return items
  }, [user?.id, messagesData, requests, orgs, mediationSessions, expenses, qc])

  const totalCount = notifications.reduce((sum, n) => sum + n.count, 0)

  return { notifications, totalCount }
}
