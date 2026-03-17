import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

type PlanType = 'perParent' | 'fullFamily'

interface Plan {
  id: string
  name: string
  prices: Record<PlanType, string>
  description: string
  features: string[]
  popular: boolean
}

const plans: Plan[] = [
  {
    id: 'essential',
    name: 'Essential',
    prices: { perParent: '$5.99', fullFamily: '$8.99' },
    description: 'Perfect for getting started',
    features: [
      '1 child profile',
      'School calendar sync',
      'Basic reminders',
      'iOS & Android app',
      'Google & Apple Calendar sync',
    ],
    popular: false,
  },
  {
    id: 'plus',
    name: 'Plus',
    prices: { perParent: '$8.99', fullFamily: '$15.99' },
    description: 'Most popular for active families',
    features: [
      'Up to 4 child profiles',
      'School calendar sync',
      'AI calendar import',
      'Smart reminders',
      'Co-parent sharing',
      'Caregiver access',
      'All calendar syncs',
    ],
    popular: true,
  },
  {
    id: 'complete',
    name: 'Complete',
    prices: { perParent: '$11.99', fullFamily: '$19.99' },
    description: 'For large families & teams',
    features: [
      'Unlimited child profiles',
      'Everything in Plus',
      'Team & club management',
      'PTA school publishing',
      'Priority support',
      'Early access to new features',
      'Family activity reports',
    ],
    popular: false,
  },
]

export function Pricing() {
  const [planType, setPlanType] = useState<PlanType>('perParent')

  return (
    <section id="pricing" className="py-24 px-4 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            Simple, honest pricing
          </h2>
          <p className="text-slate-500 text-lg mb-10">
            Start free for 60 days. No credit card required.
          </p>

          {/* Toggle */}
          <div className="inline-flex flex-col items-center gap-3">
            <div className="flex items-center gap-4 bg-white rounded-2xl border border-slate-100 shadow-sm p-2 px-5">
              <span
                className={`text-sm font-medium transition-colors ${
                  planType === 'perParent' ? 'text-slate-800' : 'text-slate-400'
                }`}
              >
                Per Parent
              </span>
              <Switch
                checked={planType === 'fullFamily'}
                onCheckedChange={(checked) =>
                  setPlanType(checked ? 'fullFamily' : 'perParent')
                }
              />
              <span
                className={`text-sm font-medium transition-colors ${
                  planType === 'fullFamily' ? 'text-slate-800' : 'text-slate-400'
                }`}
              >
                Full Family
              </span>
            </div>
            <p className="text-sm font-medium text-teal-600">
              {planType === 'fullFamily'
                ? '✓ You\'re saving up to 15% with a Full Family plan'
                : 'Save up to 15% with a Full Family plan'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              <Card
                className={`h-full flex flex-col ${
                  plan.popular
                    ? 'border-2 border-[#66CCCC] shadow-md shadow-teal-100'
                    : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-[#66CCCC] text-white border-0 px-4 py-1 text-xs font-semibold rounded-full shadow-sm">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className={`pb-4 ${plan.popular ? 'pt-8' : 'pt-6'}`}>
                  <div className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">
                    {plan.name}
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${plan.id}-${planType}`}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.18 }}
                      className="flex items-end gap-1"
                    >
                      <span className="text-4xl font-bold text-slate-800">
                        {plan.prices[planType]}
                      </span>
                      <span className="text-slate-400 text-sm mb-1">/mo</span>
                    </motion.div>
                  </AnimatePresence>
                  <p className="text-slate-500 text-sm mt-1">{plan.description}</p>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                        <span className="text-slate-600 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={plan.popular ? 'default' : 'outline'}
                    className={`w-full ${
                      plan.popular
                        ? 'bg-[#66CCCC] hover:bg-teal-500 shadow-sm shadow-teal-200'
                        : ''
                    }`}
                    onClick={() => {
                      const type = planType === 'fullFamily' ? 'family' : 'parent'
                      window.location.href = `/register?plan=${plan.id}&type=${type}`
                    }}
                  >
                    Start Free Trial
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
