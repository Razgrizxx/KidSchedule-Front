import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, CalendarPlus, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useFamilies, useChildren } from '@/hooks/useDashboard'
import { useSchedules, useCustodyEvents, useCreateSchedule, useEvents } from '@/hooks/useCalendar'
import { toast } from '@/hooks/use-toast'
import { AddEventModal } from '@/components/dashboard/AddEventModal'
import type { CustodyPattern, FamilyMember } from '@/types/api'

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Distinct palette for parents — different from child colors
const PARENT_COLORS = [
  '#14b8a6', // teal
  '#6366f1', // indigo
  '#f97316', // orange
  '#ec4899', // pink
  '#8b5cf6', // violet
  '#0ea5e9', // sky
]

const PATTERNS: { value: CustodyPattern; label: string; desc: string }[] = [
  { value: 'ALTERNATING_WEEKS', label: 'Alternating Weeks', desc: 'One full week with each parent, alternating.' },
  { value: 'TWO_TWO_THREE', label: '2-2-3 Rotation', desc: '2 days / 2 days / 3 days — week-long cycle.' },
  { value: 'THREE_FOUR_FOUR_THREE', label: '3-4-4-3 Rotation', desc: '3/4/4/3 days over two weeks.' },
  { value: 'FIVE_TWO_TWO_FIVE', label: '5-2-2-5', desc: '5 days / 2 days / 2 days / 5 days cycle.' },
  { value: 'EVERY_OTHER_WEEKEND', label: 'Every Other Weekend', desc: 'Lives with one parent; visits every other weekend.' },
]

const scheduleSchema = z.object({
  childId: z.string().min(1, 'Select a child'),
  pattern: z.string().min(1, 'Select a pattern'),
  startDate: z.string().min(1, 'Select a start date'),
  name: z.string().min(1, 'Give this schedule a name'),
  parent1Id: z.string().min(1, 'Select parent A'),
  parent2Id: z.string().min(1, 'Select parent B'),
})

type ScheduleForm = z.infer<typeof scheduleSchema>

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildMonthGrid(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days: (number | null)[] = Array(firstDay).fill(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)
  while (days.length % 7 !== 0) days.push(null)
  return days
}

