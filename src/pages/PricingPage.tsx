import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Crown, Zap, Star, ArrowLeft, Loader2, Users, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSubscription, useCreateCheckout } from '@/hooks/useSubscription'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

// ── Price IDs from Stripe ─────────────────────────────────────────────────────
const PRICE_IDS = {
  ESSENTIAL: {
    INDIVIDUAL: import.meta.env.VITE_STRIPE_PRICE_ESSENTIAL_INDIVIDUAL ?? 'price_essential_individual',
    FAMILY:     import.meta.env.VITE_STRIPE_PRICE_ESSENTIAL_FAMILY     ?? 'price_essential_family',
  },
  PLUS: {
    INDIVIDUAL: import.meta.env.VITE_STRIPE_PRICE_PLUS_INDIVIDUAL ?? 'price_plus_individual',
    FAMILY:     import.meta.env.VITE_STRIPE_PRICE_PLUS_FAMILY     ?? 'price_plus_family',
  },
  COMPLETE: {
    INDIVIDUAL: import.meta.env.VITE_STRIPE_PRICE_COMPLETE_INDIVIDUAL ?? 'price_complete_individual',
    FAMILY:     import.meta.env.VITE_STRIPE_PRICE_COMPLETE_FAMILY     ?? 'price_complete_family',
  },
}

interface Plan {
  key: 'ESSENTIAL' | 'PLUS' | 'COMPLETE'
  name: string
  individualPrice: number
  familyPrice: number
  description: string
  icon: React.ReactNode
  color: string
  badge?: string
  limit: string
  features: string[]
}

const PLANS: Plan[] = [
  {
    key: 'ESSENTIAL',
    name: 'Essential',
    individualPrice: 5.99,
    familyPrice: 8.99,
    description: 'Perfect for single-parent coordination',
    icon: <Star className="w-5 h-5" />,
    color: 'text-slate-600',
    limit: '1 child profile',
    features: [
      'Custody calendar & scheduling',
      'Secure messaging (hash-chained)',
      'Expense tracking',
      'PDF court-ready export',
      '1 child profile',
      'Groups & organizations',
      'Change requests',
      'Email notifications',
    ],
  },
  {
    key: 'PLUS',
    name: 'Plus',
    individualPrice: 8.99,
    familyPrice: 15.99,
    description: 'For families with multiple children',
    icon: <Zap className="w-5 h-5" />,
    color: 'text-blue-600',
    badge: 'Most Popular',
    limit: 'Up to 4 child profiles',
    features: [
      'Everything in Essential',
      'Up to 4 child profiles',
      'AI Mediation assistant',
      'AI Calendar import',
      'Google Calendar sync',
      'Unlimited moments',
      'Caregiver portal access',
    ],
  },
  {
    key: 'COMPLETE',
    name: 'Complete',
    individualPrice: 11.99,
    familyPrice: 19.99,
    description: 'Unlimited for blended families',
    icon: <Crown className="w-5 h-5" />,
    color: 'text-purple-600',
    limit: 'Unlimited child profiles',
    features: [
      'Everything in Plus',
      'Unlimited child profiles',
      'Priority AI support',
      'Advanced analytics',
      'Dedicated onboarding',
      'White-glove setup',
    ],
  },
]

