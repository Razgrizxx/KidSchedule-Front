import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar, Loader2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { post } from '@/lib/api'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
})

type FormData = z.infer<typeof schema>

interface ApiResponse {
  message: string
}

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    try {
      await post<ApiResponse>('/auth/forgot-password', data)
      setSent(true)
    } catch (err) {
      setError('email', {
        message: err instanceof Error ? err.message : 'Something went wrong',
      })
    }
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
            {sent ? (
              // Success state
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-7 h-7 text-teal-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Check your inbox</h2>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">
                  If that email is registered, we've sent a password reset link. It expires in{' '}
                  <strong>1 hour</strong>.
                </p>
                <Link to="/login">
                  <Button variant="outline" className="w-full">
                    Back to Log In
                  </Button>
                </Link>
              </div>
            ) : (
              // Form state
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-slate-800 mb-1">Forgot your password?</h2>
                  <p className="text-slate-500 text-sm">
                    Enter your email and we'll send you a reset link.
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fp-email">Email address</Label>
                    <Input
                      id="fp-email"
                      type="email"
                      placeholder="you@example.com"
                      {...register('email')}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500">{errors.email.message}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Send Reset Link
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-400 mt-6">
          <Link to="/login" className="hover:text-slate-600 transition-colors">
            ← Back to Log In
          </Link>
        </p>
      </div>
    </div>
  )
}
