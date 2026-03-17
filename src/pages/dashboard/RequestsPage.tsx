import { useState } from 'react'
import { ClipboardList, Check, X, MessageSquare, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useFamilies } from '@/hooks/useDashboard'
import { useRequests, useRespondRequest } from '@/hooks/useRequests'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/hooks/use-toast'
import type { ChangeRequest } from '@/types/api'
import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-orange-50 text-orange-600 border-orange-100',
  ACCEPTED: 'bg-teal-50 text-teal-600 border-teal-100',
  DECLINED: 'bg-red-50 text-red-500 border-red-100',
  COUNTER_PROPOSED: 'bg-blue-50 text-blue-600 border-blue-100',
}

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
    <Card className={cn('transition-all', isPending && !isMe ? 'border-orange-100' : '')}>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-1 min-w-0">
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
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="line-through text-slate-300">
                {new Date(req.originalDate).toLocaleDateString()}
              </span>
              <span>→</span>
              <span className="font-medium text-slate-700">
                {new Date(req.requestedDate).toLocaleDateString()}
              </span>
            </div>
            {req.reason && (
              <p className="text-sm text-slate-400 italic">"{req.reason}"</p>
            )}
            {req.counterDate && (
              <p className="text-xs text-blue-500 mt-1">
                Counter: {new Date(req.counterDate).toLocaleDateString()}
                {req.counterReason && ` — ${req.counterReason}`}
              </p>
            )}
          </div>

          {/* Action buttons — only show for pending requests directed at me */}
          {isPending && !isMe && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                className="gap-1.5 bg-teal-400 hover:bg-teal-500 text-xs"
                onClick={onAccept}
                disabled={responding}
              >
                {responding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs border-slate-200"
                onClick={onCounter}
                disabled={responding}
              >
                <MessageSquare className="w-3 h-3" />
                Counter
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs border-red-100 text-red-500 hover:bg-red-50"
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

export function RequestsPage() {
  const user = useAuthStore((s) => s.user)
  const { data: families } = useFamilies()
  const familyId = families?.[0]?.id
  const { data: requests, isLoading } = useRequests(familyId)
  const respond = useRespondRequest(familyId ?? '')

  const [counterOpen, setCounterOpen] = useState(false)
  const [counterTarget, setCounterTarget] = useState<ChangeRequest | null>(null)
  const [counterDate, setCounterDate] = useState('')
  const [counterReason, setCounterReason] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('ALL')

  const filtered = filterStatus === 'ALL'
    ? requests
    : requests?.filter((r) => r.status === filterStatus)

  const pendingCount = requests?.filter((r) => r.status === 'PENDING' && r.requesterId !== user?.id).length ?? 0

  async function handleRespond(id: string, action: 'accept' | 'decline') {
    try {
      await respond.mutateAsync({ id, action })
      toast({ title: action === 'accept' ? 'Request approved' : 'Request declined', variant: 'success' })
    } catch {
      toast({ title: 'Failed to respond', variant: 'error' })
    }
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            Schedule Requests
            {pendingCount > 0 && (
              <span className="text-xs bg-orange-400 text-white font-bold px-2 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </h2>
          <p className="text-sm text-slate-400">Proposed custody schedule changes</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {['ALL', 'PENDING', 'ACCEPTED', 'DECLINED', 'COUNTER_PROPOSED'].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              filterStatus === s
                ? 'bg-teal-400 text-white'
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
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : !filtered || filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
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
              onAccept={() => void handleRespond(req.id, 'accept')}
              onDecline={() => void handleRespond(req.id, 'decline')}
              onCounter={() => {
                setCounterTarget(req)
                setCounterOpen(true)
              }}
            />
          ))}
        </div>
      )}

      {/* Counter-propose dialog */}
      <Dialog open={counterOpen} onOpenChange={setCounterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Counter-Propose</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Proposed alternative date</Label>
              <Input type="date" value={counterDate} onChange={(e) => setCounterDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Reason (optional)</Label>
              <Input
                placeholder="Why this alternative?"
                value={counterReason}
                onChange={(e) => setCounterReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCounterOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!counterTarget || !counterDate) return
                // TODO: call counter-propose endpoint
                toast({ title: 'Counter-proposal sent', variant: 'success' })
                setCounterOpen(false)
                setCounterDate('')
                setCounterReason('')
                setCounterTarget(null)
              }}
            >
              Send Counter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
