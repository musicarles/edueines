import { ADMIN_EMAIL, SESSION_STORAGE_KEY } from '../env'
import { getStore } from '../store'
import type { AdminUser, AuthSession, Role, UserProfile } from '../types'
import { nowIso } from '../utils'

const SESSION_HOURS = 12
const DEFAULT_ITERATIONS = 150_000

interface Credential {
  id: string
  salt: string
  hash: string
  iterations: number
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function hexToBytes(hex: string): Uint8Array {
  const pairs = hex.match(/.{2}/g) ?? []
  return new Uint8Array(pairs.map((pair) => Number.parseInt(pair, 16)))
}

async function deriveHash(password: string, salt: string, iterations: number): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: hexToBytes(salt).buffer as ArrayBuffer,
      iterations,
    },
    key,
    256,
  )
  return bytesToHex(new Uint8Array(bits))
}

async function createCredential(uid: string, password: string): Promise<Credential> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16))
  const salt = bytesToHex(saltBytes)
  const hash = await deriveHash(password, salt, DEFAULT_ITERATIONS)
  return { id: uid, salt, hash, iterations: DEFAULT_ITERATIONS }
}

function toSession(admin: AdminUser): AuthSession {
  return {
    uid: admin.uid,
    email: admin.email,
    username: admin.username,
    displayName: admin.displayName,
    role: admin.role,
    active: admin.active,
  }
}

function readSessionRecord(): { uid: string; expiresAt: number } | null {
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { uid?: string; expiresAt?: number }
    if (!parsed.uid || !parsed.expiresAt) return null
    if (Date.now() > parsed.expiresAt) return null
    return { uid: parsed.uid, expiresAt: parsed.expiresAt }
  } catch {
    return null
  }
}

function writeSessionRecord(uid: string): void {
  const record = { uid, expiresAt: Date.now() + SESSION_HOURS * 3_600_000 }
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(record))
}

export function clearLocalSession(): void {
  window.localStorage.removeItem(SESSION_STORAGE_KEY)
}

/**
 * Local demo mode only: creates a first administrator if there is none.
 * The password is stored as a PBKDF2 hash, never in plain text.
 */
export async function ensureLocalAdmin(): Promise<void> {
  const store = await getStore()
  const admins = await store.getAll<AdminUser>('admins')
  if (admins.length > 0) return

  const uid = 'local-admin'
  const createdAt = nowIso()
  const admin: AdminUser = {
    uid,
    email: ADMIN_EMAIL,
    username: 'admin',
    displayName: 'Administrador',
    role: 'superadmin',
    active: true,
    createdAt,
    lastLoginAt: null,
  }
  const profile: UserProfile = {
    uid,
    email: admin.email,
    displayName: admin.displayName,
    role: admin.role,
    createdAt,
    lastLoginAt: null,
  }
  await store.put('admins', uid, admin)
  await store.put('users', uid, profile)
  await store.put('credentials', uid, await createCredential(uid, 'crp1617G'))
}

export async function readLocalSession(): Promise<AuthSession | null> {
  const record = readSessionRecord()
  if (!record) return null
  const store = await getStore()
  const admin = await store.get<AdminUser>('admins', record.uid)
  if (!admin || !admin.active) {
    clearLocalSession()
    return null
  }
  return toSession(admin)
}

export async function localSignIn(
  identifier: string,
  password: string,
): Promise<AuthSession> {
  await ensureLocalAdmin()
  const store = await getStore()
  const admins = await store.getAll<AdminUser>('admins')
  const needle = identifier.trim().toLowerCase()
  const admin = admins.find(
    (item) =>
      item.username.toLowerCase() === needle || item.email.toLowerCase() === needle,
  )
  if (!admin) {
    throw new Error('Usuari o contrasenya incorrectes.')
  }
  const credential = await store.get<Credential>('credentials', admin.uid)
  if (!credential) {
    throw new Error('Aquest compte encara no té cap contrasenya configurada.')
  }
  const hash = await deriveHash(password, credential.salt, credential.iterations)
  if (hash !== credential.hash) {
    throw new Error('Usuari o contrasenya incorrectes.')
  }
  if (!admin.active) {
    throw new Error('Aquest compte està desactivat. Contacta amb un administrador.')
  }

  const lastLoginAt = nowIso()
  await store.patch<AdminUser>('admins', admin.uid, { lastLoginAt })
  await store.patch<UserProfile>('users', admin.uid, { lastLoginAt }).catch(() => undefined)
  writeSessionRecord(admin.uid)
  return toSession({ ...admin, lastLoginAt })
}

export function localSignOut(): void {
  clearLocalSession()
}

export async function setLocalPassword(uid: string, password: string): Promise<void> {
  if (password.length < 8) {
    throw new Error('La contrasenya ha de tenir com a mínim 8 caràcters.')
  }
  const store = await getStore()
  await store.put('credentials', uid, await createCredential(uid, password))
}

export async function createLocalAdmin(input: {
  uid?: string
  username: string
  displayName: string
  email: string
  role: Role
  active: boolean
  password: string
}): Promise<AdminUser> {
  const store = await getStore()
  const admins = await store.getAll<AdminUser>('admins')
  const username = input.username.trim().toLowerCase()
  const email = input.email.trim().toLowerCase()
  if (admins.some((item) => item.username.toLowerCase() === username)) {
    throw new Error('Ja existeix un usuari amb aquest identificador.')
  }
  if (admins.some((item) => item.email.toLowerCase() === email)) {
    throw new Error('Ja existeix un usuari amb aquest correu electrònic.')
  }
  const uid = input.uid ?? `local-${crypto.randomUUID()}`
  const createdAt = nowIso()
  const admin: AdminUser = {
    uid,
    email,
    username,
    displayName: input.displayName.trim(),
    role: input.role,
    active: input.active,
    createdAt,
    lastLoginAt: null,
  }
  const profile: UserProfile = {
    uid,
    email,
    displayName: admin.displayName,
    role: admin.role,
    createdAt,
    lastLoginAt: null,
  }
  await store.put('admins', uid, admin)
  await store.put('users', uid, profile)
  await store.put('credentials', uid, await createCredential(uid, input.password))
  return admin
}
