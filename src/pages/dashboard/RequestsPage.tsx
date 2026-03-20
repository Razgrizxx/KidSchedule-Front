import { useState, useEffect } from 'react'
import {
  ClipboardList, Check, X, MessageSquare, Loader2, Plus, AlertTriangle,
  CalendarPlus, ArrowLeftRight, CalendarRange,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useFamilies } from '@/hooks/useDashboard'
import { useRequests, useCreateRequest, useRespondRequest } from '@/hooks/useRequests'
import { useCustodyEvents } from '@/hooks/useCalendar'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/hooks/use-toast'
import type { ChangeRequest } from '@/types/api'
import { cn } from '@/lib/utils'

// ── helpers ───────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-600 border-amber-200',
  ACCEPTED: 'bg-teal-50 text-teal-600 border-teal-200',
  DECLINED: 'bg-red-50 text-red-500 border-red-200',
  COUNTER_PROPOSED: 'bg-blue-50 text-blue-600 border-blue-200',
}

const STATUS_BORDER: Record<string, string> = {
  PENDING: 'border-l-4 border-l-amber-400',
  ACCEPTED: 'border-l-4 border-l-teal-400',
  DECLINED: 'border-l-4 border-l-red-400',
  COUNTER_PROPOSED: 'border-l-4 border-l-blue-400',
}

