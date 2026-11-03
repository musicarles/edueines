import { useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Flag,
  FolderTree,
  History,
  Inbox,
  Search,
  Settings,
  Users,
  Wrench,
} from 'lucide-react'
import { useAuth } from '../../lib/auth/AuthProvider'
import { useCollection } from '../../lib/use-collection'
import { can } from '../../lib/permissions'
import type { HistoryEntry } from '../../lib/types'
import { cn, formatDateTime } from '../../lib/utils'
import {
  AdminAccessDenied,
  AdminPageHeader,
  StatCard,
} from '../../components/admin/AdminUI'
import { Button } from '../../components/ui/Button'
import { EmptyState, LoadingBlock } from '../../components/ui/Feedback'

type EntityType = HistoryEntry['entityType']

const ENTITY_TYPES: Record<
  EntityType,
  { label: string; icon: typeof Wrench; tone: string }
> = {
  eina: { label: 'Eines', icon: Wrench, tone: 'bg-brand-50 text-brand-700' },
  proposta: { label: 'Propostes', icon: Inbox, tone: 'bg-sky-50 text-sky-700' },
  categoria: { label: 'Categories', icon: FolderTree, tone: 'bg-violet-50 text-violet-700' },
  usuari: { label: 'Usuaris', icon: Users, tone: 'bg-indigo-50 text-indigo-700' },
  avís: { label: 'Avisos', icon: Flag, tone: 'bg-amber-50 text-amber-700' },
  sistema: { label: 'Sistema', icon: Settings, tone: 'bg-slate-100 text-slate-600' },
}

const FILTERS: Array<{ key: EntityType | 'tots'; label: string }> = [
  { key: 'tots', label: 'Tot' },
  { key: 'eina', label: 'Eines' },
  { key: 'proposta', label: 'Propostes' },
  { key: 'categoria', label: 'Categories' },
  { key: 'usuari', label: 'Usuaris' },
  { key: 'avís', label: 'Avisos' },
  { key: 'sistema', label: 'Sistema' },
]

