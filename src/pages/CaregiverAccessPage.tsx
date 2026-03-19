import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Calendar,
  Shield,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Baby,
  ArrowRight,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import api from '@/api'
import { useAuthStore, type CaregiverData } from '@/store/authStore'

// ── Types ─────────────────────────────────────────────────────────────────────

// Shape returned by GET /caregivers/invite/:token (flat, not nested)
interface CaregiverAccessResponse {
  name: string
  familyId: string | null
  canViewCalendar: boolean
  canViewHealthInfo: boolean
  canViewEmergencyContacts: boolean
  canViewAllergies: boolean
  children: { id: string; firstName: string; lastName: string; color: string }[]
}

// ── Hook ──────────────────────────────────────────────────────────────────────

function useCaregiverAccess(token: string | null) {
  return useQuery<CaregiverAccessResponse>({
    queryKey: ['caregiver-access', token],
    queryFn: () => api.get(`/caregivers/invite/${token}`).then((r) => r.data),
    enabled: !!token,
    retry: false,
  })
}

// ── Permission rows ───────────────────────────────────────────────────────────

const PERMS = [
  { key: 'canViewCalendar' as const, label: 'Custody calendar', desc: 'View the schedule and events' },
  { key: 'canViewHealthInfo' as const, label: 'Child info', desc: 'Health and school information' },
  { key: 'canViewEmergencyContacts' as const, label: 'Emergency contacts', desc: 'Access emergency contact list' },
  { key: 'canViewAllergies' as const, label: 'Allergies & medical notes', desc: 'See allergy and medical info' },
] as const

// ── Component ─────────────────────────────────────────────────────────────────

export function CaregiverAccessPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const navigate = useNavigate()
  const setCaregiverAccess = useAuthStore((s) => s.setCaregiverAccess)

  const { data, isLoading, isError, error } = useCaregiverAccess(token)

  function handleGoToDashboard() {
    if (!token || !data) return
    const caregiverData: CaregiverData = {
      name: data.name,
      familyId: data.familyId,
      permissions: {
        canViewCalendar: data.canViewCalendar,
        canViewHealthInfo: data.canViewHealthInfo,
        canViewEmergencyContacts: data.canViewEmergencyContacts,
        canViewAllergies: data.canViewAllergies,
      },
      children: data.children,
    }
    setCaregiverAccess(token, caregiverData)
    void navigate('/dashboard')
  }

  if (!token) return <ErrorState message="No access token found in the URL." />

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex flex-col items-center gap-4 py-12">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          <p className="text-sm text-slate-500">Loading your access…</p>
        </div>
      </PageShell>
    )
  }

  if (isError || !data) {
    const msg =
      error instanceof Error ? error.message : 'This access link is invalid or has expired.'
    return <ErrorState message={msg} />
  }

  const childNames =
    data.children.length > 0
      ? data.children.map((c) => `${c.firstName} ${c.lastName}`).join(', ')
      : 'No children assigned yet'

  return (
    <PageShell>
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-6">
        <Shield className="w-8 h-8 text-purple-500" />
      </div>

      <h1 className="text-2xl font-bold text-slate-800 text-center mb-1">
        Caregiver Access
      </h1>
      <p className="text-slate-500 text-sm text-center mb-8">
        Hello, <strong className="text-slate-700">{data.name}</strong>. Here's what you have access to.
      </p>

      {/* Children */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100 mb-4">
        <Baby className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">Children</p>
          <p className="text-sm text-slate-800">{childNames}</p>
        </div>
      </div>

      {/* Permissions */}
      <div className="space-y-2 mb-8">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-1 mb-3">
          Your permissions
        </p>
        {PERMS.map((p) => {
          const granted = data[p.key]
          return (
            <div
              key={p.key}
              className={`flex items-center gap-3 p-3 rounded-xl border ${
                granted ? 'bg-purple-50 border-purple-100' : 'bg-slate-50 border-slate-100 opacity-50'
              }`}
            >
              {granted ? (
                <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-slate-300 shrink-0" />
              )}
              <div>
                <p className={`text-sm font-medium ${granted ? 'text-purple-800' : 'text-slate-400'}`}>
                  {p.label}
                </p>
                <p className="text-xs text-slate-400">{p.desc}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* CTA */}
      <Button
        onClick={handleGoToDashboard}
        className="w-full bg-purple-500 hover:bg-purple-600 text-white gap-2"
      >
        Go to Dashboard
        <ArrowRight className="w-4 h-4" />
      </Button>

      <p className="text-center text-xs text-slate-400 mt-4">
        Read-only access · No account required
      </p>
    </PageShell>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-teal-400 flex items-center justify-center shadow-md shadow-teal-200">
              <Calendar className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-800">KidSchedule</span>
          </Link>
        </div>
        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardContent className="pt-6 pb-8 px-8">{children}</CardContent>
        </Card>
        <p className="text-center text-sm text-slate-400 mt-6">
          <Link to="/" className="hover:text-slate-600 transition-colors">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <PageShell>
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-red-400" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800 text-center">Link unavailable</h2>
        <p className="text-sm text-slate-500 text-center leading-relaxed">{message}</p>
        <Link to="/" className="text-sm text-teal-500 hover:underline mt-1">Go to homepage</Link>
      </div>
    </PageShell>
  )
}
