import { useEffect, useRef, useState } from 'react'
import { Globe, Calendar, Bell, Paintbrush, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { useFamilies } from '@/hooks/useDashboard'
import {
  useFamilySettings,
  useUpdateFamilySettings,
  useUserSettings,
  useUpdateUserSettings,
} from '@/hooks/useSettings'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/hooks/use-toast'
import type { AppearanceTheme, TimeFormat } from '@/types/api'

// ─── Constants ────────────────────────────────────────────────────────────────

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
  'America/Argentina/Buenos_Aires',
  'America/Bogota',
  'America/Lima',
  'America/Mexico_City',
  'America/Sao_Paulo',
  'America/Santiago',
  'Europe/London',
  'Europe/Madrid',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Rome',
  'Europe/Moscow',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
  'Pacific/Auckland',
]

const WEEKDAYS = [
  { value: 'MONDAY', label: 'Monday' },
  { value: 'TUESDAY', label: 'Tuesday' },
  { value: 'WEDNESDAY', label: 'Wednesday' },
  { value: 'THURSDAY', label: 'Thursday' },
  { value: 'FRIDAY', label: 'Friday' },
  { value: 'SATURDAY', label: 'Saturday' },
  { value: 'SUNDAY', label: 'Sunday' },
]

const APPEARANCES: { value: AppearanceTheme; label: string; description: string }[] = [
  { value: 'FRIENDLY', label: 'Friendly', description: 'Pastel colors, very rounded borders' },
  { value: 'MODERN', label: 'Modern', description: 'Pronounced shadows, dark sidebar, compact' },
  { value: 'MINIMAL', label: 'Minimal', description: 'White, borderless, thin typography' },
]

// ─── Saved flash hook ─────────────────────────────────────────────────────────

function useSavedFlash() {
  const [saved, setSaved] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  function flash() {
    if (timer.current) clearTimeout(timer.current)
    setSaved(true)
    timer.current = setTimeout(() => setSaved(false), 2000)
  }

  return { saved, flash }
}

// ─── Saved badge ─────────────────────────────────────────────────────────────

function SavedBadge({ visible }: { visible: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium text-teal-600 transition-all duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <Check className="w-3 h-3" />
      Saved
    </span>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  description,
  saved,
}: {
  icon: React.ElementType
  title: string
  description: string
  saved: boolean
}) {
  return (
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-teal-500" />
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">{description}</p>
          </div>
        </div>
        <SavedBadge visible={saved} />
      </div>
    </CardHeader>
  )
}

// ─── Row wrapper ─────────────────────────────────────────────────────────────

function SettingRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
      {children}
    </div>
  )
}

// ─── Card skeleton ────────────────────────────────────────────────────────────

