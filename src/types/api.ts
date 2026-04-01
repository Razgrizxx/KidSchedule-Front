export interface AuthUser {
  id: string
  firstName: string
  lastName: string
  email: string
}

export interface Child {
  id: string
  familyId: string
  firstName: string
  lastName: string
  dateOfBirth: string
  color: string
  avatarUrl?: string
}

export interface FamilyMember {
  id: string
  familyId: string
  userId: string
  role: 'PARENT' | 'CAREGIVER'
  user: AuthUser
}

export interface Family {
  id: string
  name: string
  members: FamilyMember[]
  children: Child[]
}

export interface CustodyEvent {
  id: string
  scheduleId: string
  childId: string
  familyId: string
  date: string
  custodianId: string
  isOverride: boolean
}

export interface Schedule {
  id: string
  familyId: string
  childId: string
  name: string
  pattern: CustodyPattern
  startDate: string
  durationDays: number
  parent1Id?: string
  parent2Id?: string
  isActive: boolean
}

export type CustodyPattern =
  | 'ALTERNATING_WEEKS'
  | 'TWO_TWO_THREE'
  | 'THREE_FOUR_FOUR_THREE'
  | 'FIVE_TWO_TWO_FIVE'
  | 'EVERY_OTHER_WEEKEND'

export interface Message {
  id: string
  familyId: string
  senderId: string
  content: string
  contentHash: string
  previousHash: string
  status: 'SENT' | 'DELIVERED' | 'READ'
  attachmentUrl?: string
  isSystemMessage: boolean
  createdAt: string
  sender?: AuthUser
}

export interface Expense {
  id: string
  familyId: string
  paidBy: string
  childId?: string
  category: ExpenseCategory
  amount: string
  currency: string
  description: string
  date: string
  receiptUrl?: string
  splitRatio: string
  isSettled: boolean
  settledAt?: string
  createdAt: string
  payer?: AuthUser
}

export interface ExpenseBalance {
  members: { user: { id: string; firstName: string; lastName: string }; balance: number }[]
  summary: { pendingCount: number; settledCount: number; totalSettled: number }
}

export type ExpenseCategory =
  | 'EDUCATION'
  | 'HEALTH'
  | 'FOOD'
  | 'CLOTHING'
  | 'ACTIVITIES'
  | 'TRANSPORT'
  | 'OTHER'

export interface ChangeRequest {
  id: string
  familyId: string
  requesterId: string
  responderId?: string
  type: 'ONE_TIME' | 'PERMANENT'
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COUNTER_PROPOSED'
  originalDate?: string
  requestedDate: string
  requestedDateTo?: string
  childId?: string
  reason?: string
  counterDate?: string
  counterReason?: string
  resolvedAt?: string
  createdAt: string
  requester?: { id: string; firstName: string; lastName: string }
  responder?: { id: string; firstName: string; lastName: string }
}

export interface Moment {
  id: string
  familyId: string
  uploadedBy: string
  childId?: string
  caption?: string
  mediaUrl: string
  cloudinaryPublicId?: string
  takenAt?: string
  createdAt: string
  uploader?: { id: string; firstName: string; lastName: string }
  child?: { id: string; firstName: string; color: string }
}

export interface Caregiver {
  id: string
  familyId?: string
  createdBy: string
  name: string
  phone?: string
  email?: string
  relationship?: string
  visibility: 'SHARED' | 'PRIVATE'
  canViewCalendar: boolean
  canViewHealthInfo: boolean
  canViewEmergencyContacts: boolean
  canViewAllergies: boolean
  inviteToken?: string
  linkExpiry: 'SEVEN_DAYS' | 'THIRTY_DAYS' | 'NINETY_DAYS' | 'ONE_YEAR' | 'NEVER'
  linkExpiresAt?: string
  createdAt: string
  updatedAt: string
  children?: { child: Child }[]
}

export type EventType = 'CUSTODY_TIME' | 'SCHOOL' | 'MEDICAL' | 'ACTIVITY' | 'VACATION' | 'OTHER'
export type EventVisibility = 'SHARED' | 'PRIVATE'
export type RepeatPattern = 'NONE' | 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'YEARLY'

export interface CalendarEvent {
  id: string
  familyId: string
  createdBy: string
  title: string
  type: EventType
  visibility: EventVisibility
  startAt: string
  endAt: string
  allDay: boolean
  repeat: RepeatPattern
  notes?: string
  assignedToId?: string
  assignedTo?: { id: string; firstName: string; lastName: string }
  caregiverId?: string
  caregiver?: { id: string; name: string }
  children: { child: { id: string; firstName: string; lastName: string; color: string } }[]
  createdAt: string
}

