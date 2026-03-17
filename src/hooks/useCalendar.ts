import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api'
import type { Schedule, CustodyEvent, CustodyPattern } from '@/types/api'

export function useSchedules(familyId?: string) {
  return useQuery<Schedule[]>({
    queryKey: ['schedules', familyId],
    queryFn: () => api.get(`/schedule/${familyId}`).then((r) => r.data),
    enabled: !!familyId,
  })
}

export function useCustodyEvents(familyId?: string, month?: string) {
  return useQuery<CustodyEvent[]>({
    queryKey: ['custody-events', familyId, month],
    queryFn: () =>
      api.get(`/schedule/${familyId}/events`, { params: { month } }).then((r) => r.data),
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
    mutationFn: (dto: CreateScheduleDto) => api.post('/schedule', dto).then((r) => r.data),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: ['schedules', variables.familyId] })
      void qc.invalidateQueries({ queryKey: ['custody-events', variables.familyId] })
    },
  })
}
