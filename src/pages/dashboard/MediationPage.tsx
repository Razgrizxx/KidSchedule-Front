import { useState, useRef, useEffect } from 'react'
import {
  Scale, Plus, Send, Sparkles, GitMerge, AlertTriangle,
  FileText, ChevronLeft, CheckCircle2, XCircle, Loader2,
  TrendingUp, Activity, ShieldCheck, ArrowUpRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useFamilies } from '@/hooks/useDashboard'
import {
  useMediationStats,
  useMediationSessions,
  useMediationSession,
  useCreateSession,
  useSendMessage,
  useAskAI,
  useProposeResolution,
  useRespondProposal,
  useEscalate,
  useCourtReport,
} from '@/hooks/useMediation'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/hooks/use-toast'
import type { MediationSession, MediationMessage, ResolutionProposal } from '@/types/api'
import { cn } from '@/lib/utils'

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'bg-teal-50 text-teal-600 border-teal-200',
  RESOLVED: 'bg-blue-50 text-blue-600 border-blue-200',
  ESCALATED: 'bg-red-50 text-red-500 border-red-200',
}

const STATUS_BORDER: Record<string, string> = {
  ACTIVE: 'border-l-4 border-l-teal-400',
  RESOLVED: 'border-l-4 border-l-blue-400',
  ESCALATED: 'border-l-4 border-l-red-400',
}

// ── New Session Modal ─────────────────────────────────────────────────────────