export type MediationStatus = 'ACTIVE' | 'RESOLVED' | 'ESCALATED'
export type ProposalStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED'

export interface MediationMessage {
  id: string
  sessionId: string
  senderId?: string
  content: string
  isAI: boolean
  createdAt: string
  sender?: { id: string; firstName: string; lastName: string }
}

export interface ResolutionProposal {
  id: string
  sessionId: string
  proposedBy: string
  acceptedBy?: string
  summary: string
  status: ProposalStatus
  createdAt: string
  proposer?: { id: string; firstName: string; lastName: string }
  accepter?: { id: string; firstName: string; lastName: string }
}

export interface MediationSession {
  id: string
  familyId: string
  topic: string
  status: MediationStatus
  createdAt: string
  updatedAt: string
  messages?: MediationMessage[]
  proposals?: ResolutionProposal[]
  _count?: { messages: number; proposals: number }
}

export interface MediationStats {
  total: number
  active: number
  resolved: number
  escalated: number
  resolutionRate: number
}

export type AppearanceTheme = 'FRIENDLY' | 'MODERN' | 'MINIMAL'
export type TimeFormat = 'TWELVE_HOUR' | 'TWENTY_FOUR_HOUR'

export interface FamilySettings {
  id: string
  familyId: string
  timezone: string
  transitionDay: string
  transitionTime: string
  weekStartsOn: string
  createdAt: string
  updatedAt: string
}

export interface UserSettings {
  id: string
  userId: string
  timeFormat: TimeFormat
  emailNotifications: boolean
  pushNotifications: boolean
  appearance: AppearanceTheme
  createdAt: string
  updatedAt: string
}


// ── Organizations ──────────────────────────────────────────────────────────

export type OrgType = 'TEAM' | 'SCHOOL'
export type OrgRole = 'OWNER' | 'ADMIN' | 'VOLUNTEER' | 'MEMBER'
export type OrgMemberStatus = 'PENDING' | 'ACTIVE'
export type RsvpStatus = 'YES' | 'NO' | 'MAYBE'

export interface OrgCustomRole {
  id: string
  organizationId: string
  name: string
  canCreateEvents: boolean
  canCreateAnnouncements: boolean
  canCreateVenues: boolean
  _count?: { members: number }
}

export interface OrgMember {
  id: string
  userId: string
  organizationId: string
  role: OrgRole
  status: OrgMemberStatus
  joinedAt: string
  approvedAt?: string
  customRole?: OrgCustomRole | null
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    avatarUrl?: string
  }
}

export interface Venue {
  id: string
  organizationId: string
  name: string
  address?: string
  mapUrl?: string
  notes?: string
  createdAt: string
}

export interface OrgRsvp {
  id: string
  orgEventId: string
  userId: string
  status: RsvpStatus
  notes?: string
  user: { id: string; firstName: string; lastName: string; avatarUrl?: string }
}

export interface Announcement {
  id: string
  organizationId: string
  authorId: string
  title: string
  content: string
  pinned: boolean
  createdAt: string
  author: { id: string; firstName: string; lastName: string }
}

export interface OrgRosterEntry {
  id: string
  orgId: string
  firstName: string
  lastName: string
  parentName?: string
  parentEmail?: string
  parentPhone?: string
  notes?: string
  linkedChildId?: string
  linkedUserId?: string
  inviteToken?: string
  linkedChild?: {
    id: string
    firstName: string
    lastName: string
    color: string
    family?: {
      members: { user: { id: string; firstName: string; lastName: string; email: string } }[]
    }
  }
  linkedUser?: { id: string; firstName: string; lastName: string; email: string }
  createdAt: string
}

export interface Organization {
  id: string
  name: string
  type: OrgType
  inviteCode: string
  adminId: string
  isPublic: boolean
  description?: string
  role: OrgRole
  myRole?: OrgRole
  myStatus?: OrgMemberStatus
  myCustomRole?: OrgCustomRole | null
  members?: OrgMember[]
  venues?: Venue[]
  customRoles?: OrgCustomRole[]
  createdAt: string
  updatedAt: string
  _count?: { members: number; events: number; announcements: number }
}

export interface OrgEvent {
  id: string
  organizationId: string
  createdById: string
  title: string
  type: EventType
  startAt: string
  endAt: string
  allDay: boolean
  notes?: string
  venueId?: string
  maxCapacity?: number
  createdAt: string
  organization: { id: string; name: string; type: OrgType }
  venue?: Venue
  rsvps?: OrgRsvp[]
  _count?: { rsvps: number }
}
