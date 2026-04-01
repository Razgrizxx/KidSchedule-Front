import { useState } from 'react'
import { Lock, Crown, Zap, Star, Check, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useSubscription, useCreateCheckout, canUseFeature, FEATURE_PLAN, type PlanType } from '@/hooks/useSubscription'
import { cn } from '@/lib/utils'

// ── Upgrade Modal ──────────────────────────────────────────────────────────────

const PLAN_HIGHLIGHTS: Record<PlanType, { label: string; color: string; icon: React.ReactNode; price: string; perks: string[] }> = {
  FREE: {
    label: 'Free',
    color: 'text-slate-500',
    icon: <Star className="w-4 h-4" />,
    price: '$0',
    perks: ['1 child profile', 'Basic calendar', 'Secure messaging'],
  },
  ESSENTIAL: {
    label: 'Essential',
    color: 'text-teal-600',
    icon: <Star className="w-4 h-4" />,
    price: '$5.99/mo',
    perks: ['1 child profile', 'Caregiver portal', 'Groups & organizations', 'Change requests'],
  },
  PLUS: {
    label: 'Plus',
    color: 'text-blue-600',
    icon: <Zap className="w-4 h-4" />,
    price: '$8.99/mo',
    perks: ['Up to 4 child profiles', 'AI Mediation', 'AI Calendar import', 'Google Calendar sync', 'Unlimited moments'],
  },
  COMPLETE: {
    label: 'Complete',
    color: 'text-purple-600',
    icon: <Crown className="w-4 h-4" />,
    price: '$11.99/mo',
    perks: ['Unlimited child profiles', 'Everything in Plus', 'Priority support', 'Advanced analytics'],
  },
}

// Price IDs — must match what you set in .env
const PRICE_IDS: Record<Exclude<PlanType, 'FREE'>, string> = {
  ESSENTIAL: import.meta.env.VITE_STRIPE_PRICE_ESSENTIAL_INDIVIDUAL ?? 'price_essential_individual',
  PLUS:      import.meta.env.VITE_STRIPE_PRICE_PLUS_INDIVIDUAL      ?? 'price_plus_individual',
  COMPLETE:  import.meta.env.VITE_STRIPE_PRICE_COMPLETE_INDIVIDUAL  ?? 'price_complete_individual',
}

