import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api'
import type { Schedule, CustodyEvent, CustodyPattern, CalendarEvent, EventType, EventVisibility, RepeatPattern } from '@/types/api'

export function useSchedules(familyId?: string) {
  return useQuery<Schedule[]>({
    queryKey: ['schedules', familyId],
    queryFn: () => api.get(`/families/${familyId}/schedules`).then((r) => r.data),
    enabled: !!familyId,
  })
}

export function useCustodyEvents(familyId?: string, month?: string) {
  // month is "YYYY-MM" — split into year and month number for the backend
  const [year, mon] = month ? month.split('-').map(Number) : [undefined, undefined]
  return useQuery<CustodyEvent[]>({
    queryKey: ['custody-events', familyId, month],
    queryFn: () =>
      api
        .get(`/families/${familyId}/schedules/calendar`, {
          params: { year, month: mon },
        })
        .then((r) => r.data),
    enabled: !!familyId && !!month,
  })
}

interface CreateScheduleDto {
  familyId: string
  childId: string
  name: string
  pattern: CustodyPattern
  startDate: string
  parent1Id: string
  parent2Id: string
}

export function useCreateSchedule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ familyId, ...body }: CreateScheduleDto) =>
      api
        .post(`/families/${familyId}/schedules`, body)
        .then((r) => r.data),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: ['schedules', variables.familyId] })
      void qc.invalidateQueries({ queryKey: ['custody-events', variables.familyId] })
    },
  })
}

export function useEvents(familyId?: string, month?: string) {
  return useQuery<CalendarEvent[]>({
    queryKey: ['events', familyId, month],
    queryFn: () =>
      api.get(`/families/${familyId}/events`, { params: { month } }).then((r) => r.data),
    enabled: !!familyId,
  })
}

interface CreateEventDto {
  familyId: string
  title: string
  type: EventType
  visibility: EventVisibility
  startAt: string
  endAt: string
  allDay?: boolean
  repeat: RepeatPattern
  notes?: string
  assignedToId?: string
  caregiverId?: string
  childIds: string[]
}

export function useCreateEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ familyId, ...body }: CreateEventDto) =>
      api.post(`/families/${familyId}/events`, body).then((r) => r.data),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: ['events', variables.familyId] })
    },
  })
}

interface UpdateEventDto extends Partial<Omit<CreateEventDto, 'familyId'>> {
  familyId: string
  eventId: string
}

export function useUpdateEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ familyId, eventId, ...body }: UpdateEventDto) =>
      api.patch(`/families/${familyId}/events/${eventId}`, body).then((r) => r.data),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: ['events', variables.familyId] })
    },
  })
}

export interface HolidayWithMeta {
  id: string
  date: string
  name: string
  country: 'AR' | 'US'
  category: 'NATIONAL' | 'SCHOOL'
  isTransitionDay: boolean
}

export function useHolidays(familyId?: string, year?: number, country?: string) {
  return useQuery<HolidayWithMeta[]>({
    queryKey: ['holidays', familyId, year, country],
    queryFn: () =>
      api
        .get(`/families/${familyId}/events/holidays`, { params: { year, country } })
        .then((r) => r.data),
    enabled: !!familyId && !!year,
  })
}

interface BulkImportDto {
  familyId: string
  events: { title: string; date: string; type: string }[]
  childIds: string[]
  visibility: string
}

export function useBulkImport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ familyId, ...body }: BulkImportDto) =>
      api.post(`/families/${familyId}/events/bulk`, body).then((r) => r.data),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: ['events', variables.familyId] })
    },
  })
}

export function useDeleteEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ familyId, eventId }: { familyId: string; eventId: string }) =>
      api.delete(`/families/${familyId}/events/${eventId}`).then((r) => r.data),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: ['events', variables.familyId] })
    },
  })
}
