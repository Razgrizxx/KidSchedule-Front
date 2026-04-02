import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api'
import type { Organization, OrgCustomRole, OrgEntity, OrgEvent, OrgRosterEntry, OrgType, OrgRole } from '@/types/api'

export const orgKeys = {
  entities: ['organizations', 'entities', 'mine'] as const,
  mine: ['organizations', 'mine'] as const,
  detail: (id: string) => ['organizations', id] as const,
  events: (id: string, month?: string) => ['organizations', id, 'events', month] as const,
  allEvents: (month?: string) => ['organizations', 'events', 'all', month] as const,
  directory: (id: string, search?: string) => ['organizations', id, 'directory', search] as const,
  announcements: (id: string) => ['organizations', id, 'announcements'] as const,
  venues: (id: string) => ['organizations', id, 'venues'] as const,
  rsvps: (id: string, eventId: string) => ['organizations', id, 'events', eventId, 'rsvp'] as const,
  roles: (id: string) => ['organizations', id, 'roles'] as const,
  roster: (id: string) => ['organizations', id, 'roster'] as const,
}

// ── Entities ───────────────────────────────────────────────────────────────

export function useMyEntities() {
  return useQuery<OrgEntity[]>({
    queryKey: orgKeys.entities,
    queryFn: () => api.get('/organizations/entities/mine').then((r) => r.data),
  })
}

export function useCreateEntity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { name: string; type: OrgType; description?: string }) =>
      api.post('/organizations/entities', body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: orgKeys.entities }),
  })
}

export function useDeleteEntity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (entityId: string) =>
      api.delete(`/organizations/entities/${entityId}`).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: orgKeys.entities })
      void qc.invalidateQueries({ queryKey: orgKeys.mine })
    },
  })
}

// ── Queries ────────────────────────────────────────────────────────────────

export function useMyOrganizations() {
  return useQuery<Organization[]>({
    queryKey: orgKeys.mine,
    queryFn: () => api.get('/organizations/mine').then((r) => r.data),
  })
}

export function useOrganization(id?: string) {
  return useQuery<Organization>({
    queryKey: orgKeys.detail(id!),
    queryFn: () => api.get(`/organizations/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useOrgEvents(orgId?: string, month?: string) {
  return useQuery<OrgEvent[]>({
    queryKey: orgKeys.events(orgId!, month),
    queryFn: () =>
      api.get(`/organizations/${orgId}/events`, { params: { month } }).then((r) => r.data),
    enabled: !!orgId,
  })
}

export function useAllMyOrgEvents(month?: string) {
  return useQuery<OrgEvent[]>({
    queryKey: orgKeys.allEvents(month),
    queryFn: () =>
      api.get('/organizations/events', { params: { month } }).then((r) => r.data),
  })
}

export function useOrgDirectory(orgId?: string, search?: string) {
  return useQuery({
    queryKey: orgKeys.directory(orgId!, search),
    queryFn: () =>
      api.get(`/organizations/${orgId}/directory`, { params: { search } }).then((r) => r.data),
    enabled: !!orgId,
  })
}

export function useOrgAnnouncements(orgId?: string) {
  return useQuery({
    queryKey: orgKeys.announcements(orgId!),
    queryFn: () => api.get(`/organizations/${orgId}/announcements`).then((r) => r.data),
    enabled: !!orgId,
  })
}

export function useOrgVenues(orgId?: string) {
  return useQuery({
    queryKey: orgKeys.venues(orgId!),
    queryFn: () => api.get(`/organizations/${orgId}/venues`).then((r) => r.data),
    enabled: !!orgId,
  })
}

export function useEventRsvps(orgId?: string, eventId?: string) {
  return useQuery({
    queryKey: orgKeys.rsvps(orgId!, eventId!),
    queryFn: () =>
      api.get(`/organizations/${orgId}/events/${eventId}/rsvp`).then((r) => r.data),
    enabled: !!orgId && !!eventId,
  })
}

// ── Mutations ──────────────────────────────────────────────────────────────

export function useCreateOrg() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { name: string; type: OrgType; description?: string; isPublic?: boolean; entityId?: string }) =>
      api.post('/organizations', body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: orgKeys.mine }),
  })
}

export function useJoinOrg() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (inviteCode: string) =>
      api.post('/organizations/join', { inviteCode }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: orgKeys.mine }),
  })
}

export function useLeaveOrg() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (orgId: string) =>
      api.delete(`/organizations/${orgId}/leave`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: orgKeys.mine }),
  })
}

export function useDeleteOrg() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (orgId: string) =>
      api.delete(`/organizations/${orgId}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: orgKeys.mine }),
  })
}

