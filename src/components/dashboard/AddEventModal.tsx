import { useState, useEffect } from 'react'
import { Loader2, Users, Lock, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateEvent, useUpdateEvent } from '@/hooks/useCalendar'
import { toast } from '@/hooks/use-toast'
import type { Child, FamilyMember, EventType, EventVisibility, RepeatPattern, CalendarEvent } from '@/types/api'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  onClose: () => void
  familyId: string
  children: Child[]
  parents: FamilyMember[]
  /** Pre-fill the start date (YYYY-MM-DD) when opened by clicking a day */
  defaultDate?: string
  /** When provided, the modal acts as an editor for this event */
  editEvent?: CalendarEvent
}

// ── Constants ─────────────────────────────────────────────────────────────────

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: 'CUSTODY_TIME', label: 'Custody Time' },
  { value: 'SCHOOL', label: 'School' },
  { value: 'MEDICAL', label: 'Medical' },
  { value: 'ACTIVITY', label: 'Activity' },
  { value: 'VACATION', label: 'Vacation' },
  { value: 'OTHER', label: 'Other' },
]

const REPEAT_PATTERNS: { value: RepeatPattern; label: string }[] = [
  { value: 'NONE', label: 'Does not repeat' },
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'BIWEEKLY', label: 'Every 2 weeks' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
]

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AddEventModal({ open, onClose, familyId, children, parents, defaultDate, editEvent }: Props) {
  const createEvent = useCreateEvent()
  const updateEvent = useUpdateEvent()
  const isEditing = !!editEvent

  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([])
  const [type, setType] = useState<EventType>('CUSTODY_TIME')
  const [assignedToId, setAssignedToId] = useState<string>('')
  const [title, setTitle] = useState('Custody Time')
  const [visibility, setVisibility] = useState<EventVisibility>('SHARED')
  const [allDay, setAllDay] = useState(false)
  const [startDate, setStartDate] = useState(todayStr())
  const [startTime, setStartTime] = useState('09:00')
  const [endDate, setEndDate] = useState(todayStr())
  const [endTime, setEndTime] = useState('17:00')
  const [repeat, setRepeat] = useState<RepeatPattern>('NONE')
  const [notes, setNotes] = useState('')

  // Re-seed every time the modal opens
  useEffect(() => {
    if (!open) return
    if (editEvent) {
      setSelectedChildIds(editEvent.children.map((ec) => ec.child.id))
      setAssignedToId(editEvent.assignedToId ?? '')
      setType(editEvent.type)
      setTitle(editEvent.title)
      setVisibility(editEvent.visibility)
      setAllDay(editEvent.allDay)
      setStartDate(editEvent.startAt.slice(0, 10))
      setStartTime(editEvent.startAt.slice(11, 16))
      setEndDate(editEvent.endAt.slice(0, 10))
      setEndTime(editEvent.endAt.slice(11, 16))
      setRepeat(editEvent.repeat)
      setNotes(editEvent.notes ?? '')
    } else {
      const date = defaultDate ?? todayStr()
      setSelectedChildIds(children.length > 0 ? [children[0].id] : [])
      setAssignedToId(parents[0]?.userId ?? '')
      setType('CUSTODY_TIME')
      setTitle('Custody Time')
      setVisibility('SHARED')
      setAllDay(false)
      setStartDate(date)
      setStartTime('09:00')
      setEndDate(date)
      setEndTime('17:00')
      setRepeat('NONE')
      setNotes('')
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleTypeChange(val: EventType) {
    setType(val)
    // Auto-fill title when type changes (only if user hasn't customized it)
    const defaultTitles: Record<EventType, string> = {
      CUSTODY_TIME: 'Custody Time',
      SCHOOL: 'School',
      MEDICAL: 'Medical Appointment',
      ACTIVITY: 'Activity',
      VACATION: 'Vacation',
      OTHER: '',
    }
    setTitle(defaultTitles[val])
  }

  function toggleChild(id: string) {
    setSelectedChildIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    )
  }

  function handleClose() {
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedChildIds.length === 0) {
      toast({ title: 'Select at least one child', variant: 'error' })
      return
    }

    const startAt = allDay ? `${startDate}T00:00:00.000Z` : `${startDate}T${startTime}:00.000Z`
    const endAt = allDay ? `${endDate}T23:59:59.000Z` : `${endDate}T${endTime}:00.000Z`

    try {
      const payload = {
        familyId,
        title,
        type,
        visibility,
        startAt,
        endAt,
        allDay,
        repeat,
        notes: notes || undefined,
        assignedToId: assignedToId || undefined,
        childIds: selectedChildIds,
      }
      if (isEditing && editEvent) {
        await updateEvent.mutateAsync({ ...payload, eventId: editEvent.id })
        toast({ title: 'Event updated!', variant: 'success' })
      } else {
        await createEvent.mutateAsync(payload)
        toast({ title: 'Event added!', variant: 'success' })
      }
      handleClose()
    } catch {
      toast({ title: 'Failed to add event', variant: 'error' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Event' : 'Add Event'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the details for this event.' : 'Add a new event to the family calendar.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Select Children */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Select Children
            </Label>
            <div className="flex flex-wrap gap-2">
              {children.map((c) => {
                const selected = selectedChildIds.includes(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleChild(c.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      selected
                        ? 'text-white border-transparent'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                    style={selected ? { backgroundColor: c.color, borderColor: c.color } : {}}
                  >
                    {selected && <Check className="w-3 h-3" />}
                    {c.firstName}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Event Details */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Event Details
            </p>

            <div className="space-y-1.5">
              <Label>Event Type</Label>
              <Select value={type} onValueChange={(v) => handleTypeChange(v as EventType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Assign to Parent</Label>
              <Select value={assignedToId} onValueChange={setAssignedToId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select parent…" />
                </SelectTrigger>
                <SelectContent>
                  {parents.map((m) => (
                    <SelectItem key={m.userId} value={m.userId}>
                      {m.user.firstName} {m.user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Event Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Event title"
              />
            </div>

            {/* Visibility */}
            <div className="space-y-1.5">
              <Label>Visibility</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVisibility('SHARED')}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                    visibility === 'SHARED'
                      ? 'border-teal-400 bg-teal-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Users className={`w-4 h-4 mt-0.5 shrink-0 ${visibility === 'SHARED' ? 'text-teal-500' : 'text-slate-400'}`} />
                  <div>
                    <p className={`text-sm font-medium ${visibility === 'SHARED' ? 'text-teal-700' : 'text-slate-600'}`}>
                      Shared
                    </p>
                    <p className="text-[11px] text-slate-400 leading-tight">Visible to both co-parents</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('PRIVATE')}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                    visibility === 'PRIVATE'
                      ? 'border-slate-500 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Lock className={`w-4 h-4 mt-0.5 shrink-0 ${visibility === 'PRIVATE' ? 'text-slate-600' : 'text-slate-400'}`} />
                  <div>
                    <p className={`text-sm font-medium ${visibility === 'PRIVATE' ? 'text-slate-700' : 'text-slate-600'}`}>
                      Private
                    </p>
                    <p className="text-[11px] text-slate-400 leading-tight">Only you can see this</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Date &amp; Time
            </p>

            {/* All Day toggle */}
            <label className="flex items-center gap-2 cursor-pointer w-fit">
              <div
                onClick={() => setAllDay((v) => !v)}
                className={`w-9 h-5 rounded-full transition-colors relative ${allDay ? 'bg-teal-400' : 'bg-slate-200'}`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    allDay ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </div>
              <span className="text-sm text-slate-600">All Day Event</span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              {!allDay && (
                <div className="space-y-1.5">
                  <Label>Start Time</Label>
                  <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              {!allDay && (
                <div className="space-y-1.5">
                  <Label>End Time</Label>
                  <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
              )}
            </div>
          </div>

          {/* Repeat */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Repeat Options
            </p>
            <div className="space-y-1.5">
              <Label>Repeat Pattern</Label>
              <Select value={repeat} onValueChange={(v) => setRepeat(v as RepeatPattern)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPEAT_PATTERNS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Additional Options
            </p>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional details…"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createEvent.isPending || updateEvent.isPending}>
              {(createEvent.isPending || updateEvent.isPending) && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              {isEditing ? 'Save Changes' : 'Add Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
