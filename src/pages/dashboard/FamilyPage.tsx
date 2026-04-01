import { useState } from 'react'
import { Baby, Users, UserPlus, Plus, Shield, Mail, Loader2, Share2, Lock, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useFamilies,
  useFamily,
  useChildren,
  useCaregivers,
  useAddChild,
  useUpdateChild,
  useDeleteChild,
  useInviteMember,
  useUpdateCaregiver,
  useRemoveCaregiver,
  useAssignCaregiverToChild,
  useUnassignCaregiverFromChild,
  type CreateChildDto,
  type UpdateChildDto,
  type UpdateCaregiverDto,
} from '@/hooks/useDashboard'
import { InviteCaregiverModal } from '@/components/dashboard/InviteCaregiverModal'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/hooks/use-toast'
import type { Child, FamilyMember, Caregiver } from '@/types/api'
import { getErrorMessage } from '@/lib/getErrorMessage'

// ─── Constants ────────────────────────────────────────────────────────────────

const CHILD_COLORS = [
  '#4ECDC4',
  '#FF6B6B',
  '#A8E6CF',
  '#FFD93D',
  '#C3A6FF',
  '#FF8E53',
  '#6BCB77',
  '#4D96FF',
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getAge(dateOfBirth: string): string {
  const dob = new Date(dateOfBirth)
  const now = new Date()
  const totalMonths =
    (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth())
  if (totalMonths < 24) return `${totalMonths}mo`
  return `${Math.floor(totalMonths / 12)}y`
}

// ─── Child card ───────────────────────────────────────────────────────────────

function ChildRow({
  child,
  onEdit,
  onDelete,
}: {
  child: Child
  onEdit: (c: Child) => void
  onDelete: (c: Child) => void
}) {
  const initials = `${child.firstName[0]}${child.lastName[0]}`.toUpperCase()
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0 group">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
        style={{ backgroundColor: child.color + '28', color: child.color }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800">
          {child.firstName} {child.lastName}
        </p>
        <p className="text-xs text-slate-400">{getAge(child.dateOfBirth)} old</p>
      </div>
      <div
        className="w-3 h-3 rounded-full shrink-0"
        style={{ backgroundColor: child.color }}
        title="Custody color"
      />
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => onEdit(child)}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(child)}
          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Member row ───────────────────────────────────────────────────────────────

function MemberRow({ member, isMe }: { member: FamilyMember; isMe: boolean }) {
  const initials = `${member.user.firstName[0]}${member.user.lastName[0]}`.toUpperCase()
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0">
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarFallback className="text-xs bg-teal-50 text-teal-600">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
          {member.user.firstName} {member.user.lastName}
          {isMe && <span className="text-xs text-slate-400 font-normal">(you)</span>}
        </p>
        <p className="text-xs text-slate-400 truncate">{member.user.email}</p>
      </div>
      <Badge
        variant="secondary"
        className="text-xs shrink-0 bg-slate-50 text-slate-500 border border-slate-100"
      >
        {member.role === 'PARENT' ? 'Parent' : 'Caregiver'}
      </Badge>
    </div>
  )
}

// ─── Caregiver row ────────────────────────────────────────────────────────────

