import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Calendar, Loader2, AlertCircle, School, Trophy, MapPin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import api from '@/api'
import type { OrgEvent, OrgType } from '@/types/api'

// ── Types ──────────────────────────────────────────────────────────────────

interface OrgPortalData {
  org: { id: string; name: string; type: OrgType; description?: string }
  childName: string
  events: OrgEvent[]
}

// ── Hook ───────────────────────────────────────────────────────────────────

function useOrgPortal(token: string | null) {
  return useQuery<OrgPortalData>({
    queryKey: ['org-portal', token],
    queryFn: () => api.get('/public/organizations/portal', { params: { token } }).then((r) => r.data),
    enabled: !!token,
    retry: false,
  })
}

// ── Component ──────────────────────────────────────────────────────────────

export function OrgPortalPage() {
  const [params] = useSearchParams()
  const token = params.get('token')

  const { data, isLoading, isError, error } = useOrgPortal(token)

  if (!token) return <ErrorState message="No access token found in the URL." />

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex flex-col items-center gap-4 py-12">
          <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
          <p className="text-sm text-slate-500">Loading…</p>
        </div>
      </PageShell>
    )
  }

  if (isError || !data) {
    const msg = error instanceof Error ? error.message : 'This link is invalid or has expired.'
    return <ErrorState message={msg} />
  }

  const { org, childName, events } = data

  const upcoming = events
    .filter((e) => new Date(e.startAt) >= new Date())
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())

  return (
    <PageShell>
      {/* Org header */}
      <div className="flex flex-col items-center gap-2 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center">
          {org.type === 'SCHOOL'
            ? <School className="w-7 h-7 text-teal-500" />
            : <Trophy className="w-7 h-7 text-teal-500" />}
        </div>
        <h1 className="text-xl font-bold text-slate-800 text-center">{org.name}</h1>
        {org.description && <p className="text-sm text-slate-500 text-center">{org.description}</p>}
        <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-600 border border-teal-100">
          {org.type === 'SCHOOL' ? 'School' : 'Team'}
        </span>
      </div>

      {/* Child badge */}
      <div className="flex items-center justify-center gap-2 mb-6 p-3 rounded-xl bg-slate-50 border border-slate-100">
        <Calendar className="w-4 h-4 text-slate-400" />
        <p className="text-sm text-slate-600">
          Schedule for <strong className="text-slate-800">{childName}</strong>
        </p>
      </div>

      {/* Upcoming events */}
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
        Upcoming events
      </p>
      {upcoming.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">No upcoming events.</p>
      ) : (
        <div className="space-y-2">
          {upcoming.map((ev) => (
            <div key={ev.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-white">
              <div className="text-center min-w-[40px]">
                <div className="text-[10px] text-slate-400 uppercase">
                  {new Date(ev.startAt).toLocaleDateString('en-US', { month: 'short' })}
                </div>
                <div className="text-lg font-bold text-slate-800 leading-none">
                  {new Date(ev.startAt).getDate()}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">{ev.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {ev.allDay
                    ? 'All day'
                    : `${new Date(ev.startAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} – ${new Date(ev.endAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
                </p>
                {ev.venue && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    {ev.venue.mapUrl ? (
                      <a
                        href={ev.venue.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-teal-500 hover:underline"
                      >
                        {ev.venue.name} ↗
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">{ev.venue.name}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-slate-400 mt-6">Read-only view · No account required</p>
    </PageShell>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-teal-400 flex items-center justify-center shadow-md shadow-teal-200">
              <Calendar className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-800">KidSchedule</span>
          </Link>
        </div>
        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardContent className="pt-6 pb-8 px-8">{children}</CardContent>
        </Card>
        <p className="text-center text-sm text-slate-400 mt-6">
          <Link to="/" className="hover:text-slate-600 transition-colors">← Back to home</Link>
        </p>
      </div>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <PageShell>
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-red-400" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800 text-center">Link unavailable</h2>
        <p className="text-sm text-slate-500 text-center leading-relaxed">{message}</p>
        <Link to="/" className="text-sm text-teal-500 hover:underline mt-1">Go to homepage</Link>
      </div>
    </PageShell>
  )
}
