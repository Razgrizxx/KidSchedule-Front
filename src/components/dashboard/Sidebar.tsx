import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarDays,
  DollarSign,
  MessageSquare,
  Images,
  Scale,
  ClipboardList,
  Users,
  Settings,
  LogOut,
  Calendar,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Family', icon: Users, to: '/dashboard/family' },
  { label: 'Calendar', icon: CalendarDays, to: '/dashboard/calendar' },
  { label: 'Expenses', icon: DollarSign, to: '/dashboard/expenses' },
  { label: 'Messages', icon: MessageSquare, to: '/dashboard/messages' },
  { label: 'Moments', icon: Images, to: '/dashboard/moments' },
  { label: 'Requests', icon: ClipboardList, to: '/dashboard/requests' },
  { label: 'Mediation', icon: Scale, to: '/dashboard/mediation' },
]

interface SidebarProps {
  mobileOpen: boolean
  onClose: () => void
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : 'US'

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-teal-400 flex items-center justify-center">
          <Calendar className="w-4 h-4 text-white" />
        </div>
        <span className="text-base font-bold text-slate-800">KidSchedule</span>
      </div>

      <Separator />

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-teal-50 text-teal-600 border-l-2 border-teal-400 pl-[10px]'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
              )
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <Separator />

      {/* Bottom section */}
      <div className="px-3 py-4 space-y-0.5 shrink-0">
        <NavLink
          to="/dashboard/settings"
          onClick={onClose}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              isActive
                ? 'bg-teal-50 text-teal-600'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
            )
          }
        >
          <Settings className="w-4 h-4 shrink-0" />
          Settings
        </NavLink>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all w-full text-left"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Log Out
        </button>
      </div>

      {/* User card */}
      <div className="px-3 pb-4 shrink-0">
        <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-slate-50 border border-slate-100">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">
              {user ? `${user.firstName} ${user.lastName}` : 'User'}
            </p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-60 flex-col bg-white/80 backdrop-blur-md border-r border-slate-100 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'lg:hidden fixed left-0 top-0 h-screen w-60 flex-col bg-white z-50 transition-transform duration-300 shadow-xl',
          mobileOpen ? 'flex translate-x-0' : 'flex -translate-x-full',
        )}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
        >
          <X className="w-4 h-4" />
        </button>
        {sidebarContent}
      </aside>
    </>
  )
}
