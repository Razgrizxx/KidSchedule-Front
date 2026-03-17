import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, Clock, ArrowRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { usePosts, type PostSummary } from '@/hooks/useBlog'

// ─── Category badge colours ───────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  'Co-Parenting':   'bg-teal-50   text-teal-600   border-teal-100',
  'Family Life':    'bg-emerald-50 text-emerald-600 border-emerald-100',
  'Legal & Custody':'bg-blue-50   text-blue-600   border-blue-100',
  'Wellness':       'bg-purple-50 text-purple-600  border-purple-100',
  'Finance':        'bg-amber-50  text-amber-600   border-amber-100',
  'Tips & Tricks':  'bg-rose-50   text-rose-600    border-rose-100',
  'General':        'bg-slate-50  text-slate-500   border-slate-100',
}

function categoryClass(category: string) {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS['General']
}

// ─── Post card ────────────────────────────────────────────────────────────────

function PostCard({ post, index }: { post: PostSummary; index: number }) {
  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: index * 0.06 }}
    >
      <Link to={`/blog/${post.slug}`} className="group block h-full">
        <div className="h-full rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
          {/* Cover image */}
          <div className="aspect-video w-full overflow-hidden bg-slate-100">
            {post.coverImage ? (
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-50 to-slate-100">
                <Calendar className="w-10 h-10 text-slate-200" />
              </div>
            )}
          </div>

          {/* Body */}
          <div className="p-6">
            <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border mb-3 ${categoryClass(post.category)}`}>
              {post.category}
            </span>
            <h2 className="text-base font-bold text-slate-800 leading-snug mb-2 group-hover:text-teal-600 transition-colors line-clamp-2">
              {post.title}
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed line-clamp-3 mb-4">
              {post.excerpt}
            </p>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {date}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {post.readTime} min read
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white overflow-hidden">
      <Skeleton className="aspect-video w-full" />
      <div className="p-6 space-y-3">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function BlogListPage() {
  const { data: posts, isLoading } = usePosts()

  return (
    <div className="bg-slate-50 min-h-screen">
      <Navbar />

      {/* Header */}
      <section className="pt-16 pb-12 px-4 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block text-xs font-semibold text-teal-500 uppercase tracking-widest mb-4">
              KidSchedule Blog
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4 leading-tight">
              Insights for modern families
            </h1>
            <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
              Co-parenting tips, legal guides, family wellness, and practical
              tools — written by parents who get it.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : !posts?.length ? (
            <div className="text-center py-24">
              <p className="text-slate-400 text-lg">No posts yet. Check back soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post, i) => (
                <PostCard key={post.slug} post={post} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
