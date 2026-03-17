import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { Calendar, Clock, ArrowLeft, ArrowRight, User } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { usePost, useRelatedPosts, type PostSummary } from '@/hooks/useBlog'

// ─── Category badge colours (same map as list page) ──────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  'Co-Parenting':    'bg-teal-50   text-teal-600   border-teal-100',
  'Family Life':     'bg-emerald-50 text-emerald-600 border-emerald-100',
  'Legal & Custody': 'bg-blue-50   text-blue-600   border-blue-100',
  'Wellness':        'bg-purple-50 text-purple-600  border-purple-100',
  'Finance':         'bg-amber-50  text-amber-600   border-amber-100',
  'Tips & Tricks':   'bg-rose-50   text-rose-600    border-rose-100',
  'General':         'bg-slate-50  text-slate-500   border-slate-100',
}

function categoryClass(c: string) {
  return CATEGORY_COLORS[c] ?? CATEGORY_COLORS['General']
}

// ─── Related post card ────────────────────────────────────────────────────────

function RelatedCard({ post }: { post: PostSummary }) {
  return (
    <Link to={`/blog/${post.slug}`} className="group block">
      <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
        <div className="aspect-video w-full overflow-hidden bg-slate-100">
          {post.coverImage ? (
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-teal-50 to-slate-100" />
          )}
        </div>
        <div className="p-4">
          <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border mb-2 ${categoryClass(post.category)}`}>
            {post.category}
          </span>
          <h3 className="text-sm font-bold text-slate-800 leading-snug group-hover:text-teal-600 transition-colors line-clamp-2 mb-1">
            {post.title}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-3 h-3" />
            {post.readTime} min read
          </div>
        </div>
      </div>
    </Link>
  )
}

// ─── Markdown prose styles ────────────────────────────────────────────────────

const proseComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-3xl font-bold text-slate-800 mt-10 mb-4 leading-tight">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-2xl font-bold text-slate-800 mt-8 mb-3 leading-snug">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-xl font-semibold text-slate-700 mt-6 mb-2">{children}</h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-slate-600 leading-[1.85] mb-5 text-[15px]">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc pl-6 mb-5 space-y-1.5 text-slate-600 text-[15px]">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal pl-6 mb-5 space-y-1.5 text-slate-600 text-[15px]">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-4 border-teal-300 pl-5 py-1 my-6 text-slate-500 italic bg-teal-50/50 rounded-r-xl">
      {children}
    </blockquote>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="bg-slate-100 text-teal-700 rounded px-1.5 py-0.5 text-sm font-mono">{children}</code>
  ),
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="bg-slate-900 text-slate-100 rounded-2xl p-5 overflow-x-auto mb-5 text-sm leading-relaxed">{children}</pre>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} className="text-teal-600 underline underline-offset-2 hover:text-teal-700" target="_blank" rel="noopener noreferrer">{children}</a>
  ),
  hr: () => <hr className="border-slate-100 my-8" />,
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-slate-800">{children}</strong>
  ),
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: post, isLoading, isError } = usePost(slug ?? '')
  const { data: related } = useRelatedPosts(slug ?? '')

  const date = post?.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : ''

  if (isLoading) {
    return (
      <div className="bg-white min-h-screen">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-16 space-y-6">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="aspect-[21/9] w-full rounded-3xl" />
          <div className="space-y-4 pt-4">
            {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
          </div>
        </div>
      </div>
    )
  }

  if (isError || !post) {
    return (
      <div className="bg-white min-h-screen">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <p className="text-slate-400 text-lg mb-4">Post not found.</p>
          <Link to="/blog" className="text-teal-500 text-sm font-medium hover:underline">
            ← Back to Blog
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="bg-white min-h-screen">
      <Navbar />

      <article className="max-w-3xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-slate-400 mb-8">
            <Link to="/" className="hover:text-slate-600 transition-colors">Home</Link>
            <ArrowRight className="w-3 h-3" />
            <Link to="/blog" className="hover:text-slate-600 transition-colors">Blog</Link>
            <ArrowRight className="w-3 h-3" />
            <span className="text-slate-600 truncate max-w-[200px]">{post.title}</span>
          </nav>

          {/* Category */}
          <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full border mb-5 ${categoryClass(post.category)}`}>
            {post.category}
          </span>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-5">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-5 text-sm text-slate-400 mb-8 pb-8 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              {post.author}
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {date}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {post.readTime} min read
            </div>
          </div>

          {/* Cover image */}
          {post.coverImage && (
            <div className="aspect-[21/9] w-full overflow-hidden rounded-3xl mb-10 bg-slate-100">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="prose-content">
            <ReactMarkdown components={proseComponents}>
              {post.content}
            </ReactMarkdown>
          </div>

          {/* Back link */}
          <div className="mt-12 pt-8 border-t border-slate-100">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-teal-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Link>
          </div>
        </motion.div>
      </article>

      {/* Related posts */}
      {related && related.length > 0 && (
        <section className="bg-slate-50 py-16 px-4 border-t border-slate-100">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-bold text-slate-800 mb-8">Related Articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {related.map((r) => (
                <RelatedCard key={r.slug} post={r} />
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  )
}
