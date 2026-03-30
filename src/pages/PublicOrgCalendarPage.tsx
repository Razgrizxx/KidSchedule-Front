import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { School, Trophy, MapPin, Calendar, Loader2, Lock, AlertCircle } from 'lucide-react'
import api from '@/api'
import type { OrgEvent } from '@/types/api'

interface PublicCalendarData {
  org: { id: string; name: string; type: 'TEAM' | 'SCHOOL' }
  events: OrgEvent[]
}

function usePublicOrgCalendar(id?: string) {
  return useQuery<PublicCalendarData>({
    queryKey: ['public-org-calendar', id],
    queryFn: () => api.get(`/public/organizations/${id}/calendar`).then((r) => r.data),
    enabled: !!id,
    retry: false,
  })
}

function formatDate(iso: string, allDay: boolean) {
  const d = new Date(iso)
  if (allDay) return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function groupByMonth(events: OrgEvent[]) {
  const groups: Record<string, OrgEvent[]> = {}
  for (const e of events) {
    const key = new Date(e.startAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    if (!groups[key]) groups[key] = []
    groups[key].push(e)
  }
  return groups
}

export function PublicOrgCalendarPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, isError, error } = usePublicOrgCalendar(id)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
      </div>
    )
  }

  const isPrivate = (error as any)?.response?.status === 403
  const notFound = (error as any)?.response?.status === 404

  if (isError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center space-y-4">
          {isPrivate
            ? <Lock className="w-10 h-10 text-slate-400 mx-auto" />
            : <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />}
          <h1 className="text-xl font-bold text-slate-800">
            {isPrivate ? 'Calendar is private' : notFound ? 'Not found' : 'Something went wrong'}
          </h1>
          <p className="text-sm text-slate-500">
            {isPrivate
              ? 'This calendar is not publicly shared.'
              : notFound
                ? 'This organization does not exist.'
                : 'Could not load the calendar. Try again later.'}
          </p>
          <Link to="/" className="text-sm text-teal-600 hover:underline">Go to KidSchedule</Link>
        </div>
      </div>
    )
  }

  if (!data) return null

  const upcoming = data.events.filter((e) => new Date(e.endAt) >= new Date())
  const past = data.events.filter((e) => new Date(e.endAt) < new Date())
  const upcomingGroups = groupByMonth(upcoming)
  const pastGroups = groupByMonth(past)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-4 py-6 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${data.org.type === 'SCHOOL' ? 'bg-blue-100' : 'bg-orange-100'}`}>
            {data.org.type === 'SCHOOL'
              ? <School className="w-6 h-6 text-blue-600" />
              : <Trophy className="w-6 h-6 text-orange-600" />}
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">{data.org.name}</h1>
            <p className="text-xs text-slate-400">{data.org.type === 'SCHOOL' ? 'School' : 'Team'} · Public Calendar</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* Upcoming */}
        {upcoming.length === 0 && past.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No events scheduled yet.</p>
          </div>
        )}

        {Object.entries(upcomingGroups).map(([month, evts]) => (
          <div key={month}>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">{month}</h2>
            <div className="space-y-2">
              {evts.map((e) => (
                <EventRow key={e.id} event={e} />
              ))}
            </div>
          </div>
        ))}

        {past.length > 0 && (
          <details className="group">
            <summary className="text-xs font-semibold text-slate-400 uppercase tracking-widest cursor-pointer select-none hover:text-slate-600 transition-colors">
              Past events ({past.length})
            </summary>
            <div className="mt-3 space-y-8">
              {Object.entries(pastGroups).map(([month, evts]) => (
                <div key={month}>
                  <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-widest mb-3">{month}</h2>
                  <div className="space-y-2">
                    {evts.map((e) => (
                      <EventRow key={e.id} event={e} muted />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}

        <p className="text-center text-xs text-slate-300 pt-4">
          Powered by{' '}
          <Link to="/" className="hover:text-teal-500 transition-colors">KidSchedule</Link>
        </p>
      </div>
    </div>
  )
}

function EventRow({ event, muted }: { event: OrgEvent; muted?: boolean }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 p-4 ${muted ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
          <Calendar className="w-4 h-4 text-teal-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-800 text-sm">{event.title}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {formatDate(event.startAt, event.allDay)}
            {!event.allDay && event.endAt !== event.startAt && (
              <> – {new Date(event.endAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</>
            )}
          </p>
          {event.venue && (
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" /> {event.venue.name}
            </p>
          )}
          {event.notes && <p className="text-xs text-slate-500 mt-1">{event.notes}</p>}
        </div>
      </div>
    </div>
  )
}
