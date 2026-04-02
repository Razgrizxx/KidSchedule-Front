import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  useAdminPosts, useCreatePost, useUpdatePost, useDeletePost, useIsAdmin, usePost,
  type PostPayload,
} from '@/hooks/useBlog'
import type { PostSummary } from '@/hooks/useBlog'

function EditFormLoader({ post, onSave, onClose, isSaving }: {
  post: AdminPost; onSave: (d: PostPayload) => void
  onClose: () => void; isSaving: boolean
}) {
  const { data, isLoading } = usePost(post.slug)
  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-teal-500" /></div>
  return (
    <PostForm
      initial={{
        slug: post.slug, title: post.title, excerpt: post.excerpt,
        content: data?.content ?? '',
        category: post.category ?? '', author: post.author ?? '',
        coverImage: post.coverImage ?? '', published: post.published,
      }}
      onSave={onSave} onClose={onClose} isSaving={isSaving}
    />
  )
}

type AdminPost = PostSummary & { published: boolean }

// ── Post Form ──────────────────────────────────────────────────────────────

const EMPTY: PostPayload = {
  slug: '', title: '', excerpt: '', content: '',
  category: '', author: '', coverImage: '', published: false,
}

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function PostForm({ initial, onSave, onClose, isSaving }: {
  initial: PostPayload
  onSave: (data: PostPayload) => void
  onClose: () => void
  isSaving: boolean
}) {
  const [form, setForm] = useState<PostPayload>(initial)
  const isNew = !initial.slug

  function set(field: keyof PostPayload, value: string | boolean) {
    setForm((f) => {
      const next = { ...f, [field]: value }
      if (field === 'title' && isNew) next.slug = slugify(value as string)
      return next
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Title *</Label>
          <Input value={form.title} onChange={(e) => set('title', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Slug *</Label>
          <Input value={form.slug} onChange={(e) => set('slug', e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Excerpt *</Label>
        <Textarea
          value={form.excerpt}
          onChange={(e) => set('excerpt', e.target.value)}
          rows={2}
          className="resize-none"
          placeholder="Short description shown in the list…"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Content * <span className="text-slate-400 font-normal">(Markdown)</span></Label>
        <Textarea
          value={form.content}
          onChange={(e) => set('content', e.target.value)}
          rows={14}
          className="resize-none font-mono text-sm"
          placeholder="# Heading&#10;&#10;Write your post in Markdown…"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Input value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="Co-Parenting" />
        </div>
        <div className="space-y-1.5">
          <Label>Author</Label>
          <Input value={form.author} onChange={(e) => set('author', e.target.value)} placeholder="KidSchedule Team" />
        </div>
        <div className="space-y-1.5">
          <Label>Cover image URL</Label>
          <Input value={form.coverImage} onChange={(e) => set('coverImage', e.target.value)} placeholder="https://…" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={!!form.published}
            onChange={(e) => set('published', e.target.checked)}
            className="rounded"
          />
          Publish immediately
        </label>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => onSave(form)}
            disabled={isSaving || !form.title.trim() || !form.slug.trim() || !form.content.trim() || !form.excerpt.trim()}
          >
            {isSaving ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving…</> : 'Save post'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export function BlogAdminPage() {
  const navigate = useNavigate()
  const isAdmin = useIsAdmin()
  const { data: posts = [], isLoading } = useAdminPosts()
  const createPost = useCreatePost()
  const updatePost = useUpdatePost()
  const deletePost = useDeletePost()

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<AdminPost | null>(null)

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Access denied.</p>
      </div>
    )
  }

  async function handleCreate(data: PostPayload) {
    try {
      await createPost.mutateAsync(data)
      toast({ title: 'Post created', variant: 'success' })
      setCreating(false)
    } catch {
      toast({ title: 'Could not create post', variant: 'error' })
    }
  }

  async function handleUpdate(data: PostPayload) {
    if (!editing) return
    try {
      await updatePost.mutateAsync({ slug: editing.slug, ...data })
      toast({ title: 'Post updated', variant: 'success' })
      setEditing(null)
    } catch {
      toast({ title: 'Could not update post', variant: 'error' })
    }
  }

  async function handleDelete(slug: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    try {
      await deletePost.mutateAsync(slug)
      toast({ title: 'Post deleted', variant: 'success' })
    } catch {
      toast({ title: 'Could not delete post', variant: 'error' })
    }
  }

  async function togglePublish(post: AdminPost) {
    try {
      await updatePost.mutateAsync({ slug: post.slug, published: !post.published })
      toast({ title: post.published ? 'Moved to drafts' : 'Published', variant: 'success' })
    } catch {
      toast({ title: 'Could not update post', variant: 'error' })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/blog')} className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors">
              <ArrowLeft className="w-4 h-4 text-slate-500" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Blog Admin</h1>
              <p className="text-sm text-slate-400">{posts.length} post{posts.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <Button onClick={() => setCreating(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> New post
          </Button>
        </div>

        {/* Posts list */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
          </div>
        ) : posts.length === 0 ? (
          <p className="text-center text-slate-400 py-20">No posts yet.</p>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div key={post.slug} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-start gap-4">
                {post.coverImage && (
                  <img src={post.coverImage} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={cn(
                      'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                      post.published
                        ? 'bg-green-50 text-green-600 border-green-100'
                        : 'bg-amber-50 text-amber-600 border-amber-100',
                    )}>
                      {post.published ? 'Published' : 'Draft'}
                    </span>
                    {post.category && (
                      <span className="text-[10px] text-slate-400">{post.category}</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-slate-800 truncate">{post.title}</p>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{post.excerpt}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => togglePublish(post)}
                    title={post.published ? 'Move to drafts' : 'Publish'}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                  >
                    {post.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(post)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(post.slug, post.title)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      <Dialog open={creating} onOpenChange={(o) => { if (!o) setCreating(false) }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New post</DialogTitle></DialogHeader>
          <PostForm
            initial={EMPTY}
            onSave={handleCreate}
            onClose={() => setCreating(false)}
            isSaving={createPost.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit modal */}
      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null) }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit post</DialogTitle></DialogHeader>
          {editing && (
            <EditFormLoader
              post={editing}
              onSave={handleUpdate}
              onClose={() => setEditing(null)}
              isSaving={updatePost.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
