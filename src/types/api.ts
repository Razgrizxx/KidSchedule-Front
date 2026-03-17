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
  createdAt: string
  payer?: AuthUser
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
  originalDate: string
  requestedDate: string
  childId?: string
  reason?: string
  counterDate?: string
  counterReason?: string
  resolvedAt?: string
  createdAt: string
  requester?: AuthUser
}

export interface Moment {
  id: string
  familyId: string
  uploadedBy: string
  childId?: string
  title?: string
  description?: string
  mediaUrl: string
  thumbnailUrl?: string
  takenAt?: string
  createdAt: string
  uploader?: AuthUser
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
