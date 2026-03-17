import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api'
import type { Expense, ExpenseCategory } from '@/types/api'

export function useExpenses(familyId?: string) {
  return useQuery<Expense[]>({
    queryKey: ['expenses', familyId],
    queryFn: () => api.get(`/expenses/${familyId}`).then((r) => r.data),
    enabled: !!familyId,
  })
}

interface CreateExpenseDto {
  familyId: string
  childId?: string
  category: ExpenseCategory
  amount: number
  currency: string
  description: string
  date: string
  splitRatio: number
}

export function useCreateExpense(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateExpenseDto) =>
      api.post(`/expenses/${familyId}`, dto).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['expenses', familyId] })
    },
  })
}
