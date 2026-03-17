import { useQuery } from '@tanstack/react-query'
import api from '@/api'
import type { Family, Child } from '@/types/api'

export function useFamilies() {
  return useQuery<Family[]>({
    queryKey: ['families'],
    queryFn: () => api.get('/family').then((r) => r.data),
  })
}

export function useFamily(familyId?: string) {
  return useQuery<Family>({
    queryKey: ['family', familyId],
    queryFn: () => api.get(`/family/${familyId}`).then((r) => r.data),
    enabled: !!familyId,
  })
}

export function useChildren(familyId?: string) {
  return useQuery<Child[]>({
    queryKey: ['children', familyId],
    queryFn: () => api.get(`/children/${familyId}`).then((r) => r.data),
    enabled: !!familyId,
  })
}
