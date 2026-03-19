import { useRef, useState } from 'react'
import {
  Plus, Loader2, DollarSign, TrendingUp, TrendingDown,
  Receipt, Trash2, X, FileText, ExternalLink,
} from 'lucide-react'
import { type Resolver, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useFamilies, useChildren } from '@/hooks/useDashboard'
import { useExpenses, useExpenseBalance, useCreateExpense, useDeleteExpense, useUploadReceipt } from '@/hooks/useExpenses'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/hooks/use-toast'
import type { ExpenseCategory } from '@/types/api'

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES: ExpenseCategory[] = [
  'EDUCATION', 'HEALTH', 'FOOD', 'CLOTHING', 'ACTIVITIES', 'TRANSPORT', 'OTHER',
]

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  EDUCATION:  'bg-blue-50 text-blue-600 border-blue-100',
  HEALTH:     'bg-red-50 text-red-500 border-red-100',
  FOOD:       'bg-orange-50 text-orange-500 border-orange-100',
  CLOTHING:   'bg-purple-50 text-purple-500 border-purple-100',
  ACTIVITIES: 'bg-teal-50 text-teal-600 border-teal-100',
  TRANSPORT:  'bg-slate-50 text-slate-500 border-slate-200',
  OTHER:      'bg-gray-50 text-gray-500 border-gray-100',
}

const CURRENCIES = ['USD', 'EUR', 'ARS', 'GBP', 'MXN', 'BRL', 'CLP', 'COP']

// ── Schema ────────────────────────────────────────────────────────────────────

