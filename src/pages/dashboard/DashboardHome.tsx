import { CalendarDays, DollarSign, Images, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/store/authStore'
import { useFamilies, useChildren } from '@/hooks/useDashboard'
import { useExpenses } from '@/hooks/useExpenses'
import { useMoments } from '@/hooks/useMoments'
import { useRequests } from '@/hooks/useRequests'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
}

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

export function DashboardHome() {
  const user = useAuthStore((s) => s.user)
  const { data: families, isLoading: familiesLoading } = useFamilies()
  const familyId = families?.[0]?.id
  const { data: children } = useChildren(familyId)
  const { data: expenses, isLoading: expLoading } = useExpenses(familyId)
  const { data: moments, isLoading: momLoading } = useMoments(familyId)
  const { data: requests, isLoading: reqLoading } = useRequests(familyId)

  const childCount = children?.length ?? 0
  const pendingRequests = requests?.filter((r) => r.status === 'PENDING').length ?? 0

  const totalExpenses = expenses?.reduce((s, e) => s + parseFloat(e.amount), 0) ?? 0
  const latestMoment = moments?.[0]

  const recentActivity = [
    ...(expenses?.slice(0, 2).map((e) => ({
      label: `Expense added: ${e.description} ($${parseFloat(e.amount).toFixed(2)})`,
      time: new Date(e.date).toLocaleDateString(),
    })) ?? []),
    ...(requests?.slice(0, 2).map((r) => ({
      label: `Schedule request ${r.status.toLowerCase()}: ${r.type.replace('_', ' ')}`,
      time: new Date(r.createdAt).toLocaleDateString(),
    })) ?? []),
    ...(moments?.slice(0, 1).map((m) => ({
      label: `New moment added${m.title ? `: ${m.title}` : ''}`,
      time: new Date(m.createdAt).toLocaleDateString(),
    })) ?? []),
  ].slice(0, 5)

  const isLoading = familiesLoading

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Welcome hero */}
      <div className="bg-gradient-to-br from-teal-400 to-teal-500 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute right-16 bottom-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2" />
        <div className="relative">
          <h1 className="text-2xl font-bold mb-1">
            Good {getGreeting()}, {user?.firstName ?? 'there'}! 👋
          </h1>
          <p className="text-teal-100 text-sm">
            {childCount > 0
              ? `You have ${childCount} child${childCount > 1 ? 'ren' : ''} in your family.`
              : "Let's get your family set up."}
            {pendingRequests > 0 && ` ${pendingRequests} request${pendingRequests > 1 ? 's' : ''} need your attention.`}
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Next Handover"
          icon={CalendarDays}
          value={isLoading ? '—' : childCount > 0 ? 'Tomorrow' : 'No schedule'}
          sub={isLoading ? '' : childCount > 0 ? 'Check calendar for details' : 'Setup a custody schedule'}
          loading={isLoading}
          color="teal"
        />
        <StatCard
          title="Pending Expenses"
          icon={DollarSign}
          value={expLoading ? '—' : `$${totalExpenses.toFixed(2)}`}
          sub={expLoading ? '' : `${expenses?.length ?? 0} expenses logged`}
          loading={expLoading}
          color="coral"
        />
        <StatCard
          title="Latest Moment"
          icon={Images}
          value={momLoading ? '—' : latestMoment?.title ?? (moments?.length ? 'No title' : 'No moments yet')}
          sub={momLoading ? '' : latestMoment ? new Date(latestMoment.createdAt).toLocaleDateString() : 'Upload your first moment'}
          loading={momLoading}
          color="slate"
        />
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center">
              <Activity className="w-4 h-4 text-slate-400" />
            </div>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading || reqLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : recentActivity.length > 0 ? (
            <div>
              {recentActivity.map((item, i) => (
                <ActivityItem key={i} label={item.label} time={item.time} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">
              No activity yet. Start by adding a child, a schedule, or an expense.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