export default function AdminHistoryPage() {
  const { user } = useAuth()
  const { items, loading, error } = useCollection<HistoryEntry>('history', (a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )
  const [filter, setFilter] = useState<EntityType | 'tots'>('tots')
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(60)

  const allowed = can(user?.role, 'history.view')

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const entry of items) {
      map.set(entry.entityType, (map.get(entry.entityType) ?? 0) + 1)
    }
    return map
  }, [items])

  const actors = useMemo(
    () => new Set(items.map((entry) => entry.actorName).filter(Boolean)).size,
    [items],
  )

  const lastWeek = useMemo(() => {
    const limit = Date.now() - 7 * 86_400_000
    return items.filter((entry) => new Date(entry.createdAt).getTime() >= limit).length
  }, [items])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return items.filter((entry) => {
      if (filter !== 'tots' && entry.entityType !== filter) return false
      if (!needle) return true
      return [entry.summary, entry.entityName, entry.actorName, entry.action, entry.entityType]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })
  }, [items, filter, query])

  if (!allowed) {
    return (
      <AdminAccessDenied
        title="Historial"
        description="El teu rol no permet consultar el registre de canvis de l’administració."
      />
    )
  }

  const shown = filtered.slice(0, visibleCount)

  return (
    <div>
      <AdminPageHeader
        title="Historial de canvis"
        description="Registre cronològic de totes les accions de l’administració: propostes revisades, fitxes verificades, categories, usuaris i avisos. Cada entrada indica qui l’ha feta i quan."
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
          label="Entrades"
          value={items.length}
          hint="Canvis registrats"
          icon={<History className="size-4" aria-hidden="true" />}
        />
        <StatCard
          label="Darrers 7 dies"
          value={lastWeek}
          hint="Activitat recent"
          tone="emerald"
          icon={<History className="size-4" aria-hidden="true" />}
        />
        <StatCard
          label="Persones"
          value={actors}
          hint="Han fet alguna acció"
          tone="sky"
          icon={<Users className="size-4" aria-hidden="true" />}
        />
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <label htmlFor="cerca-historial" className="sr-only">
            Cerca a l’historial
          </label>
          <input
            id="cerca-historial"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cerca per acció, element o persona…"
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-ink shadow-sm placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
          />
        </div>
        <p className="text-sm text-slate-500">
          {filtered.length} {filtered.length === 1 ? 'entrada' : 'entrades'}
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5" role="group" aria-label="Filtra per tipus">
        {FILTERS.map((item) => {
          const count = item.key === 'tots' ? items.length : (counts.get(item.key) ?? 0)
          return (
            <button
              key={item.key}
              type="button"
              aria-pressed={filter === item.key}
              onClick={() => {
                setFilter(item.key)
                setVisibleCount(60)
              }}
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
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {loading ? (
        <LoadingBlock label="Carregant l’historial…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<History className="size-5" />}
          title="No hi ha cap entrada en aquesta vista"
          description="Quan es revisi una proposta o es modifiqui una fitxa, l’acció apareixerà aquí."
          action={
            filter !== 'tots' ? (
              <Button variant="outline" onClick={() => setFilter('tots')}>
                Mostra tot l’historial
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <ol className="space-y-2">
            {shown.map((entry) => {
              const meta = ENTITY_TYPES[entry.entityType]
              const Icon = meta.icon
              const isOpen = expanded === entry.id
              return (
                <li
                  key={entry.id}
                  className="rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="flex items-start gap-3 p-4">
                    <span
                      className={cn(
                        'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl',
                        meta.tone,
                      )}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                          {meta.label}
                        </span>
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-700">
                          {entry.action}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formatDateTime(entry.createdAt)}
                        </span>
                      </div>

                      <p className="mt-1.5 text-sm leading-relaxed text-ink">{entry.summary}</p>

                      <p className="mt-1 text-xs text-slate-500">
                        <span className="font-medium text-slate-600">{entry.entityName}</span>
                        {' · '}
                        {entry.actorName || 'Sistema'}
                      </p>

                      {entry.changes.length > 0 ? (
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => setExpanded(isOpen ? null : entry.id)}
                            aria-expanded={isOpen}
                            className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs font-semibold text-brand-800 hover:bg-brand-50"
                          >
                            {isOpen ? (
                              <ChevronDown className="size-3.5" aria-hidden="true" />
                            ) : (
                              <ChevronRight className="size-3.5" aria-hidden="true" />
                            )}
                            {entry.changes.length}{' '}
                            {entry.changes.length === 1 ? 'canvi de camp' : 'canvis de camp'}
                          </button>

                          {isOpen ? (
                            <div className="mt-2 overflow-hidden rounded-xl border border-slate-200">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                                  <tr>
                                    <th scope="col" className="px-3 py-2 font-bold">
                                      Camp
                                    </th>
                                    <th scope="col" className="px-3 py-2 font-bold">
                                      Abans
                                    </th>
                                    <th scope="col" className="px-3 py-2 font-bold">
                                      Després
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {entry.changes.map((change, index) => (
                                    <tr key={`${entry.id}-${change.field}-${index}`}>
                                      <td className="px-3 py-2 font-medium text-slate-700">
                                        {change.field}
                                      </td>
                                      <td className="max-w-[16rem] break-words px-3 py-2 text-slate-500">
                                        {change.from}
                                      </td>
                                      <td className="max-w-[16rem] break-words px-3 py-2 text-slate-700">
                                        {change.to}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>

          {filtered.length > shown.length ? (
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                onClick={() => setVisibleCount((current) => current + 60)}
              >
                Mostra’n més ({filtered.length - shown.length} restants)
              </Button>
            </div>
          ) : null}
        </>
      )}

      <p className="mt-6 text-xs leading-relaxed text-slate-500">
        L’historial és només de consulta: no es pot editar ni esborrar des de la interfície.
        Conserva el rastre de qui ha aprovat, verificat o modificat cada element del catàleg.
      </p>
    </div>
  )
}