function CaregiverRow({
  caregiver,
  allChildren,
  familyId,
  onEdit,
  onDelete,
}: {
  caregiver: Caregiver
  allChildren: Child[]
  familyId: string
  onEdit: (c: Caregiver) => void
  onDelete: (c: Caregiver) => void
}) {
  const initials = caregiver.name.slice(0, 2).toUpperCase()
  const [showAssign, setShowAssign] = useState(false)
  const assign = useAssignCaregiverToChild(familyId)
  const unassign = useUnassignCaregiverFromChild(familyId)

  const assignedIds = new Set(caregiver.children?.map((cc) => cc.child.id) ?? [])
  const assignedChildren = caregiver.children?.map((cc) => cc.child) ?? []
  const unassignedChildren = allChildren.filter((c) => !assignedIds.has(c.id))

  return (
    <div className="py-3 border-b border-slate-50 last:border-0">
      <div className="flex items-center gap-3 group">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="text-xs bg-purple-50 text-purple-600">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">{caregiver.name}</p>
          <p className="text-xs text-slate-400">
            {caregiver.relationship ?? 'Caregiver'}
            {caregiver.email && ` · ${caregiver.email}`}
          </p>
        </div>
        {caregiver.visibility === 'SHARED' ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 shrink-0">
            <Share2 className="w-3 h-3" />
            Shared
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
            <Lock className="w-3 h-3" />
            Private
          </span>
        )}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onEdit(caregiver)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(caregiver)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Assigned children */}
      <div className="ml-12 mt-2 flex flex-wrap items-center gap-1.5">
        {assignedChildren.map((child) => (
          <span
            key={child.id}
            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: child.color + '22', color: child.color }}
          >
            {child.firstName}
            <button
              onClick={() => unassign.mutate({ caregiverId: caregiver.id, childId: child.id })}
              className="hover:opacity-70 transition-opacity ml-0.5"
              title={`Remove ${child.firstName}`}
            >
              ×
            </button>
          </span>
        ))}
        {unassignedChildren.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowAssign((v) => !v)}
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-dashed border-slate-300 text-slate-400 hover:border-teal-400 hover:text-teal-600 transition-colors"
            >
              <Plus className="w-3 h-3" /> Assign child
            </button>
            {showAssign && (
              <div className="absolute left-0 top-full mt-1 z-10 bg-white rounded-xl border border-slate-100 shadow-md py-1 min-w-[140px]">
                {unassignedChildren.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => {
                      assign.mutate({ caregiverId: caregiver.id, childId: child.id })
                      setShowAssign(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-slate-50 transition-colors"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: child.color }}
                    />
                    {child.firstName} {child.lastName}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {assignedChildren.length === 0 && unassignedChildren.length === 0 && (
          <span className="text-xs text-slate-300">No children in family</span>
        )}
      </div>
    </div>
  )
}

// ─── Section skeleton ─────────────────────────────────────────────────────────

function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-1">
      {Array(rows).fill(0).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function FamilyPage() {
  const currentUser = useAuthStore((s) => s.user)
  const { data: families, isLoading: loadingFamilies } = useFamilies()
  const familyId = families?.[0]?.id
  const family = families?.[0]

  const { data: children, isLoading: loadingChildren } = useChildren(familyId)
  const { data: members, isLoading: loadingMembers } = useFamily(familyId)
  const { data: caregivers, isLoading: loadingCaregivers } = useCaregivers(familyId)

  const addChild = useAddChild(familyId ?? '')
  const updateChild = useUpdateChild(familyId ?? '')
  const deleteChild = useDeleteChild(familyId ?? '')
  const inviteMember = useInviteMember(familyId ?? '')
  const updateCaregiver = useUpdateCaregiver(familyId ?? '')
  const removeCaregiver = useRemoveCaregiver(familyId ?? '')

  // ── Edit Child dialog ─────────────────────────────────────────────────────
  const [editingChild, setEditingChild] = useState<Child | null>(null)
  const [editChildForm, setEditChildForm] = useState<UpdateChildDto>({})

  function openEditChild(c: Child) {
    setEditingChild(c)
    setEditChildForm({
      firstName: c.firstName,
      lastName: c.lastName,
      dateOfBirth: c.dateOfBirth,
      color: c.color,
    })
  }

  async function handleEditChild() {
    if (!editingChild) return
    try {
      await updateChild.mutateAsync({ id: editingChild.id, ...editChildForm })
      toast({ title: 'Child updated', variant: 'success' })
      setEditingChild(null)
    } catch (err) {
      toast({ title: 'Could not update child', description: getErrorMessage(err), variant: 'error' })
    }
  }

  // ── Delete Child confirm ──────────────────────────────────────────────────
  const [deletingChild, setDeletingChild] = useState<Child | null>(null)

  async function handleDeleteChild() {
    if (!deletingChild) return
    try {
      await deleteChild.mutateAsync(deletingChild.id)
      toast({ title: `${deletingChild.firstName} removed`, variant: 'success' })
      setDeletingChild(null)
    } catch (err) {
      toast({ title: 'Could not delete child', description: getErrorMessage(err), variant: 'error' })
    }
  }

  // ── Edit Caregiver dialog ─────────────────────────────────────────────────
  const [editingCaregiver, setEditingCaregiver] = useState<Caregiver | null>(null)
  const [editForm, setEditForm] = useState<UpdateCaregiverDto>({})

  function openEdit(c: Caregiver) {
    setEditingCaregiver(c)
    setEditForm({
      name: c.name,
      email: c.email ?? '',
      relationship: c.relationship ?? '',
      visibility: c.visibility,
      linkExpiry: c.linkExpiry,
      canViewCalendar: c.canViewCalendar,
      canViewHealthInfo: c.canViewHealthInfo,
      canViewEmergencyContacts: c.canViewEmergencyContacts,
      canViewAllergies: c.canViewAllergies,
    })
  }

  async function handleEdit() {
    if (!editingCaregiver) return
    try {
      await updateCaregiver.mutateAsync({ id: editingCaregiver.id, ...editForm })
      toast({ title: 'Caregiver updated', variant: 'success' })
      setEditingCaregiver(null)
    } catch (err) {
      toast({ title: 'Could not update caregiver', description: getErrorMessage(err), variant: 'error' })
    }
  }

  // ── Delete Caregiver confirm ───────────────────────────────────────────────
  const [deletingCaregiver, setDeletingCaregiver] = useState<Caregiver | null>(null)

  async function handleDelete() {
    if (!deletingCaregiver) return
    try {
      await removeCaregiver.mutateAsync(deletingCaregiver.id)
      toast({ title: `${deletingCaregiver.name} removed`, variant: 'success' })
      setDeletingCaregiver(null)
    } catch (err) {
      toast({ title: 'Could not delete caregiver', description: getErrorMessage(err), variant: 'error' })
    }
  }

  // ── Add Child dialog ──────────────────────────────────────────────────────
  const [childOpen, setChildOpen] = useState(false)
  const [childForm, setChildForm] = useState<CreateChildDto>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    color: CHILD_COLORS[0],
  })

  async function handleAddChild() {
    if (!childForm.firstName || !childForm.lastName || !childForm.dateOfBirth) return
    try {
      await addChild.mutateAsync(childForm)
      toast({ title: 'Child added!', variant: 'success' })
      setChildOpen(false)
      setChildForm({ firstName: '', lastName: '', dateOfBirth: '', color: CHILD_COLORS[0] })
    } catch (err) {
      toast({ title: 'Could not add child', description: getErrorMessage(err), variant: 'error' })
    }
  }

  // ── Caregiver modal ───────────────────────────────────────────────────────
  const [caregiverModalOpen, setCaregiverModalOpen] = useState(false)
  const [caregiverIsShared, setCaregiverIsShared] = useState(true)

  // ── Invite Member dialog ──────────────────────────────────────────────────
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [sendEmail, setSendEmail] = useState(true)

  async function handleInvite() {
    if (!inviteEmail) return
    try {
      await inviteMember.mutateAsync({ email: inviteEmail, sendEmail })
      toast({
        title: sendEmail ? `Invitation emailed to ${inviteEmail}` : 'Co-parent added',
        variant: 'success',
      })
      setInviteOpen(false)
      setInviteEmail('')
    } catch (err) {
      toast({ title: 'Could not send invitation', description: getErrorMessage(err), variant: 'error' })
    }
  }

  if (loadingFamilies) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    )
  }

  if (!familyId) {
    return (
      <div className="max-w-3xl">
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No family yet</h3>
            <p className="text-sm text-slate-400 max-w-xs mx-auto">
              You're not part of a family group. Ask your co-parent to invite you, or create one.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">Family</h2>
        <p className="text-sm text-slate-400">{family?.name ?? 'Your family'}</p>
      </div>

      {/* ── Children ──────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
                <Baby className="w-4 h-4 text-teal-500" />
              </div>
              <div>
                <CardTitle className="text-base">Children</CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">
                  {children?.length ?? 0} child{(children?.length ?? 0) !== 1 ? 'ren' : ''} in your family
                </p>
              </div>
            </div>
            <Button size="sm" onClick={() => setChildOpen(true)} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Add Child
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {loadingChildren ? (
            <ListSkeleton rows={2} />
          ) : !children?.length ? (
            <div className="text-center py-8">
              <Baby className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No children added yet.</p>
              <button
                onClick={() => setChildOpen(true)}
                className="text-xs text-teal-500 hover:underline mt-1"
              >
                Add your first child →
              </button>
            </div>
          ) : (
            children.map((child) => (
              <ChildRow
                key={child.id}
                child={child}
                onEdit={openEditChild}
                onDelete={setDeletingChild}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* ── Family Members ────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-base">Family Members</CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">
                  Parents and co-parents with full access
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setInviteOpen(true)}
              className="gap-1.5 border-slate-200"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Invite
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {loadingMembers ? (
            <ListSkeleton rows={2} />
          ) : !members?.members?.length ? (
            <p className="text-sm text-slate-400 text-center py-8">No members found.</p>
          ) : (
            members.members.map((m) => (
              <MemberRow key={m.id} member={m} isMe={m.userId === currentUser?.id} />
            ))
          )}
        </CardContent>
      </Card>

      {/* ── Caregivers ────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
                <Shield className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <CardTitle className="text-base">Caregivers</CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">
                  Nannies, grandparents, and trusted adults
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setCaregiverIsShared(true); setCaregiverModalOpen(true) }}
                className="gap-1.5 border-purple-200 text-purple-600 hover:bg-purple-50"
              >
                <Share2 className="w-3.5 h-3.5" />
                Shared
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setCaregiverIsShared(false); setCaregiverModalOpen(true) }}
                className="gap-1.5 border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <Lock className="w-3.5 h-3.5" />
                Private
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {loadingCaregivers ? (
            <ListSkeleton rows={2} />
          ) : !caregivers?.length ? (
            <div className="text-center py-8">
              <Shield className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No caregivers added yet.</p>
              <p className="text-xs text-slate-300 mt-1">
                Caregivers can see the schedule with limited access.
              </p>
            </div>
          ) : (
            caregivers.map((c) => (
              <CaregiverRow
                key={c.id}
                caregiver={c}
                allChildren={children ?? []}
                familyId={familyId}
                onEdit={openEdit}
                onDelete={setDeletingCaregiver}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* ── Edit Child Dialog ────────────────────────────────────────────── */}
      <Dialog open={!!editingChild} onOpenChange={(o) => { if (!o) setEditingChild(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit child</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>First Name</Label>
                <Input
                  value={editChildForm.firstName ?? ''}
                  onChange={(e) => setEditChildForm((f) => ({ ...f, firstName: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Last Name</Label>
                <Input
                  value={editChildForm.lastName ?? ''}
                  onChange={(e) => setEditChildForm((f) => ({ ...f, lastName: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Date of Birth</Label>
              <Input
                type="date"
                max={new Date().toISOString().split('T')[0]}
                value={editChildForm.dateOfBirth ?? ''}
                onChange={(e) => setEditChildForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Calendar color</Label>
              <div className="flex items-center gap-2">
                {CHILD_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setEditChildForm((f) => ({ ...f, color }))}
                    className="w-7 h-7 rounded-full transition-transform hover:scale-110 focus:outline-none"
                    style={{
                      backgroundColor: color,
                      boxShadow:
                        editChildForm.color === color ? `0 0 0 2px white, 0 0 0 4px ${color}` : 'none',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingChild(null)}>Cancel</Button>
            <Button
              onClick={() => void handleEditChild()}
              disabled={updateChild.isPending || !editChildForm.firstName || !editChildForm.lastName}
            >
              {updateChild.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Child Dialog ───────────────────────────────────────────── */}
      <Dialog open={!!deletingChild} onOpenChange={(o) => { if (!o) setDeletingChild(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Delete child
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 py-1">
            Are you sure you want to remove <strong>{deletingChild?.firstName} {deletingChild?.lastName}</strong>?
            This will also delete their schedule and all associated events.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingChild(null)}>Cancel</Button>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => void handleDeleteChild()}
              disabled={deleteChild.isPending}
            >
              {deleteChild.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Child Dialog ──────────────────────────────────────────────── */}
      <Dialog open={childOpen} onOpenChange={setChildOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a child</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>First Name</Label>
                <Input
                  placeholder="Emma"
                  value={childForm.firstName}
                  onChange={(e) => setChildForm((f) => ({ ...f, firstName: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Last Name</Label>
                <Input
                  placeholder="Smith"
                  value={childForm.lastName}
                  onChange={(e) => setChildForm((f) => ({ ...f, lastName: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Date of Birth</Label>
              <Input
                type="date"
                max={new Date().toISOString().split('T')[0]}
                value={childForm.dateOfBirth}
                onChange={(e) => setChildForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Calendar color</Label>
              <div className="flex items-center gap-2">
                {CHILD_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setChildForm((f) => ({ ...f, color }))}
                    className="w-7 h-7 rounded-full transition-transform hover:scale-110 focus:outline-none"
                    style={{
                      backgroundColor: color,
                      boxShadow:
                        childForm.color === color ? `0 0 0 2px white, 0 0 0 4px ${color}` : 'none',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChildOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleAddChild()}
              disabled={
                addChild.isPending ||
                !childForm.firstName ||
                !childForm.lastName ||
                !childForm.dateOfBirth
              }
            >
              {addChild.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Add Child
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Caregiver Dialog ─────────────────────────────────────────── */}
      <Dialog open={!!editingCaregiver} onOpenChange={(o) => { if (!o) setEditingCaregiver(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Caregiver</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Name *</Label>
                <Input
                  value={editForm.name ?? ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Relationship</Label>
                <Select
                  value={editForm.relationship ?? ''}
                  onValueChange={(v) => setEditForm((f) => ({ ...f, relationship: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {['Grandparent', 'Aunt / Uncle', 'Nanny / Au Pair', 'Family Friend', 'Teacher', 'Coach', 'Babysitter', 'Other'].map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email <span className="text-slate-400">(optional)</span></Label>
              <Input
                type="email"
                value={editForm.email ?? ''}
                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Visibility</Label>
              <div className="flex gap-2">
                {(['SHARED', 'PRIVATE'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setEditForm((f) => ({ ...f, visibility: v }))}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-all ${
                      editForm.visibility === v
                        ? v === 'SHARED' ? 'bg-purple-50 border-purple-300 text-purple-600' : 'bg-slate-50 border-slate-300 text-slate-600'
                        : 'border-slate-100 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    {v === 'SHARED' ? <Share2 className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    {v === 'SHARED' ? 'Shared' : 'Private'}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Permissions</Label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { key: 'canViewCalendar', label: 'Calendar' },
                    { key: 'canViewHealthInfo', label: 'Child Info' },
                    { key: 'canViewEmergencyContacts', label: 'Emergency Contacts' },
                    { key: 'canViewAllergies', label: 'Allergies' },
                  ] as const
                ).map((p) => {
                  const checked = editForm[p.key]
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setEditForm((f) => ({ ...f, [p.key]: !f[p.key] }))}
                      className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-left ${
                        checked ? 'border-teal-300 bg-teal-50' : 'border-slate-100 bg-white hover:border-slate-200'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded border transition-colors shrink-0 flex items-center justify-center ${checked ? 'bg-teal-400 border-teal-400' : 'border-slate-300'}`}>
                        {checked && (
                          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-xs font-medium ${checked ? 'text-teal-700' : 'text-slate-700'}`}>{p.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCaregiver(null)}>Cancel</Button>
            <Button
              onClick={() => void handleEdit()}
              disabled={updateCaregiver.isPending || !editForm.name?.trim()}
            >
              {updateCaregiver.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Caregiver Confirm ──────────────────────────────────────── */}
      <Dialog open={!!deletingCaregiver} onOpenChange={(o) => { if (!o) setDeletingCaregiver(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <DialogTitle>Remove caregiver?</DialogTitle>
            </div>
          </DialogHeader>
          <p className="text-sm text-slate-500 leading-relaxed">
            <strong className="text-slate-700">{deletingCaregiver?.name}</strong> will lose access to your family's information. This cannot be undone.
          </p>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setDeletingCaregiver(null)}>Cancel</Button>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => void handleDelete()}
              disabled={removeCaregiver.isPending}
            >
              {removeCaregiver.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Invite Caregiver Modal ────────────────────────────────────────── */}
      <InviteCaregiverModal
        open={caregiverModalOpen}
        onOpenChange={setCaregiverModalOpen}
        familyId={familyId}
        isShared={caregiverIsShared}
      />

      {/* ── Invite Member Dialog ───────────────────────────────────────────── */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a co-parent</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-500 leading-relaxed">
              They'll receive an invitation link to join your family group on KidSchedule.
            </p>
            <div className="space-y-1.5">
              <Label>Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="email"
                  placeholder="coparent@example.com"
                  className="pl-9"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <p className="text-sm font-medium text-slate-700">Send invite email now</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Send the invitation link immediately
                </p>
              </div>
              <Switch checked={sendEmail} onCheckedChange={setSendEmail} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleInvite()}
              disabled={inviteMember.isPending || !inviteEmail}
            >
              {inviteMember.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
