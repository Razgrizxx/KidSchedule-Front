import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api'
import type { Expense, ExpenseBalance, ExpenseCategory } from '@/types/api'

export function useExpenses(familyId?: string) {
  return useQuery<Expense[]>({
    queryKey: ['expenses', familyId],
    queryFn: () => api.get(`/families/${familyId}/expenses`).then((r) => r.data),
    enabled: !!familyId,
  })
}

export function useExpenseBalance(familyId?: string) {
  return useQuery<ExpenseBalance>({
    queryKey: ['expenseBalance', familyId],
    queryFn: () => api.get(`/families/${familyId}/expenses/balance`).then((r) => r.data),
    enabled: !!familyId,
  })
}

interface CreateExpenseDto {
  childId?: string
  category: ExpenseCategory
  amount: number
  currency: string
  description: string
  date: string
  splitRatio: number
  receiptUrl?: string
}

export function useCreateExpense(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateExpenseDto) =>
      api.post(`/families/${familyId}/expenses`, dto).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['expenses', familyId] })
      void qc.invalidateQueries({ queryKey: ['expenseBalance', familyId] })
    },
  })
}

export function useDeleteExpense(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (expenseId: string) =>
      api.delete(`/families/${familyId}/expenses/${expenseId}`).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['expenses', familyId] })
      void qc.invalidateQueries({ queryKey: ['expenseBalance', familyId] })
    },
  })
}

export function useSettleExpense(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ expenseId, unsettle }: { expenseId: string; unsettle?: boolean }) =>
      api
        .patch(`/families/${familyId}/expenses/${expenseId}/${unsettle ? 'unsettle' : 'settle'}`)
        .then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['expenses', familyId] })
      void qc.invalidateQueries({ queryKey: ['expenseBalance', familyId] })
    },
  })
}

export function useSettleAllExpenses(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      api.post<{ settled: number }>(`/families/${familyId}/expenses/settle-all`).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['expenses', familyId] })
      void qc.invalidateQueries({ queryKey: ['expenseBalance', familyId] })
    },
  })
}

export function useUploadReceipt(familyId: string) {
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return api
        .post<{ url: string }>(`/families/${familyId}/expenses/upload`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data.url)
    },
  })
}
