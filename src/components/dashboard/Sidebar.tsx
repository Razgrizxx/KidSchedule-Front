import { useState } from 'react'
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
  Plus,
  School,
  Trophy,
  ChevronRight,
  Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useMyOrganizations, useCreateOrg, useJoinOrg } from '@/hooks/useOrganizations'
import { useSubscription, canUseFeature } from '@/hooks/useSubscription'
import { ProBadge, UpgradeModal } from '@/components/FeatureGate'
import { toast } from '@/hooks/use-toast'
import type { OrgType } from '@/types/api'

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

const ORG_COLORS: Record<OrgType, string> = {
  TEAM: 'bg-orange-100 text-orange-600',
  SCHOOL: 'bg-blue-100 text-blue-600',
}

// ── Join or Create modal ───────────────────────────────────────────────────

function OrgModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<'join' | 'create'>('join')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [type, setType] = useState<OrgType>('SCHOOL')

  const joinOrg = useJoinOrg()
  const createOrg = useCreateOrg()

  function reset() {
    setCode('')
    setName('')
    setType('SCHOOL')
  }

  async function handleJoin() {
    if (!code.trim()) return
    try {
      await joinOrg.mutateAsync(code.trim())
      toast({ title: 'Joined!', description: 'You have joined the organization.' })
      reset()
      onClose()
    } catch (e: any) {
      toast({ title: 'Error', description: e?.response?.data?.message ?? 'Invalid code', variant: 'destructive' })
    }
  }

  async function handleCreate() {
    if (!name.trim()) return
    try {
      const org = await createOrg.mutateAsync({ name: name.trim(), type })
      toast({ title: 'Created!', description: `Invite code: ${org.inviteCode}` })
      reset()
      onClose()
    } catch (e: any) {
      toast({ title: 'Error', description: e?.response?.data?.message ?? 'Could not create', variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose() } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Groups</DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex rounded-xl bg-slate-100 p-1 gap-1">
          {(['join', 'create'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 py-1.5 rounded-lg text-sm font-medium transition-all',
                tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500',
              )}
            >
              {t === 'join' ? 'Join a Group' : 'New Group'}
            </button>
          ))}
        </div>

        {tab === 'join' ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Enter the invite code shared by the group admin.</p>
            <div className="space-y-1.5">
              <Label>Invite Code</Label>
              <Input
                placeholder="KID-XXXX"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              />
            </div>
            <Button className="w-full" onClick={handleJoin} disabled={joinOrg.isPending}>
              {joinOrg.isPending ? 'Joining…' : 'Join Group'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Group Name</Label>
              <Input
                placeholder="Soccer Team U10"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <div className="flex gap-2">
                {(['SCHOOL', 'TEAM'] as OrgType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-sm font-medium transition-all',
                      type === t
                        ? 'border-teal-400 bg-teal-50 text-teal-700'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300',
                    )}
                  >
                    {t === 'SCHOOL' ? <School className="w-4 h-4" /> : <Trophy className="w-4 h-4" />}
                    {t === 'SCHOOL' ? 'School' : 'Team'}
                  </button>
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={handleCreate} disabled={createOrg.isPending}>
              {createOrg.isPending ? 'Creating…' : 'Create Group'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Sidebar ────────────────────────────────────────────────────────────────

interface SidebarProps {
  mobileOpen: boolean
  onClose: () => void
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const [orgModalOpen, setOrgModalOpen] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  const { data: orgs = [] } = useMyOrganizations()
  const { data: sub } = useSubscription()
  const plan = sub?.plan ?? 'FREE'
  const canUseOrgs = canUseFeature(plan, 'organizations')

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

        {/* My Groups section */}
        <div className="pt-3">
          <div className="flex items-center justify-between px-3 pb-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                My Groups
              </span>
              {!canUseOrgs && <ProBadge plan="ESSENTIAL" />}
            </div>
            <button
              onClick={() => canUseOrgs ? setOrgModalOpen(true) : setUpgradeOpen(true)}
              className="p-0.5 rounded-md text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
              title={canUseOrgs ? 'Join or create a group' : 'Upgrade to Essential to use groups'}
            >
              {canUseOrgs ? <Plus className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            </button>
          </div>

          {!canUseOrgs ? (
            <button
              onClick={() => setUpgradeOpen(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
              Available on Essential+
            </button>
          ) : orgs.length === 0 ? (
            <button
              onClick={() => setOrgModalOpen(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Join or create a group
            </button>
          ) : (
            <div className="space-y-0.5">
              {orgs.map((org) => (
                <NavLink
                  key={org.id}
                  to={`/dashboard/organizations/${org.id}`}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all',
                      isActive
                        ? 'bg-teal-50 text-teal-700 font-medium'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
                    )
                  }
                >
                  <span className={cn('w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0', ORG_COLORS[org.type])}>
                    {org.type === 'SCHOOL' ? <School className="w-3 h-3" /> : <Trophy className="w-3 h-3" />}
                  </span>
                  <span className="truncate flex-1 text-sm">{org.name}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                </NavLink>
              ))}
            </div>
          )}
        </div>
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

      <OrgModal open={orgModalOpen} onClose={() => setOrgModalOpen(false)} />
      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        requiredPlan="ESSENTIAL"
        featureLabel="Groups & Organizations"
      />
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
