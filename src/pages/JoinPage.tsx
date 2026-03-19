import { useSearchParams, Link } from 'react-router-dom'
import { Calendar, Users, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useVerifyInvitation } from '@/hooks/useDashboard'

export function JoinPage() {
  const [params] = useSearchParams()
  const token = params.get('token')

  const { data: invite, isLoading, isError, error } = useVerifyInvitation(token)

  // ── No token in URL ────────────────────────────────────────────────────────
  if (!token) {
    return <ErrorState message="No invitation token found in the URL." />
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <PageShell>
        <div className="flex flex-col items-center gap-4 py-12">
          <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
          <p className="text-sm text-slate-500">Verifying your invitation…</p>
        </div>
      </PageShell>
    )
  }

  // ── Error (expired / already used / not found) ─────────────────────────────
  if (isError || !invite) {
    const msg =
      error instanceof Error ? error.message : 'This invitation is invalid or has expired.'
    return <ErrorState message={msg} />
  }

  // ── Valid invite ───────────────────────────────────────────────────────────
  return (
    <PageShell>
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-6">
        <Users className="w-8 h-8 text-teal-500" />
      </div>

      {/* Heading */}
      <h1 className="text-2xl font-bold text-slate-800 text-center mb-2">
        You've been invited!
      </h1>
      <p className="text-slate-500 text-sm text-center mb-8 leading-relaxed">
        <strong className="text-slate-700">{invite.inviterName}</strong> has invited you to
        join the <strong className="text-slate-700">{invite.familyName}</strong> family on
        KidSchedule.
      </p>

      {/* Info card */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-teal-50 border border-teal-100 mb-8">
        <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-teal-800">
            Invitation for <span className="font-semibold">{invite.email}</span>
          </p>
          <p className="text-xs text-teal-600 mt-0.5 leading-relaxed">
            Create an account with this email address to join the family. If you already have
            an account, log in and the invitation will be accepted automatically.
          </p>
        </div>
      </div>

      {/* CTAs */}
      <div className="space-y-3">
        <Button asChild className="w-full bg-teal-400 hover:bg-teal-500 text-white">
          <Link to={`/login?inviteToken=${token}&tab=register`}>
            Create an account
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full border-slate-200">
          <Link to={`/login?inviteToken=${token}`}>
            Log in to an existing account
          </Link>
        </Button>
      </div>

      <p className="text-center text-xs text-slate-400 mt-6">
        This invitation expires in 7 days.
      </p>
    </PageShell>
  )
}

// ── Layout helpers ─────────────────────────────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
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
        <h2 className="text-lg font-semibold text-slate-800 text-center">
          Invitation unavailable
        </h2>
        <p className="text-sm text-slate-500 text-center leading-relaxed">{message}</p>
        <Button asChild variant="outline" className="mt-2">
          <Link to="/">Go to homepage</Link>
        </Button>
      </div>
    </PageShell>
  )
}
