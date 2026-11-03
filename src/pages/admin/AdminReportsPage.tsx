import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Filter,
  Flag,
  Mail,
  RotateCcw,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../lib/auth/AuthProvider'
import { useCollection } from '../../lib/use-collection'
import { can } from '../../lib/permissions'
import { resolveReport, reopenReport } from '../../lib/workflow'
import type { ChangeReport } from '../../lib/types'
import { cn, formatDateTime } from '../../lib/utils'
import {
  AdminAccessDenied,
  AdminPageHeader,
  StatCard,
} from '../../components/admin/AdminUI'
import { Button, buttonClasses } from '../../components/ui/Button'
import { EmptyState, LoadingBlock } from '../../components/ui/Feedback'

type FilterKey = 'nous' | 'resolts' | 'tots'

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'nous', label: 'Per atendre' },
  { key: 'resolts', label: 'Resolts' },
  { key: 'tots', label: 'Tots' },
]

export default function AdminReportsPage() {
  const { user } = useAuth()
  const { items, loading, error, refresh } = useCollection<ChangeReport>('reports', (a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )
  const [filter, setFilter] = useState<FilterKey>('nous')
  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const actor = user ? { uid: user.uid, name: user.displayName } : null
  const allowed = can(user?.role, 'reports.manage')

  const counts = useMemo(() => {
    const result = { nous: 0, resolts: 0 }
    for (const report of items) {
      if (report.status === 'nou') result.nous += 1
      else result.resolts += 1
    }
    return result
  }, [items])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return items.filter((report) => {
      if (filter === 'nous' && report.status !== 'nou') return false
      if (filter === 'resolts' && report.status !== 'resolt') return false
      if (!needle) return true
      return [report.toolName, report.message, report.reporterEmail]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })
  }, [items, filter, query])

  if (!allowed) {
    return (
      <AdminAccessDenied
        title="Avisos de canvi"
        description="El teu rol no permet gestionar els avisos enviats des de les fitxes públiques."
      />
    )
  }

  async function handleResolve(report: ChangeReport) {
    if (!actor) return
    setBusyId(report.id)
    try {
      await resolveReport(report, actor)
      await refresh()
      toast.success('Avís marcat com a resolt.')
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No s’ha pogut resoldre l’avís.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleReopen(report: ChangeReport) {
    if (!actor) return
    setBusyId(report.id)
    try {
      await reopenReport(report, actor)
      await refresh()
      toast.success('Avís reobert.')
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No s’ha pogut reobrir l’avís.')
    } finally {
      setBusyId(null)
    }
  }

  const filterCount = (key: FilterKey) =>
    key === 'nous' ? counts.nous : key === 'resolts' ? counts.resolts : items.length

  return (
    <div>
      <AdminPageHeader
        title="Avisos de canvi"
        description="Missatges que la comunitat envia des de les fitxes públiques quan una condició ja no és correcta. Revisa l’eina, actualitza la fitxa i marca l’avís com a resolt."
        actions={
          <Link to="/admin/eines" className={buttonClasses('outline', 'md')}>
            Gestiona les eines
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        }
      />

      {error ? (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
        >
          {error}
        </p>
      ) : null}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <StatCard
          label="Avisos oberts"
          value={counts.nous}
          hint="Pendents d’atendre"
          tone="amber"
          icon={<Flag className="size-4" aria-hidden="true" />}
        />
        <StatCard
          label="Resolts"
          value={counts.resolts}
          hint="Amb la fitxa revisada"
          tone="emerald"
          icon={<CheckCircle2 className="size-4" aria-hidden="true" />}
        />
        <StatCard
          label="Total rebut"
          value={items.length}
          hint="Des de l’inici del catàleg"
          tone="sky"
          icon={<Mail className="size-4" aria-hidden="true" />}
        />
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <label htmlFor="cerca-avisos" className="sr-only">
            Cerca avisos
          </label>
          <input
            id="cerca-avisos"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cerca per eina, missatge o correu…"
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-ink shadow-sm placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
          />
        </div>
        <p className="inline-flex items-center gap-1.5 text-sm text-slate-500">
          <Filter className="size-4" aria-hidden="true" />
          {filtered.length} {filtered.length === 1 ? 'avís' : 'avisos'}
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5" role="group" aria-label="Filtra per estat">
        {FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            aria-pressed={filter === item.key}
            onClick={() => setFilter(item.key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600',
              filter === item.key
                ? 'border-brand-700 bg-brand-700 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
            )}
          >
            {item.label}
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                filter === item.key ? 'bg-white/20' : 'bg-slate-100 text-slate-600',
              )}
            >
              {filterCount(item.key)}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingBlock label="Carregant els avisos…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Flag className="size-5" />}
          title={
            filter === 'nous'
              ? 'No hi ha avisos pendents'
              : 'No hi ha avisos en aquesta vista'
          }
          description="Els avisos arriben quan algú detecta que les condicions d’una eina han canviat. Si no n’hi ha cap, tot està al dia."
          action={
            filter !== 'tots' ? (
              <Button variant="outline" onClick={() => setFilter('tots')}>
                Mostra tots els avisos
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((report) => {
            const open = report.status === 'nou'
            return (
              <li
                key={report.id}
                className={cn(
                  'rounded-2xl border bg-white p-4 shadow-sm sm:p-5',
                  open ? 'border-amber-200' : 'border-slate-200',
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl',
                        open ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700',
                      )}
                    >
                      {open ? (
                        <AlertTriangle className="size-4" aria-hidden="true" />
                      ) : (
                        <CheckCircle2 className="size-4" aria-hidden="true" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <Link
                        to={`/admin/eines/${report.toolId}`}
                        className="font-display text-base font-bold text-ink hover:text-brand-800 hover:underline"
                      >
                        {report.toolName}
                      </Link>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="size-3" aria-hidden="true" />
                          {formatDateTime(report.createdAt)}
                        </span>
                        {report.reporterEmail ? (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="size-3" aria-hidden="true" />
                            {report.reporterEmail}
                          </span>
                        ) : (
                          <span>Avís anònim</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset',
                      open
                        ? 'bg-amber-50 text-amber-800 ring-amber-200'
                        : 'bg-emerald-50 text-emerald-700 ring-emerald-200',
                    )}
                  >
                    {open ? 'Nou' : 'Resolt'}
                  </span>
                </div>

                <blockquote className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-sm leading-relaxed text-slate-700">
                  {report.message}
                </blockquote>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <p className="text-[11px] text-slate-500">
                    {report.status === 'resolt' && report.resolvedAt
                      ? `Resolt per ${report.resolvedBy || 'un administrador'} el ${formatDateTime(report.resolvedAt)}.`
                      : 'Encara no s’ha revisat la fitxa.'}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Link
                      to={`/admin/eines/${report.toolId}`}
                      className={cn(
                        'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-ink shadow-sm transition hover:border-slate-400 hover:bg-slate-50',
                      )}
                    >
                      Revisa la fitxa
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    </Link>
                    {open ? (
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={busyId === report.id}
                        onClick={() => handleResolve(report)}
                      >
                        <CheckCircle2 className="size-3.5" aria-hidden="true" />
                        {busyId === report.id ? 'Resolent…' : 'Marca com a resolt'}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busyId === report.id}
                        onClick={() => handleReopen(report)}
                      >
                        <RotateCcw className="size-3.5" aria-hidden="true" />
                        {busyId === report.id ? 'Reobrint…' : 'Reobre'}
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <p className="mt-5 text-xs leading-relaxed text-slate-500">
        Els avisos es poden enviar sense compte. No publiquen ni modifiquen cap fitxa
        automàticament: només deixen constància que cal revisar la informació. Un cop revisada la
        font oficial, actualitza la fitxa i marca l’avís com a resolt.
      </p>
    </div>
  )
}
