import { useState, useMemo, useEffect } from 'react'
import {
  ChevronLeft, ChevronRight, CalendarPlus, Loader2, DownloadCloud, CalendarSync,
} from 'lucide-react'
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
import { useSchedules, useCreateSchedule } from '@/hooks/useCalendar'
import { useGoogleStatus, useGoogleAuthUrl, useExportCalendar } from '@/hooks/useSettings'
import { toast } from '@/hooks/use-toast'
import { AddEventModal } from '@/components/dashboard/AddEventModal'
import { ImportEventsModal } from '@/components/dashboard/ImportEventsModal'
import { ViewSelector } from '@/components/calendar/ViewSelector'
import { MonthView } from '@/components/calendar/MonthView'
import { WeekView } from '@/components/calendar/WeekView'
import { DayView } from '@/components/calendar/DayView'
import { ListView } from '@/components/calendar/ListView'
import { YearView } from '@/components/calendar/YearView'
import { useCalendarStore } from '@/store/calendarStore'
import { buildParentColorMap, MONTHS_LONG, MONTHS_SHORT, focusToYearMonth } from '@/lib/calendarUtils'
import type { CustodyPattern, FamilyMember, CalendarEvent } from '@/types/api'

// ── Constants ─────────────────────────────────────────────────────────────────

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

// ── Header title helpers ───────────────────────────────────────────────────────

