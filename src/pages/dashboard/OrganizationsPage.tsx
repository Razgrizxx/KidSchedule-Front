import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  School, Trophy, Copy, Check, Trash2, UserMinus, CalendarPlus, Loader2,
  Crown, MapPin, Megaphone, Pin, UserCheck, UserX, Download, Globe,
  Lock, Search, ChevronDown, Plus, CalendarDays, Link2, ShieldCheck,
} from 'lucide-react'
import {
  useOrganization, useDeleteOrg, useLeaveOrg, useUpdateOrg,
  useCreateOrgEvent, useDeleteOrgEvent, useOrgEvents,
  useApproveMember, useRejectMember, useRemoveMember, useUpdateMemberRole,
  useCreateVenue, useDeleteVenue, useOrgVenues,
  useCreateAnnouncement, useDeleteAnnouncement, useOrgAnnouncements,
  useUpsertRsvp, useBulkCreateOrgEvents,
  useCreateCustomRole, useUpdateCustomRole, useDeleteCustomRole, useAssignCustomRole,
} from '@/hooks/useOrganizations'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { OrgCustomRole, OrgEvent, OrgMember, OrgRole, Venue, Announcement } from '@/types/api'

// ── Constants ──────────────────────────────────────────────────────────────

const ROLE_BADGE: Record<OrgRole, string> = {
  OWNER: 'bg-amber-100 text-amber-700',
  ADMIN: 'bg-teal-100 text-teal-700',
  VOLUNTEER: 'bg-blue-100 text-blue-700',
  MEMBER: 'bg-slate-100 text-slate-500',
}

const RSVP_STYLE = {
  YES: 'bg-green-500 text-white hover:bg-green-600',
  NO: 'bg-red-500 text-white hover:bg-red-600',
  MAYBE: 'bg-amber-400 text-white hover:bg-amber-500',
}

const RSVP_OUTLINE = {
  YES: 'border-green-300 text-green-600 hover:bg-green-50',
  NO: 'border-red-300 text-red-600 hover:bg-red-50',
  MAYBE: 'border-amber-300 text-amber-600 hover:bg-amber-50',
}

function initials(first: string, last: string) { return `${first[0]}${last[0]}`.toUpperCase() }

// ── Add Event Modal ────────────────────────────────────────────────────────

