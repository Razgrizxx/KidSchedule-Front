import { Link } from 'react-router-dom'
import { CalendarDays, DollarSign, Activity, CheckCircle2, Circle, ArrowRight, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/store/authStore'
import { useFamilies, useChildren, useFamily } from '@/hooks/useDashboard'
import { useExpenses } from '@/hooks/useExpenses'
import { useRequests } from '@/hooks/useRequests'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  title,
  icon: Icon,
  value,
  sub,
  loading,
  color = 'teal',
}: {
  title: string
  icon: React.ElementType
  value: string
  sub: string
  loading: boolean
  color?: 'teal' | 'coral' | 'slate'
}) {
  const bg = color === 'teal' ? 'bg-teal-50' : color === 'coral' ? 'bg-orange-50' : 'bg-slate-50'
  const ic = color === 'teal' ? 'text-teal-500' : color === 'coral' ? 'text-orange-400' : 'text-slate-400'

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className={`w-11 h-11 rounded-2xl ${bg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-5 h-5 ${ic}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">{title}</p>
            {loading ? (
              <>
                <Skeleton className="h-6 w-24 mb-1" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <p className="text-xl font-bold text-slate-800">{value}</p>
                <p className="text-sm text-slate-400 mt-0.5">{sub}</p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Activity item ────────────────────────────────────────────────────────────

function ActivityItem({ label, time }: { label: string; time: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-teal-300 shrink-0" />
        <span className="text-sm text-slate-700">{label}</span>
      </div>
      <span className="text-xs text-slate-400 shrink-0">{time}</span>
    </div>
  )
}

// ─── Onboarding checklist ─────────────────────────────────────────────────────

function OnboardingChecklist({
  hasChild,
  hasCoParent,
}: {
  hasChild: boolean
  hasCoParent: boolean
}) {
  const steps = [
    {
      done: hasChild,
      label: 'Add your first child',
      sub: 'Children are the center of your schedule',
      href: '/dashboard/family',
    },
    {
      done: hasCoParent,
      label: 'Invite your co-parent',
      sub: 'They\'ll have access to the shared schedule',
      href: '/dashboard/family',
    },
    {
      done: false,
      label: 'Set up a custody schedule',
      sub: 'Choose a pattern that fits your arrangement',
      href: '/dashboard/calendar',
    },
  ]

  const doneCount = steps.filter((s) => s.done).length

  return (
    <Card className="border-teal-100 bg-gradient-to-br from-white to-teal-50/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Getting Started</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              {doneCount} of {steps.length} steps completed
            </p>
          </div>
          <div className="flex gap-1">
            {steps.map((s, i) => (
              <div
                key={i}
                className={`h-1.5 w-8 rounded-full transition-colors ${
                  s.done ? 'bg-teal-400' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-1">
        {steps.map((step, i) => (
          <Link
            key={i}
            to={step.href}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${
              step.done
                ? 'opacity-60 cursor-default pointer-events-none'
                : 'hover:bg-white hover:shadow-sm'
            }`}
          >
            {step.done ? (
              <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-slate-300 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium ${
                  step.done ? 'line-through text-slate-400' : 'text-slate-700'
                }`}
              >
                {step.label}
              </p>
              {!step.done && (
                <p className="text-xs text-slate-400 mt-0.5">{step.sub}</p>
              )}
            </div>
            {!step.done && (
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-teal-400 transition-colors shrink-0" />
            )}
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DashboardHome() {
  const user = useAuthStore((s) => s.user)
  const { data: families, isLoading: familiesLoading } = useFamilies()
  const familyId = families?.[0]?.id

  const { data: children, isLoading: childrenLoading } = useChildren(familyId)
  const { data: family } = useFamily(familyId)
  const { data: expenses, isLoading: expLoading } = useExpenses(familyId)
  const { data: requests, isLoading: reqLoading } = useRequests(familyId)

  const childCount = children?.length ?? 0
  const memberCount = family?.members?.length ?? 0
  const pendingBalance = expenses?.reduce((sum, e) => {
    const amt = parseFloat(e.amount)
    const split = parseFloat(e.splitRatio)
    return e.paidBy === user?.id ? sum + amt * (1 - split) : sum - amt * split
  }, 0) ?? 0

  const pendingRequests = requests?.filter((r) => r.status === 'PENDING').length ?? 0

  const recentActivity = [
    ...(requests?.slice(0, 3).map((r) => ({
      label: `Schedule request — ${r.type.replace('_', ' ').toLowerCase()} · ${r.status.toLowerCase()}`,
      time: new Date(r.createdAt).toLocaleDateString(),
    })) ?? []),
    ...(expenses?.slice(0, 2).map((e) => ({
      label: `Expense: ${e.description} ($${parseFloat(e.amount).toFixed(2)})`,
      time: new Date(e.date).toLocaleDateString(),
    })) ?? []),
  ].slice(0, 5)

  const isNew = !familiesLoading && !childrenLoading && childCount === 0
  const hasCoParent = memberCount > 1

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Welcome hero */}
      <div className="bg-gradient-to-br from-teal-400 to-teal-500 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute right-16 bottom-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2" />
        <div className="relative">
          <h1 className="text-2xl font-bold mb-1">
            Good {getGreeting()}, {user?.firstName ?? 'there'}!
          </h1>
          <p className="text-teal-100 text-sm">
            {childCount > 0
              ? `${childCount} child${childCount > 1 ? 'ren' : ''} in your family${pendingRequests > 0 ? ` · ${pendingRequests} request${pendingRequests > 1 ? 's' : ''} pending` : ''}`
              : "Welcome! Let's get your family set up."}
          </p>
        </div>
      </div>

      {/* Empty state — new user */}
      {isNew && (
        <Card className="border-2 border-dashed border-slate-200 bg-white">
          <CardContent className="py-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-teal-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 mb-1">
              Your dashboard is ready
            </h3>
            <p className="text-sm text-slate-400 max-w-xs mx-auto mb-5">
              Start by adding your children and inviting your co-parent to unlock
              schedules, expenses, and messages.
            </p>
            <Button asChild>
              <Link to="/dashboard/family" className="gap-2">
                <Users className="w-4 h-4" />
                Set up your family
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stat widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Next Event"
          icon={CalendarDays}
          value={familiesLoading ? '—' : childCount > 0 ? 'See calendar' : 'No schedule yet'}
          sub={childCount > 0 ? 'Open calendar for details' : 'Add a child to create a schedule'}
          loading={familiesLoading}
          color="teal"
        />
        <StatCard
          title="Pending Balance"
          icon={DollarSign}
          value={expLoading ? '—' : `$${Math.abs(pendingBalance).toFixed(2)}`}
          sub={
            expLoading
              ? ''
              : pendingBalance > 0
              ? 'You are owed'
              : pendingBalance < 0
              ? 'You owe'
              : 'All settled'
          }
          loading={expLoading}
          color="coral"
        />
      </div>

      {/* Onboarding checklist (shown until family is configured) */}
      {(!hasCoParent || childCount === 0) && !familiesLoading && !childrenLoading && (
        <OnboardingChecklist hasChild={childCount > 0} hasCoParent={hasCoParent} />
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center">
                <Activity className="w-4 h-4 text-slate-400" />
              </div>
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </div>
            {recentActivity.length > 0 && (
              <Link
                to="/dashboard/requests"
                className="text-xs text-teal-500 hover:underline"
              >
                View all
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {familiesLoading || reqLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : recentActivity.length > 0 ? (
            recentActivity.map((item, i) => (
              <ActivityItem key={i} label={item.label} time={item.time} />
            ))
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">
              No activity yet. Add a child and set up a schedule to get started.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
