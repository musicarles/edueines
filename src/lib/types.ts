export type ToolStatus =
  | 'pendent'
  | 'verificada'
  | 'publicada'
  | 'cal_actualitzar'
  | 'no_vigent'

export type ProposalStatus =
  | 'pendent'
  | 'en_revisio'
  | 'aprovada'
  | 'rebutjada'
  | 'fusionada'

export type BenefitType =
  | 'premium-docent'
  | 'llicencia-educativa'
  | 'pla-gratuit'
  | 'descompte'
  | 'altres'

export type EducationLevel =
  | 'infantil'
  | 'primaria'
  | 'eso'
  | 'batxillerat'
  | 'fp'
  | 'superior'
  | 'adults'
  | 'altres'

export type Role = 'superadmin' | 'admin' | 'editor' | 'consultor'

export interface Tool {
  id: string
  name: string
  slug: string
  normalizedName: string
  officialUrl: string
  domain: string
  shortDescription: string
  fullDescription: string
  educationalUses: string
  categoryId: string
  benefitType: BenefitType
  accessConditions: string
  accessMethod: string
  signupInstructions: string
  requiresInstitutionalEmail: boolean | null
  requiresTeacherVerification: boolean | null
  levels: EducationLevel[]
  officialSource: string
  verificationNotes: string
  status: ToolStatus
  featured: boolean
  popularity: number
  color: string
  lastVerifiedAt: string | null
  nextReviewAt: string | null
  createdAt: string
  updatedAt: string
  publishedAt: string | null
  proposalId: string | null
  archivedReason: string
  mergedIntoId: string | null
}

export interface Proposal {
  id: string
  name: string
  normalizedName: string
  officialUrl: string
  domain: string
  description: string
  categoryId: string
  benefitType: BenefitType
  accessMethod: string
  requiresInstitutionalEmail: boolean | null
  requiresTeacherVerification: boolean | null
  levels: EducationLevel[]
  proposerName: string
  proposerEmail: string
  observations: string
  status: ProposalStatus
  createdAt: string
  updatedAt: string
  reviewedBy: string
  reviewedByName: string
  reviewedAt: string | null
  rejectionReason: string
  toolId: string | null
  mergedIntoId: string | null
  reference: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  color: string
  order: number
  active: boolean
}

export interface Verification {
  id: string
  toolId: string
  toolName: string
  verifiedAt: string
  nextReviewAt: string
  source: string
  notes: string
  adminUid: string
  adminName: string
  createdAt: string
}

export interface AdminUser {
  uid: string
  email: string
  username: string
  displayName: string
  role: Role
  active: boolean
  createdAt: string
  lastLoginAt: string | null
}

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  role: Role
  createdAt: string
  lastLoginAt: string | null
}

export interface HistoryEntry {
  id: string
  entityType: 'eina' | 'proposta' | 'categoria' | 'usuari' | 'avís' | 'sistema'
  entityId: string
  entityName: string
  action: string
  summary: string
  actorUid: string
  actorName: string
  createdAt: string
  changes: Array<{ field: string; from: string; to: string }>
}

export interface ChangeReport {
  id: string
  toolId: string
  toolName: string
  message: string
  reporterEmail: string
  status: 'nou' | 'resolt'
  createdAt: string
  resolvedAt: string | null
  resolvedBy: string
}

export interface Invite {
  id: string
  email: string
  displayName: string
  role: Role
  createdAt: string
  invitedBy: string
}

export type CollectionName =
  | 'tools'
  | 'categories'
  | 'proposals'
  | 'admins'
  | 'users'
  | 'verifications'
  | 'history'
  | 'reports'
  | 'invites'
  | 'locks'
  | 'credentials'
  | 'meta'

export interface DatabaseDocument {
  id: string
}

export type DataMode = 'local' | 'firebase'

export interface AuthSession {
  uid: string
  email: string
  username: string
  displayName: string
  role: Role
  active: boolean
}
