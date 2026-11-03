import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  Cloud,
  Database,
  Download,
  HardDrive,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../lib/auth/AuthProvider'
import { useCollections } from '../../lib/use-collection'
import { useData } from '../../lib/data-context'
import { can } from '../../lib/permissions'
import {
  ADMIN_EMAIL,
  DATA_MODE,
  DATA_MODE_DESCRIPTION,
  FIREBASE_CONFIG,
  IS_FIREBASE,
  IS_FIREBASE_CONFIGURED,
} from '../../lib/env'
import { REVIEW_MONTHS, REVIEW_WARNING_DAYS } from '../../lib/constants'
import { resetLocalCatalog, seedCatalogManually } from '../../lib/seed'
import { getStore } from '../../lib/store'
import type { CollectionName } from '../../lib/types'
import { formatDateTime, nowIso } from '../../lib/utils'
import {
  AdminAccessDenied,
  AdminCard,
  AdminPageHeader,
} from '../../components/admin/AdminUI'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'

const BACKUP_COLLECTIONS = [
  'tools',
  'categories',
  'proposals',
  'admins',
  'users',
  'verifications',
  'history',
  'reports',
  'invites',
  'meta',
] as const satisfies readonly CollectionName[]

export default function AdminSettingsPage() {
  const { user } = useAuth()
  const { refresh: refreshCatalog } = useData()
  const [data, loading, error, refresh] = useCollections([...BACKUP_COLLECTIONS])
  const [busy, setBusy] = useState<'seed' | 'reset' | 'export' | null>(null)
  const [confirmAction, setConfirmAction] = useState<'seed' | 'reset' | null>(null)

  const allowed = can(user?.role, 'settings.manage')
  const canExport = can(user?.role, 'backup.export')

  const tools = (data.tools ?? []) as Array<{ id: string }>
  const counts = useMemo(
    () => ({
      tools: tools.length,
      categories: (data.categories ?? []).length,
      proposals: (data.proposals ?? []).length,
      admins: (data.admins ?? []).length,
      verifications: (data.verifications ?? []).length,
      history: (data.history ?? []).length,
      reports: (data.reports ?? []).length,
      invites: (data.invites ?? []).length,
    }),
    [data, tools.length],
  )

  if (!allowed) {
    return (
      <AdminAccessDenied
        title="Configuració"
        description="Només el superadministrador pot accedir a la configuració del sistema i a les còpies de seguretat."
      />
    )
  }

  const actor = user ? { uid: user.uid, name: user.displayName } : null

  async function handleSeed() {
    if (!actor) return
    setBusy('seed')
    try {
      const total = await seedCatalogManually(actor)
      await Promise.all([refresh(), refreshCatalog()])
      toast.success(`S’han carregat ${total} eines i les categories inicials.`)
      setConfirmAction(null)
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No s’ha pogut importar el catàleg.')
    } finally {
      setBusy(null)
    }
  }

  async function handleReset() {
    if (!actor) return
    setBusy('reset')
    try {
      await resetLocalCatalog(actor)
      await Promise.all([refresh(), refreshCatalog()])
      toast.success('S’ha restablert el catàleg local amb les dades inicials.')
      setConfirmAction(null)
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No s’ha pogut restablir el catàleg.')
    } finally {
      setBusy(null)
    }
  }

  async function handleExport() {
    setBusy('export')
    try {
      const store = await getStore()
      const entries = await Promise.all(
        BACKUP_COLLECTIONS.map(async (collection) => {
          const items = await store.getAll<Record<string, unknown>>(collection)
          return [collection, items] as const
        }),
      )
      const payload = {
        app: 'Edueines',
        exportedAt: nowIso(),
        mode: DATA_MODE,
        collections: Object.fromEntries(entries),
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `edueines-copia-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      toast.success('Còpia exportada. Guarda el fitxer en un lloc segur.')
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No s’ha pogut exportar la còpia.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Configuració"
        description="Estat del sistema, càrrega del catàleg inicial, còpies de seguretat i recordatoris de seguretat. Aquestes accions només són accessibles al superadministrador."
      />

      {error ? (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
        >
          {error}
        </p>
      ) : null}

      {IS_FIREBASE && !IS_FIREBASE_CONFIGURED ? (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p>
            El mode Firebase està activat, però falten valors de configuració. Revisa les
            variables <code className="font-mono text-xs">VITE_FIREBASE_*</code> abans de
            desplegar l’aplicació.
          </p>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminCard
          title="Mode de dades"
          description="Determina on es desen eines, propostes, usuaris i historial."
        >
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-cream/60 p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              {IS_FIREBASE ? (
                <Cloud className="size-5" aria-hidden="true" />
              ) : (
                <HardDrive className="size-5" aria-hidden="true" />
              )}
            </span>
            <div>
              <p className="font-semibold text-ink">
                {IS_FIREBASE ? 'Firebase (Firestore i Authentication)' : 'Dades locals del navegador'}
              </p>
              <p className="mt-0.5 text-sm leading-relaxed text-slate-600">
                {DATA_MODE_DESCRIPTION}
              </p>
            </div>
          </div>

          <dl className="mt-4 divide-y divide-slate-100 text-sm">
            <div className="flex items-center justify-between gap-3 py-2">
              <dt className="text-slate-500">Mode actiu</dt>
              <dd className="font-semibold text-ink">{DATA_MODE}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-2">
              <dt className="text-slate-500">Projecte Firebase</dt>
              <dd className="font-mono text-xs text-ink">
                {IS_FIREBASE ? FIREBASE_CONFIG.projectId || 'No configurat' : '—'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-2">
              <dt className="text-slate-500">Autenticació</dt>
              <dd className="text-right text-xs text-ink">
                {IS_FIREBASE
                  ? IS_FIREBASE_CONFIGURED
                    ? 'Firebase Authentication'
                    : 'Falta configuració'
                  : 'PBKDF2 al navegador'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-2">
              <dt className="text-slate-500">Correu de l’administrador</dt>
              <dd className="truncate font-mono text-xs text-ink">{ADMIN_EMAIL}</dd>
            </div>
          </dl>

          <p className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs leading-relaxed text-sky-900">
            {IS_FIREBASE
              ? 'El catàleg inicial no es carrega automàticament en mode Firebase: fes-ho manualment quan tinguis el projecte preparat.'
              : 'En mode local, el catàleg inicial es carrega automàticament la primera vegada. Les dades viuen només en aquest navegador.'}
          </p>
        </AdminCard>

        <AdminCard
          title="Verificació i revisió"
          description="Paràmetres que apliquen a totes les fitxes del catàleg."
        >
          <dl className="divide-y divide-slate-100 text-sm">
            <div className="flex items-center justify-between gap-3 py-2">
              <dt className="text-slate-500">Període de revisió</dt>
              <dd className="font-semibold text-ink">{REVIEW_MONTHS} mesos</dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-2">
              <dt className="text-slate-500">Avís previ</dt>
              <dd className="font-semibold text-ink">{REVIEW_WARNING_DAYS} dies</dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-2">
              <dt className="text-slate-500">Publicació</dt>
              <dd className="text-right text-xs text-ink">
                Només després de revisió i verificació manual
              </dd>
            </div>
          </dl>

          <div className="mt-4 space-y-2 text-xs leading-relaxed text-slate-600">
            <p>
              Quan una fitxa supera el període de revisió, passa a «Cal actualitzar» i es mostra
              un avís a la fitxa pública. No s’amaga automàticament.
            </p>
            <p>
              Les eines «No vigent» i les propostes pendents no apareixen al catàleg públic.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Metric label="Eines" value={counts.tools} />
            <Metric label="Categories" value={counts.categories} />
            <Metric label="Propostes" value={counts.proposals} />
            <Metric label="Verificacions" value={counts.verifications} />
            <Metric label="Avisos" value={counts.reports} />
            <Metric label="Entrades d’historial" value={counts.history} />
          </div>
        </AdminCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <AdminCard
          title="Catàleg inicial"
          description="Carrega les 12 eines i les 12 categories de referència."
        >
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
            <Database className="mt-0.5 size-5 shrink-0 text-slate-500" aria-hidden="true" />
            <p>
              La importació només funciona si el catàleg és buit. Moltes de les eines inicials
              estan marcades com a pendents de verificació: no es publiquen automàticament i les
              condicions s’han de comprovar a la font oficial.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              onClick={() => setConfirmAction('seed')}
              disabled={loading || busy !== null || counts.tools > 0}
              title={
                counts.tools > 0
                  ? 'El catàleg ja conté eines: buida’l o fes servir una altra instància.'
                  : undefined
              }
            >
              <Download className="size-4" aria-hidden="true" />
              {counts.tools > 0 ? 'Catàleg ja carregat' : 'Importa el catàleg inicial'}
            </Button>
            {!IS_FIREBASE ? (
              <Button
                variant="danger"
                onClick={() => setConfirmAction('reset')}
                disabled={loading || busy !== null}
              >
                <RefreshCw className="size-4" aria-hidden="true" />
                Restableix el catàleg local
              </Button>
            ) : null}
          </div>

          {!IS_FIREBASE ? (
            <p className="mt-3 text-xs leading-relaxed text-rose-700">
              Restablir el catàleg local esborra eines, categories, propostes, verificacions,
              avisos i historial d’aquest navegador, i torna a carregar les dades inicials. Els
              comptes d’usuari es conserven.
            </p>
          ) : (
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              Aquesta acció no es pot desfer. Si ja hi ha dades, fes una còpia de seguretat abans
              de continuar.
            </p>
          )}
        </AdminCard>

        <AdminCard
          title="Còpia de seguretat"
          description="Exporta totes les col·leccions en un fitxer JSON."
        >
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
            <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <p>
              La còpia inclou eines, categories, propostes, comptes, verificacions, historial,
              avisos i invitacions. <strong>No inclou credencials ni bloquejos de duplicats.</strong>{' '}
              Conté dades personals: guarda-la en un lloc segur i no la publiquis.
            </p>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <Metric label="Comptes" value={counts.admins} />
            <Metric label="Invitacions" value={counts.invites} />
          </dl>

          <Button
            className="mt-4"
            variant="outline"
            onClick={handleExport}
            disabled={!canExport || busy !== null}
          >
            <Download className="size-4" aria-hidden="true" />
            {busy === 'export' ? 'Exportant…' : 'Exporta la còpia JSON'}
          </Button>
          {!canExport ? (
            <p className="mt-2 text-xs text-rose-700">
              El teu rol no permet exportar còpies de seguretat.
            </p>
          ) : (
            <p className="mt-2 text-xs text-slate-500">
              Darrera exportació d’aquesta sessió:{' '}
              {busy === 'export' ? 'en curs…' : formatDateTime(nowIso())}
            </p>
          )}
        </AdminCard>
      </div>

      <div className="mt-6">
        <AdminCard
          title="Seguretat i bones pràctiques"
          description="Recomanacions per posar Edueines en producció."
        >
          <ul className="space-y-2 text-sm leading-relaxed text-slate-600">
            <li className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-700" aria-hidden="true" />
              <span>
                Cap proposta ni fitxa es publica automàticament. L’aprovació i la verificació són
                sempre accions manuals d’un administrador.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-700" aria-hidden="true" />
              <span>
                En mode Firebase, publica les regles de seguretat de Firestore incloses al
                projecte abans d’obrir el formulari públic. Les escriptures anònimes només han de
                permetre crear propostes i avisos.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-700" aria-hidden="true" />
              <span>
                Els comptes locals desen la contrasenya com a hash PBKDF2, mai en text pla. Tot i
                així, el mode local és per a proves: per a un equip real, fes servir Firebase.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-700" aria-hidden="true" />
              <span>
                Revisa periòdicament els comptes amb rol de superadministrador i desactiva els
                que ja no calguin. L’historial conserva totes les accions.
              </span>
            </li>
          </ul>
        </AdminCard>
      </div>

      <Modal
        open={confirmAction === 'seed'}
        onClose={() => setConfirmAction(null)}
        title="Importar el catàleg inicial"
        description="S’afegiran les 12 eines i les 12 categories de referència. Les eines pendents no es publicaran fins que les verifiquis."
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setConfirmAction(null)}
              disabled={busy !== null}
            >
              Cancel·la
            </Button>
            <Button onClick={handleSeed} disabled={busy !== null}>
              {busy === 'seed' ? 'Important…' : 'Importa el catàleg'}
            </Button>
          </>
        }
      >
        <p className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm leading-relaxed text-sky-900">
          Aquesta acció només és possible si encara no hi ha cap eina. Un cop importat, podràs
          revisar cada fitxa i verificar-ne les condicions a la font oficial.
        </p>
      </Modal>

      <Modal
        open={confirmAction === 'reset'}
        onClose={() => setConfirmAction(null)}
        title="Restablir el catàleg local"
        description="Aquesta acció esborra les dades del catàleg d’aquest navegador i les substitueix per les dades inicials."
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setConfirmAction(null)}
              disabled={busy !== null}
            >
              Cancel·la
            </Button>
            <Button variant="danger" onClick={handleReset} disabled={busy !== null}>
              <Trash2 className="size-4" aria-hidden="true" />
              {busy === 'reset' ? 'Restablint…' : 'Sí, restableix el catàleg'}
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm leading-relaxed text-slate-700">
          <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800">
            S’esborraran eines, categories, propostes, verificacions, avisos i historial. Els
            comptes i les contrasenyes es conserven.
          </p>
          <p>
            Si tens dades que vols conservar, cancel·la i exporta primer una còpia de seguretat.
          </p>
        </div>
      </Modal>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 font-display text-lg font-extrabold text-ink">{value}</p>
    </div>
  )
}
