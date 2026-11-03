import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { DATA_MODE } from '../env'
import type { AuthSession, DataMode } from '../types'
import {
  ensureLocalAdmin,
  localSignIn,
  localSignOut,
  readLocalSession,
} from './local'

interface AuthContextValue {
  user: AuthSession | null
  loading: boolean
  error: string | null
  mode: DataMode
  signIn: (identifier: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function messageOf(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'No s’ha pogut completar l’operació d’autenticació.'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    let unsubscribe: (() => void) | null = null

    async function start() {
      try {
        if (DATA_MODE === 'local') {
          await ensureLocalAdmin()
          const session = await readLocalSession()
          if (!active) return
          setUser(session)
          setLoading(false)
          return
        }
        const module = await import('./firebase')
        if (!active) return
        unsubscribe = module.subscribeFirebaseAuth((session) => {
          setUser(session)
          setLoading(false)
        })
      } catch (caught) {
        if (!active) return
        setError(messageOf(caught))
        setLoading(false)
      }
    }

    void start()
    return () => {
      active = false
      unsubscribe?.()
    }
  }, [])

  const signIn = useCallback(async (identifier: string, password: string) => {
    setError(null)
    try {
      if (DATA_MODE === 'local') {
        const session = await localSignIn(identifier, password)
        setUser(session)
        return
      }
      const module = await import('./firebase')
      const session = await module.firebaseSignIn(identifier, password)
      setUser(session)
    } catch (caught) {
      const message = messageOf(caught)
      setError(message)
      throw new Error(message)
    }
  }, [])

  const signOut = useCallback(async () => {
    setError(null)
    if (DATA_MODE === 'local') {
      localSignOut()
    } else {
      const module = await import('./firebase')
      await module.firebaseSignOut()
    }
    setUser(null)
  }, [])

  const refresh = useCallback(async () => {
    if (DATA_MODE !== 'local') return
    const session = await readLocalSession()
    setUser(session)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      mode: DATA_MODE,
      signIn,
      signOut,
      refresh,
    }),
    [user, loading, error, signIn, signOut, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth s’ha d’utilitzar dins d’AuthProvider.')
  }
  return context
}
