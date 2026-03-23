import { useLocation, Link } from 'react-router-dom'
import { Menu, Bell, Crown, Zap } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuthStore } from '@/store/authStore'
import { useSubscription, type PlanType } from '@/hooks/useSubscription'
import { cn } from '@/lib/utils'

const PAGE_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/calendar': 'Calendar',
  '/dashboard/expenses': 'Expenses',
  '/dashboard/messages': 'Messages',
  '/dashboard/moments': 'Moments',
  '/dashboard/mediation': 'Mediation',
  '/dashboard/requests': 'Requests',
  '/dashboard/settings': 'Settings',
}

interface TopBarProps {
  onMenuClick: () => void
}

function PlanBadge({ plan }: { plan: PlanType }) {
  if (plan === 'FREE') {
    return (
      <Link to="/pricing" className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
        FREE
      </Link>
    )
  }
  if (plan === 'ESSENTIAL') {
    return (
      <Link to="/pricing" className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-600 border border-teal-200 hover:bg-teal-100 transition-colors">
        ESSENTIAL
      </Link>
    )
  }
  if (plan === 'PLUS') {
    return (
      <Link
        to="/pricing"
        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm hover:shadow-md transition-shadow"
      >
        <Zap className="w-2.5 h-2.5" />
        PLUS
      </Link>
    )
  }
  // COMPLETE
  return (
    <Link
      to="/pricing"
      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm hover:shadow-md transition-shadow"
    >
      <Crown className="w-2.5 h-2.5" />
      COMPLETE
    </Link>
  )
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const { data: subscription } = useSubscription()
  const plan: PlanType = subscription?.plan ?? 'FREE'

  const pageLabel = PAGE_LABELS[location.pathname] ?? 'Dashboard'
  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : 'US'

  return (
    <header className="h-14 border-b border-slate-100 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-slate-400">KidSchedule</span>
          <span className="text-slate-300">/</span>
          <span className="font-medium text-slate-800">{pageLabel}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-400" />
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-2 pl-2">
          <div className="hidden sm:block text-right">
            <div className="flex items-center justify-end gap-1.5">
              <p className="text-sm font-medium text-slate-800 leading-none">
                {user ? `${user.firstName} ${user.lastName}` : 'User'}
              </p>
              <PlanBadge plan={plan} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
          </div>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
