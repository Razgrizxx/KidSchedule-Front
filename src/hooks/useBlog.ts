import { useQuery } from '@tanstack/react-query'
import api from '@/api'

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