function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array(rows).fill(0).map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-52" />
          </div>
          <Skeleton className="h-9 w-40 rounded-xl" />
        </div>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SettingsPage() {
  // Data
  const { data: families, isLoading: loadingFamilies } = useFamilies()
  const familyId = families?.[0]?.id

  const { data: familySettings, isLoading: loadingFamilyQuery } = useFamilySettings(familyId)
  const { data: userSettings, isLoading: loadingUser } = useUserSettings()

  const updateFamily = useUpdateFamilySettings(familyId ?? '')
  const updateUser = useUpdateUserSettings()

  const setAppearance = useAuthStore((s) => s.setAppearance)
  const setTimeFormat = useAuthStore((s) => s.setTimeFormat)

  // Separate saved indicators per card
  const calendar = useSavedFlash()
  const time = useSavedFlash()
  const notifications = useSavedFlash()
  const appearance = useSavedFlash()

  // True when the family settings card should show skeleton:
  // loading families OR (familyId found but settings still fetching)
  const loadingFamily = loadingFamilies || (!!familyId && loadingFamilyQuery)
  // No family found and not loading = user has no family yet
  const noFamily = !loadingFamilies && !familyId

  // ── Save helpers ──────────────────────────────────────────────────────────

  async function saveFamilySetting(patch: Record<string, string>) {
    if (!familyId) return
    try {
      await updateFamily.mutateAsync(patch)
      calendar.flash()
    } catch {
      toast({ title: 'Could not save setting', variant: 'error' })
    }
  }

  async function saveUserSetting(
    patch: Record<string, string | boolean>,
    section: 'time' | 'notifications' | 'appearance',
  ) {
    try {
      await updateUser.mutateAsync(patch)
      if (section === 'time') time.flash()
      else if (section === 'notifications') notifications.flash()
      else appearance.flash()
    } catch {
      toast({ title: 'Could not save setting', variant: 'error' })
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Settings</h2>
        <p className="text-sm text-slate-400">Changes save automatically</p>
      </div>

      {/* ── Calendar Configuration ───────────────────────────────────────── */}
      <Card>
        <SectionHeader
          icon={Calendar}
          title="Calendar Configuration"
          description="Shared settings for your family's schedule"
          saved={calendar.saved}
        />
        <CardContent className="pt-2">
          {loadingFamily ? (
            <CardSkeleton rows={4} />
          ) : noFamily ? (
            <p className="text-sm text-slate-400 py-4 text-center">
              Join or create a family to configure calendar settings.
            </p>
          ) : !familySettings ? (
            <CardSkeleton rows={4} />
          ) : (
            <>
              <SettingRow>
                <div>
                  <Label className="text-sm font-medium text-slate-700">Timezone</Label>
                  <p className="text-xs text-slate-400 mt-0.5">Used to calculate custody boundaries</p>
                </div>
                <Select
                  defaultValue={familySettings.timezone}
                  onValueChange={(v) => void saveFamilySetting({ timezone: v })}
                >
                  <SelectTrigger className="w-52">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SettingRow>

              <SettingRow>
                <div>
                  <Label className="text-sm font-medium text-slate-700">Transition Day</Label>
                  <p className="text-xs text-slate-400 mt-0.5">Default handover day for new schedules</p>
                </div>
                <Select
                  defaultValue={familySettings.transitionDay}
                  onValueChange={(v) => void saveFamilySetting({ transitionDay: v })}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEKDAYS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SettingRow>

              <SettingRow>
                <div>
                  <Label className="text-sm font-medium text-slate-700">Transition Time</Label>
                  <p className="text-xs text-slate-400 mt-0.5">Time of day custody changes hands</p>
                </div>
                <input
                  type="time"
                  defaultValue={familySettings.transitionTime}
                  onBlur={(e) => void saveFamilySetting({ transitionTime: e.target.value })}
                  className="w-36 px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                />
              </SettingRow>

              <SettingRow>
                <div>
                  <Label className="text-sm font-medium text-slate-700">Week Starts On</Label>
                  <p className="text-xs text-slate-400 mt-0.5">First day shown in the calendar</p>
                </div>
                <Select
                  defaultValue={familySettings.weekStartsOn}
                  onValueChange={(v) => void saveFamilySetting({ weekStartsOn: v })}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONDAY">Monday</SelectItem>
                    <SelectItem value="SUNDAY">Sunday</SelectItem>
                    <SelectItem value="SATURDAY">Saturday</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Time & Display ───────────────────────────────────────────────── */}
      <Card>
        <SectionHeader
          icon={Globe}
          title="Time & Display"
          description="How dates and times appear for you personally"
          saved={time.saved}
        />
        <CardContent className="pt-2">
          {loadingUser || !userSettings ? (
            <CardSkeleton rows={1} />
          ) : (
            <SettingRow>
              <div>
                <Label className="text-sm font-medium text-slate-700">Time Format</Label>
                <p className="text-xs text-slate-400 mt-0.5">12h (2:30 PM) or 24h (14:30)</p>
              </div>
              <Select
                defaultValue={userSettings.timeFormat}
                onValueChange={(v) => {
                  setTimeFormat(v as TimeFormat)
                  void saveUserSetting({ timeFormat: v }, 'time')
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TWELVE_HOUR">12-hour</SelectItem>
                  <SelectItem value="TWENTY_FOUR_HOUR">24-hour</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>
          )}
        </CardContent>
      </Card>

      {/* ── Notifications ────────────────────────────────────────────────── */}
      <Card>
        <SectionHeader
          icon={Bell}
          title="Notifications"
          description="Control when and how you're alerted"
          saved={notifications.saved}
        />
        <CardContent className="pt-2">
          {loadingUser || !userSettings ? (
            <CardSkeleton rows={2} />
          ) : (
            <>
              <SettingRow>
                <div>
                  <Label className="text-sm font-medium text-slate-700">Email Notifications</Label>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Schedule changes, requests, and summaries
                  </p>
                </div>
                <Switch
                  defaultChecked={userSettings.emailNotifications}
                  onCheckedChange={(checked) =>
                    void saveUserSetting({ emailNotifications: checked }, 'notifications')
                  }
                />
              </SettingRow>

              <SettingRow>
                <div>
                  <Label className="text-sm font-medium text-slate-700">Reminders</Label>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Upcoming handovers and expense due dates
                  </p>
                </div>
                <Switch
                  defaultChecked={userSettings.pushNotifications}
                  onCheckedChange={(checked) =>
                    void saveUserSetting({ pushNotifications: checked }, 'notifications')
                  }
                />
              </SettingRow>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Appearance ───────────────────────────────────────────────────── */}
      <Card>
        <SectionHeader
          icon={Paintbrush}
          title="Appearance"
          description="Choose the look and feel of your dashboard"
          saved={appearance.saved}
        />
        <CardContent className="pt-4">
          {loadingUser || !userSettings ? (
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {APPEARANCES.map(({ value, label, description }) => {
                const isActive = userSettings.appearance === value
                return (
                  <button
                    key={value}
                    onClick={() => {
                      setAppearance(value)
                      void saveUserSetting({ appearance: value }, 'appearance')
                    }}
                    className={`relative text-left rounded-xl border-2 p-4 transition-all hover:shadow-md ${
                      isActive
                        ? 'border-teal-400 bg-teal-50'
                        : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-teal-400 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </span>
                    )}
                    <ThemePreview theme={value} />
                    <p className="text-sm font-semibold text-slate-800 mt-3">{label}</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{description}</p>
                  </button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Mini theme preview ───────────────────────────────────────────────────────

function ThemePreview({ theme }: { theme: AppearanceTheme }) {
  const configs = {
    FRIENDLY: {
      bg: 'bg-teal-50',
      bar: 'bg-teal-400',
      card: 'rounded-xl bg-white shadow-sm',
      line1: 'bg-slate-200 rounded-full',
      line2: 'bg-teal-100 rounded-full',
    },
    MODERN: {
      bg: 'bg-slate-800',
      bar: 'bg-teal-400',
      card: 'rounded bg-slate-700 shadow-lg',
      line1: 'bg-slate-500 rounded',
      line2: 'bg-teal-400 rounded',
    },
    MINIMAL: {
      bg: 'bg-white border border-slate-100',
      bar: 'bg-slate-300',
      card: 'rounded-sm bg-white border border-slate-100',
      line1: 'bg-slate-100 rounded-sm',
      line2: 'bg-slate-200 rounded-sm',
    },
  }
  const c = configs[theme]
  return (
    <div className={`h-14 rounded-lg overflow-hidden flex gap-1.5 p-1.5 ${c.bg}`}>
      <div className="w-5 flex flex-col gap-1">
        <div className={`h-1 w-3 ${c.bar}`} />
        <div className={`h-1 w-4 ${c.line1}`} />
        <div className={`h-1 w-3 ${c.line1}`} />
        <div className={`h-1 w-4 ${c.line1}`} />
      </div>
      <div className="flex-1 flex flex-col gap-1">
        <div className={`flex-1 ${c.card} p-1`}>
          <div className={`h-1 w-8 mb-1 ${c.line1}`} />
          <div className={`h-1 w-5 ${c.line2}`} />
        </div>
        <div className={`h-3 ${c.card} p-1`}>
          <div className={`h-1 w-6 ${c.line1}`} />
        </div>
      </div>
    </div>
  )
}
