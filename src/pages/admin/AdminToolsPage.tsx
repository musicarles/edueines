import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Archive,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Eye,
  EyeOff,
  Plus,
  Search,
  Wrench,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../lib/auth/AuthProvider'
import { useCollection } from '../../lib/use-collection'
import { useData } from '../../lib/data-context'
import { can } from '../../lib/permissions'
import { canPublish, isReviewOverdue, isPublicTool, verificationState } from '../../lib/catalog'
import { BENEFITS, TOOL_STATUSES } from '../../lib/constants'
import type { Tool, ToolStatus } from '../../lib/types'
import { formatDate } from '../../lib/utils'
import { AdminPageHeader } from '../../components/admin/AdminUI'
import { LoadingBlock, EmptyState } from '../../components/ui/Feedback'
import { ToolStatusBadge } from '../../components/StatusBadge'
import { ToolMonogram } from '../../components/ToolMonogram'
import { Button, buttonClasses } from '../../components/ui/Button'
import { publishTool, unpublishTool } from '../../lib/workflow'
import { cn } from '../../lib/utils'

type StatusFilter = 'totes' | ToolStatus

export default function AdminToolsPage() {
  const { user } = useAuth()
  const { categories } = useData()
  const [searchParams] = useSearchParams()
  const initialStatus = (searchParams.get('estat') ?? 'totes') as StatusFilter
  const { items, loading, error, refresh } = useCollection<Tool>('tools', (a, b) =>
    a.name.localeCompare(b.name, 'ca'),
  )
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>(
    initialStatus in TOOL_STATUSES ? initialStatus : 'totes',
  )
  const [categoryFilter, setCategoryFilter] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return items.filter((tool) => {
      if (status !== 'totes' && tool.status !== status) return false
      if (categoryFilter && tool.categoryId !== categoryFilter) return false
      if (!needle) return true
      return `${tool.name} ${tool.domain} ${tool.shortDescription}`.toLowerCase().includes(needle)
    })
  }, [items, status, categoryFilter, query])

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const tool of items) map.set(tool.status, (map.get(tool.status) ?? 0) + 1)
    return map
  }, [items])

  const actor = user ? { uid: user.uid, name: user.displayName } : null

  async function handlePublish(tool: Tool) {
    if (!actor) return
    setBusyId(tool.id)
    try {
      await publishTool(tool, actor)
      await refresh()
      toast.success(`«${tool.name}» s’ha publicat.`)
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No s’ha pogut publicar.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleUnpublish(tool: Tool) {
    if (!actor) return
    setBusyId(tool.id)
    try {
      await unpublishTool(tool, actor)
      await refresh()
      toast.success(`«${tool.name}» s’ha retirat del catàleg públic.`)
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No s’ha pogut retirar.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Eines"
        description="Gestiona totes les fitxes del catàleg, incloses les que no són visibles al públic. Des d’aquí pots editar, verificar, publicar, retirar o arxivar eines."
        actions={
          can(user?.role, 'tools.edit') ? (
            <Link to="/admin/eines/nova" className={buttonClasses('primary', 'md')}>
              <Plus className="size-4" aria-hidden="true" />
              Nova eina
            </Link>
          ) : undefined
        }
      />

      {error ? (
        <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <label htmlFor="cerca-eines" className="sr-only">
            Cerca eines
          </label>
          <input
            id="cerca-eines"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cerca per nom, domini o descripció…"
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-ink shadow-sm placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
          />
        </div>
        <label className="sr-only" htmlFor="filtre-estat">
          Filtra per estat
        </label>
        <select
          id="filtre-estat"
          value={status}
          onChange={(event) => setStatus(event.target.value as StatusFilter)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-ink shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
        >
          <option value="totes">Tots els estats ({items.length})</option>
          {Object.entries(TOOL_STATUSES).map(([key, info]) => (
            <option key={key} value={key}>
              {info.label} ({counts.get(key) ?? 0})
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="filtre-categoria">
          Filtra per categoria
        </label>
        <select
          id="filtre-categoria"
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-ink shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
        >
          <option value="">Totes les categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingBlock label="Carregant les eines…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Wrench className="size-5" />}
          title="No hi ha eines amb aquests filtres"
          description="Prova de canviar la cerca o l’estat. També pots crear una fitxa manualment."
          action={
            can(user?.role, 'tools.edit') ? (
              <Link to="/admin/eines/nova" className={buttonClasses('primary', 'md')}>
                <Plus className="size-4" aria-hidden="true" />
                Nova eina
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[1.7fr_1fr_0.9fr_1fr_auto] gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 lg:grid">
            <span>Eina</span>
            <span>Categoria i avantatge</span>
            <span>Verificació</span>
            <span>Estat</span>
            <span className="text-right">Accions</span>
          </div>
          <ul className="divide-y divide-slate-100">
            {filtered.map((tool) => {
              const state = verificationState(tool)
              return (
                <li
                  key={tool.id}
                  className="grid gap-3 px-5 py-4 transition hover:bg-slate-50/70 lg:grid-cols-[1.7fr_1fr_0.9fr_1fr_auto] lg:items-center"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <ToolMonogram name={tool.name} color={tool.color} size="sm" />
                    <div className="min-w-0">
                      <Link
                        to={`/admin/eines/${tool.id}`}
                        className="block truncate font-semibold text-ink hover:text-brand-800 hover:underline"
                      >
                        {tool.name}
                      </Link>
                      <p className="truncate text-xs text-slate-500">{tool.domain}</p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-600">
                    <p className="font-medium">
                      {categories.find((category) => category.id === tool.categoryId)?.name ??
                        tool.categoryId}
                    </p>
                    <p className="mt-0.5">{BENEFITS[tool.benefitType].short}</p>
                  </div>
                  <div className="text-xs">
                    <p
                      className={cn(
                        'inline-flex items-center gap-1 font-medium',
                        state === 'overdue' || state === 'never' ? 'text-orange-700' : 'text-slate-600',
                      )}
                    >
                      <CalendarClock className="size-3.5" aria-hidden="true" />
                      {tool.lastVerifiedAt ? formatDate(tool.lastVerifiedAt) : 'Sense verificar'}
                    </p>
                    <p className="mt-0.5 text-slate-400">
                      {tool.nextReviewAt ? `Revisió: ${formatDate(tool.nextReviewAt)}` : 'Sense data'}
                    </p>
                  </div>
                  <div>
                    <ToolStatusBadge status={tool.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 lg:justify-end">
                    {isPublicTool(tool) ? (
                      <Link
                        to={`/eines/${tool.slug}`}
                        className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-ink"
                        aria-label={`Veure la fitxa pública de ${tool.name}`}
                        title="Veure la fitxa pública"
                      >
                        <Eye className="size-4" aria-hidden="true" />
                      </Link>
                    ) : null}
                    {tool.status === 'verificada' && can(user?.role, 'tools.publish') ? (
                      <Button
                        size="sm"
                        variant="soft"
                        disabled={busyId === tool.id || !canPublish(tool)}
                        onClick={() => handlePublish(tool)}
                        title={
                          canPublish(tool)
                            ? 'Publica la fitxa'
                            : 'Cal una verificació de menys de sis mesos'
                        }
                      >
                        <CheckCircle2 className="size-3.5" aria-hidden="true" />
                        Publica
                      </Button>
                    ) : null}
                    {isPublicTool(tool) && can(user?.role, 'tools.publish') ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busyId === tool.id}
                        onClick={() => handleUnpublish(tool)}
                        title="Retira la fitxa del catàleg públic"
                      >
                        <EyeOff className="size-3.5" aria-hidden="true" />
                        Retira
                      </Button>
                    ) : null}
                    {tool.status === 'no_vigent' ? (
                      <Link
                        to={`/admin/eines/${tool.id}`}
                        className={buttonClasses('outline', 'sm')}
                      >
                        <Archive className="size-3.5" aria-hidden="true" />
                        Arxivada
                      </Link>
                    ) : null}
                    <Link
                      to={`/admin/eines/${tool.id}`}
                      className={buttonClasses('outline', 'sm')}
                    >
                      Edita
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                  {isReviewOverdue(tool) ? (
                    <p className="rounded-lg bg-orange-50 px-2 py-1 text-[11px] font-medium text-orange-800 lg:col-span-5">
                      La verificació ha vençut. La fitxa continua visible però marcada com a «Cal
                      actualitzar».
                    </p>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <p className="mt-4 text-xs leading-relaxed text-slate-500">
        Les fitxes amb estat «Pendent de revisió» i «No vigent» no apareixen al catàleg públic.
        «Verificada» vol dir que les dades estan comprovades però encara no s’han publicat.
      </p>
    </div>
  )
}
