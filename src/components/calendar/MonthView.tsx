import { useState } from 'react'
import { Loader2, Pencil, Trash2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useCustodyEvents, useEvents, useDeleteEvent } from '@/hooks/useCalendar'
import { useAllMyOrgEvents } from '@/hooks/useOrganizations'
import { useCalendarStore } from '@/store/calendarStore'
import { toast } from '@/hooks/use-toast'
import {
  DAYS_SHORT,
  EVENT_TYPE_ICONS,
  buildMonthGrid,
  focusToYearMonth,
  toISO,
} from '@/lib/calendarUtils'
import type { CalendarEvent, Child, FamilyMember } from '@/types/api'

interface Props {
  familyId: string
  children: Child[]
  parents: FamilyMember[]
  parentColorMap: Map<string, string>
  selectedChildId: string | null
  selectedDay: number | null
  onSelectDay: (day: number | null) => void
  onAddEvent: (date?: string) => void
  onEditEvent: (ev: CalendarEvent) => void
}

export function MonthView({
  familyId,
  children,
  parents,
  parentColorMap,
  selectedChildId,
  selectedDay,
  onSelectDay,
  onAddEvent,
  onEditEvent,
}: Props) {
  const { focusDate, setFocusDate } = useCalendarStore()
  const { year, month, monthKey } = focusToYearMonth(focusDate)
  const today = new Date()

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const deleteEvent = useDeleteEvent()

  const { data: allCustodyEvents, isLoading: custodyLoading } = useCustodyEvents(familyId, monthKey)
  const { data: calendarEvents } = useEvents(familyId, monthKey)
  const { data: orgEvents = [] } = useAllMyOrgEvents(monthKey)

  const custodyEvents = selectedChildId
    ? (allCustodyEvents ?? []).filter((e) => e.childId === selectedChildId)
    : (allCustodyEvents ?? [])

  const filteredCalendarEvents = selectedChildId
    ? (calendarEvents ?? []).filter((e) =>
        e.children.some((ec) => ec.child.id === selectedChildId),
      )
    : (calendarEvents ?? [])

  const custodyMap = new Map<string, string>()
  custodyEvents.forEach((ev) => custodyMap.set(ev.date.slice(0, 10), ev.custodianId))

  const days = buildMonthGrid(year, month)

  // Selected day data (for the day detail card in sidebar — shown by parent via props)
  const selectedDateStr = selectedDay ? toISO(year, month, selectedDay) : null
  const selectedDayEvents = (allCustodyEvents ?? []).filter(
    (e) => e.date.slice(0, 10) === selectedDateStr,
  )
  const selectedDayCalendarEvents = filteredCalendarEvents.filter(
    (e) => e.startAt.slice(0, 10) === selectedDateStr,
  )
  const selectedDayOrgEvents = orgEvents.filter(
    (e) => e.startAt.slice(0, 10) === selectedDateStr,
  )

  async function handleDeleteEvent(eventId: string) {
    try {
      await deleteEvent.mutateAsync({ familyId, eventId })
      setConfirmDeleteId(null)
      toast({ title: 'Event deleted', variant: 'success' })
    } catch {
      toast({ title: 'Failed to delete event', variant: 'error' })
    }
  }

  return (
    <div>
      {/* Day-of-week labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_SHORT.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      {custodyLoading ? (
        <div className="grid grid-cols-7 gap-1">
          {Array(35).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            if (!day) return <div key={i} />

            const iso = toISO(year, month, day)
            const custodianId = custodyMap.get(iso)
            const parentColor = custodianId ? parentColorMap.get(custodianId) : undefined
            const isToday =
              day === today.getDate() &&
              month === today.getMonth() &&
              year === today.getFullYear()
            const isSelected = day === selectedDay
            const dayEvents = filteredCalendarEvents.filter(
              (e) => e.startAt.slice(0, 10) === iso,
            )
            const dayOrgEvents = orgEvents.filter((e) => e.startAt.slice(0, 10) === iso)
            const allDayEvents = [...dayEvents, ...dayOrgEvents]
            const visibleEvents = dayEvents.slice(0, 2)
            const extraCount = allDayEvents.length - 2

            return (
              <button
                key={i}
                onClick={() => {
                  onSelectDay(isSelected ? null : day)
                  setFocusDate(iso)
                }}
                className={`
                  relative h-12 rounded-xl text-sm font-medium transition-all
                  ${isToday ? 'font-bold' : ''}
                  ${parentColor ? 'text-white' : 'text-slate-600 hover:bg-slate-50'}
                `}
                style={{
                  backgroundColor: parentColor ?? undefined,
                  border: isSelected ? '2px solid #66CCCC' : '2px solid transparent',
                }}
              >
                <span className="absolute inset-0 flex items-center justify-center">
                  {day}
                </span>
                {isToday && !parentColor && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-teal-400" />
                )}
                {allDayEvents.length > 0 && (
                  <span className="absolute top-0.5 right-0.5 flex items-center gap-px">
                    {visibleEvents.map((ev, idx) => {
                      const Icon = EVENT_TYPE_ICONS[ev.type]
                      return (
                        <span
                          key={idx}
                          className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: parentColor ? 'rgba(255,255,255,0.92)' : 'white',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
                          }}
                        >
                          <Icon
                            style={{ width: 8, height: 8, color: parentColor ?? '#6366f1' }}
                          />
                        </span>
                      )
                    })}
                    {dayOrgEvents.length > 0 && dayEvents.length < 2 && (
                      <span
                        className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: parentColor ? 'rgba(255,255,255,0.92)' : '#dcfce7',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
                        }}
                        title={dayOrgEvents[0].organization.name}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#16a34a', display: 'block' }} />
                      </span>
                    )}
                    {extraCount > 0 && (
                      <span
                        className="h-3.5 rounded-full flex items-center justify-center font-bold"
                        style={{
                          backgroundColor: parentColor ? 'rgba(255,255,255,0.92)' : 'white',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
                          color: parentColor ?? '#6366f1',
                          fontSize: 8,
                          minWidth: 14,
                          paddingLeft: 2,
                          paddingRight: 2,
                        }}
                      >
                        +{extraCount}
                      </span>
                    )}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Selected day detail */}
      {selectedDay && selectedDateStr && (
        <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-3 space-y-1.5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {new Date(selectedDateStr + 'T12:00:00').toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric',
              })}
            </p>
            <button
              onClick={() => onAddEvent(selectedDateStr)}
              className="text-xs text-teal-500 hover:text-teal-600 font-medium"
            >
              + Add
            </button>
          </div>

          {selectedDayEvents.map((ev) => {
            const child = children.find((c) => c.id === ev.childId)
            const custodian = parents.find((p) => p.userId === ev.custodianId)
            const color = parentColorMap.get(ev.custodianId) ?? '#94a3b8'
            return (
              <div key={ev.id} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50">
                <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-1" style={{ backgroundColor: color }} />
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {child?.firstName ?? 'Child'} with {custodian?.user.firstName ?? 'parent'}
                  </p>
                  {ev.isOverride && (
                    <p className="text-[10px] text-amber-500 font-medium">Override</p>
                  )}
                </div>
              </div>
            )
          })}

          {selectedDayCalendarEvents.map((ev) => (
            <div
              key={ev.id}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 group"
            >
              <div className="w-2.5 h-2.5 rounded-full shrink-0 bg-indigo-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-indigo-800 truncate">{ev.title}</p>
                <p className="text-[10px] text-indigo-400">
                  {ev.allDay ? 'All day' : `${ev.startAt.slice(11, 16)} – ${ev.endAt.slice(11, 16)}`}
                  {ev.visibility === 'PRIVATE' && ' · Private'}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={() => onEditEvent(ev)}
                  className="p-1 rounded-lg hover:bg-indigo-100 text-indigo-400 hover:text-indigo-600 transition-colors"
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
                        className="text-xs px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(ev.id)}
                        disabled={deleteEvent.isPending}
                        className="text-xs px-2 py-0.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium disabled:opacity-60"
                      >
                        {deleteEvent.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Delete'}
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => setConfirmDeleteId(ev.id)}
                    className="p-1 rounded-lg hover:bg-red-100 text-indigo-400 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {selectedDayOrgEvents.map((ev) => (
            <div
              key={ev.id}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-green-50 border border-green-100"
            >
              <div className="w-2.5 h-2.5 rounded-full shrink-0 bg-green-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-800 truncate">{ev.title}</p>
                <p className="text-[10px] text-green-500">
                  {ev.allDay ? 'All day' : `${ev.startAt.slice(11, 16)} – ${ev.endAt.slice(11, 16)}`}
                  {' · '}
                  <span className="font-medium">{ev.organization.name}</span>
                  {' · '}
                  {ev.organization.type === 'SCHOOL' ? 'School' : 'Team'}
                </p>
              </div>
            </div>
          ))}

          {selectedDayEvents.length === 0 && selectedDayCalendarEvents.length === 0 && selectedDayOrgEvents.length === 0 && (
            <p className="text-xs text-slate-400 py-1">No events on this day.</p>
          )}
        </div>
      )}
    </div>
  )
}
