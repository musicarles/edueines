import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Flag,
  Inbox,
  Plus,
  Wrench,
} from 'lucide-react'
import { useAuth } from '../../lib/auth/AuthProvider'
import { useData } from '../../lib/data-context'
import { useCollections } from '../../lib/use-collection'
import { can } from '../../lib/permissions'
import { isPublicTool, isReviewOverdue, verificationState } from '../../lib/catalog'
import { BENEFITS, PROPOSAL_STATUSES, ROLES, TOOL_STATUSES } from '../../lib/constants'
import type { ChangeReport, HistoryEntry, Proposal, Tool } from '../../lib/types'
import { cn, formatDate, formatDateTime } from '../../lib/utils'
import { AdminCard, AdminPageHeader, StatCard } from '../../components/admin/AdminUI'
import { LoadingBlock } from '../../components/ui/Feedback'
import { buttonClasses } from '../../components/ui/Button'
import { ProposalStatusBadge, ToolStatusBadge } from '../../components/StatusBadge'
import { ToolMonogram } from '../../components/ToolMonogram'

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const { categories } = useData()
  const [data, loading, error] = useCollections([
    'tools',
    'proposals',
    'reports',
    'history',
  ])

  const tools = (data.tools ?? []) as Tool[]
  const proposals = (data.proposals ?? []) as Proposal[]
  const reports = (data.reports ?? []) as ChangeReport[]
  const history = (data.history ?? []) as HistoryEntry[]

  const published = tools.filter(isPublicTool)
  const verified = published.filter((tool) => verificationState(tool) === 'ok')
  const needsReview = tools
    .filter(
      (tool) =>
        tool.status === 'pendent' ||
        tool.status === 'cal_actualitzar' ||
        isReviewOverdue(tool) ||
        (tool.status !== 'no_vigent' && !tool.lastVerifiedAt),
    )
    .sort((a, b) => {
      const aDate = a.nextReviewAt ?? a.lastVerifiedAt ?? ''
      const bDate = b.nextReviewAt ?? b.lastVerifiedAt ?? ''
      return aDate.localeCompare(bDate)
    })
  const pendingProposals = proposals
    .filter((proposal) => proposal.status === 'pendent' || proposal.status === 'en_revisio')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const openReports = reports
    .filter((report) => report.status === 'nou')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const recentHistory = [...history]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6)

  const categoryName = useMemo(() => {
    const map = new Map(categories.map((category) => [category.id, category.name]))
    return (id: string) => map.get(id) ?? id
  }, [categories])

  const readOnly = !can(user?.role, 'tools.edit')

  return (
    <div>
      <AdminPageHeader
        title={`Hola, ${user?.displayName?.split(' ')[0] ?? 'equip'}`}
        description={`Aquest és l’estat del catàleg a ${formatDate(new Date().toISOString())}. Des d’aquí pots continuar el circuit de revisió i mantenir les fitxes al dia.`}
        actions={
          can(user?.role, 'proposals.view') ? (
            <Link to="/admin/propostes" className={buttonClasses('primary', 'md')}>
              <Inbox className="size-4" aria-hidden="true" />
              Revisa les propostes
              {pendingProposals.length > 0 ? (
                <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[11px] font-bold">
                  {pendingProposals.length}
                </span>
              ) : null}
            </Link>
          ) : undefined
        }
      />

      {readOnly ? (
        <p className="mb-5 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
          El teu rol és de consulta: pots veure dades i historial, però no modificar fitxes ni
          propostes.
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      {loading ? (
        <LoadingBlock label="Carregant el tauler…" />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <StatCard
              label="Eines publicades"
              value={published.length}
              hint={`${verified.length} amb verificació vigent`}
              icon={<Wrench className="size-4" aria-hidden="true" />}
              tone="brand"
              to="/admin/eines"
            />
            <StatCard
              label="Propostes pendents"
              value={pendingProposals.length}
              hint="Per revisar o en revisió"
              icon={<Inbox className="size-4" aria-hidden="true" />}
              tone="amber"
              to="/admin/propostes"
            />
            <StatCard
              label="Fitxes a revisar"
              value={needsReview.length}
              hint="Verificació vençuda o incompleta"
              icon={<CalendarClock className="size-4" aria-hidden="true" />}
              tone="rose"
              to="/admin/eines?estat=cal_actualitzar"
            />
            <StatCard
              label="Avisos oberts"
              value={openReports.length}
              hint="Canvis comunicats per la comunitat"
              icon={<Flag className="size-4" aria-hidden="true" />}
              tone="sky"
              to="/admin/avisos"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <AdminCard
              title="Propostes que demanen atenció"
              description="Les propostes no es publiquen fins que algú en verifica les condicions."
              action={
                <Link
                  to="/admin/propostes"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-800 hover:underline"
                >
                  Totes
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              }
            >
              {pendingProposals.length === 0 ? (
                <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  No hi ha cap proposta pendent. Bona feina!
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {pendingProposals.slice(0, 5).map((proposal) => (
                    <li key={proposal.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <Link
                          to={`/admin/propostes/${proposal.id}`}
                          className="font-semibold text-ink hover:text-brand-800 hover:underline"
                        >
                          {proposal.name}
                        </Link>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {categoryName(proposal.categoryId)} · {BENEFITS[proposal.benefitType].short} ·{' '}
                          {formatDateTime(proposal.createdAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <ProposalStatusBadge status={proposal.status} />
                        <span className="text-[11px] font-medium text-slate-400">
                          {proposal.reference}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </AdminCard>

            <AdminCard
              title="Fitxes que cal revisar"
              description="Revisió vençuda, sense verificar o marcada com a cal actualitzar."
              action={
                <Link
                  to="/admin/eines"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-800 hover:underline"
                >
                  Gestió
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              }
            >
              {needsReview.length === 0 ? (
                <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
                  <BadgeCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  Totes les fitxes tenen la verificació al dia.
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {needsReview.slice(0, 5).map((tool) => (
                    <li key={tool.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <ToolMonogram name={tool.name} color={tool.color} size="sm" />
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/admin/eines/${tool.id}`}
                          className="block truncate font-semibold text-ink hover:text-brand-800 hover:underline"
                        >
                          {tool.name}
                        </Link>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                          <Clock3 className="size-3" aria-hidden="true" />
                          {tool.lastVerifiedAt
                            ? `Verificada el ${formatDate(tool.lastVerifiedAt)}`
                            : 'Sense cap verificació'}
                        </p>
                      </div>
                      <ToolStatusBadge status={tool.status} className="shrink-0" />
                    </li>
                  ))}
                </ul>
              )}
            </AdminCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <AdminCard
              title="Avisos de canvi recents"
              description="Missatges enviats des de les fitxes públiques."
              action={
                can(user?.role, 'reports.manage') ? (
                  <Link
                    to="/admin/avisos"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-800 hover:underline"
                  >
                    Gestiona
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                ) : undefined
              }
            >
              {openReports.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                  No hi ha cap avís obert.
                </p>
              ) : (
                <ul className="space-y-3">
                  {openReports.slice(0, 4).map((report) => (
                    <li key={report.id} className="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
                      <p className="text-sm font-semibold text-ink">{report.toolName}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">
                        {report.message}
                      </p>
                      <p className="mt-1.5 text-[11px] font-medium text-slate-500">
                        {formatDateTime(report.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </AdminCard>

            <AdminCard
              title="Activitat recent"
              description="Cada canvi queda registrat amb la persona que l’ha fet."
              action={
                can(user?.role, 'history.view') ? (
                  <Link
                    to="/admin/historial"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-800 hover:underline"
                  >
                    Historial
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                ) : undefined
              }
            >
              {recentHistory.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                  Encara no hi ha activitat registrada.
                </p>
              ) : (
                <ul className="space-y-3">
                  {recentHistory.map((entry) => (
                    <li key={entry.id} className="flex items-start gap-2.5">
                      <span
                        className={cn(
                          'mt-1 size-2 shrink-0 rounded-full',
                          entry.action.includes('rebutjada')
                            ? 'bg-rose-500'
                            : entry.action.includes('publicada') || entry.action.includes('aprovada')
                              ? 'bg-emerald-500'
                              : 'bg-brand-500',
                        )}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink">{entry.summary}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {entry.actorName} · {formatDateTime(entry.createdAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </AdminCard>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                to: '/admin/propostes',
                label: 'Revisar propostes',
                icon: ClipboardList,
                permission: 'proposals.view' as const,
              },
              {
                to: '/admin/eines',
                label: 'Gestionar eines',
                icon: Wrench,
                permission: 'tools.view' as const,
              },
              {
                to: '/admin/avisos',
                label: 'Atendre avisos',
                icon: Flag,
                permission: 'reports.manage' as const,
              },
              {
                to: '/proposa',
                label: 'Provar el formulari públic',
                icon: Plus,
                permission: 'tools.view' as const,
              },
            ]
              .filter((action) => can(user?.role, action.permission))
              .map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-ink shadow-sm transition hover:border-brand-300 hover:shadow-md"
                >
                  <span className="flex size-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <action.icon className="size-4.5" aria-hidden="true" />
                  </span>
                  {action.label}
                  <ArrowRight className="ml-auto size-4 text-slate-400" aria-hidden="true" />
                </Link>
              ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {Object.entries(TOOL_STATUSES).map(([key, info]) => {
              const count = tools.filter((tool) => tool.status === key).length
              return (
                <div key={key} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-700">{info.label}</span>
                    <span className="font-display text-lg font-bold text-ink">{count}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {user ? (
            <p className="text-xs text-slate-500">
              Sessió iniciada com a {ROLES[user.role].label}. {ROLES[user.role].description}
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}
