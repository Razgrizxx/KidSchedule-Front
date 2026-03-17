import { useState, useCallback } from 'react'
import { Upload, Images, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useFamilies } from '@/hooks/useDashboard'
import { useMoments, useUploadMoment } from '@/hooks/useMoments'
import { toast } from '@/hooks/use-toast'
import type { Moment } from '@/types/api'

function MomentCard({ moment }: { moment: Moment }) {
  return (
    <div className="group relative rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-sm aspect-square">
      <img
        src={moment.thumbnailUrl ?? moment.mediaUrl}
        alt={moment.title ?? 'Family moment'}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        onError={(e) => {
          (e.target as HTMLImageElement).src = `https://placehold.co/300x300/f1f5f9/94a3b8?text=${encodeURIComponent(moment.title ?? 'Moment')}`
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="absolute bottom-0 left-0 right-0 p-3">
          {moment.title && (
            <p className="text-white text-sm font-medium truncate">{moment.title}</p>
          )}
          <p className="text-white/70 text-xs">
            {moment.takenAt
              ? new Date(moment.takenAt).toLocaleDateString()
              : new Date(moment.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  )
}

function UploadZone({
  onFiles,
  dragging,
  setDragging,
}: {
  onFiles: (files: FileList) => void
  dragging: boolean
  setDragging: (v: boolean) => void
}) {
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      if (e.dataTransfer.files.length > 0) onFiles(e.dataTransfer.files)
    },
    [onFiles, setDragging],
  )

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`
        border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer
        ${dragging ? 'border-teal-400 bg-teal-50' : 'border-slate-200 bg-white hover:border-teal-300 hover:bg-slate-50'}
      `}
      onClick={() => document.getElementById('moment-file-input')?.click()}
    >
      <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-3">
        <Upload className={`w-6 h-6 ${dragging ? 'text-teal-500' : 'text-teal-400'}`} />
      </div>
      <p className="text-sm font-medium text-slate-700 mb-1">
        {dragging ? 'Drop it here!' : 'Upload a moment'}
      </p>
      <p className="text-xs text-slate-400">Drag & drop or click to select — JPG, PNG, MP4</p>
      <input
        id="moment-file-input"
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => { if (e.target.files) onFiles(e.target.files) }}
      />
    </div>
  )
}

export function MomentsPage() {
  const { data: families } = useFamilies()
  const familyId = families?.[0]?.id
  const { data: moments, isLoading } = useMoments(familyId)
  const uploadMoment = useUploadMoment(familyId ?? '')

  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  async function handleFiles(files: FileList) {
    const file = files[0]
    if (!file || !familyId) return

    setUploading(true)
    const previewUrl = URL.createObjectURL(file)
    setPreview(previewUrl)

    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('title', file.name.replace(/\.[^.]+$/, ''))
      await uploadMoment.mutateAsync(fd)
      toast({ title: 'Moment uploaded!', variant: 'success' })
    } catch {
      toast({ title: 'Upload failed', variant: 'error' })
    } finally {
      setUploading(false)
      URL.revokeObjectURL(previewUrl)
      setPreview(null)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Moments</h2>
          <p className="text-sm text-slate-400">Family memories, shared securely</p>
        </div>
        <Button
          onClick={() => document.getElementById('moment-file-input')?.click()}
          className="gap-2"
          disabled={uploading}
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Upload Moment
        </Button>
      </div>

      {/* Upload zone */}
      <UploadZone onFiles={handleFiles} dragging={dragging} setDragging={setDragging} />

      {/* Upload preview */}
      {preview && (
        <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-teal-400">
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
          <button
            onClick={() => setPreview(null)}
            className="absolute top-1 right-1 p-0.5 rounded-full bg-white/80"
          >
            <X className="w-3 h-3 text-slate-600" />
          </button>
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array(8).fill(0).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-2xl" />
          ))}
        </div>
      ) : !moments || moments.length === 0 ? (
        <div className="text-center py-16">
          <Images className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 text-sm">No moments yet. Upload your first family photo!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {moments.map((moment) => (
            <MomentCard key={moment.id} moment={moment} />
          ))}
        </div>
      )}
    </div>
  )
}