export function useOrgCustomRoles(orgId?: string) {
  return useQuery<OrgCustomRole[]>({
    queryKey: orgKeys.roles(orgId!),
    queryFn: () => api.get(`/organizations/${orgId}/roles`).then((r) => r.data),
    enabled: !!orgId,
  })
}

export function useUpdateOrg() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orgId, ...body }: { orgId: string; isPublic?: boolean }) =>
      api.patch(`/organizations/${orgId}`, body).then((r) => r.data),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: orgKeys.detail(vars.orgId) })
      void qc.invalidateQueries({ queryKey: orgKeys.mine })
    },
  })
}

export function useCreateOrgEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orgId, ...body }: {
      orgId: string; title: string; startAt: string; endAt: string
      allDay?: boolean; notes?: string; venueId?: string; maxCapacity?: number
    }) => api.post(`/organizations/${orgId}/events`, body).then((r) => r.data),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ['organizations', vars.orgId, 'events'] })
      void qc.invalidateQueries({ queryKey: orgKeys.allEvents() })
    },
  })
}

export function useBulkCreateOrgEvents() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orgId, ...body }: {
      orgId: string; title: string; dates: string[]
      startTime?: string; endTime?: string; allDay?: boolean
      venueId?: string; maxCapacity?: number
    }) => api.post(`/organizations/${orgId}/events/bulk`, body).then((r) => r.data),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ['organizations', vars.orgId, 'events'] })
      void qc.invalidateQueries({ queryKey: orgKeys.allEvents() })
    },
  })
}

export function useDeleteOrgEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orgId, eventId }: { orgId: string; eventId: string }) =>
      api.delete(`/organizations/${orgId}/events/${eventId}`).then((r) => r.data),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ['organizations', vars.orgId, 'events'] })
      void qc.invalidateQueries({ queryKey: orgKeys.allEvents() })
    },
  })
}

export function useUpsertRsvp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orgId, eventId, status, notes }: {
      orgId: string; eventId: string; status: 'YES' | 'NO' | 'MAYBE'; notes?: string
    }) => api.post(`/organizations/${orgId}/events/${eventId}/rsvp`, { status, notes }).then((r) => r.data),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: orgKeys.rsvps(vars.orgId, vars.eventId) })
      void qc.invalidateQueries({ queryKey: ['organizations', vars.orgId, 'events'] })
    },
  })
}

export function useApproveMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orgId, userId }: { orgId: string; userId: string }) =>
      api.patch(`/organizations/${orgId}/members/${userId}/approve`).then((r) => r.data),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: orgKeys.detail(vars.orgId) }),
  })
}

export function useRejectMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orgId, userId }: { orgId: string; userId: string }) =>
      api.delete(`/organizations/${orgId}/members/${userId}/reject`).then((r) => r.data),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: orgKeys.detail(vars.orgId) }),
  })
}

export function useUpdateMemberRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orgId, userId, role }: { orgId: string; userId: string; role: OrgRole }) =>
      api.patch(`/organizations/${orgId}/members/${userId}/role`, { role }).then((r) => r.data),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: orgKeys.detail(vars.orgId) }),
  })
}

export function useRemoveMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orgId, userId }: { orgId: string; userId: string }) =>
      api.delete(`/organizations/${orgId}/members/${userId}`).then((r) => r.data),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: orgKeys.detail(vars.orgId) }),
  })
}

export function useCreateVenue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orgId, ...body }: {
      orgId: string; name: string; address?: string; mapUrl?: string; notes?: string
    }) => api.post(`/organizations/${orgId}/venues`, body).then((r) => r.data),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: orgKeys.venues(vars.orgId) }),
  })
}

export function useUpdateVenue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orgId, venueId, ...body }: {
      orgId: string; venueId: string; name: string; address?: string; mapUrl?: string; notes?: string
    }) => api.patch(`/organizations/${orgId}/venues/${venueId}`, body).then((r) => r.data),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: orgKeys.venues(vars.orgId) }),
  })
}

