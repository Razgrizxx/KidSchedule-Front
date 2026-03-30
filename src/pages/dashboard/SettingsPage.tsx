import { useEffect, useRef, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Globe, Calendar, Bell, Paintbrush, Check, Link2, Link2Off, RefreshCw, Loader2, CreditCard, Crown, Zap, Star, ExternalLink, Lock, Phone, BadgeCheck, Pencil } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useFamilies } from '@/hooks/useDashboard'
import {
  useFamilySettings,
  useUpdateFamilySettings,
  useUserSettings,
  useUpdateUserSettings,
  useGoogleStatus,
  useGoogleAuthUrl,
  useGoogleDisconnect,
  useGoogleSync,
  useSendPhoneCode,
  useVerifyPhone,
} from '@/hooks/useSettings'
import { useSubscription, useCreatePortal, type PlanType } from '@/hooks/useSubscription'
import { Input } from '@/components/ui/input'
import { getErrorMessage } from '@/lib/getErrorMessage'
import { useQueryClient } from '@tanstack/react-query'
import { UpgradeModal } from '@/components/FeatureGate'
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

// ─── Plan metadata ────────────────────────────────────────────────────────────

const PLAN_META: Record<PlanType, {
  label: string
  icon: React.ReactNode
  gradient: string
  textColor: string
  badgeClass: string
  perks: string[]
}> = {
  FREE: {
    label: 'Free',
    icon: <Star className="w-4 h-4" />,
    gradient: 'from-slate-100 to-slate-200',
    textColor: 'text-slate-600',
    badgeClass: 'bg-slate-100 text-slate-600',
    perks: ['1 child profile', 'Basic calendar', 'Secure messaging', 'Up to 5 moments'],
  },
  ESSENTIAL: {
    label: 'Essential',
    icon: <Star className="w-4 h-4" />,
    gradient: 'from-teal-400 to-teal-600',
    textColor: 'text-teal-600',
    badgeClass: 'bg-teal-100 text-teal-700',
    perks: ['1 child profile', 'Groups & organizations', 'Change requests', 'Email notifications'],
  },
  PLUS: {
    label: 'Plus',
    icon: <Zap className="w-4 h-4" />,
    gradient: 'from-blue-500 to-indigo-600',
    textColor: 'text-blue-600',
    badgeClass: 'bg-blue-100 text-blue-700',
    perks: ['Up to 4 child profiles', 'AI Mediation', 'AI Calendar import', 'Google Calendar sync', 'Unlimited moments'],
  },
  COMPLETE: {
    label: 'Complete',
    icon: <Crown className="w-4 h-4" />,
    gradient: 'from-purple-500 to-pink-600',
    textColor: 'text-purple-600',
    badgeClass: 'bg-purple-100 text-purple-700',
    perks: ['Unlimited child profiles', 'Everything in Plus', 'Priority support', 'Advanced analytics'],
  },
}

// ─── Subscription card ────────────────────────────────────────────────────────

