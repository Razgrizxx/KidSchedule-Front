import { useState } from 'react'
import { Pencil, Trash2, Loader2, CalendarPlus } from 'lucide-react'
import { useCalendarStore } from '@/store/calendarStore'
import { useCustodyEvents, useEvents, useDeleteEvent } from '@/hooks/useCalendar'
import { toast } from '@/hooks/use-toast'
import { focusToYearMonth, EVENT_TYPE_ICONS, EVENT_TYPE_LABELS, formatTime } from '@/lib/calendarUtils'
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

export function DayView({
  familyId,
  children,
  parents,
  parentColorMap,
  selectedChildId,
  onAddEvent,
  onEditEvent,
}: Props) {
  const { focusDate } = useCalendarStore()
  const { monthKey } = focusToYearMonth(focusDate)

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const deleteEvent = useDeleteEvent()

  const { data: allCustodyEvents } = useCustodyEvents(familyId, monthKey)
  const { data: allCalendarEvents } = useEvents(familyId, monthKey)

  const custodyEvents = (allCustodyEvents ?? []).filter(
    (e) => e.date.slice(0, 10) === focusDate &&
      (!selectedChildId || e.childId === selectedChildId),
  )

  const calendarEvents = (allCalendarEvents ?? []).filter(
    (e) =>
      e.startAt.slice(0, 10) === focusDate &&
      (!selectedChildId || e.children.some((ec) => ec.child.id === selectedChildId)),
  )

  // Sort calendar events by time
  const sortedEvents = [...calendarEvents].sort((a, b) => {
    if (a.allDay && !b.allDay) return -1
    if (!a.allDay && b.allDay) return 1
    return a.startAt.localeCompare(b.startAt)
  })

  const displayDate = new Date(focusDate + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  async function handleDeleteEvent(eventId: string) {
    try {
      await deleteEvent.mutateAsync({ familyId, eventId })
      setConfirmDeleteId(null)
      toast({ title: 'Event deleted', variant: 'success' })
    } catch (err) {
      toast({ title: 'Failed to delete event', description: getErrorMessage(err), variant: 'error' })
    }
  }

  return (
    <div className="space-y-4">
      {/* Date header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-800">{displayDate}</h3>
        <button
          onClick={() => onAddEvent(focusDate)}
          className="flex items-center gap-1.5 text-xs text-teal-500 hover:text-teal-600 font-medium px-3 py-1.5 rounded-xl border border-teal-200 hover:bg-teal-50 transition-all"
        >
          <CalendarPlus className="w-3.5 h-3.5" />
          Add event
        </button>
      </div>

      {/* Custody indicators */}
      {custodyEvents.length > 0 && (
        <div className="space-y-1.5">
          {custodyEvents.map((ev) => {
            const child = children.find((c) => c.id === ev.childId)
            const custodian = parents.find((p) => p.userId === ev.custodianId)
            const color = parentColorMap.get(ev.custodianId) ?? '#94a3b8'
            return (
              <div
                key={ev.id}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{ backgroundColor: color + '18', borderLeft: `4px solid ${color}` }}
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ backgroundColor: color }}
                >
                  {custodian?.user.firstName?.[0] ?? '?'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {child?.firstName ?? 'Child'} · with {custodian?.user.firstName ?? 'parent'}
                  </p>
                  <p className="text-xs text-slate-400">Custody day{ev.isOverride ? ' (override)' : ''}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Timeline events */}
      {sortedEvents.length > 0 ? (
        <div className="space-y-2">
          {sortedEvents.map((ev) => {
            const Icon = EVENT_TYPE_ICONS[ev.type]
            const assignedChildren = ev.children.map((ec) => ec.child)
            return (
              <div
                key={ev.id}
                className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-white border border-slate-100 shadow-sm group"
              >
                {/* time column */}
                <div className="w-14 shrink-0 text-right">
                  {ev.allDay ? (
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">All day</span>
                  ) : (
                    <>
                      <p className="text-xs font-semibold text-slate-700">{formatTime(ev.startAt)}</p>
                      <p className="text-[10px] text-slate-400">{formatTime(ev.endAt)}</p>
                    </>
                  )}
                </div>

                {/* color bar */}
                <div className="w-1 self-stretch rounded-full shrink-0 bg-indigo-300" />

                {/* content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <p className="text-sm font-semibold text-slate-800 truncate">{ev.title}</p>
                    {ev.visibility === 'PRIVATE' && (
                      <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full shrink-0">
                        Private
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{EVENT_TYPE_LABELS[ev.type]}</p>
                  {assignedChildren.length > 0 && (
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      {assignedChildren.map((c) => (
                        <span
                          key={c.id}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: c.color ?? '#94a3b8' }}
                        >
                          {c.firstName}
                        </span>
                      ))}
                    </div>
                  )}
                  {ev.notes && (
                    <p className="text-xs text-slate-500 mt-1.5 italic">{ev.notes}</p>
                  )}
                </div>

                {/* actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => onEditEvent(ev)}
                    className="p-1.5 rounded-xl hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
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
                      className="p-1.5 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : custodyEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-slate-400 text-sm mb-2">No events on this day</p>
          <button
            onClick={() => onAddEvent(focusDate)}
            className="text-xs text-teal-500 hover:text-teal-600 font-medium"
          >
            + Add an event
          </button>
        </div>
      ) : null}
    </div>
  )
}