export function useDeleteVenue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orgId, venueId }: { orgId: string; venueId: string }) =>
      api.delete(`/organizations/${orgId}/venues/${venueId}`).then((r) => r.data),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: orgKeys.venues(vars.orgId) }),
  })
}

export function useCreateAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orgId, ...body }: {
      orgId: string; title: string; content: string; pinned?: boolean
    }) => api.post(`/organizations/${orgId}/announcements`, body).then((r) => r.data),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: orgKeys.announcements(vars.orgId) }),
  })
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orgId, announcementId }: { orgId: string; announcementId: string }) =>
      api.delete(`/organizations/${orgId}/announcements/${announcementId}`).then((r) => r.data),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: orgKeys.announcements(vars.orgId) }),
  })
}

export function useCreateCustomRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orgId, ...body }: {
      orgId: string; name: string
      canCreateEvents?: boolean; canCreateAnnouncements?: boolean; canCreateVenues?: boolean
    }) => api.post(`/organizations/${orgId}/roles`, body).then((r) => r.data),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: orgKeys.roles(vars.orgId) })
      void qc.invalidateQueries({ queryKey: orgKeys.detail(vars.orgId) })
    },
  })
}

export function useUpdateCustomRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orgId, roleId, ...body }: {
      orgId: string; roleId: string; name?: string
      canCreateEvents?: boolean; canCreateAnnouncements?: boolean; canCreateVenues?: boolean
    }) => api.patch(`/organizations/${orgId}/roles/${roleId}`, body).then((r) => r.data),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: orgKeys.roles(vars.orgId) })
      void qc.invalidateQueries({ queryKey: orgKeys.detail(vars.orgId) })
    },
  })
}

export function useDeleteCustomRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orgId, roleId }: { orgId: string; roleId: string }) =>
      api.delete(`/organizations/${orgId}/roles/${roleId}`).then((r) => r.data),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: orgKeys.roles(vars.orgId) })
      void qc.invalidateQueries({ queryKey: orgKeys.detail(vars.orgId) })
    },
  })
}

export function useAssignCustomRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orgId, userId, customRoleId }: {
      orgId: string; userId: string; customRoleId: string | null
    }) => api.patch(`/organizations/${orgId}/members/${userId}/custom-role`, { customRoleId }).then((r) => r.data),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: orgKeys.detail(vars.orgId) }),
  })
}

// ── Members' children ─────────────────────────────────────────────────────

export interface MemberChild {
  parent: { id: string; firstName: string; lastName: string; email: string }
  child: { id: string; firstName: string; lastName: string; color: string }
}

export function useOrgMembersChildren(orgId?: string) {
  return useQuery<MemberChild[]>({
    queryKey: ['organizations', orgId, 'members-children'],
    queryFn: () => api.get(`/organizations/${orgId}/members-children`).then((r) => r.data),
    enabled: !!orgId,
  })
}

// ── Roster ─────────────────────────────────────────────────────────────────

export function useOrgRoster(orgId?: string) {
  return useQuery<OrgRosterEntry[]>({
    queryKey: orgKeys.roster(orgId!),
    queryFn: () => api.get(`/organizations/${orgId}/roster`).then((r) => r.data),
    enabled: !!orgId,
  })
}

export function useAddToRoster() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orgId, ...body }: {
      orgId: string; firstName: string; lastName: string
      parentName?: string; parentEmail?: string; parentPhone?: string; notes?: string
      linkedChildId?: string
    }) => api.post(`/organizations/${orgId}/roster`, body).then((r) => r.data),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: orgKeys.roster(vars.orgId) }),
  })
}

export function useRemoveFromRoster() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orgId, rosterId }: { orgId: string; rosterId: string }) =>
      api.delete(`/organizations/${orgId}/roster/${rosterId}`).then((r) => r.data),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: orgKeys.roster(vars.orgId) }),
  })
}

export function useSendRosterInvite() {
  return useMutation({
    mutationFn: ({ orgId, rosterId }: { orgId: string; rosterId: string }) =>
      api.post(`/organizations/${orgId}/roster/${rosterId}/invite`).then((r) => r.data),
  })
}
