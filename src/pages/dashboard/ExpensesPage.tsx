import { useRef, useState } from 'react'
import {
  Plus, Loader2, DollarSign, TrendingUp, TrendingDown,
  Receipt, Trash2, X, FileText, CheckCircle2, Circle,
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
import {
  useExpenses, useExpenseBalance,
  useCreateExpense, useDeleteExpense,
  useSettleExpense, useSettleAllExpenses,
  useUploadReceipt,
} from '@/hooks/useExpenses'
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

function fmtLabel(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase()
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ExpensesPage() {
  const user = useAuthStore((s) => s.user)
  const { data: families } = useFamilies()
  const familyId = families?.[0]?.id

  const { data: expenses, isLoading } = useExpenses(familyId)
  const { data: balanceData } = useExpenseBalance(familyId)
  const { data: children } = useChildren(familyId)

  const createExpense  = useCreateExpense(familyId ?? '')
  const deleteExpense  = useDeleteExpense(familyId ?? '')
  const settleExpense  = useSettleExpense(familyId ?? '')
  const settleAll      = useSettleAllExpenses(familyId ?? '')
  const uploadReceipt  = useUploadReceipt(familyId ?? '')

  const [filterCategory, setFilterCategory]     = useState<string>('ALL')
  const [filterSettled, setFilterSettled]       = useState<'all' | 'pending' | 'settled'>('all')
  const [addOpen, setAddOpen]                   = useState(false)
  const [confirmDeleteId, setConfirmDeleteId]   = useState<string | null>(null)
  const [confirmSettleId, setConfirmSettleId]   = useState<string | null>(null)

  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptUrl, setReceiptUrl]   = useState<string | null>(null)
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

  // ── Derived balances ──────────────────────────────────────────────────────

  // Pending net balance for the current user (from local expense list for speed)
  const myPendingBalance = expenses?.reduce((sum, e) => {
    if (e.isSettled) return sum
    const amount = parseFloat(e.amount)
    const split  = parseFloat(e.splitRatio)
    return e.paidBy === user?.id
      ? sum + amount * split
      : sum - amount * (1 - split)
  }, 0) ?? 0

  const pendingCount  = balanceData?.summary?.pendingCount  ?? 0
  const settledCount  = balanceData?.summary?.settledCount  ?? 0
  const totalSettled  = balanceData?.summary?.totalSettled  ?? 0
  const hasPending    = pendingCount > 0

  // ── Filtering ─────────────────────────────────────────────────────────────

  const filtered = (expenses ?? []).filter((e) => {
    if (filterCategory !== 'ALL' && e.category !== filterCategory) return false
    if (filterSettled === 'pending' && e.isSettled) return false
    if (filterSettled === 'settled' && !e.isSettled) return false
    return true
  })

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

  async function handleSettle(expenseId: string, unsettle = false) {
    try {
      await settleExpense.mutateAsync({ expenseId, unsettle })
      toast({
        title: unsettle ? 'Marked as pending' : 'Expense settled!',
        variant: 'success',
      })
    } catch {
      toast({ title: 'Failed to update expense', variant: 'error' })
    }
  }

  async function handleSettleAll() {
    try {
      const result = await settleAll.mutateAsync()
      toast({ title: `${result.settled} expense${result.settled !== 1 ? 's' : ''} settled`, variant: 'success' })
    } catch {
      toast({ title: 'Failed to settle expenses', variant: 'error' })
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
      <Card className={`border-2 ${myPendingBalance >= 0 ? 'border-teal-100' : 'border-orange-100'}`}>
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center gap-4">
            {/* Net balance */}
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${myPendingBalance >= 0 ? 'bg-teal-50' : 'bg-orange-50'}`}>
              {myPendingBalance >= 0
                ? <TrendingUp className="w-6 h-6 text-teal-500" />
                : <TrendingDown className="w-6 h-6 text-orange-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400 mb-0.5">
                {myPendingBalance >= 0 ? 'You are owed (pending)' : 'You owe (pending)'}
              </p>
              <p className={`text-2xl font-bold ${myPendingBalance >= 0 ? 'text-teal-600' : 'text-orange-500'}`}>
                ${Math.abs(myPendingBalance).toFixed(2)}
              </p>
            </div>

            {/* Settled summary */}
            <div className="text-right shrink-0 space-y-0.5">
              <div className="flex items-center justify-end gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-xs text-slate-500">
                  <strong>{pendingCount}</strong> pending
                </span>
              </div>
              <div className="flex items-center justify-end gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-400" />
                <span className="text-xs text-slate-500">
                  <strong>{settledCount}</strong> settled · ${totalSettled.toFixed(2)} total
                </span>
              </div>
            </div>

            {/* Settle all button */}
            {hasPending && (
              <Button
                variant="outline"
                className="gap-2 shrink-0"
                disabled={settleAll.isPending}
                onClick={() => void handleSettleAll()}
              >
                {settleAll.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <DollarSign className="w-4 h-4" />}
                Settle All
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Category filter */}
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

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Settled filter */}
        {(['all', 'pending', 'settled'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterSettled(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              filterSettled === s
                ? s === 'settled' ? 'bg-teal-100 text-teal-700' : s === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-700 text-white'
                : 'bg-white border border-slate-100 text-slate-500 hover:bg-slate-50'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Expense list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {filtered.length} expense{filtered.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">
              No expenses here yet.
            </p>
          ) : (
            <div className="space-y-1">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wide">
                <div className="col-span-4">Description</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-1">Date</div>
                <div className="col-span-2">Paid by</div>
                <div className="col-span-2 text-right">Amount</div>
                <div className="col-span-1" />
              </div>

              {filtered.map((expense) => {
                const child = children?.find((c) => c.id === expense.childId)
                const isSettling = settleExpense.isPending && settleExpense.variables?.expenseId === expense.id

                return (
                  <div
                    key={expense.id}
                    className={`grid grid-cols-12 gap-2 px-3 py-3 rounded-xl transition-colors items-center group ${
                      expense.isSettled ? 'bg-slate-50 opacity-70' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Description + child */}
                    <div className="col-span-4 min-w-0">
                      <p className={`text-sm font-medium truncate ${expense.isSettled ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                        {expense.description}
                      </p>
                      {child && (
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <span
                            className="w-1.5 h-1.5 rounded-full inline-block"
                            style={{ backgroundColor: child.color ?? '#94a3b8' }}
                          />
                          {child.firstName}
                        </p>
                      )}
                      {expense.isSettled && expense.settledAt && (
                        <p className="text-[9px] text-teal-500 mt-0.5">
                          Settled {new Date(expense.settledAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Category */}
                    <div className="col-span-2">
                      <span className={`text-xs px-2 py-0.5 rounded-lg font-medium border ${CATEGORY_COLORS[expense.category]}`}>
                        {fmtLabel(expense.category)}
                      </span>
                    </div>

                    {/* Date */}
                    <div className="col-span-1 text-xs text-slate-400">
                      {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>

                    {/* Paid by */}
                    <div className="col-span-2 text-sm text-slate-500">
                      {expense.paidBy === user?.id ? 'You' : expense.payer?.firstName ?? 'Other'}
                      <span className="text-[10px] text-slate-400 ml-1">
                        ({Math.round(parseFloat(expense.splitRatio) * 100)}% other)
                      </span>
                    </div>

                    {/* Amount */}
                    <div className="col-span-2 text-right">
                      <span className={`text-sm font-semibold ${expense.isSettled ? 'text-slate-400' : expense.paidBy === user?.id ? 'text-teal-600' : 'text-slate-600'}`}>
                        {expense.currency ?? 'USD'} {parseFloat(expense.amount).toFixed(2)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex items-center justify-end gap-1">
                      {expense.receiptUrl && (
                        <a
                          href={expense.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
                          title="View receipt"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <div className="relative">
                        {confirmSettleId === expense.id && (
                          <div className="absolute right-0 bottom-full mb-1.5 flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl shadow-lg px-2.5 py-1.5 z-10 whitespace-nowrap">
                            <span className="text-xs text-slate-600 font-medium">
                              {expense.isSettled ? 'Mark as pending?' : 'Mark as settled?'}
                            </span>
                            <button
                              onClick={() => setConfirmSettleId(null)}
                              className="text-xs px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-medium"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => { void handleSettle(expense.id, expense.isSettled); setConfirmSettleId(null) }}
                              disabled={isSettling}
                              className="text-xs px-2 py-0.5 rounded-lg bg-teal-500 text-white font-medium disabled:opacity-60"
                            >
                              {isSettling ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm'}
                            </button>
                          </div>
                        )}
                        <button
                          onClick={() => setConfirmSettleId(expense.id)}
                          title={expense.isSettled ? 'Mark as pending' : 'Mark as settled'}
                          className="p-1 rounded-lg text-slate-400 hover:text-teal-500 hover:bg-teal-50 transition-colors"
                        >
                          {isSettling
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : expense.isSettled
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
                            : <Circle className="w-3.5 h-3.5" />}
                        </button>
                      </div>
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
                          className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-50 transition-colors"
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
                <Select defaultValue="USD" onValueChange={(v) => setValue('currency', v)}>
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
                  type="number" step="0.01" min="0" placeholder="0.00"
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
                  <SelectTrigger><SelectValue placeholder="Select a category..." /></SelectTrigger>
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
                      <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Split Ratio</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number" min="0" max="100" step="1" placeholder="50"
                    value={Math.round(watchSplit * 100)}
                    onChange={(e) => {
                      const pct = Math.min(100, Math.max(0, Number(e.target.value)))
                      setValue('splitRatio', pct / 100)
                    }}
                  />
                  <span className="text-sm text-slate-400 shrink-0">%</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  You {Math.round((1 - watchSplit) * 100)}% / Other {Math.round(watchSplit * 100)}%
                </p>
              </div>
            </div>

            {/* Receipt */}
            <div className="space-y-1.5">
              <Label>Receipt (optional)</Label>
              {receiptFile ? (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50">
                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-sm text-slate-600 flex-1 truncate">{receiptFile.name}</span>
                  {uploadReceipt.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 shrink-0" />}
                  <button type="button" onClick={clearReceipt} className="p-0.5 rounded text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-teal-400 hover:bg-teal-50 transition-all cursor-pointer">
                  <Receipt className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-500">Choose file…</span>
                  <span className="text-xs text-slate-400 ml-auto">JPEG, PNG, PDF (max 10 MB)</span>
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
                {(isSubmitting || uploadReceipt.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Add Expense
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