function AddEventModal({ orgId, venues, open, onClose }: {
  orgId: string; venues: Venue[]; open: boolean; onClose: () => void
}) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [allDay, setAllDay] = useState(false)
  const [venueId, setVenueId] = useState('')
  const [maxCapacity, setMaxCapacity] = useState('')
  const createEvent = useCreateOrgEvent()

  function reset() {
    setTitle(''); setDate(''); setStartTime('09:00'); setEndTime('10:00')
    setAllDay(false); setVenueId(''); setMaxCapacity('')
  }

  async function handleSubmit() {
    if (!title.trim() || !date) return
    const startAt = allDay ? `${date}T00:00:00.000Z` : new Date(`${date}T${startTime}:00`).toISOString()
    const endAt = allDay ? `${date}T23:59:59.000Z` : new Date(`${date}T${endTime}:00`).toISOString()
    try {
      await createEvent.mutateAsync({
        orgId, title: title.trim(), startAt, endAt, allDay,
        venueId: venueId || undefined,
        maxCapacity: maxCapacity ? Number(maxCapacity) : undefined,
      })
      toast({ title: 'Event added', variant: 'success' })
      reset(); onClose()
    } catch {
      toast({ title: 'Could not create event', variant: 'error' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose() } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Add Event</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input placeholder="Soccer Practice" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          {!allDay && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start</Label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>End</Label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>
          )}
          {venues.length > 0 && (
            <div className="space-y-1.5">
              <Label>Venue</Label>
              <select
                value={venueId}
                onChange={(e) => setVenueId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-300"
              >
                <option value="">No venue</option>
                {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Max capacity</Label>
              <Input type="number" min="1" placeholder="Unlimited" value={maxCapacity} onChange={(e) => setMaxCapacity(e.target.value)} />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="rounded" />
                All day
              </label>
            </div>
          </div>
          <Button className="w-full" onClick={handleSubmit} disabled={createEvent.isPending || !title.trim() || !date}>
            {createEvent.isPending ? 'Saving…' : 'Add Event'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Bulk Schedule Modal ────────────────────────────────────────────────────

function BulkScheduleModal({ orgId, venues, open, onClose }: {
  orgId: string; venues: Venue[]; open: boolean; onClose: () => void
}) {
  const [title, setTitle] = useState('')
  const [dates, setDates] = useState<string[]>([])
  const [dateInput, setDateInput] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [venueId, setVenueId] = useState('')
  const bulkCreate = useBulkCreateOrgEvents()

  function addDate() {
    if (dateInput && !dates.includes(dateInput)) setDates((d) => [...d, dateInput].sort())
    setDateInput('')
  }

  function reset() {
    setTitle(''); setDates([]); setDateInput('')
    setStartTime('09:00'); setEndTime('10:00'); setVenueId('')
  }

  async function handleSubmit() {
    if (!title.trim() || dates.length === 0) return
    try {
      const result = await bulkCreate.mutateAsync({
        orgId, title: title.trim(), dates, startTime, endTime,
        venueId: venueId || undefined,
      })
      toast({ title: `${result.created} events created`, variant: 'success' })
      reset(); onClose()
    } catch {
      toast({ title: 'Could not create events', variant: 'error' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose() } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Bulk Schedule</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Event title</Label>
            <Input placeholder="Soccer Practice" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Add dates</Label>
            <div className="flex gap-2">
              <Input type="date" value={dateInput} onChange={(e) => setDateInput(e.target.value)} />
              <Button type="button" variant="outline" onClick={addDate} disabled={!dateInput}>Add</Button>
            </div>
            {dates.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {dates.map((d) => (
                  <span key={d} className="flex items-center gap-1 px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full text-xs">
                    {new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    <button onClick={() => setDates((prev) => prev.filter((x) => x !== d))} className="hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>End</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
          {venues.length > 0 && (
            <div className="space-y-1.5">
              <Label>Venue</Label>
              <select
                value={venueId}
                onChange={(e) => setVenueId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-300"
              >
                <option value="">No venue</option>
                {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
          )}
          <Button className="w-full" onClick={handleSubmit} disabled={bulkCreate.isPending || !title.trim() || dates.length === 0}>
            {bulkCreate.isPending ? 'Creating…' : `Create ${dates.length} event${dates.length !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── RSVP Buttons ───────────────────────────────────────────────────────────

function RsvpButtons({ orgId, event }: { orgId: string; event: OrgEvent }) {
  const user = useAuthStore((s) => s.user)
  const myRsvp = event.rsvps?.find((r) => r.userId === user?.id)
  const upsertRsvp = useUpsertRsvp()

  const counts = {
    YES: event.rsvps?.filter((r) => r.status === 'YES').length ?? 0,
    NO: event.rsvps?.filter((r) => r.status === 'NO').length ?? 0,
    MAYBE: event.rsvps?.filter((r) => r.status === 'MAYBE').length ?? 0,
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {(['YES', 'NO', 'MAYBE'] as const).map((s) => (
        <button
          key={s}
          disabled={upsertRsvp.isPending}
          onClick={() => upsertRsvp.mutate({ orgId, eventId: event.id, status: s })}
          className={cn(
            'px-2.5 py-1 rounded-full text-xs font-semibold border transition-all',
            myRsvp?.status === s ? RSVP_STYLE[s] : `bg-white border ${RSVP_OUTLINE[s]}`,
          )}
        >
          {s === 'YES' ? '✓ Going' : s === 'NO' ? '✗ No' : '? Maybe'} {counts[s] > 0 && `(${counts[s]})`}
        </button>
      ))}
    </div>
  )
}

// ── Event Card ─────────────────────────────────────────────────────────────

function EventCard({ event, isManager, orgId }: { event: OrgEvent; isManager: boolean; orgId: string }) {
  const deleteEvent = useDeleteOrgEvent()
  const [expanded, setExpanded] = useState(false)

  const yesCount = event.rsvps?.filter((r) => r.status === 'YES').length ?? 0
  const totalRsvps = event.rsvps?.length ?? 0

  return (
    <div className="rounded-xl border border-slate-100 hover:border-slate-200 transition-colors overflow-hidden">
      <div className="flex items-start gap-3 p-3">
        <div className="text-center min-w-[40px]">
          <div className="text-xs text-slate-400">{new Date(event.startAt).toLocaleDateString('en-US', { month: 'short' })}</div>
          <div className="text-lg font-bold text-slate-800 leading-none">{new Date(event.startAt).getDate()}</div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800">{event.title}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {event.allDay ? 'All day' : `${new Date(event.startAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} – ${new Date(event.endAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
          </p>
          {event.venue && (
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3" />{event.venue.name}
            </p>
          )}
          {totalRsvps > 0 && (
            <p className="text-xs text-teal-600 mt-0.5">{yesCount} going · {totalRsvps} responded</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setExpanded((e) => !e)} className="p-1 text-slate-300 hover:text-slate-500">
            <ChevronDown className={cn('w-4 h-4 transition-transform', expanded && 'rotate-180')} />
          </button>
          {isManager && (
            <button
              onClick={() => deleteEvent.mutate({ orgId, eventId: event.id })}
              disabled={deleteEvent.isPending}
              className="p-1 text-slate-300 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 border-t border-slate-50 pt-2 space-y-2">
          <p className="text-xs font-medium text-slate-500">Your RSVP</p>
          <RsvpButtons orgId={orgId} event={event} />
          {event.rsvps && event.rsvps.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-xs font-medium text-slate-400">Responses</p>
              {(['YES', 'NO', 'MAYBE'] as const).map((s) => {
                const group = event.rsvps!.filter((r) => r.status === s)
                if (group.length === 0) return null
                return (
                  <div key={s} className="flex items-center gap-2">
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-bold', RSVP_STYLE[s])}>
                      {s === 'YES' ? '✓' : s === 'NO' ? '✗' : '?'}
                    </span>
                    <span className="text-xs text-slate-600">{group.map((r) => r.user.firstName).join(', ')}</span>
                  </div>
                )
              })}
            </div>
          )}
          {event.maxCapacity && (
            <p className="text-xs text-slate-400">Capacity: {yesCount}/{event.maxCapacity}</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Venue Card ─────────────────────────────────────────────────────────────

function AddVenueModal({ orgId, open, onClose }: { orgId: string; open: boolean; onClose: () => void }) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [mapUrl, setMapUrl] = useState('')
  const [notes, setNotes] = useState('')
  const createVenue = useCreateVenue()

  function reset() { setName(''); setAddress(''); setMapUrl(''); setNotes('') }

  async function handleSubmit() {
    if (!name.trim()) return
    try {
      await createVenue.mutateAsync({ orgId, name: name.trim(), address, mapUrl, notes })
      toast({ title: 'Venue added', variant: 'success' })
      reset(); onClose()
    } catch {
      toast({ title: 'Could not add venue', variant: 'error' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose() } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Add Venue</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input placeholder="City Park Field 3" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Input placeholder="123 Main St" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Map URL</Label>
            <Input placeholder="https://maps.google.com/..." value={mapUrl} onChange={(e) => setMapUrl(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Input placeholder="Parking at the north entrance" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button className="w-full" onClick={handleSubmit} disabled={createVenue.isPending || !name.trim()}>
            {createVenue.isPending ? 'Saving…' : 'Add Venue'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Announcement Composer ──────────────────────────────────────────────────

function AnnouncementComposer({ orgId, onClose }: { orgId: string; onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [pinned, setPinned] = useState(false)
  const createAnnouncement = useCreateAnnouncement()

  async function handleSubmit() {
    if (!title.trim() || !content.trim()) return
    try {
      await createAnnouncement.mutateAsync({ orgId, title: title.trim(), content: content.trim(), pinned })
      toast({ title: 'Announcement posted', variant: 'success' })
      setTitle(''); setContent(''); setPinned(false)
      onClose()
    } catch {
      toast({ title: 'Could not post announcement', variant: 'error' })
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
      <p className="text-sm font-semibold text-slate-700">New Announcement</p>
      <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Textarea placeholder="Write your message…" value={content} onChange={(e) => setContent(e.target.value)} rows={4} />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
          <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="rounded" />
          <Pin className="w-3.5 h-3.5" /> Pin to top
        </label>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={createAnnouncement.isPending || !title.trim() || !content.trim()}>
            {createAnnouncement.isPending ? 'Posting…' : 'Post'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────

export function OrganizationsPage() {
  const { id } = useParams<{ id: string }>()
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [addEventOpen, setAddEventOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [addVenueOpen, setAddVenueOpen] = useState(false)
  const [composingAnnouncement, setComposingAnnouncement] = useState(false)
  const [memberSearch, setMemberSearch] = useState('')

  const { data: org, isLoading } = useOrganization(id)
  const { data: events = [] } = useOrgEvents(id)
  const { data: venues = [] } = useOrgVenues(id)
  const { data: announcements = [] } = useOrgAnnouncements(id)
  const deleteOrg = useDeleteOrg()
  const leaveOrg = useLeaveOrg()
  const updateOrg = useUpdateOrg()
  const approveM = useApproveMember()
  const rejectM = useRejectMember()
  const removeM = useRemoveMember()
  const deleteVenue = useDeleteVenue()
  const deleteAnn = useDeleteAnnouncement()

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
    </div>
  )
  if (!org) return null

  const isManager = ['OWNER', 'ADMIN'].includes(org.myRole ?? org.role)
  const isPending = org.myStatus === 'PENDING'
  const myCustomRole = org.myCustomRole
  const canCreateEvents = isManager || !!myCustomRole?.canCreateEvents
  const canCreateAnnouncements = isManager || !!myCustomRole?.canCreateAnnouncements
  const canCreateVenues = isManager || !!myCustomRole?.canCreateVenues

  const activeMembers = org.members?.filter((m) => m.status === 'ACTIVE') ?? []
  const pendingMembers = org.members?.filter((m) => m.status === 'PENDING') ?? []
  const filteredMembers = memberSearch
    ? activeMembers.filter((m) =>
        `${m.user.firstName} ${m.user.lastName} ${m.user.email}`
          .toLowerCase()
          .includes(memberSearch.toLowerCase())
      )
    : activeMembers

  const upcomingEvents = events.filter((e) => new Date(e.startAt) >= new Date())
  const pastEvents = events.filter((e) => new Date(e.startAt) < new Date())

  function copyCode() {
    navigator.clipboard.writeText(org!.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function copyPublicLink() {
    navigator.clipboard.writeText(`${window.location.origin}/org/${org!.id}/calendar`)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  function togglePublic() {
    updateOrg.mutate({ orgId: org!.id, isPublic: !org!.isPublic })
  }

  function downloadIcs() {
    window.open(`/api/v1/organizations/${id}/calendar.ics`, '_blank')
  }

  async function handleDelete() {
    if (!confirm('Delete this organization? This cannot be undone.')) return
    await deleteOrg.mutateAsync(org!.id)
    navigate('/dashboard')
  }

  async function handleLeave() {
    if (!confirm('Leave this organization?')) return
    await leaveOrg.mutateAsync(org!.id)
    navigate('/dashboard')
  }

  // ── Pending approval screen ───────────────────────────────────────────────

  if (isPending) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center space-y-4 px-4">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
          <UserCheck className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Awaiting Approval</h2>
        <p className="text-slate-500 text-sm">
          Your request to join <strong>{org.name}</strong> is pending approval from the admin.
          You'll get access once they verify your membership.
        </p>
        <Button variant="outline" onClick={handleLeave}>Cancel request</Button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center shrink-0',
          org.type === 'SCHOOL' ? 'bg-blue-100' : 'bg-orange-100')}>
          {org.type === 'SCHOOL'
            ? <School className="w-7 h-7 text-blue-600" />
            : <Trophy className="w-7 h-7 text-orange-600" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-slate-800">{org.name}</h1>
            <Badge variant="outline" className="text-xs">{org.type === 'SCHOOL' ? 'School' : 'Team'}</Badge>
            <Badge className={cn('border-0 text-xs', ROLE_BADGE[org.myRole ?? org.role])}>
              {org.myRole ?? org.role}
            </Badge>
            {isManager
              ? (
                <button
                  onClick={togglePublic}
                  disabled={updateOrg.isPending}
                  className={cn(
                    'flex items-center gap-1 text-xs rounded-full px-2 py-0.5 transition-colors',
                    org.isPublic
                      ? 'text-green-600 bg-green-50 hover:bg-green-100'
                      : 'text-slate-400 bg-slate-100 hover:bg-slate-200',
                  )}
                  title={org.isPublic ? 'Click to make private' : 'Click to make public'}
                >
                  {org.isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  {org.isPublic ? 'Public' : 'Private'}
                </button>
              )
              : org.isPublic
                ? <span className="flex items-center gap-1 text-xs text-green-600"><Globe className="w-3 h-3" /> Public</span>
                : <span className="flex items-center gap-1 text-xs text-slate-400"><Lock className="w-3 h-3" /> Private</span>}
          </div>
          {org.description && <p className="text-sm text-slate-500 mt-1">{org.description}</p>}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <code className="text-sm text-slate-600 font-mono bg-slate-50 px-2 py-0.5 rounded">{org.inviteCode}</code>
            <button onClick={copyCode} className="p-1 rounded text-slate-400 hover:text-teal-600 transition-colors" title="Copy invite code">
              {copied ? <Check className="w-3.5 h-3.5 text-teal-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button onClick={downloadIcs} className="flex items-center gap-1 text-xs text-slate-400 hover:text-teal-600 transition-colors">
              <Download className="w-3.5 h-3.5" /> .ics
            </button>
            {org.isPublic && (
              <button onClick={copyPublicLink} className="flex items-center gap-1 text-xs text-slate-400 hover:text-teal-600 transition-colors" title="Copy public calendar link">
                {copiedLink ? <Check className="w-3.5 h-3.5 text-teal-500" /> : <Link2 className="w-3.5 h-3.5" />}
                {copiedLink ? 'Copied!' : 'Share link'}
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {isManager
            ? <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={handleDelete}><Trash2 className="w-3.5 h-3.5" /></Button>
            : <Button size="sm" variant="ghost" className="text-slate-400 hover:text-red-500 hover:bg-red-50" onClick={handleLeave}><UserMinus className="w-3.5 h-3.5" /></Button>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Members', value: activeMembers.length },
          { label: 'Events', value: events.length },
          { label: 'Venues', value: venues.length },
          { label: 'Posts', value: announcements.length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 p-3 text-center">
            <div className="text-xl font-bold text-slate-800">{value}</div>
            <div className="text-xs text-slate-400">{label}</div>
          </div>
        ))}
      </div>

      {/* Pending approvals banner */}
      {isManager && pendingMembers.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-amber-800 mb-2">
            {pendingMembers.length} pending approval{pendingMembers.length !== 1 ? 's' : ''}
          </p>
          <div className="space-y-2">
            {pendingMembers.map((m) => (
              <div key={m.id} className="flex items-center gap-3">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-[10px]">{initials(m.user.firstName, m.user.lastName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{m.user.firstName} {m.user.lastName}</p>
                  <p className="text-xs text-slate-400 truncate">{m.user.email}</p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => approveM.mutate({ orgId: org.id, userId: m.userId })}
                    disabled={approveM.isPending}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-500 text-white text-xs font-medium hover:bg-green-600 transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => rejectM.mutate({ orgId: org.id, userId: m.userId })}
                    disabled={rejectM.isPending}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-100 text-red-600 text-xs font-medium hover:bg-red-200 transition-colors"
                  >
                    <UserX className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="events">
        <TabsList className="w-full">
          <TabsTrigger value="events" className="flex-1">
            <CalendarDays className="w-3.5 h-3.5 mr-1.5" /> Events
          </TabsTrigger>
          <TabsTrigger value="members" className="flex-1">
            <Crown className="w-3.5 h-3.5 mr-1.5" /> Members
          </TabsTrigger>
          <TabsTrigger value="venues" className="flex-1">
            <MapPin className="w-3.5 h-3.5 mr-1.5" /> Venues
          </TabsTrigger>
          <TabsTrigger value="announcements" className="flex-1">
            <Megaphone className="w-3.5 h-3.5 mr-1.5" /> Posts
          </TabsTrigger>
          {isManager && (
            <TabsTrigger value="roles" className="flex-1">
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> Roles
            </TabsTrigger>
          )}
        </TabsList>

        {/* ── Events tab ── */}
        <TabsContent value="events" className="space-y-3 mt-4">
          {canCreateEvents && (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setAddEventOpen(true)}>
                <CalendarPlus className="w-3.5 h-3.5 mr-1.5" /> Add Event
              </Button>
              <Button size="sm" variant="outline" onClick={() => setBulkOpen(true)}>
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Bulk Schedule
              </Button>
            </div>
          )}
          {upcomingEvents.length === 0 && pastEvents.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">No events yet.</p>
          )}
          <div className="space-y-2">
            {upcomingEvents.map((e) => (
              <EventCard key={e.id} event={e} isManager={isManager} orgId={org.id} />
            ))}
          </div>
          {pastEvents.length > 0 && (
            <div className="space-y-2 opacity-60">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Past</p>
              {pastEvents.slice(-5).map((e) => (
                <EventCard key={e.id} event={e} isManager={isManager} orgId={org.id} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Members tab ── */}
        <TabsContent value="members" className="space-y-3 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search members…"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="space-y-2">
            {filteredMembers.map((m) => (
              <MemberRow
                key={m.id}
                member={m}
                isManager={isManager}
                isSelf={m.userId === user?.id}
                orgId={org.id}
                onRemove={() => removeM.mutate({ orgId: org.id, userId: m.userId })}
                customRoles={(org.customRoles ?? []) as OrgCustomRole[]}
              />
            ))}
            {filteredMembers.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">No members found.</p>
            )}
          </div>
          {!isManager && (
            <p className="text-xs text-slate-400 text-center pt-2">
              Contact information is visible to all active members.
            </p>
          )}
        </TabsContent>

        {/* ── Venues tab ── */}
        <TabsContent value="venues" className="space-y-3 mt-4">
          {canCreateVenues && (
            <Button size="sm" onClick={() => setAddVenueOpen(true)}>
              <MapPin className="w-3.5 h-3.5 mr-1.5" /> Add Venue
            </Button>
          )}
          {venues.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">No venues saved yet.</p>
          )}
          <div className="space-y-2">
            {(venues as Venue[]).map((v) => (
              <div key={v.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{v.name}</p>
                  {v.address && <p className="text-xs text-slate-400">{v.address}</p>}
                  {v.notes && <p className="text-xs text-slate-400 italic">{v.notes}</p>}
                  {v.mapUrl && (
                    <a href={v.mapUrl} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-teal-500 hover:underline mt-0.5 inline-block">
                      Open in Maps ↗
                    </a>
                  )}
                </div>
                {isManager && (
                  <button
                    onClick={() => deleteVenue.mutate({ orgId: org.id, venueId: v.id })}
                    className="p-1 text-slate-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ── Announcements tab ── */}
        <TabsContent value="announcements" className="space-y-3 mt-4">
          {canCreateAnnouncements && !composingAnnouncement && (
            <Button size="sm" onClick={() => setComposingAnnouncement(true)}>
              <Megaphone className="w-3.5 h-3.5 mr-1.5" /> New Announcement
            </Button>
          )}
          {composingAnnouncement && (
            <AnnouncementComposer orgId={org.id} onClose={() => setComposingAnnouncement(false)} />
          )}
          {announcements.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">No announcements yet.</p>
          )}
          <div className="space-y-3">
            {(announcements as Announcement[]).map((a) => (
              <div key={a.id} className="bg-white rounded-2xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {a.pinned && <Pin className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                    <p className="text-sm font-semibold text-slate-800">{a.title}</p>
                  </div>
                  {isManager && (
                    <button onClick={() => deleteAnn.mutate({ orgId: org.id, announcementId: a.id })}
                      className="p-1 text-slate-300 hover:text-red-400 shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{a.content}</p>
                <p className="text-xs text-slate-400 mt-2">
                  {a.author.firstName} {a.author.lastName} · {new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ── Roles tab ── */}
        {isManager && (
          <TabsContent value="roles" className="mt-4">
            <CustomRolesTab orgId={org.id} customRoles={(org.customRoles ?? []) as OrgCustomRole[]} />
          </TabsContent>
        )}
      </Tabs>

      {/* Modals */}
      <AddEventModal orgId={org.id} venues={venues as Venue[]} open={addEventOpen} onClose={() => setAddEventOpen(false)} />
      <BulkScheduleModal orgId={org.id} venues={venues as Venue[]} open={bulkOpen} onClose={() => setBulkOpen(false)} />
      <AddVenueModal orgId={org.id} open={addVenueOpen} onClose={() => setAddVenueOpen(false)} />
    </div>
  )
}

// ── Member Row ─────────────────────────────────────────────────────────────

function MemberRow({ member, isManager, isSelf, orgId, onRemove, customRoles }: {
  member: OrgMember; isManager: boolean; isSelf: boolean; orgId: string
  onRemove: () => void; customRoles: OrgCustomRole[]
}) {
  const updateRole = useUpdateMemberRole()
  const assignCustomRole = useAssignCustomRole()
  const [showRoles, setShowRoles] = useState(false)
  const [showCustomRoles, setShowCustomRoles] = useState(false)
  const roles: OrgRole[] = ['MEMBER', 'VOLUNTEER', 'ADMIN']

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="text-xs">{initials(member.user.firstName, member.user.lastName)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">
          {member.user.firstName} {member.user.lastName}
          {isSelf && <span className="text-slate-400 ml-1 text-xs">(you)</span>}
        </p>
        <p className="text-xs text-slate-400 truncate">{member.user.email}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {member.customRole && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600 font-medium border border-violet-100 truncate max-w-[80px]">
            {member.customRole.name}
          </span>
        )}
        {isManager && !isSelf ? (
          <div className="flex items-center gap-1">
            <div className="relative">
              <button
                onClick={() => setShowRoles((v) => !v)}
                className={cn('text-[11px] px-2 py-0.5 rounded-full font-semibold', ROLE_BADGE[member.role])}
              >
                {member.role} ▾
              </button>
              {showRoles && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
                  {roles.map((r) => (
                    <button
                      key={r}
                      onClick={() => { updateRole.mutate({ orgId, userId: member.userId, role: r }); setShowRoles(false) }}
                      className="block w-full text-left px-4 py-2 text-xs hover:bg-slate-50"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {customRoles.length > 0 && member.role !== 'OWNER' && (
              <div className="relative">
                <button
                  onClick={() => setShowCustomRoles((v) => !v)}
                  className="p-1 text-slate-300 hover:text-violet-500 transition-colors"
                  title="Assign custom role"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                </button>
                {showCustomRoles && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden min-w-[140px]">
                    <button
                      onClick={() => { assignCustomRole.mutate({ orgId, userId: member.userId, customRoleId: null }); setShowCustomRoles(false) }}
                      className="block w-full text-left px-4 py-2 text-xs hover:bg-slate-50 text-slate-400"
                    >
                      None
                    </button>
                    {customRoles.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => { assignCustomRole.mutate({ orgId, userId: member.userId, customRoleId: r.id }); setShowCustomRoles(false) }}
                        className={cn('block w-full text-left px-4 py-2 text-xs hover:bg-violet-50', member.customRole?.id === r.id ? 'text-violet-600 font-semibold' : '')}
                      >
                        {r.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <span className={cn('text-[11px] px-2 py-0.5 rounded-full font-semibold', ROLE_BADGE[member.role])}>
            {member.role}
          </span>
        )}
        {isManager && !isSelf && member.role !== 'OWNER' && (
          <button onClick={onRemove} className="p-1 text-slate-300 hover:text-red-400 transition-colors">
            <UserX className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

// ── Custom Roles Tab ────────────────────────────────────────────────────────

const PERM_LABELS = [
  { key: 'canCreateEvents' as const, label: 'Create events' },
  { key: 'canCreateAnnouncements' as const, label: 'Create announcements' },
  { key: 'canCreateVenues' as const, label: 'Create venues' },
]

function CustomRolesTab({ orgId, customRoles }: { orgId: string; customRoles: OrgCustomRole[] }) {
  const createRole = useCreateCustomRole()
  const updateRole = useUpdateCustomRole()
  const deleteRole = useDeleteCustomRole()

  const [newName, setNewName] = useState('')
  const [newPerms, setNewPerms] = useState({ canCreateEvents: false, canCreateAnnouncements: false, canCreateVenues: false })
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editPerms, setEditPerms] = useState({ canCreateEvents: false, canCreateAnnouncements: false, canCreateVenues: false })

  function startEdit(role: OrgCustomRole) {
    setEditingId(role.id)
    setEditName(role.name)
    setEditPerms({ canCreateEvents: role.canCreateEvents, canCreateAnnouncements: role.canCreateAnnouncements, canCreateVenues: role.canCreateVenues })
  }

  function handleCreate() {
    if (!newName.trim()) return
    createRole.mutate({ orgId, name: newName.trim(), ...newPerms }, {
      onSuccess: () => {
        setNewName('')
        setNewPerms({ canCreateEvents: false, canCreateAnnouncements: false, canCreateVenues: false })
        setCreating(false)
      },
    })
  }

  function handleUpdate() {
    if (!editingId || !editName.trim()) return
    updateRole.mutate({ orgId, roleId: editingId, name: editName.trim(), ...editPerms }, {
      onSuccess: () => setEditingId(null),
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">Custom roles let you grant specific permissions to members beyond their base role.</p>
        {!creating && (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> New Role
          </Button>
        )}
      </div>

      {creating && (
        <div className="bg-white border border-violet-100 rounded-2xl p-4 space-y-3">
          <Input
            placeholder="Role name (e.g. Coach, Coordinator)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
          />
          <div className="space-y-2">
            {PERM_LABELS.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newPerms[key]}
                  onChange={(e) => setNewPerms((p) => ({ ...p, [key]: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm text-slate-700">{label}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={!newName.trim() || createRole.isPending}>Create</Button>
            <Button size="sm" variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {customRoles.length === 0 && !creating && (
        <p className="text-sm text-slate-400 text-center py-8">No custom roles yet.</p>
      )}

      <div className="space-y-2">
        {customRoles.map((role) => (
          <div key={role.id} className="bg-white border border-slate-100 rounded-2xl p-4">
            {editingId === role.id ? (
              <div className="space-y-3">
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
                <div className="space-y-2">
                  {PERM_LABELS.map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editPerms[key]}
                        onChange={(e) => setEditPerms((p) => ({ ...p, [key]: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm text-slate-700">{label}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleUpdate} disabled={!editName.trim() || updateRole.isPending}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-violet-700">{role.name}</span>
                    {role._count && (
                      <span className="text-xs text-slate-400">{role._count.members} member{role._count.members !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                  <div className="flex gap-3 mt-1.5 flex-wrap">
                    {PERM_LABELS.map(({ key, label }) => (
                      <span key={key} className={cn('text-xs flex items-center gap-1', role[key] ? 'text-teal-600' : 'text-slate-300')}>
                        {role[key] ? '✓' : '✗'} {label}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => startEdit(role)} className="p-1 text-slate-400 hover:text-violet-500 transition-colors">
                    <ChevronDown className="w-3.5 h-3.5 rotate-[-90deg]" />
                  </button>
                  <button
                    onClick={() => deleteRole.mutate({ orgId, roleId: role.id })}
                    disabled={deleteRole.isPending}
                    className="p-1 text-slate-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