function toISO(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** Assign a stable color to each parent by their position in the members array */
function buildParentColorMap(members: FamilyMember[]): Map<string, string> {
  const parents = members.filter((m) => m.role === 'PARENT')
  const map = new Map<string, string>()
  parents.forEach((m, i) => {
    map.set(m.userId, PARENT_COLORS[i % PARENT_COLORS.length])
  })
  return map
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CalendarPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [addEventOpen, setAddEventOpen] = useState(false)
  const [addEventDate, setAddEventDate] = useState<string | undefined>(undefined)

  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`

  const { data: families } = useFamilies()
  const family = families?.[0]
  const familyId = family?.id
  const { data: children, isLoading: childrenLoading } = useChildren(familyId)
  const { data: allCustodyEvents, isLoading: eventsLoading } = useCustodyEvents(familyId, monthKey)
  const { data: calendarEvents } = useEvents(familyId, monthKey)
  const { data: schedules } = useSchedules(familyId)
  const createSchedule = useCreateSchedule()

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting }, reset } = useForm<ScheduleForm>({
    resolver: zodResolver(scheduleSchema),
  })
  const watchPattern = watch('pattern')

  // Parent color map — stable colors assigned by family member order
  const parentColorMap = useMemo(
    () => buildParentColorMap(family?.members ?? []),
    [family?.members],
  )

  // Parents list for the legend
  const parents = useMemo(
    () => (family?.members ?? []).filter((m) => m.role === 'PARENT'),
    [family?.members],
  )

  // Filter events by selected child (null = all)
  const custodyEvents = useMemo(
    () =>
      selectedChildId
        ? (allCustodyEvents ?? []).filter((e) => e.childId === selectedChildId)
        : (allCustodyEvents ?? []),
    [allCustodyEvents, selectedChildId],
  )

  // Build date → custodianId map (date normalized to YYYY-MM-DD)
  const custodyMap = useMemo(() => {
    const map = new Map<string, string>()
    custodyEvents.forEach((ev) => map.set(ev.date.slice(0, 10), ev.custodianId))
    return map
  }, [custodyEvents])

  const days = buildMonthGrid(year, month)

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelectedDay(null)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelectedDay(null)
  }

  async function onSubmit(data: ScheduleForm) {
    if (!familyId) return
    try {
      await createSchedule.mutateAsync({
        familyId,
        childId: data.childId,
        name: data.name,
        pattern: data.pattern as CustodyPattern,
        startDate: data.startDate,
        parent1Id: data.parent1Id,
        parent2Id: data.parent2Id,
      })
      toast({ title: 'Schedule created!', variant: 'success' })
      setWizardOpen(false)
      reset()
    } catch {
      toast({ title: 'Failed to create schedule', variant: 'error' })
    }
  }

  const selectedDateStr = selectedDay ? toISO(year, month, selectedDay) : null
  const selectedDayEvents = (allCustodyEvents ?? []).filter(
    (e) => e.date.slice(0, 10) === selectedDateStr,
  )
  const selectedDayCalendarEvents = (calendarEvents ?? []).filter(
    (e) => e.startAt.slice(0, 10) === selectedDateStr,
  )

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Family Calendar</h2>
          <p className="text-sm text-slate-400">Custody schedule at a glance</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => { setAddEventDate(undefined); setAddEventOpen(true) }}
            className="gap-2"
          >
            <CalendarPlus className="w-4 h-4" />
            Add Event
          </Button>
          <Button onClick={() => setWizardOpen(true)} className="gap-2">
            <CalendarPlus className="w-4 h-4" />
            Setup Schedule
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Month calendar */}
        <Card className="lg:col-span-2">
          <CardContent className="pt-4">
            {/* Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="text-base font-semibold text-slate-800">
                {MONTHS[month]} {year}
              </h3>
              <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Child filter tabs */}
            {children && children.length > 1 && (
              <div className="flex items-center gap-1.5 mb-4 flex-wrap">
                <button
                  onClick={() => setSelectedChildId(null)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                    selectedChildId === null
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  All children
                </button>
                {children.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedChildId(c.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                      selectedChildId === c.id
                        ? 'text-white border-transparent'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                    }`}
                    style={
                      selectedChildId === c.id
                        ? { backgroundColor: c.color, borderColor: c.color }
                        : {}
                    }
                  >
                    {c.firstName}
                  </button>
                ))}
              </div>
            )}

            {/* Day labels */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
              ))}
            </div>

            {/* Day cells */}
            {eventsLoading ? (
              <div className="grid grid-cols-7 gap-1">
                {Array(35).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-10 rounded-xl" />
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
                  const hasEvents = (calendarEvents ?? []).some(
                    (e) => e.startAt.slice(0, 10) === iso,
                  )

                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDay(day)}
                      className={`
                        relative h-10 rounded-xl text-sm font-medium transition-all
                        ${isSelected ? 'ring-2 ring-offset-1' : ''}
                        ${isToday ? 'font-bold' : ''}
                        ${parentColor ? 'text-white' : 'text-slate-600 hover:bg-slate-50'}
                      `}
                      style={{
                        backgroundColor: parentColor ?? undefined,
                        ...(isSelected ? { ringColor: parentColor ?? '#14b8a6' } : {}),
                      }}
                    >
                      {day}
                      {isToday && !parentColor && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-teal-400" />
                      )}
                      {hasEvents && (
                        <span
                          className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: parentColor ? 'rgba(255,255,255,0.8)' : '#6366f1' }}
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Parent color legend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Parents</CardTitle>
            </CardHeader>
            <CardContent>
              {parents.length === 0 ? (
                <p className="text-xs text-slate-400">No parents found.</p>
              ) : (
                <div className="space-y-2.5">
                  {parents.map((m) => {
                    const color = parentColorMap.get(m.userId) ?? '#94a3b8'
                    return (
                      <div key={m.userId} className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: color }}
                        >
                          {m.user.firstName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-700">
                            {m.user.firstName} {m.user.lastName}
                          </p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                            Custody days
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Children legend */}
          {children && children.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Children</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {children.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedChildId(selectedChildId === c.id ? null : c.id)}
                      className={`w-full flex items-center gap-2 p-2 rounded-xl transition-all text-left ${
                        selectedChildId === c.id ? 'bg-slate-100' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: c.color ?? '#66CCCC' }}
                      />
                      <span className="text-sm text-slate-700">{c.firstName} {c.lastName}</span>
                      {selectedChildId === c.id && (
                        <span className="ml-auto text-[10px] text-slate-400">filtered</span>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Selected day detail */}
          {selectedDay && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    {MONTHS[month]} {selectedDay}, {year}
                  </CardTitle>
                  <button
                    onClick={() => {
                      setAddEventDate(toISO(year, month, selectedDay))
                      setAddEventOpen(true)
                    }}
                    className="text-xs text-teal-500 hover:text-teal-600 font-medium"
                  >
                    + Add
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {selectedDayEvents.map((ev) => {
                  const child = children?.find((c) => c.id === ev.childId)
                  const custodian = parents.find((p) => p.userId === ev.custodianId)
                  const color = parentColorMap.get(ev.custodianId) ?? '#94a3b8'
                  return (
                    <div key={ev.id} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
                        style={{ backgroundColor: color }}
                      />
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
                  <div key={ev.id} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-indigo-50 border border-indigo-100">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-1 bg-indigo-400" />
                    <div>
                      <p className="text-sm font-medium text-indigo-800">{ev.title}</p>
                      <p className="text-[10px] text-indigo-400">
                        {ev.allDay
                          ? 'All day'
                          : `${ev.startAt.slice(11, 16)} – ${ev.endAt.slice(11, 16)}`}
                        {ev.visibility === 'PRIVATE' && ' · Private'}
                      </p>
                    </div>
                  </div>
                ))}
                {selectedDayEvents.length === 0 && selectedDayCalendarEvents.length === 0 && (
                  <p className="text-xs text-slate-400">No events on this day.</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Active schedules */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Active Schedules</CardTitle>
            </CardHeader>
            <CardContent>
              {childrenLoading ? (
                <Skeleton className="h-8 w-full" />
              ) : schedules && schedules.length > 0 ? (
                <div className="space-y-2">
                  {schedules.filter((s) => s.isActive).map((s) => {
                    const child = children?.find((c) => c.id === s.childId)
                    return (
                      <div key={s.id} className="flex items-center gap-2 text-sm">
                        {child && (
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: child.color }}
                          />
                        )}
                        <div>
                          <p className="font-medium text-slate-700">{s.name}</p>
                          <p className="text-xs text-slate-400">{s.pattern.replace(/_/g, ' ')}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  No active schedules. Click "Setup Schedule" to begin.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Event modal */}
      {familyId && children && (
        <AddEventModal
          open={addEventOpen}
          onClose={() => setAddEventOpen(false)}
          familyId={familyId}
          children={children}
          parents={parents}
          defaultDate={addEventDate}
        />
      )}

      {/* Setup Schedule wizard */}
      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Setup Custody Schedule</DialogTitle>
            <DialogDescription>
              Define a recurring custody pattern for your child.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Schedule name</Label>
              <Input placeholder="e.g. Weekly alternating" {...register('name')} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Child</Label>
              {childrenLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select onValueChange={(v) => setValue('childId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select child…" />
                  </SelectTrigger>
                  <SelectContent>
                    {children?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.firstName} {c.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.childId && <p className="text-xs text-red-500">{errors.childId.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Custody pattern</Label>
              <Select onValueChange={(v) => setValue('pattern', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select pattern…" />
                </SelectTrigger>
                <SelectContent>
                  {PATTERNS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {watchPattern && (
                <p className="text-xs text-slate-400">
                  {PATTERNS.find((p) => p.value === watchPattern)?.desc}
                </p>
              )}
              {errors.pattern && <p className="text-xs text-red-500">{errors.pattern.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Start date</Label>
              <Input type="date" {...register('startDate')} />
              {errors.startDate && <p className="text-xs text-red-500">{errors.startDate.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Parent A (starts custody)</Label>
                <Select onValueChange={(v) => setValue('parent1Id', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {parents.map((m) => (
                      <SelectItem key={m.userId} value={m.userId}>
                        {m.user.firstName} {m.user.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.parent1Id && <p className="text-xs text-red-500">{errors.parent1Id.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Parent B</Label>
                <Select onValueChange={(v) => setValue('parent2Id', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {parents.map((m) => (
                      <SelectItem key={m.userId} value={m.userId}>
                        {m.user.firstName} {m.user.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.parent2Id && <p className="text-xs text-red-500">{errors.parent2Id.message}</p>}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setWizardOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Create Schedule
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
