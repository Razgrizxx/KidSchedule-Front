import type { FamilyMember, EventType } from '@/types/api'
import { Home, GraduationCap, Stethoscope, Zap, Plane, CalendarDays } from 'lucide-react'

export const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const PARENT_COLORS = [
  '#14b8a6',
  '#6366f1',
  '#f97316',
  '#ec4899',
  '#8b5cf6',
  '#0ea5e9',
]

export const EVENT_TYPE_ICONS: Record<EventType, React.ElementType> = {
  CUSTODY_TIME: Home,
  SCHOOL: GraduationCap,
  MEDICAL: Stethoscope,
  ACTIVITY: Zap,
  VACATION: Plane,
  OTHER: CalendarDays,
}

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  CUSTODY_TIME: '#14b8a6',
  SCHOOL: '#6366f1',
  MEDICAL: '#ef4444',
  ACTIVITY: '#f97316',
  VACATION: '#06b6d4',
  OTHER: '#94a3b8',
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  CUSTODY_TIME: 'Custody',
  SCHOOL: 'School',
  MEDICAL: 'Medical',
  ACTIVITY: 'Activity',
  VACATION: 'Vacation',
  OTHER: 'Other',
}

export function toISO(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function buildMonthGrid(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days: (number | null)[] = Array(firstDay).fill(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)
  while (days.length % 7 !== 0) days.push(null)
  return days
}

export function buildParentColorMap(members: FamilyMember[]): Map<string, string> {
  const parents = members.filter((m) => m.role === 'PARENT')
  const map = new Map<string, string>()
  parents.forEach((m, i) => {
    map.set(m.userId, PARENT_COLORS[i % PARENT_COLORS.length])
  })
  return map
}

/** Returns all "YYYY-MM" strings that a 7-day week spans, given focusDate */
export function getWeekMonthKeys(focusDate: string): string[] {
  const d = new Date(focusDate + 'T12:00:00')
  const dow = d.getDay()
  const sun = new Date(d)
  sun.setDate(d.getDate() - dow)
  const sat = new Date(sun)
  sat.setDate(sun.getDate() + 6)
  const m1 = `${sun.getFullYear()}-${String(sun.getMonth() + 1).padStart(2, '0')}`
  const m2 = `${sat.getFullYear()}-${String(sat.getMonth() + 1).padStart(2, '0')}`
  return m1 === m2 ? [m1] : [m1, m2]
}

/** Returns the 7 Date objects for the week containing focusDate (Sun → Sat) */
export function getWeekDays(focusDate: string): Date[] {
  const d = new Date(focusDate + 'T12:00:00')
  const dow = d.getDay()
  const sun = new Date(d)
  sun.setDate(d.getDate() - dow)
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(sun)
    day.setDate(sun.getDate() + i)
    return day
  })
}

export function dateToISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function formatTime(isoString: string): string {
  const t = isoString.slice(11, 16)
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

export function focusToYearMonth(focusDate: string): { year: number; month: number; monthKey: string } {
  const [yearStr, monthStr] = focusDate.split('-')
  const year = Number(yearStr)
  const month = Number(monthStr) - 1
  return { year, month, monthKey: `${yearStr}-${monthStr}` }
}
