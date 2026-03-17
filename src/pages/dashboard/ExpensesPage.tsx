import { useState } from 'react'
import { Plus, Loader2, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import { type Resolver, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useFamilies } from '@/hooks/useDashboard'
import { useExpenses, useCreateExpense } from '@/hooks/useExpenses'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/hooks/use-toast'
import type { ExpenseCategory } from '@/types/api'

const CATEGORIES: ExpenseCategory[] = [
  'EDUCATION', 'HEALTH', 'FOOD', 'CLOTHING', 'ACTIVITIES', 'TRANSPORT', 'OTHER',
]

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  EDUCATION: 'bg-blue-50 text-blue-600',
  HEALTH: 'bg-red-50 text-red-500',
  FOOD: 'bg-orange-50 text-orange-500',
  CLOTHING: 'bg-purple-50 text-purple-500',
  ACTIVITIES: 'bg-teal-50 text-teal-600',
  TRANSPORT: 'bg-slate-50 text-slate-500',
  OTHER: 'bg-gray-50 text-gray-500',
}

const expenseSchema = z.object({
  description: z.string().min(1, 'Description required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  category: z.string().min(1, 'Select a category'),
  date: z.string().min(1, 'Select a date'),
  splitRatio: z.coerce.number().min(0).max(1).default(0.5),
})
type ExpenseForm = z.infer<typeof expenseSchema>

export function ExpensesPage() {
  const user = useAuthStore((s) => s.user)
  const { data: families } = useFamilies()
  const familyId = families?.[0]?.id
  const { data: expenses, isLoading } = useExpenses(familyId)
  const createExpense = useCreateExpense(familyId ?? '')

  const [filterCategory, setFilterCategory] = useState<string>('ALL')
  const [addOpen, setAddOpen] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting }, reset } =
    useForm<ExpenseForm>({ resolver: zodResolver(expenseSchema) as Resolver<ExpenseForm> })

  // Balance calculation
  const myBalance = expenses?.reduce((sum, e) => {
    const amount = parseFloat(e.amount)
    const split = parseFloat(e.splitRatio)
    if (e.paidBy === user?.id) {
      // I paid → other owes me (amount * (1 - splitRatio))
      return sum + amount * (1 - split)
    } else {
      // Other paid → I owe them (amount * splitRatio)
      return sum - amount * split
    }
  }, 0) ?? 0

  const filtered = filterCategory === 'ALL'
    ? expenses
    : expenses?.filter((e) => e.category === filterCategory)

  async function onSubmit(data: ExpenseForm) {
    if (!familyId) return
    try {
      await createExpense.mutateAsync({
        familyId,
        description: data.description,
        amount: data.amount,
        category: data.category as ExpenseCategory,
        date: data.date,
        splitRatio: data.splitRatio,
        currency: 'USD',
      })
      toast({ title: 'Expense added!', variant: 'success' })
      setAddOpen(false)
      reset()
    } catch {
      toast({ title: 'Failed to add expense', variant: 'error' })
    }
  }

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Expenses</h2>
          <p className="text-sm text-slate-400">Track and split shared costs</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Expense
        </Button>
      </div>

      {/* Balance card */}
      <Card className={`border-2 ${myBalance >= 0 ? 'border-teal-100' : 'border-orange-100'}`}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${myBalance >= 0 ? 'bg-teal-50' : 'bg-orange-50'}`}>
              {myBalance >= 0
                ? <TrendingUp className="w-6 h-6 text-teal-500" />
                : <TrendingDown className="w-6 h-6 text-orange-400" />}
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">
                {myBalance >= 0 ? 'You are owed' : 'You owe'}
              </p>
              <p className={`text-3xl font-bold ${myBalance >= 0 ? 'text-teal-600' : 'text-orange-500'}`}>
                ${Math.abs(myBalance).toFixed(2)}
              </p>
            </div>
            {Math.abs(myBalance) > 0.01 && (
              <div className="ml-auto">
                <Button variant="outline" className="gap-2">
                  <DollarSign className="w-4 h-4" />
                  Settle Up
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {['ALL', ...CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              filterCategory === cat
                ? 'bg-teal-400 text-white'
                : 'bg-white border border-slate-100 text-slate-500 hover:bg-slate-50'
            }`}
          >
            {cat === 'ALL' ? 'All' : cat.charAt(0) + cat.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Expenses table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {filtered?.length ?? 0} expense{(filtered?.length ?? 0) !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : !filtered || filtered.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">
              No expenses yet. Click "Add Expense" to log one.
            </p>
          ) : (
            <div className="space-y-1">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wide">
                <div className="col-span-4">Description</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-2">Date</div>
                <div className="col-span-2">Paid by</div>
                <div className="col-span-2 text-right">Amount</div>
              </div>
              {filtered.map((expense) => (
                <div
                  key={expense.id}
                  className="grid grid-cols-12 gap-2 px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors items-center"
                >
                  <div className="col-span-4 text-sm font-medium text-slate-700 truncate">
                    {expense.description}
                  </div>
                  <div className="col-span-2">
                    <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${CATEGORY_COLORS[expense.category]}`}>
                      {expense.category.charAt(0) + expense.category.slice(1).toLowerCase()}
                    </span>
                  </div>
                  <div className="col-span-2 text-sm text-slate-400">
                    {new Date(expense.date).toLocaleDateString()}
                  </div>
                  <div className="col-span-2 text-sm text-slate-500">
                    {expense.paidBy === user?.id ? 'You' : expense.payer?.firstName ?? 'Other'}
                  </div>
                  <div className="col-span-2 text-right">
                    <span className={`text-sm font-semibold ${expense.paidBy === user?.id ? 'text-teal-600' : 'text-slate-600'}`}>
                      ${parseFloat(expense.amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add expense dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input placeholder="e.g. School supplies" {...register('description')} />
              {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Amount (USD)</Label>
                <Input type="number" step="0.01" placeholder="0.00" {...register('amount')} />
                {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" {...register('date')} />
                {errors.date && <p className="text-xs text-red-500">{errors.date.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select onValueChange={(v) => setValue('category', v)}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Your split (%)</Label>
                <Input type="number" step="0.01" min="0" max="1" placeholder="0.50" {...register('splitRatio')} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Add Expense
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
