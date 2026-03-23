import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@/api'

export type PlanType = 'FREE' | 'ESSENTIAL' | 'PLUS' | 'COMPLETE'
export type BillingType = 'INDIVIDUAL' | 'FAMILY'

export interface Subscription {
  plan: PlanType
  ownPlan: PlanType
  inheritedFromFamily: boolean
  billingType: BillingType
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

// Which plan is needed per feature — mirrors backend FEATURE_PLAN
export const FEATURE_PLAN: Record<string, PlanType> = {
  multi_child:         'PLUS',
  ai_mediation:        'PLUS',
  ai_calendar_import:  'PLUS',
  google_calendar:     'PLUS',
  caregiver_portal:    'ESSENTIAL',
  organizations:       'ESSENTIAL',
  change_requests:     'ESSENTIAL',
  moments_unlimited:   'PLUS',
}

const PLAN_ORDER: Record<PlanType, number> = {
  FREE: 0, ESSENTIAL: 1, PLUS: 2, COMPLETE: 3,
}

export function canUsePlan(userPlan: PlanType, required: PlanType): boolean {
  return PLAN_ORDER[userPlan] >= PLAN_ORDER[required]
}

export function canUseFeature(userPlan: PlanType, feature: string): boolean {
  const required = FEATURE_PLAN[feature]
  if (!required) return true
  return canUsePlan(userPlan, required)
}

export const FREE_MOMENTS_LIMIT = 5

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
