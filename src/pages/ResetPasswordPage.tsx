import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { post } from '@/lib/api'

const schema = z
  .object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

interface ApiResponse {
  message: string
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [showPw, setShowPw] = useState(false)
  const [done, setDone] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    if (!token) return
    setApiError(null)
    try {
      await post<ApiResponse>('/auth/reset-password', {
        token,
        newPassword: data.newPassword,
      })
      setDone(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  // Missing token in URL
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center px-4">
        <Card className="rounded-2xl border-slate-100 shadow-sm max-w-sm w-full">
          <CardContent className="pt-6 pb-8 px-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Invalid link</h2>
            <p className="text-slate-500 text-sm mb-6">
              This reset link is missing or malformed. Please request a new one.
            </p>
            <Link to="/forgot-password">
              <Button className="w-full">Request New Link</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

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
          <CardContent className="pt-6 pb-8 px-8">
            {done ? (
              // Success state
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-7 h-7 text-teal-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Password updated!</h2>
                <p className="text-slate-500 text-sm mb-1">
                  Your password has been changed successfully.
                </p>
                <p className="text-slate-400 text-xs">Redirecting you to login…</p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-slate-800 mb-1">Set new password</h2>
                  <p className="text-slate-500 text-sm">
                    Choose a strong password for your account.
                  </p>
                </div>

                {apiError && (
                  <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 mb-4">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600">{apiError}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="rp-password">New password</Label>
                    <div className="relative">
                      <Input
                        id="rp-password"
                        type={showPw ? 'text' : 'password'}
                        placeholder="Min 8 characters"
                        className="pr-10"
                        {...register('newPassword')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPw ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {errors.newPassword && (
                      <p className="text-xs text-red-500">{errors.newPassword.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="rp-confirm">Confirm password</Label>
                    <Input
                      id="rp-confirm"
                      type={showPw ? 'text' : 'password'}
                      placeholder="Repeat your password"
                      {...register('confirmPassword')}
                    />
                    {errors.confirmPassword && (
                      <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Update Password
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
