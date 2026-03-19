import { useQuery } from '@tanstack/react-query'
import api from '@/api'
import { useAuthStore } from '@/store/authStore'

export interface CustodyEventSlim {
  id: string
  date: string
  childId: string
  custodianId: string
}

export interface ContactSlim {
  firstName: string
  lastName: string
  email: string
  phone: string | null
}

export interface CaregiverDashboardData {
  name: string
  familyId: string | null
  permissions: {
    canViewCalendar: boolean
    canViewHealthInfo: boolean
    canViewEmergencyContacts: boolean
    canViewAllergies: boolean
  }
  children: { id: string; firstName: string; lastName: string; color: string; dateOfBirth: string }[]
  custodyEvents: CustodyEventSlim[]
  contacts: ContactSlim[]
}

export function useCaregiverDashboard() {
  const token = useAuthStore((s) => s.caregiverToken)
  return useQuery<CaregiverDashboardData>({
    queryKey: ['caregiver-dashboard', token],
    queryFn: () => api.get('/caregiver-portal/dashboard').then((r) => r.data),
    enabled: !!token,
    staleTime: 2 * 60 * 1000, // 2 min
  })
}
