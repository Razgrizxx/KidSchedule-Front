import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCustodyEvents } from '@/hooks/useCalendar'
import { useFamily } from '@/hooks/useDashboard'
import { buildParentColorMap } from '@/lib/calendarUtils'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function toYM(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`
}

function buildGrid(year: number, month: number): (number | null)[] {
  const firstDow = new Date(year, month - 1, 1).getDay()
  const days = new Date(year, month, 0).getDate()
  const cells: (number | null)[] = Array(firstDow).fill(null)
  for (let d = 1; d <= days; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

interface Props {
  familyId: string
  value: string        // YYYY-MM-DD or ''
  onChange: (v: string) => void
  label?: string
  minDate?: string     // YYYY-MM-DD — days before this are disabled
}

export function CustodyDatePicker({ familyId, value, onChange, label, minDate }: Props) {
  const user = useAuthStore((s) => s.user)

  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)

  const ym = toYM(year, month)
  const { data: custodyEvents } = useCustodyEvents(familyId, ym)
  const { data: family } = useFamily(familyId)

  const colorMap = family ? buildParentColorMap(family.members) : new Map<string, string>()

  // Build day → custodian color lookup
  const dayCustodian = new Map<number, { color: string; isMe: boolean }>()
  if (custodyEvents) {
    for (const e of custodyEvents) {
      const d = new Date(e.date.slice(0, 10) + 'T12:00:00')
      if (d.getFullYear() === year && d.getMonth() + 1 === month) {
        const color = colorMap.get(e.custodianId) ?? '#94a3b8'
        dayCustodian.set(d.getDate(), { color, isMe: e.custodianId === user?.id })
      }
    }
  }

  const grid = buildGrid(year, month)
  const selectedDay = value ? (() => {
    const [y, m, d] = value.split('-').map(Number)
    return y === year && m === month ? d : null
  })() : null

  const minDay = minDate ? (() => {
    const [y, m, d] = minDate.split('-').map(Number)
    return y === year && m === month ? d : y < year || (y === year && m < month) ? -1 : 999
  })() : -1

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) } else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) } else setMonth(m => m + 1)
  }

  const MONTH_NAMES = ['January','February','March','April','May','June',
    'July','August','September','October','November','December']

  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}

      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
        {/* Nav */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
          <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-slate-700">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {DAYS_SHORT.map((d) => (
            <div key={d} className="py-1.5 text-center text-[11px] font-medium text-slate-400">
              {d}
            </div>
          ))}
        </div>

        {/* Cells */}
        <div className="grid grid-cols-7 p-1 gap-0.5">
          {grid.map((day, i) => {
            if (!day) return <div key={i} />

            const custody = dayCustodian.get(day)
            const isSelected = day === selectedDay
            const isDisabled = minDay !== -1 && day < minDay

            return (
              <button
                key={i}
                type="button"
                disabled={isDisabled}
                onClick={() => onChange(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`)}
                className={cn(
                  'relative h-8 w-full rounded-lg text-xs font-medium transition-all',
                  isDisabled && 'opacity-30 cursor-not-allowed',
                  !isDisabled && 'hover:ring-2 hover:ring-slate-300',
                  isSelected && 'ring-2 ring-offset-1 ring-teal-500 z-10',
                )}
                style={custody ? {
                  backgroundColor: isSelected ? custody.color : `${custody.color}28`,
                  color: isSelected ? '#fff' : custody.color,
                } : {
                  color: '#94a3b8',
                }}
              >
                {day}
                {/* Dot indicator */}
                {custody && !isSelected && (
                  <span
                    className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ backgroundColor: custody.color }}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        {colorMap.size > 0 && family && (
          <div className="flex items-center gap-3 px-3 py-2 border-t border-slate-100 flex-wrap">
            {family.members.map((m) => {
              const color = colorMap.get(m.userId)
              if (!color) return null
              return (
                <div key={m.userId} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-xs text-slate-500">
                    {m.user?.firstName ?? 'Parent'}{m.userId === user?.id ? ' (you)' : ''}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
