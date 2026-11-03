import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react'
import { useAuth } from '../../lib/auth/AuthProvider'
import { DATA_MODE } from '../../lib/env'
import { buttonClasses } from '../../components/ui/Button'
import { LogoMark } from '../../components/Logo'

interface LocationState {
  from?: string
}

export default function AdminLoginPage() {
  const { user, loading, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as LocationState | null)?.from ?? '/admin'
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && user) {
      navigate(from, { replace: true })
    }
  }, [loading, user, from, navigate])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!identifier.trim() || !password) {
      setError('Indica l’usuari i la contrasenya.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await signIn(identifier, password)
      navigate(from, { replace: true })
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'No s’ha pogut iniciar la sessió. Torna-ho a provar.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-cream">
      <aside className="relative hidden w-[44%] flex-col justify-between overflow-hidden bg-brand-900 p-10 text-white lg:flex xl:w-1/2">
        <div
          className="pointer-events-none absolute -right-24 top-1/4 size-96 rounded-full bg-brand-500/25 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -left-20 bottom-0 size-72 rounded-full bg-emerald-400/15 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative">
          <Link
            to="/"
            className="inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-4 focus-visible:ring-offset-brand-900"
          >
            <LogoMark className="size-11" />
            <span className="font-display text-2xl font-extrabold tracking-tight text-white">
              Edueines
            </span>
          </Link>
          <h2 className="mt-16 max-w-md font-display text-3xl font-extrabold leading-tight text-white xl:text-4xl">
            Mantenir el catàleg fiable també és feina d’equip.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-brand-100">
            Des d’aquí es revisen les propostes, es verifiquen les condicions, es publiquen les
            fitxes i es conserva l’historial de canvis.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-brand-50">
            <li className="flex items-start gap-2.5">
              <ShieldCheck className="mt-0.5 size-4.5 shrink-0 text-brand-300" aria-hidden="true" />
              Cap publicació automàtica: tot passa per revisió i verificació.
            </li>
            <li className="flex items-start gap-2.5">
              <KeyRound className="mt-0.5 size-4.5 shrink-0 text-brand-300" aria-hidden="true" />
              Permisos diferenciats per rol: superadmin, admin, editor i consultor.
            </li>
            <li className="flex items-start gap-2.5">
              <TriangleAlert className="mt-0.5 size-4.5 shrink-0 text-brand-300" aria-hidden="true" />
              Avisos de revisió als sis mesos per no deixar fitxes desactualitzades.
            </li>
          </ul>
        </div>
        <p className="relative text-xs text-brand-200">
          Accés restringit a persones autoritzades. Els intents d’accés queden subjectes a les
          condicions del servei.
        </p>
      </aside>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <LogoMark className="size-10" />
              <span className="font-display text-xl font-extrabold tracking-tight text-ink">
                Edueines
              </span>
            </Link>
          </div>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:mt-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              <LockKeyhole className="size-3.5" aria-hidden="true" />
              Àrea d’administració
            </span>
            <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-ink">
              Inicia la sessió
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              Accedeix amb el teu usuari o correu electrònic i la contrasenya.
            </p>

            {DATA_MODE === 'local' ? (
              <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs leading-relaxed text-sky-900">
                <p className="font-semibold">Entorn de demostració local</p>
                <p className="mt-0.5">
                  Usuari: <code className="font-mono font-bold">admin</code> · Contrasenya:{' '}
                  <code className="font-mono font-bold">crp1617G</code>
                </p>
                <p className="mt-1 text-sky-800">
                  Les dades es desen només en aquest navegador (IndexedDB).
                </p>
              </div>
            ) : null}

            {error ? (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
              >
                {error}
              </p>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
              <div className="space-y-1.5">
                <label htmlFor="identifier" className="text-sm font-semibold text-ink">
                  Usuari o correu electrònic
                </label>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  autoComplete="username"
                  placeholder="admin"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-ink shadow-sm placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-semibold text-ink">
                  Contrasenya
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 pr-11 text-sm text-ink shadow-sm placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Amaga la contrasenya' : 'Mostra la contrasenya'}
                    className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-ink"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || loading}
                className={buttonClasses('primary', 'lg', 'w-full')}
              >
                <LockKeyhole className="size-4" aria-hidden="true" />
                {submitting ? 'Comprovant…' : 'Entra a l’administració'}
              </button>
            </form>

            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              Si has oblidat la contrasenya o necessites un compte, contacta amb un
              superadministrador. No hi ha cap registre obert.
            </p>
          </div>

          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-brand-800"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Torna al lloc públic
          </Link>
        </div>
      </main>
    </div>
  )
}