function fmt(d: string) {
  // Parse as local noon to avoid UTC-midnight shifting to previous day
  return new Date(d.slice(0, 10) + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── New Request Modal ─────────────────────────────────────────────────────────

function NewRequestModal({
  familyId,
  open,
  onClose,
}: {
  familyId: string
  open: boolean
  onClose: () => void
}) {
  const user = useAuthStore((s) => s.user)
  const [mode, setMode] = useState<'SWAP' | 'SINGLE' | 'RANGE'>('SINGLE')
  const [originalDate, setOriginalDate] = useState('')
  const [requestedDate, setRequestedDate] = useState('')
  const [requestedDateTo, setRequestedDateTo] = useState('')
  const [reason, setReason] = useState('')
  const [ownershipWarning, setOwnershipWarning] = useState(false)

  const originalMonth = originalDate ? originalDate.slice(0, 7) : undefined
  const { data: custodyEvents } = useCustodyEvents(
    familyId,
    originalMonth,
  )

  // Check ownership when originalDate changes (swap mode only)
  useEffect(() => {
    if (mode !== 'SWAP' || !originalDate || !custodyEvents || !user) {
      setOwnershipWarning(false)
      return
    }
    const dateISO = new Date(originalDate + 'T12:00:00').toISOString().slice(0, 10)
    const event = custodyEvents.find((e) => {
      const d = new Date(e.date).toISOString().slice(0, 10)
      return d === dateISO
    })
    // Warn if that day does NOT belong to the current user
    setOwnershipWarning(!!event && event.custodianId !== user.id)
  }, [mode, originalDate, custodyEvents, user])

  const create = useCreateRequest(familyId)

  async function handleSubmit() {
    if (!requestedDate) return
    if (mode === 'SWAP' && !originalDate) return
    if (mode === 'RANGE' && !requestedDateTo) return
    try {
      await create.mutateAsync({
        type: mode === 'RANGE' ? 'PERMANENT' : 'ONE_TIME',
        requestedDate,
        originalDate: mode === 'SWAP' ? originalDate : undefined,
        requestedDateTo: mode === 'RANGE' ? requestedDateTo : undefined,
        reason: reason || undefined,
      })
      toast({ title: 'Request sent!', variant: 'success' })
      handleClose()
    } catch {
      toast({ title: 'Failed to send request', variant: 'error' })
    }
  }

  function handleClose() {
    setMode('SINGLE')
    setOriginalDate('')
    setRequestedDate('')
    setRequestedDateTo('')
    setReason('')
    setOwnershipWarning(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Schedule Request</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode toggles */}
          <div className="space-y-1.5">
            <Label>Request Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'SINGLE', icon: CalendarPlus, label: 'Extra Day' },
                { value: 'SWAP',   icon: ArrowLeftRight, label: 'Day Swap' },
                { value: 'RANGE',  icon: CalendarRange,  label: 'Date Range' },
              ] as const).map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => { setMode(value); setOriginalDate(''); setOwnershipWarning(false) }}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-medium transition-all ${
                    mode === value
                      ? 'bg-teal-50 border-teal-400 text-teal-700'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${mode === value ? 'text-teal-500' : 'text-slate-400'}`} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Swap: date giving up */}
          {mode === 'SWAP' && (
            <div className="space-y-1.5">
              <Label>Date I&apos;m Giving Up</Label>
              <Input
                type="date"
                value={originalDate}
                onChange={(e) => setOriginalDate(e.target.value)}
              />
              {ownershipWarning && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    This day appears to belong to your co-parent. Are you sure you want to give it up?
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Single / Swap: one date */}
          {mode !== 'RANGE' && (
            <div className="space-y-1.5">
              <Label>{mode === 'SWAP' ? 'Date I Want in Return' : 'Date I Want'}</Label>
              <Input
                type="date"
                value={requestedDate}
                onChange={(e) => setRequestedDate(e.target.value)}
              />
            </div>
          )}

          {/* Range: from + to */}
          {mode === 'RANGE' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>From</Label>
                <Input
                  type="date"
                  value={requestedDate}
                  onChange={(e) => setRequestedDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>To</Label>
                <Input
                  type="date"
                  value={requestedDateTo}
                  min={requestedDate || undefined}
                  onChange={(e) => setRequestedDateTo(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-1.5">
            <Label>Reason <span className="text-slate-400 font-normal">(optional)</span></Label>
            <Input
              placeholder="e.g. School event, family trip..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button
            disabled={
            !requestedDate ||
            (mode === 'SWAP' && !originalDate) ||
            (mode === 'RANGE' && !requestedDateTo) ||
            create.isPending
          }
            onClick={() => void handleSubmit()}
            className="gap-2"
          >
            {create.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Send Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Counter-propose Modal ─────────────────────────────────────────────────────

function CounterModal({
  open,
  onClose,
  onSubmit,
  responding,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (counterDate: string, counterReason: string) => void
  responding: boolean
}) {
  const [counterDate, setCounterDate] = useState('')
  const [counterReason, setCounterReason] = useState('')

  function handleClose() {
    setCounterDate('')
    setCounterReason('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Counter-Propose</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Proposed alternative date</Label>
            <Input type="date" value={counterDate} onChange={(e) => setCounterDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Reason <span className="text-slate-400 font-normal">(optional)</span></Label>
            <Input
              placeholder="Why this alternative?"
              value={counterReason}
              onChange={(e) => setCounterReason(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button
            disabled={!counterDate || responding}
            onClick={() => { onSubmit(counterDate, counterReason); handleClose() }}
            className="gap-2"
          >
            {responding && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Send Counter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Request Card ──────────────────────────────────────────────────────────────

function RequestCard({
  req,
  isMe,
  onAccept,
  onDecline,
  onCounter,
  responding,
}: {
  req: ChangeRequest
  isMe: boolean
  onAccept: () => void
  onDecline: () => void
  onCounter: () => void
  responding: boolean
}) {
  const isPending = req.status === 'PENDING'

  return (
    <Card className={cn('transition-all overflow-hidden', STATUS_BORDER[req.status])}>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-slate-800">
                {isMe ? 'Your request' : `From ${req.requester?.firstName ?? 'Co-parent'}`}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[req.status] ?? ''}`}>
                {req.status.replace('_', ' ')}
              </span>
              <span className="text-xs bg-slate-50 text-slate-500 border border-slate-100 px-2 py-0.5 rounded-full">
                {req.type === 'ONE_TIME' ? 'One-time' : 'Permanent'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              {req.originalDate && (
                <><span className="line-through text-slate-300">{fmt(req.originalDate)}</span>
                <span className="text-slate-400">→</span></>
              )}
              <span className="font-medium text-slate-700">
                {fmt(req.requestedDate)}{req.requestedDateTo ? ` – ${fmt(req.requestedDateTo)}` : ''}
              </span>
            </div>

            {req.reason && (
              <p className="text-sm text-slate-400 italic">&quot;{req.reason}&quot;</p>
            )}

            {req.counterDate && (
              <p className="text-xs text-blue-500">
                Counter offer: {fmt(req.counterDate)}
                {req.counterReason && ` — ${req.counterReason}`}
              </p>
            )}

            {req.resolvedAt && req.status !== 'PENDING' && (
              <p className="text-xs text-slate-300">
                {req.status === 'ACCEPTED' ? 'Approved' : req.status === 'DECLINED' ? 'Declined' : 'Counter sent'}{' '}
                {fmt(req.resolvedAt)}
                {req.responder && ` by ${req.responder.firstName}`}
              </p>
            )}
          </div>

          {isPending && !isMe && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                className="gap-1.5 bg-teal-500 hover:bg-teal-600 text-xs h-8"
                onClick={onAccept}
                disabled={responding}
              >
                {responding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs h-8 border-slate-200"
                onClick={onCounter}
                disabled={responding}
              >
                <MessageSquare className="w-3 h-3" />
                Counter
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs h-8 border-red-100 text-red-500 hover:bg-red-50"
                onClick={onDecline}
                disabled={responding}
              >
                <X className="w-3 h-3" />
                Decline
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function RequestsPage() {
  const user = useAuthStore((s) => s.user)
  const { data: families } = useFamilies()
  const familyId = families?.[0]?.id
  const { data: requests, isLoading } = useRequests(familyId)
  const respond = useRespondRequest(familyId ?? '')

  const [newOpen, setNewOpen] = useState(false)
  const [counterOpen, setCounterOpen] = useState(false)
  const [counterTarget, setCounterTarget] = useState<ChangeRequest | null>(null)
  const [filterStatus, setFilterStatus] = useState('ALL')

  const filtered =
    filterStatus === 'ALL' ? requests : requests?.filter((r) => r.status === filterStatus)

  const pendingCount =
    requests?.filter((r) => r.status === 'PENDING' && r.requesterId !== user?.id).length ?? 0

  async function handleRespond(
    id: string,
    action: 'ACCEPTED' | 'DECLINED' | 'COUNTER_PROPOSED',
    counterDate?: string,
    counterReason?: string,
  ) {
    try {
      await respond.mutateAsync({ id, action, counterDate, counterReason })
      const labels = { ACCEPTED: 'Request approved', DECLINED: 'Request declined', COUNTER_PROPOSED: 'Counter-proposal sent' }
      toast({ title: labels[action], variant: 'success' })
    } catch {
      toast({ title: 'Failed to respond', variant: 'error' })
    }
  }

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            Schedule Requests
            {pendingCount > 0 && (
              <span className="text-xs bg-amber-400 text-white font-bold px-2 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </h2>
          <p className="text-sm text-slate-400">Proposed custody schedule changes</p>
        </div>
        <Button onClick={() => setNewOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Request
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {['ALL', 'PENDING', 'ACCEPTED', 'DECLINED', 'COUNTER_PROPOSED'].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              filterStatus === s
                ? 'bg-teal-500 text-white'
                : 'bg-white border border-slate-100 text-slate-500 hover:bg-slate-50'
            }`}
          >
            {s === 'ALL' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : !filtered?.length ? (
        <Card>
          <CardContent className="py-14 text-center">
            <ClipboardList className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No requests found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <RequestCard
              key={req.id}
              req={req}
              isMe={req.requesterId === user?.id}
              responding={respond.isPending}
              onAccept={() => void handleRespond(req.id, 'ACCEPTED')}
              onDecline={() => void handleRespond(req.id, 'DECLINED')}
              onCounter={() => {
                setCounterTarget(req)
                setCounterOpen(true)
              }}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {familyId && (
        <NewRequestModal familyId={familyId} open={newOpen} onClose={() => setNewOpen(false)} />
      )}

      <CounterModal
        open={counterOpen}
        onClose={() => { setCounterOpen(false); setCounterTarget(null) }}
        responding={respond.isPending}
        onSubmit={(counterDate, counterReason) => {
          if (!counterTarget) return
          void handleRespond(counterTarget.id, 'COUNTER_PROPOSED', counterDate, counterReason)
        }}
      />
    </div>
  )
}
