import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api'
import { useAuthStore } from '@/store/authStore'

const ADMIN_USER_ID = import.meta.env.VITE_ADMIN_USER_ID as string | undefined

export function useIsAdmin() {
  const user = useAuthStore((s) => s.user)
  return !!ADMIN_USER_ID && user?.id === ADMIN_USER_ID
}

export interface PostSummary {
  slug: string
  title: string
  excerpt: string
  coverImage?: string
  category: string
  author: string
  readTime: number
  publishedAt: string
}

export interface PostDetail extends PostSummary {
  id: string
  content: string
  published: boolean
  createdAt: string
  updatedAt: string
}

export function usePosts() {
  return useQuery<PostSummary[]>({
    queryKey: ['posts'],
    queryFn: () => api.get('/blog').then((r) => r.data),
  })
}

export function usePost(slug: string) {
  return useQuery<PostDetail>({
    queryKey: ['post', slug],
    queryFn: () => api.get(`/blog/${slug}`).then((r) => r.data),
    enabled: !!slug,
  })
}

export function useRelatedPosts(slug: string) {
  return useQuery<PostSummary[]>({
    queryKey: ['post-related', slug],
    queryFn: () => api.get(`/blog/${slug}/related`).then((r) => r.data),
    enabled: !!slug,
  })
}

export function useAdminPosts() {
  return useQuery<(PostSummary & { published: boolean })[]>({
    queryKey: ['posts', 'admin'],
    queryFn: () => api.get('/blog/admin/all').then((r) => r.data),
  })
}

export interface PostPayload {
  slug: string
  title: string
  excerpt: string
  content: string
  category?: string
  author?: string
  coverImage?: string
  published?: boolean
}

export function useCreatePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: PostPayload) => api.post('/blog', body).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

export function useUpdatePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ slug, ...body }: Partial<PostPayload> & { slug: string }) =>
      api.patch(`/blog/${slug}`, body).then((r) => r.data),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ['posts'] })
      void qc.invalidateQueries({ queryKey: ['post', vars.slug] })
    },
  })
}

export function useDeletePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (slug: string) => api.delete(`/blog/${slug}`).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}