function NewSessionModal({
  familyId,
  open,
  onClose,
}: {
  familyId: string
  open: boolean
  onClose: () => void
}) {
  const [topic, setTopic] = useState('')
  const create = useCreateSession(familyId)

  function submit() {
    if (!topic.trim()) return
    create.mutate({ topic: topic.trim() }, {
      onSuccess: () => {
        toast({ title: 'Session started' })
        setTopic('')
        onClose()
      },
      onError: () => toast({ title: 'Error', description: 'Could not create session', variant: 'destructive' }),
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Mediation Session</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>Topic / Issue</Label>
            <Input
              className="mt-1"
              placeholder="e.g. Holiday schedule disagreement"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
          </div>
          <p className="text-xs text-slate-400">
            Describe the co-parenting issue you'd like to resolve. An AI mediator will be available to help facilitate the discussion.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!topic.trim() || create.isPending}>
            {create.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            Start Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Propose Resolution Modal ──────────────────────────────────────────────────

function ProposeModal({
  familyId,
  sessionId,
  open,
  onClose,
}: {
  familyId: string
  sessionId: string
  open: boolean
  onClose: () => void
}) {
  const [summary, setSummary] = useState('')
  const propose = useProposeResolution(familyId, sessionId)

  function submit() {
    if (!summary.trim()) return
    propose.mutate({ summary: summary.trim() }, {
      onSuccess: () => {
        toast({ title: 'Proposal submitted' })
        setSummary('')
        onClose()
      },
      onError: () => toast({ title: 'Error', description: 'Could not submit proposal', variant: 'destructive' }),
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Propose Resolution</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Label>Agreement Summary</Label>
          <Textarea
            rows={4}
            placeholder="Summarize the proposed agreement in clear, concrete terms..."
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
          <p className="text-xs text-slate-400">
            Your co-parent will be asked to accept or reject this proposal.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!summary.trim() || propose.isPending}>
            {propose.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            Submit Proposal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Escalate Confirm Modal ────────────────────────────────────────────────────

function EscalateModal({
  familyId,
  sessionId,
  open,
  onClose,
}: {
  familyId: string
  sessionId: string
  open: boolean
  onClose: () => void
}) {
  const escalate = useEscalate(familyId, sessionId)

  function confirm() {
    escalate.mutate(undefined, {
      onSuccess: () => {
        toast({ title: 'Session escalated to professional mediation' })
        onClose()
      },
      onError: () => toast({ title: 'Error', variant: 'destructive' }),
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Escalate to Professional
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-600 py-2">
          This will mark the session as escalated and notify both co-parents that professional mediation is recommended. This action cannot be undone.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={confirm} disabled={escalate.isPending}>
            {escalate.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            Escalate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Court Report Modal ────────────────────────────────────────────────────────

function CourtReportModal({
  familyId,
  sessionId,
  open,
  onClose,
}: {
  familyId: string
  sessionId: string
  open: boolean
  onClose: () => void
}) {
  const { data, isLoading } = useCourtReport(familyId, sessionId, open)

  function printReport() {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-600" />
            Court Report
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-4 py-2 print:overflow-visible">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
            </div>
          ) : data ? (
            <>
              <div className="text-xs text-slate-400">
                Generated: {fmtDate(data.generatedAt)} · Session: {data.session.topic}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Session Messages</h4>
                <div className="space-y-2 text-xs">
                  {data.session.messages?.map((m: MediationMessage) => (
                    <div key={m.id} className="border-b border-slate-100 pb-1">
                      <span className="font-medium text-slate-600">
                        {m.isAI ? 'AI Mediator' : `${m.sender?.firstName} ${m.sender?.lastName}`}
                      </span>
                      <span className="text-slate-400 ml-2">{fmtTime(m.createdAt)}</span>
                      <p className="text-slate-700 mt-0.5">{m.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              {data.session.proposals?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Resolution Proposals</h4>
                  <div className="space-y-2 text-xs">
                    {data.session.proposals.map((p: ResolutionProposal) => (
                      <div key={p.id} className="border rounded p-2 bg-slate-50">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{p.proposer?.firstName} {p.proposer?.lastName}</span>
                          <Badge className={cn('text-xs border', p.status === 'ACCEPTED' ? 'bg-teal-50 text-teal-600 border-teal-200' : p.status === 'REJECTED' ? 'bg-red-50 text-red-500 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-200')}>
                            {p.status}
                          </Badge>
                        </div>
                        <p>{p.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Message Chain Integrity (SHA-256)</h4>
                <div className="space-y-1 text-xs font-mono bg-slate-50 p-2 rounded border max-h-40 overflow-y-auto">
                  {data.chainMessages?.map((m: { id: string; contentHash: string; previousHash: string; createdAt: string; isSystemMessage: boolean; sender?: { firstName: string; lastName: string } }) => (
                    <div key={m.id} className="truncate text-slate-500">
                      {m.contentHash?.slice(0, 16)}… ← {m.previousHash?.slice(0, 16) ?? 'genesis'}
                      <span className="ml-2 text-slate-400">
                        {m.isSystemMessage ? '[system]' : `${m.sender?.firstName ?? '?'}`} {fmtTime(m.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={printReport}>
            <FileText className="w-4 h-4 mr-1" />
            Print / Save PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Proposal Card ─────────────────────────────────────────────────────────────

function ProposalCard({
  proposal,
  currentUserId,
  familyId,
  sessionId,
  sessionActive,
}: {
  proposal: ResolutionProposal
  currentUserId: string
  familyId: string
  sessionId: string
  sessionActive: boolean
}) {
  const respond = useRespondProposal(familyId, sessionId)
  const isOwn = proposal.proposedBy === currentUserId
  const isPending = proposal.status === 'PENDING'

  function handleRespond(action: 'ACCEPTED' | 'REJECTED') {
    respond.mutate({ proposalId: proposal.id, action }, {
      onError: () => toast({ title: 'Error', variant: 'destructive' }),
    })
  }

  return (
    <div className={cn(
      'rounded-lg border p-3 text-sm',
      proposal.status === 'ACCEPTED' ? 'bg-teal-50 border-teal-200' :
      proposal.status === 'REJECTED' ? 'bg-red-50 border-red-200' :
      'bg-amber-50 border-amber-200',
    )}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="font-medium text-slate-700">
          {proposal.proposer?.firstName} {proposal.proposer?.lastName} proposed:
        </span>
        <Badge className={cn('text-xs border shrink-0',
          proposal.status === 'ACCEPTED' ? 'bg-teal-50 text-teal-600 border-teal-200' :
          proposal.status === 'REJECTED' ? 'bg-red-50 text-red-500 border-red-200' :
          'bg-amber-50 text-amber-600 border-amber-200',
        )}>
          {proposal.status}
        </Badge>
      </div>
      <p className="text-slate-600 mb-2">{proposal.summary}</p>
      {isPending && !isOwn && sessionActive && (
        <div className="flex gap-2">
          <Button size="sm" className="h-7 text-xs" onClick={() => handleRespond('ACCEPTED')} disabled={respond.isPending}>
            <CheckCircle2 className="w-3 h-3 mr-1" /> Accept
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleRespond('REJECTED')} disabled={respond.isPending}>
            <XCircle className="w-3 h-3 mr-1" /> Reject
          </Button>
        </div>
      )}
      {isPending && isOwn && (
        <p className="text-xs text-slate-400">Waiting for co-parent's response…</p>
      )}
    </div>
  )
}

// ── Chat Message ──────────────────────────────────────────────────────────────

function ChatMessage({
  message,
  currentUserId,
}: {
  message: MediationMessage
  currentUserId: string
}) {
  const isOwn = !message.isAI && message.senderId === currentUserId
  const isAI = message.isAI

  if (isAI) {
    return (
      <div className="flex gap-2 max-w-[80%]">
        <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
        </div>
        <div>
          <div className="text-xs text-slate-400 mb-1">AI Mediator · {fmtTime(message.createdAt)}</div>
          <div className="bg-teal-50 border border-teal-100 rounded-2xl rounded-tl-sm px-3 py-2 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
            {message.content}
          </div>
        </div>
      </div>
    )
  }

  if (isOwn) {
    return (
      <div className="flex flex-col items-end">
        <div className="text-xs text-slate-400 mb-1">{fmtTime(message.createdAt)}</div>
        <div className="bg-slate-800 text-white rounded-2xl rounded-tr-sm px-3 py-2 text-sm max-w-[75%] whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2 max-w-[80%]">
      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-0.5 text-xs font-semibold text-slate-600">
        {message.sender?.firstName?.[0] ?? '?'}
      </div>
      <div>
        <div className="text-xs text-slate-400 mb-1">
          {message.sender?.firstName} · {fmtTime(message.createdAt)}
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-3 py-2 text-sm text-slate-700 whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    </div>
  )
}

// ── Mediation Room ────────────────────────────────────────────────────────────

function MediationRoom({
  familyId,
  sessionId,
  onBack,
}: {
  familyId: string
  sessionId: string
  onBack: () => void
}) {
  const user = useAuthStore((s) => s.user)
  const { data: session, isLoading } = useMediationSession(familyId, sessionId)
  const sendMessage = useSendMessage(familyId, sessionId)
  const askAI = useAskAI(familyId, sessionId)
  const [text, setText] = useState('')
  const [showPropose, setShowPropose] = useState(false)
  const [showEscalate, setShowEscalate] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const isActive = session?.status === 'ACTIVE'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [session?.messages])

  function handleSend() {
    if (!text.trim() || !isActive) return
    sendMessage.mutate({ content: text.trim() }, {
      onError: () => toast({ title: 'Error', variant: 'destructive' }),
    })
    setText('')
  }

  function handleAskAI() {
    askAI.mutate(undefined, {
      onError: () => toast({ title: 'Error', description: 'AI unavailable', variant: 'destructive' }),
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    )
  }

  if (!session) return null

  const pendingProposal = session.proposals?.find((p) => p.status === 'PENDING')

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-8 px-2">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 truncate">{session.topic}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge className={cn('text-xs border', STATUS_BADGE[session.status])}>
              {session.status}
            </Badge>
            <span className="text-xs text-slate-400">{fmtDate(session.createdAt)}</span>
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowReport(true)}>
            <FileText className="w-3.5 h-3.5 mr-1" /> Report
          </Button>
          {isActive && (
            <>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowPropose(true)}>
                <GitMerge className="w-3.5 h-3.5 mr-1" /> Propose
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs text-red-500 hover:text-red-600" onClick={() => setShowEscalate(true)}>
                <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> Escalate
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status banner */}
      {session.status === 'RESOLVED' && (
        <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2 mb-3 text-sm text-teal-700">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          This session has been resolved. The agreement has been recorded.
        </div>
      )}
      {session.status === 'ESCALATED' && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3 text-sm text-red-600">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          This session has been escalated to professional mediation.
        </div>
      )}

      {/* Pending proposal */}
      {pendingProposal && user && (
        <div className="mb-3">
          <ProposalCard
            proposal={pendingProposal}
            currentUserId={user.id}
            familyId={familyId}
            sessionId={sessionId}
            sessionActive={isActive}
          />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 min-h-0 pr-1" style={{ maxHeight: '440px' }}>
        {/* Static welcome message always shown first */}
        <div className="flex gap-2 max-w-[80%]">
          <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">AI Mediator</div>
            <div className="bg-teal-50 border border-teal-100 rounded-2xl rounded-tl-sm px-3 py-2 text-sm text-slate-700 leading-relaxed space-y-2">
              <p>🤝 Welcome to this mediated discussion. I'm here to help facilitate a constructive conversation about: <strong>{session.topic}</strong></p>
              <div>
                <p className="font-medium mb-1">Ground rules:</p>
                <ul className="space-y-0.5 text-slate-600">
                  <li>• Focus on the issue, not the person</li>
                  <li>• Use "I feel…" statements</li>
                  <li>• Listen to understand, not to respond</li>
                  <li>• Keep your child's best interest at heart</li>
                </ul>
              </div>
              <p>Let's begin. Who would like to share their perspective first?</p>
            </div>
          </div>
        </div>

        {session.messages?.map((m) => (
          <ChatMessage key={m.id} message={m} currentUserId={user?.id ?? ''} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {isActive && (
        <div className="mt-3 space-y-2">
          <div className="flex gap-2">
            <Textarea
              rows={2}
              className="resize-none text-sm"
              placeholder="Type your message…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
            />
            <div className="flex flex-col gap-1">
              <Button
                className="h-full px-3"
                onClick={handleSend}
                disabled={!text.trim() || sendMessage.isPending}
              >
                {sendMessage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs text-teal-600 border-teal-200 hover:bg-teal-50"
            onClick={handleAskAI}
            disabled={askAI.isPending}
          >
            {askAI.isPending ? (
              <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 mr-1" />
            )}
            Ask AI Mediator for Guidance
          </Button>
        </div>
      )}

      <ProposeModal familyId={familyId} sessionId={sessionId} open={showPropose} onClose={() => setShowPropose(false)} />
      <EscalateModal familyId={familyId} sessionId={sessionId} open={showEscalate} onClose={() => setShowEscalate(false)} />
      <CourtReportModal familyId={familyId} sessionId={sessionId} open={showReport} onClose={() => setShowReport(false)} />
    </div>
  )
}

// ── Session List Item ─────────────────────────────────────────────────────────

function SessionCard({
  session,
  onClick,
}: {
  session: MediationSession
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-xl border bg-white p-4 hover:shadow-sm transition-shadow',
        STATUS_BORDER[session.status],
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-800 truncate">{session.topic}</p>
          <p className="text-xs text-slate-400 mt-0.5">{fmtDate(session.createdAt)}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge className={cn('text-xs border', STATUS_BADGE[session.status])}>
            {session.status}
          </Badge>
          <span className="text-xs text-slate-400">
            {(session._count?.messages ?? 0)} messages
          </span>
        </div>
      </div>
    </button>
  )
}

// ── Stats Bar ─────────────────────────────────────────────────────────────────

function StatsBar({ familyId }: { familyId: string }) {
  const { data: stats } = useMediationStats(familyId)

  const items = [
    { label: 'Total', value: stats?.total ?? 0, icon: Activity, color: 'text-slate-600' },
    { label: 'Active', value: stats?.active ?? 0, icon: Scale, color: 'text-teal-600' },
    { label: 'Resolved', value: stats?.resolved ?? 0, icon: ShieldCheck, color: 'text-blue-600' },
    { label: 'Resolution Rate', value: stats ? `${stats.resolutionRate}%` : '—', icon: TrendingUp, color: 'text-violet-600' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {items.map(({ label, value, icon: Icon, color }) => (
        <Card key={label}>
          <CardContent className="p-3 flex items-center gap-3">
            <div className={cn('w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center', color)}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-400">{label}</p>
              <p className="text-lg font-semibold text-slate-800">{value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function MediationPage() {
  const { data: families } = useFamilies()
  const family = families?.[0]
  const familyId = family?.id

  const { data: sessions, isLoading } = useMediationSessions(familyId)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)

  if (!familyId) return null

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Mediation Center</h2>
          <p className="text-sm text-slate-400">AI-assisted neutral dispute resolution</p>
        </div>
        {!activeSessionId && (
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus className="w-4 h-4 mr-1" /> New Session
          </Button>
        )}
      </div>

      {!activeSessionId ? (
        <>
          <StatsBar familyId={familyId} />

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Sessions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading ? (
                [...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
              ) : sessions?.length === 0 ? (
                <div className="text-center py-12">
                  <Scale className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">No sessions yet.</p>
                  <p className="text-xs text-slate-300 mt-1">Start one when you need structured help resolving a disagreement.</p>
                </div>
              ) : (
                sessions?.map((s) => (
                  <SessionCard key={s.id} session={s} onClick={() => setActiveSessionId(s.id)} />
                ))
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="pt-4">
            <MediationRoom
              familyId={familyId}
              sessionId={activeSessionId}
              onBack={() => setActiveSessionId(null)}
            />
          </CardContent>
        </Card>
      )}

      <NewSessionModal familyId={familyId} open={showNew} onClose={() => setShowNew(false)} />
    </div>
  )
}
