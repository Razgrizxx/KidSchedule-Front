import { useState } from 'react'
import { Lock, Share2, Lightbulb, Loader2, Mail } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAddCaregiver, type CreateCaregiverDto } from '@/hooks/useDashboard'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/getErrorMessage'

// ─── Types ────────────────────────────────────────────────────────────────────

type LinkExpiry = CreateCaregiverDto['linkExpiry']

const RELATIONSHIPS = [
  'Grandparent',
  'Aunt / Uncle',
  'Nanny / Au Pair',
  'Family Friend',
  'Teacher',
  'Coach',
  'Babysitter',
  'Other',
]

const EXPIRY_OPTIONS: { value: LinkExpiry; label: string }[] = [
  { value: 'SEVEN_DAYS', label: '7 Days' },
  { value: 'THIRTY_DAYS', label: '30 Days' },
  { value: 'NINETY_DAYS', label: '90 Days' },
  { value: 'ONE_YEAR', label: '1 Year' },
  { value: 'NEVER', label: 'Never' },
]

interface Permission {
  key: keyof Pick<
    CreateCaregiverDto,
    'canViewCalendar' | 'canViewHealthInfo' | 'canViewEmergencyContacts' | 'canViewAllergies'
  >
  label: string
  description: string
}

const PERMISSIONS: Permission[] = [
  {
    key: 'canViewCalendar',
    label: 'Calendar',
    description: 'See custody schedule and events',
  },
  {
    key: 'canViewHealthInfo',
    label: 'Child Info',
    description: "View child's health and school info",
  },
  {
    key: 'canViewEmergencyContacts',
    label: 'Emergency Contacts',
    description: 'Access emergency contact list',
  },
  {
    key: 'canViewAllergies',
    label: 'Allergies',
    description: 'See allergy and medical notes',
  },
]

// ─── Default form state ───────────────────────────────────────────────────────

function defaultForm(isShared: boolean): CreateCaregiverDto {
  return {
    name: '',
    email: '',
    relationship: '',
    visibility: isShared ? 'SHARED' : 'PRIVATE',
    linkExpiry: 'THIRTY_DAYS',
    canViewCalendar: true,
    canViewHealthInfo: false,
    canViewEmergencyContacts: false,
    canViewAllergies: false,
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface InviteCaregiverModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  familyId: string
  isShared: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InviteCaregiverModal({
  open,
  onOpenChange,
  familyId,
  isShared,
}: InviteCaregiverModalProps) {
  const [form, setForm] = useState<CreateCaregiverDto>(() => defaultForm(isShared))
  const [sendEmail, setSendEmail] = useState(true)
  const addCaregiver = useAddCaregiver(familyId)

  function handleClose() {
    onOpenChange(false)
    setForm(defaultForm(isShared))
    setSendEmail(false)
  }

  function togglePermission(key: Permission['key']) {
    setForm((f) => ({ ...f, [key]: !f[key] }))
  }

  async function handleSubmit() {
    if (!form.name.trim()) return
    try {
      await addCaregiver.mutateAsync({
        ...form,
        visibility: isShared ? 'SHARED' : 'PRIVATE',
        sendEmail: !!(form.email && sendEmail),
      })
      const emailSent = form.email && sendEmail
      toast({
        title: emailSent
          ? `Invitation sent to ${form.email}`
          : `${form.name} added as caregiver`,
        variant: 'success',
      })
      handleClose()
    } catch (err) {
      toast({ title: 'Could not add caregiver', description: getErrorMessage(err), variant: 'error' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <DialogTitle className="text-lg">
              {isShared ? 'Add Shared Caregiver' : 'Add Private Caregiver'}
            </DialogTitle>
            {isShared ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-600">
                <Share2 className="w-3 h-3" />
                Shared
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                <Lock className="w-3 h-3" />
                Private
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {isShared
              ? 'Visible to all family members. They can see this caregiver in the shared schedule.'
              : 'Only visible to you. Other family members cannot see this caregiver.'}
          </p>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Name + Relationship */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Name *</Label>
              <Input
                placeholder="e.g. Grandma Rosa"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Relationship</Label>
              <Select
                value={form.relationship}
                onValueChange={(v) => setForm((f) => ({ ...f, relationship: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label className="text-xs">Email Address <span className="text-slate-400">(optional)</span></Label>
            <Input
              type="email"
              placeholder="caregiver@example.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>

          {/* Send email toggle — only relevant when email is filled */}
          {form.email && (
            <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Send invite email now</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {sendEmail ? 'A formal invitation will be emailed' : 'Save privately — share the link yourself'}
                  </p>
                </div>
              </div>
              <Switch checked={sendEmail} onCheckedChange={setSendEmail} />
            </div>
          )}

          {/* Permissions */}
          <div className="space-y-2">
            <Label className="text-xs">Permissions</Label>
            <div className="grid grid-cols-2 gap-2">
              {PERMISSIONS.map((p) => {
                const checked = form[p.key]
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => togglePermission(p.key)}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      checked
                        ? 'border-teal-300 bg-teal-50'
                        : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <div
                        className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${
                          checked
                            ? 'bg-teal-400 border-teal-400'
                            : 'border-slate-300'
                        }`}
                      >
                        {checked && (
                          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                            <path
                              d="M2 5l2.5 2.5L8 3"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                      <span className={`text-xs font-medium ${checked ? 'text-teal-700' : 'text-slate-700'}`}>
                        {p.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight pl-5">
                      {p.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Link expiry */}
          <div className="space-y-2">
            <Label className="text-xs">Invite Link Expiry</Label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {EXPIRY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, linkExpiry: opt.value }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    form.linkExpiry === opt.value
                      ? 'bg-teal-400 text-white border-teal-400'
                      : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tip */}
          <div className="flex gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-100">
            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              {isShared
                ? 'Shared caregivers appear on both parents\' schedule view. Great for nannies and regular caretakers.'
                : 'Private caregivers are only visible to you. Use this for personal contacts you don\'t want to share.'}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={addCaregiver.isPending || !form.name.trim()}
          >
            {addCaregiver.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {form.email && sendEmail ? 'Send Invitation' : 'Add Caregiver'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
