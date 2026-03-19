import { create } from 'zustand'

export type ViewMode = 'year' | 'month' | 'week' | 'day' | 'list'

interface CalendarStore {
  viewMode: ViewMode
  focusDate: string // YYYY-MM-DD

  setViewMode: (mode: ViewMode) => void
  setFocusDate: (date: string) => void
  navigatePrev: () => void
  navigateNext: () => void
  goToToday: () => void
}

function addMonths(date: Date, n: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + n)
  return d
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function fmt(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function todayISO(): string {
  return fmt(new Date())
}

export const useCalendarStore = create<CalendarStore>((set, get) => ({
  viewMode: 'month',
  focusDate: todayISO(),

  setViewMode: (mode) => set({ viewMode: mode }),
  setFocusDate: (date) => set({ focusDate: date }),
  goToToday: () => set({ focusDate: todayISO() }),

  navigatePrev: () => {
    const { viewMode, focusDate } = get()
    const d = new Date(focusDate + 'T12:00:00')
    switch (viewMode) {
      case 'year':  d.setFullYear(d.getFullYear() - 1); break
      case 'month': set({ focusDate: fmt(addMonths(d, -1)) }); return
      case 'week':  set({ focusDate: fmt(addDays(d, -7)) }); return
      case 'day':   set({ focusDate: fmt(addDays(d, -1)) }); return
      case 'list':  set({ focusDate: fmt(addMonths(d, -1)) }); return
    }
    set({ focusDate: fmt(d) })
  },

  navigateNext: () => {
    const { viewMode, focusDate } = get()
    const d = new Date(focusDate + 'T12:00:00')
    switch (viewMode) {
      case 'year':  d.setFullYear(d.getFullYear() + 1); break
      case 'month': set({ focusDate: fmt(addMonths(d, 1)) }); return
      case 'week':  set({ focusDate: fmt(addDays(d, 7)) }); return
      case 'day':   set({ focusDate: fmt(addDays(d, 1)) }); return
      case 'list':  set({ focusDate: fmt(addMonths(d, 1)) }); return
    }
    set({ focusDate: fmt(d) })
  },
}))
