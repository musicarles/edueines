import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Filter, Inbox, Search } from 'lucide-react'
import { useCollection } from '../../lib/use-collection'
import { useData } from '../../lib/data-context'
import { BENEFITS, PROPOSAL_STATUSES } from '../../lib/constants'
import type { Proposal, ProposalStatus } from '../../lib/types'
import { formatDateTime } from '../../lib/utils'
import { AdminPageHeader } from '../../components/admin/AdminUI'
import { LoadingBlock, EmptyState } from '../../components/ui/Feedback'
import { ProposalStatusBadge } from '../../components/StatusBadge'
import { buttonClasses } from '../../components/ui/Button'
import { cn } from '../../lib/utils'

type FilterKey = 'totes' | 'pendent' | 'en_revisio' | 'aprovada' | 'rebutjada' | 'fusionada'

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'totes', label: 'Totes' },
  { key: 'pendent', label: 'Pendent de revisió' },
  { key: 'en_revisio', label: 'En revisió' },
  { key: 'aprovada', label: 'Aprovades' },
  { key: 'rebutjada', label: 'Rebutjades' },
  { key: 'fusionada', label: 'Fusionades' },
]

export default function AdminProposalsPage() {
  const { categories } = useData()
  const { items, loading, error } = useCollection<Proposal>('proposals', (a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )
  const [filter, setFilter] = useState<FilterKey>('pendent')
  const [query, setQuery] = useState('')

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const proposal of items) {
      map.set(proposal.status, (map.get(proposal.status) ?? 0) + 1)
    }
    return map
  }, [items])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return items.filter((proposal) => {
      if (filter !== 'totes' && proposal.status !== filter) return false
      if (!needle) return true
      return [proposal.name, proposal.reference, proposal.proposerName, proposal.proposerEmail]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })
  }, [items, filter, query])

  return (
    <div>
      <AdminPageHeader
        title="Propostes"
        description="Revisa les eines proposades per la comunitat, comprova’n les condicions i decideix si s’aproven, es fusionen o es rebutgen. Cap proposta es publica automàticament."
        actions={
          <Link to="/proposa" className={buttonClasses('outline', 'md')}>
            Obre el formulari públic
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        }
      />

      {error ? (
        <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <label htmlFor="cerca-propostes" className="sr-only">
            Cerca propostes
          </label>
          <input
            id="cerca-propostes"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cerca per nom, referència o persona que la proposa…"
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-ink shadow-sm placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
          />
        </div>
        <p className="inline-flex items-center gap-1.5 text-sm text-slate-500">
          <Filter className="size-4" aria-hidden="true" />
          {filtered.length} {filtered.length === 1 ? 'proposta' : 'propostes'}
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5" role="group" aria-label="Filtra per estat">
        {FILTERS.map((item) => {
          const count = item.key === 'totes' ? items.length : (counts.get(item.key) ?? 0)
          return (
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
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {loading ? (
        <LoadingBlock label="Carregant les propostes…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Inbox className="size-5" />}
          title="No hi ha propostes en aquest estat"
          description="Quan algú proposi una eina des del formulari públic, apareixerà aquí per revisar-la."
          action={
            <Link to="/admin/propostes" className={buttonClasses('outline', 'md')}>
              Torna a totes les propostes
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[1.6fr_1fr_0.8fr_1fr_auto] gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 lg:grid">
            <span>Eina proposada</span>
            <span>Categoria i avantatge</span>
            <span>Estat</span>
            <span>Data</span>
            <span className="text-right">Acció</span>
          </div>
          <ul className="divide-y divide-slate-100">
            {filtered.map((proposal) => (
              <li
                key={proposal.id}
                className="grid gap-2 px-5 py-4 transition hover:bg-slate-50/70 lg:grid-cols-[1.6fr_1fr_0.8fr_1fr_auto] lg:items-center lg:gap-3"
              >
                <div className="min-w-0">
                  <Link
                    to={`/admin/propostes/${proposal.id}`}
                    className="font-semibold text-ink hover:text-brand-800 hover:underline"
                  >
                    {proposal.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {proposal.reference}
                    {proposal.proposerName ? ` · ${proposal.proposerName}` : ''}
                  </p>
                </div>
                <div className="text-xs text-slate-600">
                  <p className="font-medium">
                    {categories.find((category) => category.id === proposal.categoryId)?.name ??
                      proposal.categoryId}
                  </p>
                  <p className="mt-0.5">{BENEFITS[proposal.benefitType].short}</p>
                </div>
                <div>
                  <ProposalStatusBadge status={proposal.status} />
                </div>
                <div className="text-xs text-slate-500">{formatDateTime(proposal.createdAt)}</div>
                <div className="lg:text-right">
                  <Link
                    to={`/admin/propostes/${proposal.id}`}
                    className={buttonClasses('outline', 'sm')}
                  >
                    Revisa
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-4 text-xs leading-relaxed text-slate-500">
        Estats disponibles: {Object.values(PROPOSAL_STATUSES).map((status) => status.label).join(', ')}.
        Les propostes rebutjades o fusionades alliberen el bloqueig de duplicats perquè es pugui
        tornar a proposar l’eina si cal.
      </p>
    </div>
  )
}
