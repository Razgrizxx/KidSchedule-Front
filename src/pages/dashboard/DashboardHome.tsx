import { Link } from 'react-router-dom'
import {
  CalendarDays, DollarSign, ArrowRight, Users, CheckCircle2, Circle,
  Scale, ClipboardList, Baby, Clock, TrendingUp, AlertCircle,
  CalendarClock, Wallet,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/store/authStore'
import { useFamilies, useChildren, useFamily } from '@/hooks/useDashboard'
import { useExpenseBalance } from '@/hooks/useExpenses'
import { useRequests } from '@/hooks/useRequests'
import { useMediationStats } from '@/hooks/useMediation'
import { useCustodyEvents, useEvents } from '@/hooks/useCalendar'
import type { CustodyEvent, CalendarEvent, ChangeRequest } from '@/types/api'
import { cn } from '@/lib/utils'

// ── helpers ───────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
}

const TODAY = new Date()
const TODAY_STR = TODAY.toISOString().slice(0, 10)
const CURRENT_MONTH = TODAY.toISOString().slice(0, 7)

function fmtDate(d: string) {
  return new Date(d.slice(0, 10) + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function daysUntil(dateStr: string) {
  const diff = Math.round(
    (new Date(dateStr.slice(0, 10) + 'T12:00:00').getTime() - TODAY.setHours(12, 0, 0, 0)) /
      86400000,
  )
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff < 0) return null
  return `In ${diff}d`
}

const EVENT_TYPE_COLOR: Record<string, string> = {
  SCHOOL: 'bg-blue-100 text-blue-700',
  MEDICAL: 'bg-red-100 text-red-700',
  ACTIVITY: 'bg-amber-100 text-amber-700',
  VACATION: 'bg-teal-100 text-teal-600',
  CUSTODY_TIME: 'bg-violet-100 text-violet-700',
  OTHER: 'bg-slate-100 text-slate-600',
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  title, icon: Icon, value, sub, loading, color = 'slate', to, alert,
}: {
  title: string
  icon: React.ElementType
  value: string | number
  sub: string
  loading: boolean
  color?: 'teal' | 'coral' | 'slate' | 'violet' | 'amber'
  to?: string
  alert?: boolean
}) {
  const COLORS = {
    teal: ['bg-teal-50', 'text-teal-500'],
    coral: ['bg-orange-50', 'text-orange-400'],
    slate: ['bg-slate-50', 'text-slate-400'],
    violet: ['bg-violet-50', 'text-violet-500'],
    amber: ['bg-amber-50', 'text-amber-500'],
  }
  const [bg, ic] = COLORS[color]

  const inner = (
    <CardContent className="pt-5 pb-4">
      <div className="flex items-start gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', bg)}>
          <Icon className={cn('w-5 h-5', ic)} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">{title}</p>
          {loading ? (
            <><Skeleton className="h-6 w-20 mb-1" /><Skeleton className="h-3 w-28" /></>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold text-slate-800">{value}</p>
                {alert && <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
            </>
          )}
        </div>
        {to && !loading && (
          <ArrowRight className="w-4 h-4 text-slate-300 shrink-0 mt-1" />
        )}
      </div>
    </CardContent>
  )

  return (
    <Card className={cn(to && 'hover:shadow-md transition-shadow cursor-pointer')}>
      {to ? <Link to={to}>{inner}</Link> : inner}
    </Card>
  )
}

// ── Today's custody strip ─────────────────────────────────────────────────────

function TodayCustody({
  familyId,
  children,
  members,
  userId,
}: {
  familyId: string
  children: { id: string; firstName: string; color: string }[]
  members: { userId: string; user: { id: string; firstName: string; lastName: string } }[]
  userId: string
}) {
  const { data: events, isLoading } = useCustodyEvents(familyId, CURRENT_MONTH)

  const todayEvents = events?.filter((e) => e.date.slice(0, 10) === TODAY_STR) ?? []

  if (isLoading) {
    return (
      <div className="flex gap-3">
        {[1, 2].map((i) => <Skeleton key={i} className="h-14 flex-1 rounded-xl" />)}
      </div>
    )
  }

  if (todayEvents.length === 0) {
    return (
      <p className="text-sm text-slate-400 py-2">No custody schedule set up yet.</p>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {todayEvents.map((e: CustodyEvent) => {
        const child = children.find((c) => c.id === e.childId)
        const custodian = members.find((m) => m.userId === e.custodianId)?.user
        const isMe = e.custodianId === userId
        return (
          <div
            key={e.id}
            className="flex items-center gap-2.5 bg-white border border-slate-100 rounded-xl px-3 py-2 shadow-sm"
          >
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: child?.color ?? '#94a3b8' }}
            />
            <div>
              <p className="text-sm font-medium text-slate-800">{child?.firstName ?? '—'}</p>
              <p className="text-xs text-slate-400">
                {isMe ? 'With you' : `With ${custodian?.firstName ?? 'co-parent'}`}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Next transition ───────────────────────────────────────────────────────────

function NextTransition({
  familyId,
  children,
  members,
  userId,
}: {
  familyId: string
  children: { id: string; firstName: string; color: string }[]
  members: { userId: string; user: { id: string; firstName: string; lastName: string } }[]
  userId: string
}) {
  const { data: events } = useCustodyEvents(familyId, CURRENT_MONTH)

  const upcoming = events
    ?.filter((e) => {
      const d = e.date.slice(0, 10)
      return d > TODAY_STR
    })
    .reduce<Record<string, CustodyEvent>>((acc, e) => {
      if (!acc[e.childId] || e.date < acc[e.childId].date) acc[e.childId] = e
      return acc
    }, {})

  const transitions = Object.values(upcoming ?? {}).filter((e) => {
    const prevDay = new Date(new Date(e.date).getTime() - 86400000)
      .toISOString()
      .slice(0, 10)
    const prevEvent = events?.find(
      (p) => p.childId === e.childId && p.date.slice(0, 10) === prevDay,
    )
    return !prevEvent || prevEvent.custodianId !== e.custodianId
  })

  if (transitions.length === 0) return null

  const next = transitions.sort((a, b) => a.date.localeCompare(b.date))[0]
  const child = children.find((c) => c.id === next.childId)
  const custodian = members.find((m) => m.userId === next.custodianId)?.user
  const isMe = next.custodianId === userId
  const label = daysUntil(next.date)

  return (
    <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
      <CalendarClock className="w-3.5 h-3.5 shrink-0 text-teal-400" />
      <span>
        Next transition: <strong>{child?.firstName}</strong> goes to{' '}
        <strong>{isMe ? 'you' : custodian?.firstName ?? 'co-parent'}</strong> on{' '}
        {fmtDate(next.date)}{label ? ` · ${label}` : ''}
      </span>
    </div>
  )
}

// ── Upcoming events ───────────────────────────────────────────────────────────

function UpcomingEvents({ familyId }: { familyId: string }) {
  const { data: events, isLoading } = useEvents(familyId, CURRENT_MONTH)

  const upcoming = events
    ?.filter((e) => {
      const start = e.startAt.slice(0, 10)
      return start >= TODAY_STR
    })
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
    .slice(0, 5) ?? []

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
      </div>
    )
  }

  if (upcoming.length === 0) {
    return <p className="text-sm text-slate-400 py-4 text-center">No upcoming events.</p>
  }

  return (
    <div className="space-y-2">
      {upcoming.map((e: CalendarEvent) => {
        const label = daysUntil(e.startAt.slice(0, 10))
        return (
          <div key={e.id} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
            <div className="flex flex-col items-center w-10 shrink-0 text-center mt-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-medium">
                {new Date(e.startAt.slice(0, 10) + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' })}
              </span>
              <span className="text-lg font-bold text-slate-700 leading-none">
                {new Date(e.startAt.slice(0, 10) + 'T12:00:00').getDate()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-slate-800 truncate">{e.title}</p>
                {label && (
                  <Badge className={cn('text-[10px] border shrink-0', EVENT_TYPE_COLOR[e.type] ?? 'bg-slate-100 text-slate-600')}>
                    {label}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {e.allDay ? 'All day' : fmtTime(e.startAt)}
                {e.assignedTo && ` · ${e.assignedTo.firstName}`}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Pending requests ──────────────────────────────────────────────────────────

function PendingRequests({
  requests,
  userId,
}: {
  requests: ChangeRequest[]
  userId: string
}) {
  const pending = requests.filter((r) => r.status === 'PENDING').slice(0, 3)

  if (pending.length === 0) {
    return <p className="text-sm text-slate-400 py-3 text-center">No pending requests.</p>
  }

  return (
    <div className="space-y-2">
      {pending.map((r) => {
        const isIncoming = r.requesterId !== userId
        return (
          <div key={r.id} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
            <div className={cn(
              'w-2 h-2 rounded-full mt-1.5 shrink-0',
              isIncoming ? 'bg-amber-400' : 'bg-teal-400',
            )} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-700">
                {isIncoming ? `From ${r.requester?.firstName ?? 'Co-parent'}` : 'Your request'}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {r.reason || (r.originalDate
                  ? `Swap ${fmtDate(r.originalDate)} → ${fmtDate(r.requestedDate)}`
                  : fmtDate(r.requestedDate))}
              </p>
            </div>
            <Badge className="text-[10px] border bg-amber-50 text-amber-600 border-amber-200 shrink-0">
              Pending
            </Badge>
          </div>
        )
      })}
    </div>
  )
}

// ── Onboarding ────────────────────────────────────────────────────────────────

function OnboardingChecklist({ hasChild, hasCoParent }: { hasChild: boolean; hasCoParent: boolean }) {
  const steps = [
    { done: hasChild, label: 'Add your first child', href: '/dashboard/family' },
    { done: hasCoParent, label: 'Invite your co-parent', href: '/dashboard/family' },
    { done: false, label: 'Set up a custody schedule', href: '/dashboard/calendar' },
  ]
  const doneCount = steps.filter((s) => s.done).length

  return (
    <Card className="border-teal-100 bg-gradient-to-br from-white to-teal-50/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Getting Started · {doneCount}/{steps.length}</CardTitle>
          <div className="flex gap-1">
            {steps.map((s, i) => (
              <div key={i} className={cn('h-1.5 w-8 rounded-full', s.done ? 'bg-teal-400' : 'bg-slate-200')} />
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-1">
        {steps.map((step, i) => (
          <Link
            key={i}
            to={step.href}
            className={cn(
              'flex items-center gap-3 p-3 rounded-xl transition-all group',
              step.done ? 'opacity-60 pointer-events-none' : 'hover:bg-white hover:shadow-sm',
            )}
          >
            {step.done
              ? <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
              : <Circle className="w-5 h-5 text-slate-300 shrink-0" />}
            <p className={cn('text-sm flex-1', step.done ? 'line-through text-slate-400' : 'text-slate-700 font-medium')}>
              {step.label}
            </p>
            {!step.done && <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-teal-400 transition-colors" />}
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function DashboardHome() {
  const user = useAuthStore((s) => s.user)
  const { data: families, isLoading: familiesLoading } = useFamilies()
  const familyId = families?.[0]?.id

  const { data: children = [], isLoading: childrenLoading } = useChildren(familyId)
  const { data: family } = useFamily(familyId)
  const { data: balance, isLoading: balanceLoading } = useExpenseBalance(familyId)
  const { data: requests = [], isLoading: reqLoading } = useRequests(familyId)
  const { data: medStats } = useMediationStats(familyId)

  const members = family?.members ?? []
  const memberCount = members.length
  const childCount = children.length
  const hasCoParent = memberCount > 1
  const isNew = !familiesLoading && !childrenLoading && childCount === 0

  // Balance: find what the current user owes / is owed
  const myBalance = balance?.members.find((m) => m.user.id === user?.id)?.balance ?? 0
  const pendingCount = balance?.summary?.pendingCount ?? 0

  // Requests
  const pendingRequests = requests.filter((r) => r.status === 'PENDING').length
  const incomingPending = requests.filter(
    (r) => r.status === 'PENDING' && r.requesterId !== user?.id,
  ).length

  // Mediation
  const activeSessions = medStats?.active ?? 0

  const todayFormatted = TODAY.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  return (
    <div className="space-y-5 max-w-5xl">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-teal-400 to-teal-500 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute right-16 bottom-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2" />
        <div className="relative">
          <p className="text-teal-200 text-xs font-medium mb-1">{todayFormatted}</p>
          <h1 className="text-2xl font-bold mb-1">Good {getGreeting()}, {user?.firstName ?? 'there'}!</h1>
          <p className="text-teal-100 text-sm">
            {childCount > 0
              ? [
                  `${childCount} child${childCount > 1 ? 'ren' : ''}`,
                  pendingRequests > 0 && `${pendingRequests} pending request${pendingRequests > 1 ? 's' : ''}`,
                  activeSessions > 0 && `${activeSessions} active mediation${activeSessions > 1 ? 's' : ''}`,
                ].filter(Boolean).join(' · ')
              : "Welcome! Let's get your family set up."}
          </p>
        </div>
      </div>

      {/* ── Onboarding ────────────────────────────────────────────────────── */}
      {(!hasCoParent || childCount === 0) && !familiesLoading && !childrenLoading && (
        <OnboardingChecklist hasChild={childCount > 0} hasCoParent={hasCoParent} />
      )}

      {/* ── Stat cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Children"
          icon={Baby}
          value={childrenLoading ? '—' : childCount}
          sub={childCount === 0 ? 'Add your first child' : `${memberCount} family member${memberCount !== 1 ? 's' : ''}`}
          loading={childrenLoading}
          color="teal"
          to="/dashboard/family"
        />
        <StatCard
          title="Balance"
          icon={Wallet}
          value={balanceLoading ? '—' : myBalance === 0 ? 'Settled' : `$${Math.abs(myBalance).toFixed(0)}`}
          sub={balanceLoading ? '' : myBalance > 0 ? 'Co-parent owes you' : myBalance < 0 ? 'You owe co-parent' : `${pendingCount} unsettled expense${pendingCount !== 1 ? 's' : ''}`}
          loading={balanceLoading}
          color="coral"
          alert={myBalance !== 0 && pendingCount > 0}
          to="/dashboard/expenses"
        />
        <StatCard
          title="Requests"
          icon={ClipboardList}
          value={reqLoading ? '—' : pendingRequests}
          sub={reqLoading ? '' : incomingPending > 0 ? `${incomingPending} waiting on you` : pendingRequests === 0 ? 'All up to date' : 'Sent, awaiting response'}
          loading={reqLoading}
          color="amber"
          alert={incomingPending > 0}
          to="/dashboard/requests"
        />
        <StatCard
          title="Mediation"
          icon={Scale}
          value={activeSessions}
          sub={activeSessions === 0 ? `${medStats?.resolutionRate ?? 0}% resolution rate` : `${activeSessions} active session${activeSessions !== 1 ? 's' : ''}`}
          loading={familiesLoading}
          color="violet"
          to="/dashboard/mediation"
        />
      </div>

      {/* ── Main content: Today | Action Items ────────────────────────────── */}
      {!isNew && childCount > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Today + Upcoming */}
          <div className="lg:col-span-3 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center">
                      <CalendarDays className="w-4 h-4 text-teal-500" />
                    </div>
                    <CardTitle className="text-base">Today's Custody</CardTitle>
                  </div>
                  <Link to="/dashboard/calendar" className="text-xs text-teal-500 hover:underline">
                    Calendar →
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {familyId && (
                  <>
                    <TodayCustody
                      familyId={familyId}
                      children={children}
                      members={members}
                      userId={user?.id ?? ''}
                    />
                    <NextTransition
                      familyId={familyId}
                      children={children}
                      members={members}
                      userId={user?.id ?? ''}
                    />
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-blue-500" />
                    </div>
                    <CardTitle className="text-base">Upcoming Events</CardTitle>
                  </div>
                  <Link to="/dashboard/calendar" className="text-xs text-teal-500 hover:underline">
                    View all →
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {familyId && <UpcomingEvents familyId={familyId} />}
              </CardContent>
            </Card>
          </div>

          {/* Action items */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                      <ClipboardList className="w-4 h-4 text-amber-500" />
                    </div>
                    <CardTitle className="text-base">Pending Requests</CardTitle>
                  </div>
                  <Link to="/dashboard/requests" className="text-xs text-teal-500 hover:underline">
                    All →
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {reqLoading ? (
                  <div className="space-y-2">
                    {[1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : (
                  <PendingRequests requests={requests} userId={user?.id ?? ''} />
                )}
                {incomingPending > 0 && (
                  <Button asChild size="sm" className="w-full mt-3">
                    <Link to="/dashboard/requests">
                      Review {incomingPending} incoming request{incomingPending > 1 ? 's' : ''}
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-orange-400" />
                  </div>
                  <CardTitle className="text-base">Expense Summary</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {balanceLoading ? (
                  <div className="space-y-2">
                    {[1, 2].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
                  </div>
                ) : balance ? (
                  <div className="space-y-2">
                    {balance.members.map((m) => {
                      const isMe = m.user.id === user?.id
                      return (
                        <div key={m.user.id} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                          <span className="text-sm text-slate-600">
                            {isMe ? 'You' : `${m.user.firstName} ${m.user.lastName}`}
                          </span>
                          <span className={cn(
                            'text-sm font-semibold',
                            m.balance > 0 ? 'text-teal-600' : m.balance < 0 ? 'text-red-500' : 'text-slate-400',
                          )}>
                            {m.balance >= 0 ? '+' : ''}{m.balance.toFixed(2)}
                          </span>
                        </div>
                      )
                    })}
                    <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
                      <span>{pendingCount} unsettled</span>
                      <Link to="/dashboard/expenses" className="text-teal-500 hover:underline">
                        Manage →
                      </Link>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 text-center py-3">No expenses yet.</p>
                )}
              </CardContent>
            </Card>

            {activeSessions > 0 && (
              <Card className="border-violet-100">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                      <Scale className="w-4 h-4 text-violet-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">
                        {activeSessions} active mediation{activeSessions > 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-slate-400">Session{activeSessions > 1 ? 's' : ''} in progress</p>
                    </div>
                    <Button asChild size="sm" variant="outline" className="shrink-0">
                      <Link to="/dashboard/mediation">
                        <TrendingUp className="w-3.5 h-3.5 mr-1" /> Open
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{children.map((c) => c.firstName).join(', ') || 'No children yet'}</p>
                    <p className="text-xs text-slate-400">{memberCount} family member{memberCount !== 1 ? 's' : ''}</p>
                  </div>
                  <Button asChild size="sm" variant="ghost" className="shrink-0">
                    <Link to="/dashboard/family"><ArrowRight className="w-4 h-4" /></Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
