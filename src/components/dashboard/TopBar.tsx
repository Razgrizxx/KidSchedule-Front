import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import {
  Menu, Bell, Crown, Zap, MessageSquare, ClipboardList,
  Users, Scale, DollarSign, X,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuthStore } from '@/store/authStore'
import { useSubscription, type PlanType } from '@/hooks/useSubscription'
import { useNotifications, type NotificationType } from '@/hooks/useNotifications'
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

const TYPE_ICON: Record<NotificationType, React.ReactNode> = {
  message:   <MessageSquare className="w-4 h-4" />,
  request:   <ClipboardList className="w-4 h-4" />,
  org_join:  <Users className="w-4 h-4" />,
  mediation: <Scale className="w-4 h-4" />,
  expense:   <DollarSign className="w-4 h-4" />,
}

const TYPE_COLOR: Record<NotificationType, string> = {
  message:   'bg-blue-50 text-blue-600',
  request:   'bg-amber-50 text-amber-600',
  org_join:  'bg-teal-50 text-teal-600',
  mediation: 'bg-purple-50 text-purple-600',
  expense:   'bg-red-50 text-red-600',
}

// ── Plan badge ────────────────────────────────────────────────────────────────

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

// ── TopBar ────────────────────────────────────────────────────────────────────

interface TopBarProps {
  onMenuClick: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { data: subscription } = useSubscription()
  const plan: PlanType = subscription?.plan ?? 'FREE'

  const { notifications, totalCount } = useNotifications()

  const [open, setOpen] = useState(false)
  const [seenCount, setSeenCount] = useState(0)
  const bellRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const showDot = totalCount > 0 && totalCount !== seenCount

  function openPanel() {
    setOpen(true)
    setSeenCount(totalCount)
  }

  function closePanel() {
    setOpen(false)
  }

  // Close on outside click (check both bell and panel)
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (
        panelRef.current && !panelRef.current.contains(target) &&
        bellRef.current && !bellRef.current.contains(target)
      ) {
        closePanel()
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Close on route change
  useEffect(() => { closePanel() }, [location.pathname])

  // Calculate panel position from bell button
  const bellRect = bellRef.current?.getBoundingClientRect()

  const pageLabel = PAGE_LABELS[location.pathname] ?? 'Dashboard'
  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : 'US'

  return (
    <header className="h-14 border-b border-slate-100 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-slate-400">KidSchedule</span>
          <span className="text-slate-300">/</span>
          <span className="font-medium text-slate-800">{pageLabel}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <button
          ref={bellRef}
          onClick={open ? closePanel : openPanel}
          className={cn(
            'relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors',
            open && 'bg-slate-100',
          )}
        >
          <Bell className="w-5 h-5" />
          {showDot && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
          )}
        </button>

        {/* Panel rendered via portal so it escapes the header stacking context */}
        {open && bellRect && createPortal(
          <div
            ref={panelRef}
            style={{
              position: 'fixed',
              top: bellRect.bottom + 8,
              right: window.innerWidth - bellRect.right,
              zIndex: 9999,
            }}
            className="w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-800">Notifications</p>
              <button
                onClick={closePanel}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-500">All caught up!</p>
                <p className="text-xs text-slate-400 mt-0.5">No pending notifications</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
                {notifications.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => { navigate(n.href); closePanel() }}
                      className="w-full flex items-start gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors text-left"
                    >
                      <span className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5', TYPE_COLOR[n.type])}>
                        {TYPE_ICON[n.type]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 leading-snug">{n.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{n.description}</p>
                      </div>
                      {n.count > 1 && (
                        <span className="shrink-0 text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full mt-0.5">
                          {n.count}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>,
          document.body,
        )}

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
