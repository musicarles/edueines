import type { Role } from './types'

export type Permission =
  | 'tools.view'
  | 'tools.edit'
  | 'tools.publish'
  | 'tools.verify'
  | 'tools.archive'
  | 'proposals.view'
  | 'proposals.review'
  | 'proposals.approve'
  | 'categories.manage'
  | 'users.manage'
  | 'reports.manage'
  | 'history.view'
  | 'settings.manage'
  | 'backup.export'

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  superadmin: [
    'tools.view',
    'tools.edit',
    'tools.publish',
    'tools.verify',
    'tools.archive',
    'proposals.view',
    'proposals.review',
    'proposals.approve',
    'categories.manage',
    'users.manage',
    'reports.manage',
    'history.view',
    'settings.manage',
    'backup.export',
  ],
  admin: [
    'tools.view',
    'tools.edit',
    'tools.publish',
    'tools.verify',
    'tools.archive',
    'proposals.view',
    'proposals.review',
    'proposals.approve',
    'categories.manage',
    'reports.manage',
    'history.view',
    'backup.export',
  ],
  editor: [
    'tools.view',
    'tools.edit',
    'proposals.view',
    'proposals.review',
    'reports.manage',
    'history.view',
  ],
  consultor: ['tools.view', 'proposals.view', 'history.view'],
}

export function permissionsFor(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? []
}

export function can(role: Role | null | undefined, permission: Permission): boolean {
  if (!role) return false
  return permissionsFor(role).includes(permission)
}

export function canAny(role: Role | null | undefined, permissions: Permission[]): boolean {
  return permissions.some((permission) => can(role, permission))
}

export const ROLE_ORDER: Role[] = ['superadmin', 'admin', 'editor', 'consultor']
