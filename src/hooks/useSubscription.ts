import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@/api'

export type PlanType = 'FREE' | 'ESSENTIAL' | 'PLUS' | 'COMPLETE'
export type BillingInterval = 'MONTHLY' | 'ANNUAL'

export interface Subscription {
  plan: PlanType
  billingInterval: BillingInterval
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

export function useSubscription() {
  return useQuery<Subscription>({
    queryKey: ['subscription'],
    queryFn: () => api.get('/stripe/subscription').then((r) => r.data),
    staleTime: 60_000,
  })
}

export function useCreateCheckout() {
  return useMutation({
    mutationFn: (priceId: string) =>
      api.post('/stripe/checkout', { priceId }).then((r) => r.data as { url: string }),
    onSuccess: ({ url }) => {
      window.location.href = url
    },
  })
}

export function useCreatePortal() {
  return useMutation({
    mutationFn: () =>
      api.post('/stripe/portal').then((r) => r.data as { url: string }),
    onSuccess: ({ url }) => {
      window.location.href = url
    },
  })
}

export const PLAN_LIMITS: Record<PlanType, { children: number | null; label: string }> = {
  FREE:      { children: 1,    label: 'Free' },
  ESSENTIAL: { children: 1,    label: 'Essential' },
  PLUS:      { children: 4,    label: 'Plus' },
  COMPLETE:  { children: null, label: 'Complete' },
}
