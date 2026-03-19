import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from '@/hooks/use-toast'
import { post } from '@/lib/api'
import api from '@/api'
import { useAuthStore } from '@/store/authStore'
import type { AuthUser } from '@/store/authStore'

// ── Schemas ──────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginForm = z.infer<typeof loginSchema>
type RegisterForm = z.infer<typeof registerSchema>

interface AuthResponse {
  access_token: string
  user: AuthUser
}

// ── Accept invitation helper ──────────────────────────────────────────────────

async function tryAcceptInvitation(token: string, bearerToken: string): Promise<boolean> {
  try {
    await api.post(
      `/families/invitations/${token}/accept`,
      {},
      { headers: { Authorization: `Bearer ${bearerToken}` } },
    )
    return true
  } catch {
    return false
  }
}

// ── Sub-forms ─────────────────────────────────────────────────────────────────

function LoginForm({ inviteToken }: { inviteToken: string | null }) {
  const [showPw, setShowPw] = useState(false)
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginForm) {
    try {
      const res = await post<AuthResponse>('/auth/login', data)
      setAuth(res.user, res.access_token)

      if (inviteToken) {
        const accepted = await tryAcceptInvitation(inviteToken, res.access_token)
        if (accepted) {
          toast({ title: 'Welcome! You joined the family.', variant: 'success' })
        } else {
          toast({ title: 'Welcome back!', variant: 'success' })
        }
      } else {
        toast({ title: 'Welcome back!', variant: 'success' })
      }

      navigate('/dashboard')
    } catch (err) {
      toast({
        title: 'Login failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'error',
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          placeholder="you@example.com"
          {...register('email')}
        />
        {errors.email && (
          <p className="text-xs text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="login-password">Password</Label>
          <Link
            to="/forgot-password"
            className="text-xs text-teal-500 hover:text-teal-600 transition-colors"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Input
            id="login-password"
            type={showPw ? 'text' : 'password'}
            placeholder="••••••••"
            className="pr-10"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-red-500">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Log In
      </Button>
    </form>
  )
}

function RegisterForm({ inviteToken }: { inviteToken: string | null }) {
  const [showPw, setShowPw] = useState(false)
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })

  async function onSubmit(data: RegisterForm) {
    try {
      const res = await post<AuthResponse>('/auth/register', data)
      setAuth(res.user, res.access_token)

      if (inviteToken) {
        const accepted = await tryAcceptInvitation(inviteToken, res.access_token)
        if (accepted) {
          toast({ title: 'Account created! You joined the family.', variant: 'success' })
        } else {
          toast({ title: 'Account created!', variant: 'success' })
        }
      } else {
        toast({ title: 'Account created!', variant: 'success' })
      }

      navigate('/dashboard')
    } catch (err) {
      toast({
        title: 'Registration failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'error',
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="reg-firstName">First name</Label>
          <Input id="reg-firstName" placeholder="Jane" {...register('firstName')} />
          {errors.firstName && (
            <p className="text-xs text-red-500">{errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reg-lastName">Last name</Label>
          <Input id="reg-lastName" placeholder="Smith" {...register('lastName')} />
          {errors.lastName && (
            <p className="text-xs text-red-500">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reg-email">Email</Label>
        <Input
          id="reg-email"
          type="email"
          placeholder="you@example.com"
          {...register('email')}
        />
        {errors.email && (
          <p className="text-xs text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reg-phone">
          Phone <span className="text-slate-400 font-normal">(optional)</span>
        </Label>
        <Input id="reg-phone" type="tel" placeholder="+1 555 000 0000" {...register('phone')} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reg-password">Password</Label>
        <div className="relative">
          <Input
            id="reg-password"
            type={showPw ? 'text' : 'password'}
            placeholder="Min 8 characters"
            className="pr-10"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-red-500">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Create Account
      </Button>

      <p className="text-center text-xs text-slate-400">
        By signing up you agree to our{' '}
        <a href="#" className="text-teal-500 hover:underline">
          Terms
        </a>{' '}
        and{' '}
        <a href="#" className="text-teal-500 hover:underline">
          Privacy Policy
        </a>
        .
      </p>
    </form>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function LoginPage() {
  const [params] = useSearchParams()
  const inviteToken = params.get('inviteToken')
  const defaultTab = params.get('tab') === 'register' ? 'register' : 'login'

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
          <p className="text-slate-500 text-sm mt-1">
            {inviteToken
              ? 'Sign in or create an account to accept your invitation.'
              : 'The family calendar that actually works.'}
          </p>
        </div>

        {/* Card */}
        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardContent className="pt-6 pb-8 px-8">
            <Tabs defaultValue={defaultTab}>
              <TabsList className="w-full mb-6">
                <TabsTrigger value="login" className="flex-1">
                  Log In
                </TabsTrigger>
                <TabsTrigger value="register" className="flex-1">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <LoginForm inviteToken={inviteToken} />
              </TabsContent>

              <TabsContent value="register">
                <RegisterForm inviteToken={inviteToken} />
              </TabsContent>
            </Tabs>
          </CardContent>
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