export function PricingPage() {
  const [family, setFamily] = useState(false)
  const token = useAuthStore((s) => s.token)
  const { data: subscription } = useSubscription()
  const checkout = useCreateCheckout()

  const currentPlan = subscription?.plan ?? 'FREE'

  function handleSelectPlan(plan: Plan) {
    if (!token) {
      window.location.href = '/login'
      return
    }
    const priceId = PRICE_IDS[plan.key][family ? 'FAMILY' : 'INDIVIDUAL']
    checkout.mutate(priceId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      {/* Nav */}
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-2">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </div>

      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <Badge className="mb-4 bg-teal-50 text-teal-700 border-teal-200">Simple pricing</Badge>
        <h1 className="text-4xl font-bold text-slate-900 mb-3">Choose your plan</h1>
        <p className="text-lg text-slate-500 mb-8 max-w-xl mx-auto">
          Everything you need to co-parent with confidence. Upgrade or downgrade anytime.
        </p>

        {/* Individual / Family toggle */}
        <div className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm">
          <button
            onClick={() => setFamily(false)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
              !family
                ? 'bg-teal-500 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            <User className="w-4 h-4" />
            Individual
          </button>
          <button
            onClick={() => setFamily(true)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
              family
                ? 'bg-teal-500 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            <Users className="w-4 h-4" />
            Full Family
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-teal-100 text-teal-700">
              Both parents
            </span>
          </button>
        </div>

        {family && (
          <p className="mt-3 text-sm text-slate-500">
            Full Family plans give both co-parents access to all features under one subscription.
          </p>
        )}
      </div>

      {/* Plan cards */}
      <div className="max-w-6xl mx-auto px-4 pb-24 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Free card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-slate-400">
              <Star className="w-5 h-5" />
            </span>
            <h3 className="font-bold text-slate-800">Free</h3>
            {currentPlan === 'FREE' && (
              <Badge variant="secondary" className="ml-auto text-xs">Current</Badge>
            )}
          </div>
          <p className="text-sm text-slate-500 mb-4">Get started at no cost</p>
          <div className="mb-6">
            <span className="text-3xl font-bold text-slate-800">$0</span>
            <span className="text-slate-400 text-sm">/mo</span>
          </div>
          <ul className="space-y-2.5 mb-6">
            {['1 child profile', 'Basic custody calendar', 'Expense tracking (limited)', 'Secure messaging', 'Up to 5 moments'].map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                <Check className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
          <Button variant="outline" className="w-full" disabled>
            {currentPlan === 'FREE' ? 'Current plan' : 'Free plan'}
          </Button>
        </div>

        {/* Paid plan cards */}
        {PLANS.map((plan) => {
          const price = family ? plan.familyPrice : plan.individualPrice
          const isCurrentPlan = currentPlan === plan.key
          const isPopular = plan.badge === 'Most Popular'

          return (
            <div
              key={plan.key}
              className={cn(
                'relative bg-white border rounded-2xl p-6 shadow-sm transition-shadow hover:shadow-md',
                isPopular ? 'border-blue-400 shadow-blue-100/60 shadow-md' : 'border-slate-200',
              )}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white shadow">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 mb-1">
                <span className={plan.color}>{plan.icon}</span>
                <h3 className="font-bold text-slate-800">{plan.name}</h3>
                {isCurrentPlan && (
                  <Badge variant="secondary" className="ml-auto text-xs">Current</Badge>
                )}
              </div>
              <p className="text-sm text-slate-500 mb-4">{plan.description}</p>

              <div className="mb-4">
                <span className="text-3xl font-bold text-slate-800">${price}</span>
                <span className="text-slate-400 text-sm">/mo</span>
                {family && (
                  <p className="text-xs text-teal-600 font-medium mt-1">Both parents included</p>
                )}
              </div>

              <ul className="space-y-2.5 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check className={cn('w-4 h-4 shrink-0 mt-0.5', plan.key === 'PLUS' ? 'text-blue-500' : plan.key === 'COMPLETE' ? 'text-purple-500' : 'text-teal-500')} />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                className={cn(
                  'w-full gap-2',
                  plan.key === 'PLUS'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : plan.key === 'COMPLETE'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0'
                    : '',
                )}
                variant={plan.key === 'ESSENTIAL' ? 'outline' : 'default'}
                disabled={isCurrentPlan || checkout.isPending}
                onClick={() => handleSelectPlan(plan)}
              >
                {checkout.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : plan.key === 'COMPLETE' ? (
                  <Crown className="w-4 h-4" />
                ) : null}
                {isCurrentPlan ? 'Current plan' : `Get ${plan.name}`}
              </Button>
            </div>
          )
        })}
      </div>

      {/* Test card note */}
      <div className="max-w-6xl mx-auto px-4 pb-12 text-center">
        <p className="text-xs text-slate-400">
          Test with Stripe card <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">4242 4242 4242 4242</span> · Any future date · Any CVC
        </p>
      </div>
    </div>
  )
}
