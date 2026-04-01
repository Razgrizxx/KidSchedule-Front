import { useQueries } from '@tanstack/react-query'
import { useState } from 'react'
import { Pencil, Trash2, Loader2 } from 'lucide-react'
import api from '@/api'
import { useCalendarStore } from '@/store/calendarStore'
import { useDeleteEvent } from '@/hooks/useCalendar'
import { toast } from '@/hooks/use-toast'
import {
  MONTHS_LONG,
  EVENT_TYPE_ICONS,
  EVENT_TYPE_LABELS,
  formatTime,
  dateToISO,
} from '@/lib/calendarUtils'
import type { CalendarEvent, Child, FamilyMember } from '@/types/api'
import { getErrorMessage } from '@/lib/getErrorMessage'

interface Props {
  familyId: string
  children: Child[]
  parents: FamilyMember[]
  parentColorMap: Map<string, string>
  selectedChildId: string | null
  onAddEvent: (date?: string) => void
  onEditEvent: (ev: CalendarEvent) => void
}

function getNextTwoMonthKeys(focusDate: string): string[] {
  const d = new Date(focusDate + 'T12:00:00')
  const keys: string[] = []
  for (let i = 0; i < 3; i++) {
    const m = new Date(d.getFullYear(), d.getMonth() + i, 1)
    keys.push(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`)
  }
  return keys
}

export function ListView({
  familyId,
  selectedChildId,
  onAddEvent,
  onEditEvent,
}: Props) {
  const { focusDate, setFocusDate, setViewMode } = useCalendarStore()
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const deleteEvent = useDeleteEvent()

  const monthKeys = getNextTwoMonthKeys(focusDate)

  const eventResults = useQueries({
    queries: monthKeys.map((monthKey) => ({
      queryKey: ['events', familyId, monthKey],
      queryFn: () =>
        api
          .get(`/families/${familyId}/events`, { params: { month: monthKey } })
          .then((r) => r.data as CalendarEvent[]),
      enabled: !!familyId,
    })),
  })

  const allEvents: CalendarEvent[] = eventResults.flatMap((r) => r.data ?? [])

  const filtered = allEvents.filter(
    (e) =>
      e.startAt.slice(0, 10) >= focusDate &&
      (!selectedChildId || e.children.some((ec) => ec.child.id === selectedChildId)),
  )

  const sorted = [...filtered].sort((a, b) => a.startAt.localeCompare(b.startAt))

  // Group by date
  const grouped = new Map<string, CalendarEvent[]>()
  sorted.forEach((ev) => {
    const dateKey = ev.startAt.slice(0, 10)
    if (!grouped.has(dateKey)) grouped.set(dateKey, [])
    grouped.get(dateKey)!.push(ev)
  })

  const today = dateToISO(new Date())

  async function handleDeleteEvent(eventId: string) {
    try {
      await deleteEvent.mutateAsync({ familyId, eventId })
      setConfirmDeleteId(null)
      toast({ title: 'Event deleted', variant: 'success' })
    } catch (err) {
      toast({ title: 'Failed to delete event', description: getErrorMessage(err), variant: 'error' })
    }
  }

  if (grouped.size === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-slate-400 text-sm">No upcoming events in the next 3 months</p>
        <button
          onClick={() => onAddEvent(focusDate)}
          className="mt-3 text-xs text-teal-500 hover:text-teal-600 font-medium"
        >
          + Create one
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {Array.from(grouped.entries()).map(([dateKey, events]) => {
        const d = new Date(dateKey + 'T12:00:00')
        const isToday = dateKey === today
        const isPast = dateKey < today
        const monthName = MONTHS_LONG[d.getMonth()]
        const dayName = d.toLocaleDateString('en-US', { weekday: 'long' })

        return (
          <div key={dateKey}>
            {/* Date anchor */}
            <button
              onClick={() => { setFocusDate(dateKey); setViewMode('day') }}
              className="flex items-center gap-3 mb-2 group w-full text-left"
            >
              <div
                className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 transition-all ${
                  isToday
                    ? 'bg-teal-500 text-white shadow-md shadow-teal-200'
                    : isPast
                    ? 'bg-slate-100 text-slate-400'
                    : 'bg-slate-100 text-slate-700 group-hover:bg-teal-50 group-hover:text-teal-600'
                }`}
              >
                <span className="text-[9px] font-bold uppercase leading-none">
                  {monthName.slice(0, 3)}
                </span>
                <span className="text-base font-bold leading-tight">{d.getDate()}</span>
              </div>
              <div>
                <p className={`text-sm font-semibold ${isToday ? 'text-teal-600' : isPast ? 'text-slate-400' : 'text-slate-700'}`}>
                  {isToday ? 'Today' : dayName}
                </p>
                <p className="text-[11px] text-slate-400">
                  {monthName} {d.getDate()}, {d.getFullYear()}
                </p>
              </div>
              <div className="ml-auto w-px h-8 bg-slate-100 group-hover:bg-teal-200 transition-colors" />
            </button>

            {/* Events for this date */}
            <div className="ml-13 space-y-1.5 pl-4 border-l-2 border-slate-100" style={{ marginLeft: 52 }}>
              {events.map((ev) => {
                const Icon = EVENT_TYPE_ICONS[ev.type]
                const assignedChildren = ev.children.map((ec) => ec.child)

                return (
                  <div
                    key={ev.id}
                    className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-white border border-slate-100 group hover:border-indigo-100 hover:bg-indigo-50/30 transition-all"
                  >
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 text-indigo-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{ev.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[10px] text-slate-400">
                          {EVENT_TYPE_LABELS[ev.type]}
                        </span>
                        {!ev.allDay && (
                          <span className="text-[10px] text-slate-400">
                            · {formatTime(ev.startAt)} – {formatTime(ev.endAt)}
                          </span>
                        )}
                        {ev.allDay && (
                          <span className="text-[10px] text-slate-400">· All day</span>
                        )}
                        {ev.visibility === 'PRIVATE' && (
                          <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                            Private
                          </span>
                        )}
                        {ev.caregiver && (
                          <span className="text-[10px] text-purple-500 font-medium">
                            · {ev.caregiver.name}
                          </span>
                        )}
                      </div>
                      {assignedChildren.length > 0 && (
                        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                          {assignedChildren.map((c) => (
                            <span
                              key={c.id}
                              className="text-[9px] font-medium px-1.5 py-0.5 rounded-full text-white"
                              style={{ backgroundColor: c.color ?? '#94a3b8' }}
                            >
                              {c.firstName}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* actions */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => onEditEvent(ev)}
                        className="p-1.5 rounded-lg hover:bg-indigo-100 text-slate-400 hover:text-indigo-600 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <div className="relative">
                        {confirmDeleteId === ev.id && (
                          <div className="absolute right-0 bottom-full mb-1.5 flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl shadow-lg px-2.5 py-1.5 z-10 whitespace-nowrap">
                            <span className="text-xs text-slate-600 font-medium">Delete?</span>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-xs px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-medium"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(ev.id)}
                              disabled={deleteEvent.isPending}
                              className="text-xs px-2 py-0.5 rounded-lg bg-red-500 text-white font-medium disabled:opacity-60"
                            >
                              {deleteEvent.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Delete'}
                            </button>
                          </div>
                        )}
                        <button
                          onClick={() => setConfirmDeleteId(ev.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
