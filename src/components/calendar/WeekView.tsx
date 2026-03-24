import { useQueries } from '@tanstack/react-query'
import { Pencil, Trash2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import api from '@/api'
import { useCalendarStore } from '@/store/calendarStore'
import { useDeleteEvent } from '@/hooks/useCalendar'
import { toast } from '@/hooks/use-toast'
import {
  DAYS_SHORT,
  EVENT_TYPE_ICONS,
  dateToISO,
  focusToYearMonth,
  getWeekDays,
  getWeekMonthKeys,
} from '@/lib/calendarUtils'
import type { CalendarEvent, Child, CustodyEvent, FamilyMember } from '@/types/api'
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

export function WeekView({
  familyId,
  parents,
  parentColorMap,
  selectedChildId,
  onAddEvent,
  onEditEvent,
}: Props) {
  const { focusDate, setFocusDate, setViewMode } = useCalendarStore()
  const today = new Date()
  const todayISO = dateToISO(today)
  const weekDays = getWeekDays(focusDate)
  const monthKeys = getWeekMonthKeys(focusDate)

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const deleteEvent = useDeleteEvent()

  // Fetch custody + calendar events for all months the week spans
  const custodyResults = useQueries({
    queries: monthKeys.map((monthKey) => {
      const [yearStr, monStr] = monthKey.split('-')
      return {
        queryKey: ['custody-events', familyId, monthKey],
        queryFn: () =>
          api
            .get(`/families/${familyId}/schedules/calendar`, {
              params: { year: Number(yearStr), month: Number(monStr) },
            })
            .then((r) => r.data as CustodyEvent[]),
        enabled: !!familyId,
      }
    }),
  })

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

  const allCustodyEvents: CustodyEvent[] = custodyResults.flatMap((r) => r.data ?? [])
  const allCalendarEvents: CalendarEvent[] = eventResults.flatMap((r) => r.data ?? [])

  const custodyEvents = selectedChildId
    ? allCustodyEvents.filter((e) => e.childId === selectedChildId)
    : allCustodyEvents

  const filteredCalendarEvents = selectedChildId
    ? allCalendarEvents.filter((e) =>
        e.children.some((ec) => ec.child.id === selectedChildId),
      )
    : allCalendarEvents

  const custodyMap = new Map<string, string>()
  custodyEvents.forEach((ev) => custodyMap.set(ev.date.slice(0, 10), ev.custodianId))

  async function handleDeleteEvent(eventId: string) {
    try {
      await deleteEvent.mutateAsync({ familyId, eventId })
      setConfirmDeleteId(null)
      toast({ title: 'Event deleted', variant: 'success' })
    } catch (err) {
      toast({ title: 'Failed to delete event', description: getErrorMessage(err), variant: 'error' })
    }
  }

  const { month: focusMonth } = focusToYearMonth(focusDate)

  return (
    <div className="space-y-2">
      {/* 7-column header */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day, i) => {
          const iso = dateToISO(day)
          const isToday = iso === todayISO
          const isFocus = iso === focusDate
          const isCurrentMonth = day.getMonth() === focusMonth

          return (
            <button
              key={i}
              onClick={() => {
                setFocusDate(iso)
                setViewMode('day')
              }}
              className={`flex flex-col items-center py-2 rounded-xl transition-all text-sm font-medium ${
                isToday
                  ? 'bg-teal-500 text-white'
                  : isFocus
                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                  : isCurrentMonth
                  ? 'hover:bg-slate-50 text-slate-700'
                  : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                {DAYS_SHORT[day.getDay()]}
              </span>
              <span className="text-lg font-bold leading-none mt-0.5">{day.getDate()}</span>
            </button>
          )
        })}
      </div>

      {/* 7-column event grid */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day, colIdx) => {
          const iso = dateToISO(day)
          const custodianId = custodyMap.get(iso)
          const parentColor = custodianId ? parentColorMap.get(custodianId) : undefined
          const custodian = custodianId ? parents.find((p) => p.userId === custodianId) : null
          const dayEvents = filteredCalendarEvents.filter(
            (e) => e.startAt.slice(0, 10) === iso,
          )

          return (
            <div
              key={colIdx}
              className="min-h-[200px] rounded-xl border border-slate-100 overflow-hidden flex flex-col"
            >
              {/* custody strip */}
              {parentColor && (
                <div
                  className="h-1.5 shrink-0"
                  style={{ backgroundColor: parentColor }}
                  title={custodian?.user.firstName}
                />
              )}

              <div className="flex-1 p-1.5 space-y-1">
                {dayEvents.map((ev) => {
                  const Icon = EVENT_TYPE_ICONS[ev.type]
                  return (
                    <div
                      key={ev.id}
                      className="group relative rounded-lg bg-indigo-50 border border-indigo-100 px-2 py-1.5"
                    >
                      <div className="flex items-start gap-1.5">
                        <Icon className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold text-indigo-800 leading-tight truncate">
                            {ev.title}
                          </p>
                          {!ev.allDay && (
                            <p className="text-[10px] text-indigo-400 leading-tight">
                              {ev.startAt.slice(11, 16)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* hover actions */}
                      <div className="absolute top-0.5 right-0.5 hidden group-hover:flex gap-0.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); onEditEvent(ev) }}
                          className="p-0.5 rounded bg-white shadow text-indigo-400 hover:text-indigo-600"
                        >
                          <Pencil className="w-2.5 h-2.5" />
                        </button>
                        <div className="relative">
                          {confirmDeleteId === ev.id && (
                            <div className="absolute right-0 bottom-full mb-1 flex items-center gap-1 bg-white border border-slate-200 rounded-xl shadow-lg px-2 py-1 z-10 whitespace-nowrap">
                              <span className="text-[10px] text-slate-600 font-medium">Delete?</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null) }}
                                className="text-[10px] px-1.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-medium"
                              >
                                No
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteEvent(ev.id) }}
                                disabled={deleteEvent.isPending}
                                className="text-[10px] px-1.5 py-0.5 rounded-lg bg-red-500 text-white font-medium"
                              >
                                {deleteEvent.isPending ? <Loader2 className="w-2 h-2 animate-spin" /> : 'Yes'}
                              </button>
                            </div>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(ev.id) }}
                            className="p-0.5 rounded bg-white shadow text-indigo-400 hover:text-red-500"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {dayEvents.length === 0 && (
                  <button
                    onClick={() => onAddEvent(iso)}
                    className="w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                  >
                    <span className="text-[10px] text-slate-400">+ Add</span>
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