export function UpgradeModal({
  open,
  onClose,
  requiredPlan,
  featureLabel,
}: {
  open: boolean
  onClose: () => void
  requiredPlan: PlanType
  featureLabel?: string
}) {
  const checkout = useCreateCheckout()
  const plansToShow: Array<Exclude<PlanType, 'FREE'>> = ['ESSENTIAL', 'PLUS', 'COMPLETE']

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center">
              <Crown className="w-4 h-4 text-white" />
            </div>
            Upgrade your plan
          </DialogTitle>
        </DialogHeader>

        {featureLabel && (
          <p className="text-sm text-slate-500 -mt-2">
            <span className="font-medium text-slate-700">{featureLabel}</span> requires the{' '}
            <span className="font-semibold text-blue-600">{PLAN_HIGHLIGHTS[requiredPlan].label}</span> plan or higher.
          </p>
        )}

        <div className="space-y-3">
          {plansToShow.map((plan) => {
            const info = PLAN_HIGHLIGHTS[plan]
            const isRequired = plan === requiredPlan
            const isHigher = ['ESSENTIAL', 'PLUS', 'COMPLETE'].indexOf(plan) >= ['ESSENTIAL', 'PLUS', 'COMPLETE'].indexOf(requiredPlan)

            return (
              <div
                key={plan}
                className={cn(
                  'rounded-xl border p-4 transition-all',
                  isRequired ? 'border-blue-400 bg-blue-50/50 shadow-sm' : 'border-slate-200',
                  isHigher ? 'hover:border-blue-300 hover:shadow-sm cursor-pointer' : 'opacity-50',
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={info.color}>{info.icon}</span>
                    <span className="font-semibold text-slate-800">{info.label}</span>
                    {isRequired && (
                      <Badge className="text-[10px] bg-blue-100 text-blue-700 border-0">Required</Badge>
                    )}
                  </div>
                  <span className="text-sm font-bold text-slate-700">{info.price}</span>
                </div>
                <ul className="space-y-2 mb-3">
                  {info.perks.map((p) => (
                    <li key={p} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Check className="w-3 h-3 text-teal-500 shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
                <Button
                  size="sm"
                  className={cn(
                    'w-full gap-1.5',
                    plan === 'COMPLETE'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0'
                      : plan === 'PLUS'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : '',
                  )}
                  variant={plan === 'ESSENTIAL' ? 'outline' : 'default'}
                  disabled={!isHigher || checkout.isPending}
                  onClick={() => isHigher && checkout.mutate(PRICE_IDS[plan])}
                >
                  {checkout.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Get {info.label}
                </Button>
              </div>
            )
          })}
        </div>

        <p className="text-[10px] text-slate-400 text-center">
          Full pricing at{' '}
          <a href="/pricing" className="text-teal-600 hover:underline inline-flex items-center gap-0.5">
            /pricing <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </p>
      </DialogContent>
    </Dialog>
  )
}

// ── FeatureGate ────────────────────────────────────────────────────────────────

interface FeatureGateProps {
  feature: string
  featureLabel?: string
  children: React.ReactNode
  /** Custom fallback. Defaults to a lock-overlay on the children. */
  fallback?: React.ReactNode
  /** If true, renders children with a lock icon instead of hiding them */
  overlay?: boolean
}

export function FeatureGate({ feature, featureLabel, children, fallback, overlay }: FeatureGateProps) {
  const { data: sub } = useSubscription()
  const [showUpgrade, setShowUpgrade] = useState(false)

  const plan = sub?.plan ?? 'FREE'
  const hasAccess = canUseFeature(plan, feature)
  const requiredPlan = (FEATURE_PLAN[feature] as PlanType) ?? 'ESSENTIAL'

  if (hasAccess) return <>{children}</>

  if (fallback) {
    return (
      <>
        <span onClick={() => setShowUpgrade(true)}>{fallback}</span>
        <UpgradeModal
          open={showUpgrade}
          onClose={() => setShowUpgrade(false)}
          requiredPlan={requiredPlan}
          featureLabel={featureLabel}
        />
      </>
    )
  }

  if (overlay) {
    return (
      <>
        <div
          className="relative cursor-pointer group"
          onClick={() => setShowUpgrade(true)}
          title={`Upgrade to ${requiredPlan} to use this feature`}
        >
          <div className="pointer-events-none opacity-40">{children}</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm text-xs font-medium text-slate-700 group-hover:border-blue-400 transition-colors">
              <Lock className="w-3 h-3 text-slate-500" />
              {PLAN_HIGHLIGHTS[requiredPlan].label} plan
            </div>
          </div>
        </div>
        <UpgradeModal
          open={showUpgrade}
          onClose={() => setShowUpgrade(false)}
          requiredPlan={requiredPlan}
          featureLabel={featureLabel}
        />
      </>
    )
  }

  // Default: lock button
  return (
    <>
      <button
        onClick={() => setShowUpgrade(true)}
        className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors"
        title={`Upgrade to ${requiredPlan} to unlock`}
      >
        <Lock className="w-3.5 h-3.5" />
        <span className="text-xs">{featureLabel ?? feature}</span>
      </button>
      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        requiredPlan={requiredPlan}
        featureLabel={featureLabel}
      />
    </>
  )
}

// ── ProBadge — small inline badge for locked features in nav ──────────────────

export function ProBadge({ plan = 'PLUS' }: { plan?: PlanType }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full',
      plan === 'PLUS'
        ? 'bg-blue-100 text-blue-600'
        : 'bg-purple-100 text-purple-600',
    )}>
      {plan === 'COMPLETE' && <Crown className="w-2 h-2" />}
      {plan === 'PLUS' && <Zap className="w-2 h-2" />}
      PRO
    </span>
  )
}