const expenseSchema = z.object({
  description: z.string().min(1, 'Description required'),
  amount:      z.coerce.number().positive('Enter a positive amount'),
  currency:    z.string().default('USD'),
  category:    z.string().min(1, 'Select a category'),
  date:        z.string().min(1, 'Select a date'),
  childId:     z.string().optional(),
  splitRatio:  z.coerce.number().min(0).max(1).default(0.5),
})
type ExpenseForm = z.infer<typeof expenseSchema>

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtLabel(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase()
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ExpensesPage() {
  const user = useAuthStore((s) => s.user)
  const { data: families } = useFamilies()
  const familyId = families?.[0]?.id

  const { data: expenses, isLoading } = useExpenses(familyId)
  useExpenseBalance(familyId) // pre-fetch for future settle-up feature
  const { data: children } = useChildren(familyId)
  const createExpense = useCreateExpense(familyId ?? '')
  const deleteExpense = useDeleteExpense(familyId ?? '')
  const uploadReceipt = useUploadReceipt(familyId ?? '')

  const [filterCategory, setFilterCategory] = useState<string>('ALL')
  const [addOpen, setAddOpen] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // Receipt file state (managed outside RHF because it's a File object)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register, handleSubmit, setValue, watch,
    formState: { errors, isSubmitting }, reset,
  } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema) as Resolver<ExpenseForm>,
    defaultValues: {
      currency: 'USD',
      splitRatio: 0.5,
      date: new Date().toISOString().slice(0, 10),
    },
  })

  const watchSplit = watch('splitRatio', 0.5)

  // ── My net balance (local calculation from expense list) ─────────────────

  const myBalance = expenses?.reduce((sum, e) => {
    const amount = parseFloat(e.amount)
    const split  = parseFloat(e.splitRatio)
    return e.paidBy === user?.id
      ? sum + amount * split          // other owes me splitRatio of amount
      : sum - amount * (1 - split)   // I owe other (1-splitRatio) of amount
  }, 0) ?? 0

  const filtered = filterCategory === 'ALL'
    ? expenses
    : expenses?.filter((e) => e.category === filterCategory)

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large (max 10 MB)', variant: 'error' }); return
    }
    setReceiptFile(file)
    setReceiptUrl(null)
  }

  function clearReceipt() {
    setReceiptFile(null)
    setReceiptUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function onSubmit(data: ExpenseForm) {
    if (!familyId) return
    try {
      let finalReceiptUrl = receiptUrl
      if (receiptFile && !receiptUrl) {
        finalReceiptUrl = await uploadReceipt.mutateAsync(receiptFile)
        setReceiptUrl(finalReceiptUrl)
      }
      await createExpense.mutateAsync({
        description: data.description,
        amount:      data.amount,
        currency:    data.currency,
        category:    data.category as ExpenseCategory,
        date:        data.date,
        splitRatio:  data.splitRatio,
        ...(data.childId && data.childId !== '_none' && { childId: data.childId }),
        ...(finalReceiptUrl && { receiptUrl: finalReceiptUrl }),
      })
      toast({ title: 'Expense added!', variant: 'success' })
      setAddOpen(false)
      reset()
      clearReceipt()
    } catch {
      toast({ title: 'Failed to add expense', variant: 'error' })
    }
  }

  async function handleDelete(expenseId: string) {
    try {
      await deleteExpense.mutateAsync(expenseId)
      setConfirmDeleteId(null)
      toast({ title: 'Expense deleted', variant: 'success' })
    } catch {
      toast({ title: 'Failed to delete expense', variant: 'error' })
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Header */}
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

      {/* Category filters */}
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
            {cat === 'ALL' ? 'All' : fmtLabel(cat)}
          </button>
        ))}
      </div>

      {/* Expense list */}
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
              <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wide">
                <div className="col-span-4">Description</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-2">Date</div>
                <div className="col-span-2">Paid by</div>
                <div className="col-span-1 text-right">Amount</div>
                <div className="col-span-1" />
              </div>
              {filtered.map((expense) => {
                const child = children?.find((c) => c.id === expense.childId)
                return (
                  <div
                    key={expense.id}
                    className="grid grid-cols-12 gap-2 px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors items-center group"
                  >
                    <div className="col-span-4 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{expense.description}</p>
                      {child && (
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <span
                            className="w-1.5 h-1.5 rounded-full inline-block"
                            style={{ backgroundColor: child.color ?? '#94a3b8' }}
                          />
                          {child.firstName}
                        </p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <span className={`text-xs px-2 py-0.5 rounded-lg font-medium border ${CATEGORY_COLORS[expense.category]}`}>
                        {fmtLabel(expense.category)}
                      </span>
                    </div>
                    <div className="col-span-2 text-sm text-slate-400">
                      {new Date(expense.date).toLocaleDateString()}
                    </div>
                    <div className="col-span-2 text-sm text-slate-500">
                      {expense.paidBy === user?.id ? 'You' : expense.payer?.firstName ?? 'Other'}
                    </div>
                    <div className="col-span-1 text-right">
                      <span className={`text-sm font-semibold ${expense.paidBy === user?.id ? 'text-teal-600' : 'text-slate-600'}`}>
                        {expense.currency ?? 'USD'} {parseFloat(expense.amount).toFixed(2)}
                      </span>
                    </div>
                    <div className="col-span-1 flex items-center justify-end gap-1">
                      {expense.receiptUrl && (
                        <a
                          href={expense.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded-lg text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
                          title="View receipt"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <div className="relative">
                        {confirmDeleteId === expense.id && (
                          <div className="absolute right-0 bottom-full mb-1.5 flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl shadow-lg px-2.5 py-1.5 z-10 whitespace-nowrap">
                            <span className="text-xs text-slate-600 font-medium">Delete?</span>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-xs px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-medium"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => void handleDelete(expense.id)}
                              disabled={deleteExpense.isPending}
                              className="text-xs px-2 py-0.5 rounded-lg bg-red-500 text-white font-medium disabled:opacity-60"
                            >
                              {deleteExpense.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Delete'}
                            </button>
                          </div>
                        )}
                        <button
                          onClick={() => setConfirmDeleteId(expense.id)}
                          className="p-1 rounded-lg text-slate-200 hover:text-red-400 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Add Expense dialog ──────────────────────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={(o) => { if (!o) { setAddOpen(false); clearReceipt() } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-teal-500" />
              Add Expense
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Amount + currency */}
            <div className="space-y-1.5">
              <Label>Amount *</Label>
              <div className="flex gap-2">
                <Select
                  defaultValue="USD"
                  onValueChange={(v) => setValue('currency', v)}
                >
                  <SelectTrigger className="w-24 shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="flex-1"
                  {...register('amount')}
                />
              </div>
              {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
            </div>

            {/* Category + Date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category *</Label>
                <Select onValueChange={(v) => setValue('category', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{fmtLabel(c)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input type="date" {...register('date')} />
                {errors.date && <p className="text-xs text-red-500">{errors.date.message}</p>}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input placeholder="e.g., Doctor visit copay, Soccer registration" {...register('description')} />
              {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
            </div>

            {/* Child + Split ratio */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Child (optional)</Label>
                <Select onValueChange={(v) => setValue('childId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Not specific to one child" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Not specific to one child</SelectItem>
                    {(children ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.firstName} {c.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <Label>Split Ratio</Label>
                  <span className="text-[10px] text-slate-400">
                    You {Math.round((1 - watchSplit) * 100)}% / Other {Math.round(watchSplit * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    placeholder="50"
                    value={Math.round(watchSplit * 100)}
                    onChange={(e) => {
                      const pct = Math.min(100, Math.max(0, Number(e.target.value)))
                      setValue('splitRatio', pct / 100)
                    }}
                  />
                  <span className="text-sm text-slate-400 shrink-0">%</span>
                </div>
              </div>
            </div>

            {/* Receipt upload */}
            <div className="space-y-1.5">
              <Label>Receipt (optional)</Label>
              {receiptFile ? (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50">
                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-sm text-slate-600 flex-1 truncate">{receiptFile.name}</span>
                  {uploadReceipt.isPending && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 shrink-0" />
                  )}
                  <button
                    type="button"
                    onClick={clearReceipt}
                    className="p-0.5 rounded text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-teal-400 hover:bg-teal-50 transition-all cursor-pointer">
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-500">Choose file…</span>
                  <span className="text-xs text-slate-400 ml-auto">JPEG, PNG, GIF, WebP, PDF (max 10MB)</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setAddOpen(false); clearReceipt() }}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || uploadReceipt.isPending}>
                {(isSubmitting || uploadReceipt.isPending) && (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                )}
                Add Expense
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
