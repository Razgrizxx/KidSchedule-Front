import { useState, useRef } from 'react'
import { Images, Loader2, Plus, Trash2, X, ImageIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuthStore } from '@/store/authStore'
import { useFamilies } from '@/hooks/useDashboard'
import { useMoments, useCreateMoment, useDeleteMoment, cloudinaryOptimized } from '@/hooks/useMoments'
import { useSubscription, canUseFeature, FREE_MOMENTS_LIMIT } from '@/hooks/useSubscription'
import { UpgradeModal } from '@/components/FeatureGate'
import { toast } from '@/hooks/use-toast'
import type { Moment } from '@/types/api'

function initials(first?: string, last?: string) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase()
}

// ── MomentCard ────────────────────────────────────────────────────────────────

function MomentCard({
  moment,
  currentUserId,
  onDelete,
}: {
  moment: Moment
  currentUserId: string
  onDelete: (id: string) => Promise<unknown>
}) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const isOwner = moment.uploadedBy === currentUserId
  const optimizedUrl = cloudinaryOptimized(moment.mediaUrl, 900)

  async function handleDelete() {
    setDeleting(true)
    try {
      await onDelete(moment.id)
      toast({ title: 'Moment deleted', variant: 'success' })
    } catch {
      toast({ title: 'Failed to delete', variant: 'error' })
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  return (
    <article className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9">
            <AvatarFallback className="bg-teal-100 text-teal-700 text-sm font-semibold">
              {initials(moment.uploader?.firstName, moment.uploader?.lastName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-slate-800 leading-tight">
              {moment.uploader?.firstName} {moment.uploader?.lastName}
            </p>
            <p className="text-xs text-slate-400">
              {formatDistanceToNow(new Date(moment.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>

        {isOwner && (
          deleteOpen ? (
            <div className="flex items-center gap-1.5">
              <button
                className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded"
                onClick={() => setDeleteOpen(false)}
              >
                Cancel
              </button>
              <button
                disabled={deleting}
                onClick={() => void handleDelete()}
                className="text-xs text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded disabled:opacity-50"
              >
                {deleting ? <Loader2 className="w-3 h-3 animate-spin inline" /> : 'Delete'}
              </button>
            </div>
          ) : (
            <button
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )
        )}
      </div>

      {/* Caption */}
      {moment.caption && (
        <p className="px-4 pb-3 text-sm text-slate-700 leading-relaxed">{moment.caption}</p>
      )}

      {/* Image */}
      <div className="overflow-hidden">
        <img
          src={optimizedUrl}
          alt={moment.caption ?? 'Family moment'}
          className="w-full object-cover max-h-[480px]"
          loading="lazy"
        />
      </div>

      {/* Child tag */}
      {moment.child && (
        <div className="px-4 pt-3 pb-1">
          <span
            className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ backgroundColor: `${moment.child.color}22`, color: moment.child.color }}
          >
            {moment.child.firstName}
          </span>
        </div>
      )}

      <div className="h-3" />
    </article>
  )
}

// ── New Moment Modal ──────────────────────────────────────────────────────────

function NewMomentModal({ familyId, open, onClose }: { familyId: string; open: boolean; onClose: () => void }) {
  const [caption, setCaption] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const createMoment = useCreateMoment(familyId)

  function handleFile(f: File) {
    if (preview) URL.revokeObjectURL(preview)
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  function clearFile() {
    if (preview) URL.revokeObjectURL(preview)
    setFile(null)
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleClose() {
    clearFile()
    setCaption('')
    onClose()
  }

  async function handleSubmit() {
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    if (caption.trim()) fd.append('caption', caption.trim())
    try {
      await createMoment.mutateAsync(fd)
      toast({ title: 'Moment posted!', variant: 'success' })
      handleClose()
    } catch {
      toast({ title: 'Upload failed', variant: 'error' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Moment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {preview ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-100">
              <img src={preview} alt="Preview" className="w-full max-h-64 object-cover" />
              <button
                onClick={clearFile}
                className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-200 rounded-xl p-10 flex flex-col items-center gap-2 text-slate-400 hover:border-teal-300 hover:text-teal-500 hover:bg-teal-50/50 transition-all"
            >
              <ImageIcon className="w-8 h-8" />
              <span className="text-sm font-medium">Choose a photo</span>
              <span className="text-xs">JPG, PNG, WebP up to 10 MB</span>
            </button>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
          />

          <Textarea
            placeholder="Write a caption... (optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            className="resize-none"
          />

          <Button className="w-full gap-2" disabled={!file || createMoment.isPending} onClick={() => void handleSubmit()}>
            {createMoment.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
            ) : 'Post Moment'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function MomentsPage() {
  const user = useAuthStore((s) => s.user)
  const { data: families } = useFamilies()
  const familyId = families?.[0]?.id
  const { data: moments, isLoading } = useMoments(familyId)
  const deleteMoment = useDeleteMoment(familyId ?? '')
  const [modalOpen, setModalOpen] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  const { data: sub } = useSubscription()
  const plan = sub?.plan ?? 'FREE'
  const hasUnlimitedMoments = canUseFeature(plan, 'moments_unlimited')
  const momentCount = moments?.length ?? 0
  const atLimit = !hasUnlimitedMoments && momentCount >= FREE_MOMENTS_LIMIT

  function handleAddMoment() {
    if (atLimit) { setUpgradeOpen(true); return }
    setModalOpen(true)
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Moments</h2>
          <p className="text-sm text-slate-400">Family memories, shared securely</p>
        </div>
        <Button onClick={handleAddMoment} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Moment
        </Button>
      </div>

      {/* Free plan limit banner */}
      {!hasUnlimitedMoments && (
        <div className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm ${
          atLimit
            ? 'bg-amber-50 border-amber-200 text-amber-800'
            : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}>
          <span>
            {atLimit
              ? `Photo limit reached (${FREE_MOMENTS_LIMIT}/${FREE_MOMENTS_LIMIT}). Upgrade to upload more.`
              : `${momentCount}/${FREE_MOMENTS_LIMIT} photos used on Free plan`}
          </span>
          <button
            onClick={() => setUpgradeOpen(true)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 ml-3 shrink-0"
          >
            Upgrade →
          </button>
        </div>
      )}

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        requiredPlan="PLUS"
        featureLabel="Unlimited moments"
      />

      {isLoading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 p-4">
                <Skeleton className="w-9 h-9 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
              </div>
              <Skeleton className="w-full h-64" />
            </div>
          ))}
        </div>
      ) : !moments?.length ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Images className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium mb-1">No moments yet</p>
          <p className="text-sm text-slate-400">Share your first family photo!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {moments.map((moment) => (
            <MomentCard
              key={moment.id}
              moment={moment}
              currentUserId={user?.id ?? ''}
              onDelete={(id) => deleteMoment.mutateAsync(id)}
            />
          ))}
        </div>
      )}

      {familyId && (
        <NewMomentModal familyId={familyId} open={modalOpen} onClose={() => setModalOpen(false)} />
      )}
    </div>
  )
}
