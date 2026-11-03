import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { ADMIN_EMAIL } from '../env'
import { getDb, getFirebaseAuth } from '../firebase'
import type { AdminUser, AuthSession, Invite, Role, UserProfile } from '../types'
import { nowIso } from '../utils'

export function resolveEmail(identifier: string): string {
  const value = identifier.trim().toLowerCase()
  if (value.includes('@')) return value
  if (value === 'admin' || value === 'administrador') return ADMIN_EMAIL.toLowerCase()
  return `${value}@edueines.cat`
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

async function consumeInvite(user: User): Promise<AdminUser | null> {
  const email = (user.email ?? '').toLowerCase()
  if (!email) return null
  const inviteSnapshot = await getDoc(doc(getDb(), 'invites', email))
  if (!inviteSnapshot.exists()) return null
  const invite = inviteSnapshot.data() as Invite
  const createdAt = nowIso()
  const admin: AdminUser = {
    uid: user.uid,
    email,
    username: email.split('@')[0] ?? email,
    displayName: invite.displayName || email,
    role: invite.role,
    active: true,
    createdAt,
    lastLoginAt: createdAt,
  }
  await setDoc(doc(getDb(), 'admins', user.uid), admin)
  const profile: UserProfile = {
    uid: user.uid,
    email,
    displayName: admin.displayName,
    role: admin.role,
    createdAt,
    lastLoginAt: createdAt,
  }
  await setDoc(doc(getDb(), 'users', user.uid), profile)
  return admin
}

async function loadSession(user: User): Promise<AuthSession | null> {
  const snapshot = await getDoc(doc(getDb(), 'admins', user.uid))
  if (snapshot.exists()) {
    const admin = snapshot.data() as AdminUser
    if (!admin.active) return null
    return toSession(admin)
  }
  const invited = await consumeInvite(user)
  return invited ? toSession(invited) : null
}

export async function firebaseSignIn(
  identifier: string,
  password: string,
): Promise<AuthSession> {
  const auth = getFirebaseAuth()
  let user: User
  try {
    const credential = await signInWithEmailAndPassword(
      auth,
      resolveEmail(identifier),
      password,
    )
    user = credential.user
  } catch (error) {
    throw new Error(firebaseAuthMessage(error))
  }

  let session: AuthSession | null = null
  try {
    session = await loadSession(user)
  } catch (error) {
    await signOut(auth)
    throw new Error(
      error instanceof Error
        ? error.message
        : 'No s’ha pogut comprovar el permís d’aquest compte.',
    )
  }
  if (!session) {
    await signOut(auth)
    throw new Error(
      'Aquest compte no té accés a l’administració d’Edueines. Demana una invitació a un administrador.',
    )
  }

  const lastLoginAt = nowIso()
  await updateDoc(doc(getDb(), 'admins', user.uid), { lastLoginAt }).catch(() => undefined)
  return session
}

export async function firebaseSignOut(): Promise<void> {
  await signOut(getFirebaseAuth())
}

export async function ensureAnonymousAuth(): Promise<void> {
  const auth = getFirebaseAuth()
  if (auth.currentUser) return
  await signInAnonymously(auth)
}

export function subscribeFirebaseAuth(
  callback: (session: AuthSession | null) => void,
): () => void {
  return onAuthStateChanged(getFirebaseAuth(), async (user) => {
    if (!user) {
      callback(null)
      return
    }
    try {
      const session = await loadSession(user)
      if (!session) {
        await signOut(getFirebaseAuth())
        callback(null)
        return
      }
      callback(session)
    } catch {
      callback(null)
    }
  })
}

export async function createInvite(input: {
  email: string
  displayName: string
  role: Role
  invitedBy: string
}): Promise<void> {
  const email = input.email.trim().toLowerCase()
  const invite: Invite = {
    id: email,
    email,
    displayName: input.displayName.trim(),
    role: input.role,
    createdAt: nowIso(),
    invitedBy: input.invitedBy,
  }
  await setDoc(doc(getDb(), 'invites', email), invite)
}

export async function deleteInvite(email: string): Promise<void> {
  await deleteDoc(doc(getDb(), 'invites', email.trim().toLowerCase()))
}

export function firebaseAuthMessage(error: unknown): string {
  const code = (error as { code?: string }).code ?? ''
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Usuari o contrasenya incorrectes.'
    case 'auth/invalid-email':
      return 'El correu electrònic no és vàlid.'
    case 'auth/user-disabled':
      return 'Aquest compte està desactivat.'
    case 'auth/too-many-requests':
      return 'Massa intents seguits. Espera uns minuts i torna-ho a provar.'
    case 'auth/network-request-failed':
      return 'No hi ha connexió amb el servei d’autenticació. Revisa la xarxa.'
    case 'auth/operation-not-allowed':
      return 'El mètode d’accés no està activat al projecte de Firebase.'
    default:
      return error instanceof Error
        ? error.message
        : 'No s’ha pogut iniciar la sessió.'
  }
}
