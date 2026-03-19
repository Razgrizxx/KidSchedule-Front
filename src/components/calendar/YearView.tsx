import { useQueries } from '@tanstack/react-query'
import api from '@/api'
import { useCalendarStore } from '@/store/calendarStore'
import { focusToYearMonth, buildMonthGrid, toISO, MONTHS_SHORT, DAYS_SHORT } from '@/lib/calendarUtils'
import type { CustodyEvent } from '@/types/api'

interface Props {
  familyId: string
  parentColorMap: Map<string, string>
  selectedChildId: string | null
}

export function YearView({ familyId, parentColorMap, selectedChildId }: Props) {
  const { focusDate, setFocusDate, setViewMode } = useCalendarStore()
  const { year } = focusToYearMonth(focusDate)
  const today = new Date()
  const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const monthKeys = Array.from({ length: 12 }, (_, i) =>
    `${year}-${String(i + 1).padStart(2, '0')}`,
  )

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

  // Build a flat custody map: iso → custodianId
  const custodyMap = new Map<string, string>()
  custodyResults.forEach((result) => {
    ;(result.data ?? []).forEach((ev) => {
      if (!selectedChildId || ev.childId === selectedChildId) {
        custodyMap.set(ev.date.slice(0, 10), ev.custodianId)
      }
    })
  })

  function handleMonthClick(monthIndex: number) {
    const iso = toISO(year, monthIndex, 1)
    setFocusDate(iso)
    setViewMode('month')
  }

  function handleDayClick(iso: string) {
    setFocusDate(iso)
    setViewMode('day')
  }

  return (
    <div>
      <p className="text-xs text-slate-400 mb-4 font-medium">{year}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }, (_, mi) => {
          const days = buildMonthGrid(year, mi)
          const daysInMonth = new Date(year, mi + 1, 0).getDate()

          return (
            <div key={mi} className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
              {/* Month header */}
              <button
                onClick={() => handleMonthClick(mi)}
                className="w-full text-left mb-2 text-xs font-semibold text-slate-700 hover:text-teal-600 transition-colors"
              >
                {MONTHS_SHORT[mi]}
              </button>

              {/* Day labels */}
              <div className="grid grid-cols-7 mb-0.5">
                {DAYS_SHORT.map((d) => (
                  <div key={d} className="text-center text-[8px] font-medium text-slate-300">
                    {d[0]}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-px">
                {days.map((day, i) => {
                  if (!day) return <div key={i} className="h-5" />
                  const iso = toISO(year, mi, day)
                  const custodianId = custodyMap.get(iso)
                  const parentColor = custodianId ? parentColorMap.get(custodianId) : undefined
                  const isToday = iso === todayISO

                  return (
                    <button
                      key={i}
                      onClick={() => handleDayClick(iso)}
                      title={iso}
                      className={`
                        h-5 w-full rounded-sm text-[9px] font-medium transition-all
                        ${isToday ? 'ring-1 ring-teal-400 ring-offset-0 font-bold' : ''}
                        ${parentColor ? 'text-white' : 'text-slate-500 hover:bg-slate-50'}
                      `}
                      style={{ backgroundColor: parentColor ?? undefined }}
                    />
                  )
                })}
              </div>

              {/* Month custody % */}
              {(() => {
                const custodyDays = Array.from({ length: daysInMonth }, (_, d) =>
                  custodyMap.has(toISO(year, mi, d + 1)),
                ).filter(Boolean).length
                if (custodyDays === 0) return null
                return (
                  <p className="text-[9px] text-slate-400 mt-1.5 text-right">
                    {custodyDays}d scheduled
                  </p>
                )
              })()}
            </div>
          )
        })}
      </div>
    </div>
  )
}
