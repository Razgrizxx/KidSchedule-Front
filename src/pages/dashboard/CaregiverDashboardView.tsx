import { useMemo } from 'react'
import {
  Calendar,
  Shield,
  Phone,
  Mail,
  Baby,
  Loader2,
  Lock,
  AlertCircle,
  LogOut,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/store/authStore'
import { useCaregiverDashboard } from '@/hooks/useCaregiverPortal'

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function getAge(dob: string) {
  const d = new Date(dob)
  const months =
    (new Date().getFullYear() - d.getFullYear()) * 12 + (new Date().getMonth() - d.getMonth())
  return months < 24 ? `${months}mo` : `${Math.floor(months / 12)}y`
}

// ── Calendar section ──────────────────────────────────────────────────────────

function MiniCalendar({
  events,
  children,
}: {
  events: { id: string; date: string; childId: string; custodianId: string }[]
  children: { id: string; firstName: string; color: string }[]
}) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const grid: (number | null)[] = Array(firstDay).fill(null)
  for (let d = 1; d <= daysInMonth; d++) grid.push(d)
  while (grid.length % 7 !== 0) grid.push(null)

  const eventMap = useMemo(() => {
    const m: Record<string, string> = {}
    for (const ev of events) {
      const day = new Date(ev.date).getDate()
      const child = children.find((c) => c.id === ev.childId)
      if (child) m[day] = child.color
    }
    return m
  }, [events, children])

  return (
    <div>
      <p className="text-sm font-semibold text-slate-700 mb-3">
        {MONTH_NAMES[month]} {year}
      </p>
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-[10px] font-medium text-slate-400">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {grid.map((day, i) => {
          if (!day) return <div key={i} />
          const color = eventMap[day]
          const isToday = day === now.getDate()
          return (
            <div
              key={i}
              className={`h-8 w-full flex items-center justify-center rounded-lg text-xs font-medium transition-all ${
                isToday
                  ? 'bg-slate-800 text-white'
                  : color
                    ? 'text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
              }`}
              style={color && !isToday ? { backgroundColor: color + 'cc' } : {}}
              title={color ? `Custody day` : undefined}
            >
              {day}
            </div>
          )
        })}
      </div>
      {/* Legend */}
      {children.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-4">
          {children.map((c) => (
            <div key={c.id} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
              <span className="text-xs text-slate-500">{c.firstName}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Access denied card ────────────────────────────────────────────────────────

function AccessDeniedCard({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
        <Lock className="w-5 h-5 text-slate-300" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-400">{label} is private</p>
        <p className="text-xs text-slate-300 mt-0.5">
          This information is only visible to parents.
        </p>
      </div>
    </div>
  )
}

// ── Main view ─────────────────────────────────────────────────────────────────

export function CaregiverDashboardView() {
  const caregiverData = useAuthStore((s) => s.caregiverData)
  const clearCaregiverAccess = useAuthStore((s) => s.clearCaregiverAccess)
  const { data, isLoading, isError } = useCaregiverDashboard()

  const childName =
    caregiverData?.children.map((c) => c.firstName).join(' & ') ?? 'the children'

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <Shield className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 leading-none">
                {caregiverData?.name ?? 'Caregiver'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Read-only access · {childName}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCaregiverAccess}
            className="text-slate-400 hover:text-slate-600 gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            Exit
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* Error state */}
        {isError && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-sm text-red-600">
              Could not load dashboard data. Your access link may have expired.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={clearCaregiverAccess}
              className="ml-auto shrink-0"
            >
              Exit
            </Button>
          </div>
        )}

        {/* 2-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Calendar */}
          <Card className="md:col-span-2 rounded-2xl border-slate-100 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-teal-500" />
                </div>
                <CardTitle className="text-base">Custody Calendar</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {!caregiverData?.permissions.canViewCalendar ? (
                <AccessDeniedCard label="Calendar" />
              ) : isLoading ? (
                <Skeleton className="h-52 w-full rounded-xl" />
              ) : (
                <MiniCalendar
                  events={data?.custodyEvents ?? []}
                  children={data?.children ?? []}
                />
              )}
            </CardContent>
          </Card>

          {/* Children info */}
          <Card className="rounded-2xl border-slate-100 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Baby className="w-4 h-4 text-amber-500" />
                </div>
                <CardTitle className="text-base">Children</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {!caregiverData?.permissions.canViewHealthInfo ? (
                <AccessDeniedCard label="Child info" />
              ) : isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              ) : !data?.children.length ? (
                <p className="text-sm text-slate-400 text-center py-6">No children assigned.</p>
              ) : (
                <div className="space-y-2">
                  {data.children.map((child) => {
                    const initials = `${child.firstName[0]}${child.lastName[0]}`.toUpperCase()
                    return (
                      <div
                        key={child.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-50"
                      >
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                          style={{ backgroundColor: child.color + '28', color: child.color }}
                        >
                          {initials}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {child.firstName} {child.lastName}
                          </p>
                          <p className="text-xs text-slate-400">
                            {getAge(child.dateOfBirth)} old
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Emergency Contacts */}
          <Card className="rounded-2xl border-slate-100 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-red-400" />
                </div>
                <CardTitle className="text-base">Emergency Contacts</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {!caregiverData?.permissions.canViewEmergencyContacts ? (
                <AccessDeniedCard label="Emergency contacts" />
              ) : isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              ) : !data?.contacts.length ? (
                <p className="text-sm text-slate-400 text-center py-6">No contacts available.</p>
              ) : (
                <div className="space-y-2">
                  {data.contacts.map((c, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 space-y-1">
                      <p className="text-sm font-semibold text-slate-800">
                        {c.firstName} {c.lastName}
                      </p>
                      {c.phone && (
                        <a
                          href={`tel:${c.phone}`}
                          className="flex items-center gap-1.5 text-xs text-teal-600 hover:underline"
                        >
                          <Phone className="w-3 h-3" />
                          {c.phone}
                        </a>
                      )}
                      {c.email && (
                        <a
                          href={`mailto:${c.email}`}
                          className="flex items-center gap-1.5 text-xs text-slate-500 hover:underline"
                        >
                          <Mail className="w-3 h-3" />
                          {c.email}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        <p className="text-center text-xs text-slate-300 pb-4">
          Read-only access — powered by KidSchedule
        </p>
      </div>
    </div>
  )
}
