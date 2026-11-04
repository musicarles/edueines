import { DATA_MODE } from './env'

/**
 * In Firebase mode, public forms (proposals and change reports) need an
 * authenticated context. Anonymous sessions are enough and never grant admin
 * permissions because Firestore rules check the admins collection.
 */
export async function ensurePublicWriteAccess(): Promise<void> {
  if (DATA_MODE !== 'firebase') return
  try {
    const module = await import('./auth/firebase')
    await module.ensureAnonymousAuth()
  } catch {
    // L’escriptura pública ja no requereix autenticació; si l’auth anònima
    // falla (extensions, cookies bloquejades, etc.) continuem igualment.
  }
}