function SubscriptionCard({ justPurchased }: { justPurchased: boolean }) {
  const { data: sub, isLoading } = useSubscription()
  const portal = useCreatePortal()
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const qc = useQueryClient()

  // After a successful checkout, poll until the plan upgrades (webhook may take a few seconds)
  useEffect(() => {
    if (!justPurchased) return
    if (sub && sub.plan !== 'FREE') return // already upgraded

    const interval = setInterval(() => {
      void qc.invalidateQueries({ queryKey: ['subscription'] })
    }, 2000)

    const timeout = setTimeout(() => clearInterval(interval), 30_000) // give up after 30s

    return () => { clearInterval(interval); clearTimeout(timeout) }
  }, [justPurchased, sub?.plan, qc])

  const plan = sub?.plan ?? 'FREE'
  const meta = PLAN_META[plan]
  const isPaid = plan !== 'FREE'
  const activating = justPurchased && !isPaid
  const periodEnd = sub?.currentPeriodEnd
    ? new Date(sub.currentPeriodEnd).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  async function handleManageBilling() {
    try {
      await portal.mutateAsync()
    } catch {
      toast({ title: 'Could not open billing portal', variant: 'error' })
    }
  }

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-0 p-0">
          {/* Gradient banner */}
          <div className={`bg-gradient-to-r ${meta.gradient} px-6 py-5`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                  {meta.icon}
                </div>
                <div>
                  <p className="text-xs font-medium text-white/70 uppercase tracking-wider">Current Plan</p>
                  <p className="text-xl font-bold text-white">{meta.label}</p>
                </div>
              </div>
              {isPaid && (
                <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm text-xs">
                  {sub?.billingType === 'FAMILY' ? 'Family' : 'Individual'}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-5 space-y-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-36" />
            </div>
          ) : (
            <>
              {/* Activating banner — shown right after checkout while webhook fires */}
              {activating && (
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-blue-50 border border-blue-200">
                  <Loader2 className="w-4 h-4 text-blue-500 shrink-0 animate-spin" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Activating your plan…</p>
                    <p className="text-xs text-blue-600 mt-0.5">Payment received. Your plan will update in a few seconds.</p>
                  </div>
                </div>
              )}

              {/* FREE upsell */}
              {!isPaid && !activating && (
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                  <Lock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">You're on the free plan</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Upgrade to unlock <strong>AI Mediation</strong>, <strong>Unlimited Moments</strong>, groups, and more.
                    </p>
                  </div>
                </div>
              )}

              {/* Perks */}
              <div className="grid grid-cols-2 gap-1.5">
                {meta.perks.map((perk) => (
                  <div key={perk} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Check className="w-3 h-3 text-teal-500 shrink-0" />
                    {perk}
                  </div>
                ))}
              </div>

              {/* Inherited plan note */}
              {sub?.inheritedFromFamily && (
                <p className="text-xs text-slate-400 italic">
                  Your plan is shared from a family member's subscription.
                </p>
              )}

              {/* Period end */}
              {periodEnd && (
                <p className="text-xs text-slate-400">
                  {sub?.cancelAtPeriodEnd ? 'Cancels' : 'Renews'} on {periodEnd}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                {isPaid ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    disabled={portal.isPending}
                    onClick={() => void handleManageBilling()}
                  >
                    {portal.isPending
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <CreditCard className="w-3.5 h-3.5" />}
                    Manage Billing
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="gap-1.5 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white border-0"
                    onClick={() => setUpgradeOpen(true)}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Upgrade Plan
                  </Button>
                )}
                <Link
                  to="/pricing"
                  className="text-xs text-slate-400 hover:text-teal-600 transition-colors"
                >
                  View all plans →
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        requiredPlan="ESSENTIAL"
        featureLabel="Premium features"
      />
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SettingsPage() {
  // Data
  const { data: families, isLoading: loadingFamilies } = useFamilies()
  const familyId = families?.[0]?.id

  // URL param feedback (Google OAuth + Stripe checkout)
  const [searchParams, setSearchParams] = useSearchParams()
  const [justPurchased, setJustPurchased] = useState(false)

  useEffect(() => {
    const google = searchParams.get('google')
    const checkout = searchParams.get('checkout')

    if (google === 'connected') {
      toast({ title: 'Google Calendar connected!', variant: 'success' })
      setSearchParams((prev) => { prev.delete('google'); return prev })
    } else if (google === 'error') {
      toast({ title: 'Could not connect Google Calendar', variant: 'error' })
      setSearchParams((prev) => { prev.delete('google'); return prev })
    }

    if (checkout === 'success') {
      setJustPurchased(true)
      toast({ title: 'Payment successful!', description: 'Your plan is being activated…', variant: 'success' })
      setSearchParams((prev) => { prev.delete('checkout'); return prev })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const { data: googleStatus } = useGoogleStatus()
  const googleAuthUrl = useGoogleAuthUrl()
  const googleDisconnect = useGoogleDisconnect()
  const googleSync = useGoogleSync(familyId)

  async function handleGoogleConnect() {
    try {
      const url = await googleAuthUrl.mutateAsync()
      window.location.href = url
    } catch {
      toast({ title: 'Could not get Google auth URL', variant: 'error' })
    }
  }

  async function handleGoogleDisconnect() {
    try {
      await googleDisconnect.mutateAsync()
      toast({ title: 'Google Calendar disconnected', variant: 'success' })
    } catch {
      toast({ title: 'Could not disconnect', variant: 'error' })
    }
  }

  async function handleGoogleSync() {
    try {
      const result = await googleSync.mutateAsync()
      toast({ title: `${result.synced} events synced to Google Calendar`, variant: 'success' })
    } catch {
      toast({ title: 'Sync failed', variant: 'error' })
    }
  }

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

      {/* ── Subscription & Billing ───────────────────────────────────────── */}
      <SubscriptionCard justPurchased={justPurchased} />

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

      {/* ── Integrations ─────────────────────────────────────────────────── */}
      <Card>
        <SectionHeader
          icon={Link2}
          title="Integrations"
          description="Connect external calendars and services"
          saved={false}
        />
        <CardContent className="pt-2">
          <SettingRow>
            <div className="flex items-center gap-3">
              {/* Google Calendar logo */}
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                  <path d="M19.5 3h-15A1.5 1.5 0 003 4.5v15A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3z" fill="#fff" stroke="#ddd"/>
                  <path d="M16.5 3v4.5M7.5 3v4.5M3 9h18" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round"/>
                  <text x="6.5" y="17" fontSize="7" fontWeight="bold" fill="#4285F4" fontFamily="sans-serif">G</text>
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Google Calendar</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {googleStatus?.connected
                    ? 'Events sync automatically when you add or update them'
                    : 'Push your KidSchedule events to Google Calendar'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {googleStatus?.connected ? (
                <>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-teal-600 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                    Connected
                  </span>
                  <button
                    onClick={() => void handleGoogleSync()}
                    disabled={googleSync.isPending || !familyId}
                    title="Sync all upcoming events now"
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-teal-500 disabled:opacity-40 transition-colors"
                  >
                    {googleSync.isPending
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <RefreshCw className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => void handleGoogleDisconnect()}
                    disabled={googleDisconnect.isPending}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-40 transition-colors font-medium"
                  >
                    {googleDisconnect.isPending
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Link2Off className="w-3.5 h-3.5" />}
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={() => void handleGoogleConnect()}
                  disabled={googleAuthUrl.isPending}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white disabled:opacity-60 transition-colors font-medium shadow-sm"
                >
                  {googleAuthUrl.isPending
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Link2 className="w-3.5 h-3.5" />}
                  Connect Google Calendar
                </button>
              )}
            </div>
          </SettingRow>
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

      {/* ── Phone Verification ───────────────────────────────────────────── */}
      <PhoneVerificationCard />
    </div>
  )
}

// ─── Phone Verification Card ──────────────────────────────────────────────────

function PhoneVerificationCard() {
  const user = useAuthStore((s) => s.user)
  const sendCode = useSendPhoneCode()
  const verifyPhone = useVerifyPhone()

  const [phone, setPhone] = useState(user?.phone ?? '')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [changing, setChanging] = useState(false)

  const isVerified = !!user?.isVerified && !changing

  async function handleSend() {
    if (!phone.trim()) return
    try {
      await sendCode.mutateAsync(phone.trim())
      setCodeSent(true)
      toast({ title: 'Verification code sent via SMS', variant: 'success' })
    } catch (err) {
      toast({ title: 'Failed to send code', description: getErrorMessage(err), variant: 'error' })
    }
  }

  async function handleVerify() {
    if (!code.trim()) return
    try {
      await verifyPhone.mutateAsync({ phone: phone.trim(), code: code.trim() })
      setCode('')
      setCodeSent(false)
      setChanging(false)
      toast({ title: 'Phone verified successfully', variant: 'success' })
    } catch (err) {
      toast({ title: 'Invalid or expired code', description: getErrorMessage(err), variant: 'error' })
    }
  }

  function handleCancel() {
    setChanging(false)
    setCodeSent(false)
    setCode('')
    setPhone(user?.phone ?? '')
  }

  return (
    <Card>
      <SectionHeader
        icon={Phone}
        title="Phone Verification"
        description="Required to access encrypted messaging"
        saved={false}
      />
      <CardContent className="pt-2">
        {isVerified ? (
          <SettingRow>
            <div>
              <Label className="text-sm font-medium text-slate-700">Verified number</Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-slate-600 font-mono">{user?.phone}</span>
                <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                  <BadgeCheck className="w-3.5 h-3.5" /> Verified
                </span>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => setChanging(true)}>
              <Pencil className="w-3.5 h-3.5 mr-1.5" /> Change
            </Button>
          </SettingRow>
        ) : (
          <div className="space-y-3 py-1">
            {!codeSent ? (
              <div className="flex gap-2">
                <Input
                  placeholder="+54 9 11 XXXX-XXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="max-w-xs"
                />
                <Button
                  size="sm"
                  onClick={handleSend}
                  disabled={!phone.trim() || sendCode.isPending}
                >
                  {sendCode.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Code'}
                </Button>
                {changing && (
                  <Button size="sm" variant="ghost" onClick={handleCancel}>Cancel</Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">
                  Code sent via SMS to <span className="font-medium">{phone}</span>.{' '}
                  <button className="text-teal-600 hover:underline" onClick={() => setCodeSent(false)}>
                    Change number
                  </button>
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="6-digit code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    maxLength={6}
                    className="max-w-[140px] font-mono tracking-widest"
                    onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                  />
                  <Button
                    size="sm"
                    onClick={handleVerify}
                    disabled={code.length < 6 || verifyPhone.isPending}
                  >
                    {verifyPhone.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                  </Button>
                  {changing && (
                    <Button size="sm" variant="ghost" onClick={handleCancel}>Cancel</Button>
                  )}
                </div>
              </div>
            )}
            {!changing && (
              <p className="text-xs text-slate-400">
                A verification code will be sent via SMS. Enter it below to unlock messaging.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
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