function useHeaderTitle(focusDate: string, viewMode: string): string {
  const { year, month } = focusToYearMonth(focusDate)
  const d = new Date(focusDate + 'T12:00:00')
  const dow = d.getDay()
  const sun = new Date(d); sun.setDate(d.getDate() - dow)
  const sat = new Date(sun); sat.setDate(sun.getDate() + 6)

  switch (viewMode) {
    case 'year':
      return String(year)
    case 'month':
      return `${MONTHS_LONG[month]} ${year}`
    case 'week': {
      if (sun.getMonth() === sat.getMonth()) {
        return `${MONTHS_SHORT[sun.getMonth()]} ${sun.getDate()}–${sat.getDate()}, ${sun.getFullYear()}`
      }
      return `${MONTHS_SHORT[sun.getMonth()]} ${sun.getDate()} – ${MONTHS_SHORT[sat.getMonth()]} ${sat.getDate()}, ${sat.getFullYear()}`
    }
    case 'day':
      return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    case 'list':
      return `From ${MONTHS_LONG[month]} ${year}`
    default:
      return ''
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CalendarPage() {
  const { viewMode, focusDate, navigatePrev, navigateNext, goToToday } = useCalendarStore()

  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [addEventOpen, setAddEventOpen] = useState(false)
  const [addEventDate, setAddEventDate] = useState<string | undefined>(undefined)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [importOpen, setImportOpen] = useState(false)

  // Reset selectedDay when focusDate month changes
  const { month: currentMonth } = focusToYearMonth(focusDate)
  useEffect(() => { setSelectedDay(null) }, [currentMonth])

  const headerTitle = useHeaderTitle(focusDate, viewMode)

  const { data: families } = useFamilies()
  const family = families?.[0]
  const familyId = family?.id
  const { data: children, isLoading: childrenLoading } = useChildren(familyId)
  const { data: schedules } = useSchedules(familyId)
  const createSchedule = useCreateSchedule()

  const { data: googleStatus } = useGoogleStatus()
  const getGoogleAuthUrl = useGoogleAuthUrl()
  const exportCalendar = useExportCalendar(familyId)

  async function handleExport() {
    if (!googleStatus?.connected) {
      const url = await getGoogleAuthUrl.mutateAsync()
      window.location.href = url
      return
    }
    try {
      const result = await exportCalendar.mutateAsync(false)
      toast({
        title: '¡Calendario sincronizado!',
        description: `${result.synced + result.custodySynced} events exported. Check your Google Calendar.`,
      })
    } catch {
      toast({ title: 'Export failed', description: 'Could not sync to Google Calendar.', variant: 'destructive' })
    }
  }

  // Select first child by default
  useEffect(() => {
    if (children && children.length > 0 && selectedChildId === null) {
      setSelectedChildId(children[0].id)
    }
  }, [children]) // eslint-disable-line react-hooks/exhaustive-deps

  const parentColorMap = useMemo(
    () => buildParentColorMap(family?.members ?? []),
    [family?.members],
  )

  const parents = useMemo(
    () => (family?.members ?? []).filter((m: FamilyMember) => m.role === 'PARENT'),
    [family?.members],
  )

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting }, reset } = useForm<ScheduleForm>({
    resolver: zodResolver(scheduleSchema),
  })
  const watchPattern = watch('pattern')

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

  function openAddEvent(date?: string) {
    setAddEventDate(date)
    setAddEventOpen(true)
  }

  function openEditEvent(ev: CalendarEvent) {
    setEditingEvent(ev)
    setAddEventOpen(true)
  }

  const hasSidebar = viewMode !== 'year'

  return (
    <div className="space-y-4 max-w-6xl">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Family Calendar</h2>
          <p className="text-sm text-slate-400">Custody schedule at a glance</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exportCalendar.isPending || getGoogleAuthUrl.isPending}
            className="gap-2"
          >
            {exportCalendar.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CalendarSync className="w-4 h-4" />
            )}
            {exportCalendar.isPending ? 'Exporting…' : 'Google Calendar'}
          </Button>
          <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2">
            <DownloadCloud className="w-4 h-4" />
            Import
          </Button>
          <Button
            variant="outline"
            onClick={() => openAddEvent(focusDate)}
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

      {/* ── View selector + nav ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <ViewSelector />

        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={navigatePrev}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-slate-700 min-w-[180px] text-center">
            {headerTitle}
          </span>
          <button
            onClick={navigateNext}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <Button variant="outline" size="sm" onClick={goToToday} className="ml-1 text-xs">
            Today
          </Button>
        </div>
      </div>

      {/* ── Child filter (shared across all views) ──────────────────────────── */}
      {children && children.length > 1 && viewMode !== 'year' && (
        <div className="flex items-center gap-1.5 flex-wrap">
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

      {/* ── Main layout ─────────────────────────────────────────────────────── */}
      {viewMode === 'year' ? (
        /* Year: full width */
        familyId ? (
          <YearView
            familyId={familyId}
            parentColorMap={parentColorMap}
            selectedChildId={selectedChildId}
          />
        ) : null
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main view */}
          <Card className="lg:col-span-2">
            <CardContent className="pt-4">
              {!familyId || !children ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                </div>
              ) : viewMode === 'month' ? (
                <MonthView
                  familyId={familyId}
                  children={children}
                  parents={parents}
                  parentColorMap={parentColorMap}
                  selectedChildId={selectedChildId}
                  selectedDay={selectedDay}
                  onSelectDay={setSelectedDay}
                  onAddEvent={openAddEvent}
                  onEditEvent={openEditEvent}
                />
              ) : viewMode === 'week' ? (
                <WeekView
                  familyId={familyId}
                  children={children}
                  parents={parents}
                  parentColorMap={parentColorMap}
                  selectedChildId={selectedChildId}
                  onAddEvent={openAddEvent}
                  onEditEvent={openEditEvent}
                />
              ) : viewMode === 'day' ? (
                <DayView
                  familyId={familyId}
                  children={children}
                  parents={parents}
                  parentColorMap={parentColorMap}
                  selectedChildId={selectedChildId}
                  onAddEvent={openAddEvent}
                  onEditEvent={openEditEvent}
                />
              ) : viewMode === 'list' ? (
                <ListView
                  familyId={familyId}
                  children={children}
                  parents={parents}
                  parentColorMap={parentColorMap}
                  selectedChildId={selectedChildId}
                  onAddEvent={openAddEvent}
                  onEditEvent={openEditEvent}
                />
              ) : null}
            </CardContent>
          </Card>

          {/* Sidebar */}
          {hasSidebar && (
            <div className="space-y-4">
              {/* Parent legend */}
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
                          onClick={() => setSelectedChildId(selectedChildId === c.id ? c.id : c.id)}
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
          )}
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {familyId && children && (
        <ImportEventsModal
          open={importOpen}
          onClose={() => setImportOpen(false)}
          familyId={familyId}
          children={children}
        />
      )}

      {familyId && children && (
        <AddEventModal
          open={addEventOpen}
          onClose={() => { setAddEventOpen(false); setEditingEvent(null) }}
          familyId={familyId}
          children={children}
          parents={parents}
          defaultDate={addEventDate}
          editEvent={editingEvent ?? undefined}
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
