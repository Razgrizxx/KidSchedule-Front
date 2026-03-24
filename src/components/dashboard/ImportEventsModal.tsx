import { useState, useRef, useEffect } from 'react'
import { Search, DownloadCloud, Loader2, AlertTriangle, Calendar } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useHolidays, useBulkImport } from '@/hooks/useCalendar'
import { toast } from '@/hooks/use-toast'
import type { Child, EventVisibility } from '@/types/api'
import { getErrorMessage } from '@/lib/getErrorMessage'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  onClose: () => void
  familyId: string
  children: Child[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-').map(Number)
  return `${MONTHS[m - 1]} ${String(d).padStart(2, ' ')}`
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ImportEventsModal({ open, onClose, familyId, children }: Props) {
  const [country, setCountry] = useState<'US' | 'AR'>('US')
  const [tab, setTab] = useState<'national' | 'school'>('national')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set<string>())
  const [assignedChildIds, setAssignedChildIds] = useState<string[]>([])
  const [visibility] = useState<EventVisibility>('SHARED')

  const selectAllRef = useRef<HTMLInputElement>(null)
  const bulkImport = useBulkImport()
  const currentYear = new Date().getFullYear()

  const { data: holidaysData, isLoading } = useHolidays(
    open ? familyId : undefined,
    currentYear,
    country,
  )

  // Seed children on open
  useEffect(() => {
    if (!open) return
    setAssignedChildIds(children.length > 0 ? [children[0].id] : [])
    setSelectedIds(new Set())
    setSearch('')
    setTab('national')
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset selection when country or tab changes
  useEffect(() => { setSelectedIds(new Set()); setSearch('') }, [country, tab])

  const filtered = (holidaysData ?? []).filter((h) => {
    if (h.category !== (tab === 'national' ? 'NATIONAL' : 'SCHOOL')) return false
    if (search && !h.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const filteredIds = filtered.map((h) => h.id)
  const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id))
  const someSelected = filteredIds.some((id) => selectedIds.has(id))

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected && !allSelected
    }
  }, [someSelected, allSelected])

  function toggleItem(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleChild(id: string) {
    setAssignedChildIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    )
  }

  const totalSelected = selectedIds.size
  const selectedHolidays = (holidaysData ?? []).filter((h) => selectedIds.has(h.id))
  const transitionCount = selectedHolidays.filter((h) => h.isTransitionDay).length

  async function handleImport() {
    if (totalSelected === 0) return
    try {
      const result: { created: number; skipped: number } = await bulkImport.mutateAsync({
        familyId,
        events: selectedHolidays.map((h) => ({
          title: h.name,
          date: h.date,
          type: h.category === 'NATIONAL' ? 'OTHER' : 'SCHOOL',
        })),
        childIds: assignedChildIds,
        visibility,
      })
      const msg = result.skipped > 0
        ? `${result.created} imported, ${result.skipped} already existed`
        : `${result.created} event${result.created !== 1 ? 's' : ''} imported`
      toast({ title: msg, variant: 'success' })
      onClose()
    } catch (err) {
      toast({ title: 'Failed to import events', description: getErrorMessage(err), variant: 'error' })
    }
  }

  const listContent = (categoryKey: 'national' | 'school') => {
    const items = (holidaysData ?? []).filter((h) => {
      if (h.category !== (categoryKey === 'national' ? 'NATIONAL' : 'SCHOOL')) return false
      if (search && !h.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })

    const itemIds = items.map((h) => h.id)
    const tabAllSelected = itemIds.length > 0 && itemIds.every((id) => selectedIds.has(id))
    const tabSomeSelected = itemIds.some((id) => selectedIds.has(id))

    return (
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Select all */}
        {items.length > 0 && (
          <label className="flex items-center gap-2.5 px-1 cursor-pointer select-none">
            <input
              ref={categoryKey === tab ? selectAllRef : undefined}
              type="checkbox"
              checked={tabAllSelected}
              onChange={() => {
                setSelectedIds((prev) => {
                  const next = new Set(prev)
                  if (tabAllSelected) itemIds.forEach((id) => next.delete(id))
                  else itemIds.forEach((id) => next.add(id))
                  return next
                })
              }}
              className="w-4 h-4 accent-teal-500"
              style={{ accentColor: tabSomeSelected && !tabAllSelected ? '#94a3b8' : undefined }}
            />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Select all ({items.length})
            </span>
          </label>
        )}

        {/* List */}
        <ScrollArea className="h-52 -mx-1 px-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-full py-8">
              <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No events found.</p>
          ) : (
            <div className="space-y-0.5 pr-1">
              {items.map((holiday) => (
                <label
                  key={holiday.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all select-none ${
                    selectedIds.has(holiday.id)
                      ? 'bg-teal-50 border border-teal-100'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(holiday.id)}
                    onChange={() => toggleItem(holiday.id)}
                    className="w-4 h-4 accent-teal-500 shrink-0"
                  />
                  <span className="text-[11px] font-mono text-slate-400 w-12 shrink-0 tabular-nums">
                    {formatDate(holiday.date)}
                  </span>
                  <span className="text-sm text-slate-700 flex-1 min-w-0 truncate">
                    {holiday.name}
                  </span>
                  {holiday.isTransitionDay && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full shrink-0">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      Transition day
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DownloadCloud className="w-5 h-5 text-teal-500" />
            Import Events
          </DialogTitle>
          <DialogDescription>
            Add holidays and school events to your calendar in bulk.
          </DialogDescription>
        </DialogHeader>

        {/* Country selector */}
        <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
          {(['US', 'AR'] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCountry(c)}
              className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${
                country === c
                  ? 'bg-white shadow-sm text-slate-800'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {c === 'US' ? '🇺🇸 United States' : '🇦🇷 Argentina'}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as 'national' | 'school')}>
          <TabsList className="w-full">
            <TabsTrigger value="national" className="flex-1">Public Holidays</TabsTrigger>
            <TabsTrigger value="school" className="flex-1">School Calendar</TabsTrigger>
          </TabsList>
          <TabsContent value="national" className="mt-3">
            {listContent('national')}
          </TabsContent>
          <TabsContent value="school" className="mt-3">
            {listContent('school')}
          </TabsContent>
        </Tabs>

        {/* Children assignment */}
        <div className="space-y-2 pt-3 border-t border-slate-100">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Assign to Children
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {children.map((c) => {
              const sel = assignedChildIds.includes(c.id)
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleChild(c.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    sel
                      ? 'text-white border-transparent'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}
                  style={sel ? { backgroundColor: c.color, borderColor: c.color } : {}}
                >
                  {c.firstName}
                </button>
              )
            })}
          </div>
        </div>

        {/* Preview */}
        {totalSelected > 0 && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 bg-teal-50 border border-teal-100 rounded-xl">
            <Calendar className="w-4 h-4 text-teal-500 shrink-0" />
            <p className="text-sm text-teal-700 leading-tight">
              <strong>{totalSelected}</strong> event{totalSelected !== 1 ? 's' : ''} selected
              {transitionCount > 0 && (
                <span className="text-amber-600 ml-2">
                  · ⚠️ {transitionCount} fall{transitionCount === 1 ? 's' : ''} on a transition day
                </span>
              )}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={totalSelected === 0 || bulkImport.isPending}
            className="gap-2"
          >
            {bulkImport.isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <DownloadCloud className="w-4 h-4" />}
            {totalSelected > 0
              ? `Import ${totalSelected} event${totalSelected !== 1 ? 's' : ''}`
              : 'Import Events'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
