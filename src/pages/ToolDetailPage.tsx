import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  CircleHelp,
  ExternalLink,
  GraduationCap,
  Info,
  MailCheck,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'
import { useData } from '../lib/data-context'
import { useAuth } from '../lib/auth/AuthProvider'
import { BENEFITS, LEVELS, TOOL_STATUSES } from '../lib/constants'
import {
  isPublicTool,
  isReviewOverdue,
  reviewLabel,
  toolReviewDue,
  verificationState,
} from '../lib/catalog'
import { formatDate, cn } from '../lib/utils'
import { buttonClasses } from '../components/ui/Button'
import { LoadingBlock, EmptyState } from '../components/ui/Feedback'
import { ToolMonogram } from '../components/ToolMonogram'
import { ToolStatusBadge } from '../components/StatusBadge'
import { BenefitIcon, CategoryIcon } from '../components/icons'
import { ShareButton } from '../components/ShareButton'
import { ReportChangeModal } from '../components/ReportChangeModal'
import { ToolCard } from '../components/ToolCard'

function LevelList({ levels }: { levels: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {levels.map((level) => (
        <li
          key={level}
          className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
        >
          {LEVELS.find((item) => item.value === level)?.label ?? level}
        </li>
      ))}
    </ul>
  )
}

export default function ToolDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { tools, categories, loading, error } = useData()
  const { user } = useAuth()
  const [reportOpen, setReportOpen] = useState(false)

  const tool = useMemo(
    () => tools.find((item) => item.slug === slug || item.id === slug),
    [tools, slug],
  )
  const category = categories.find((item) => item.id === tool?.categoryId)
  const publicVisible = tool ? isPublicTool(tool) : false
  const canPreview = Boolean(user)
  const overdue = tool ? isReviewOverdue(tool) : false
  const state = tool ? verificationState(tool) : 'never'
  const due = tool ? toolReviewDue(tool) : null

  useEffect(() => {
    if (!tool) return
    const previous = document.title
    document.title = `${tool.name} · Edueines`
    return () => {
      document.title = previous
    }
  }, [tool])

  const related = useMemo(() => {
    if (!tool) return []
    return tools
      .filter(
        (item) =>
          item.id !== tool.id &&
          isPublicTool(item) &&
          (item.categoryId === tool.categoryId ||
            item.levels.some((level) => tool.levels.includes(level))),
      )
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 3)
  }, [tools, tool])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <LoadingBlock label="Carregant la fitxa…" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
        >
          {error}
        </p>
      </div>
    )
  }

  if (!tool || (!publicVisible && !canPreview)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={<CircleHelp className="size-5" />}
          title="Aquesta fitxa no està disponible"
          description="Pot ser que l’eina no estigui publicada, que s’hagi arxivat o que l’enllaç sigui incorrecte. Consulta el catàleg per trobar eines verificades."
          action={
            <Link to="/cataleg" className={buttonClasses('primary', 'md')}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Torna al catàleg
            </Link>
          }
        />
      </div>
    )
  }

  const benefit = BENEFITS[tool.benefitType]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <nav aria-label="Fil d’Ariadna" className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
        <Link to="/" className="hover:text-brand-800 hover:underline">
          Inici
        </Link>
        <span aria-hidden="true">/</span>
        <Link to="/cataleg" className="hover:text-brand-800 hover:underline">
          Catàleg
        </Link>
        {category ? (
          <>
            <span aria-hidden="true">/</span>
            <Link
              to={`/cataleg?categoria=${category.id}`}
              className="hover:text-brand-800 hover:underline"
            >
              {category.name}
            </Link>
          </>
        ) : null}
        <span aria-hidden="true">/</span>
        <span className="font-medium text-slate-700">{tool.name}</span>
      </nav>

      {!publicVisible ? (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">Vista prèvia d’administració</p>
            <p className="mt-0.5 leading-relaxed">
              Aquesta fitxa té l’estat «{TOOL_STATUSES[tool.status].label}» i no és visible per al
              públic. La pots revisar aquí abans de publicar-la.{' '}
              <Link to={`/admin/eines/${tool.id}`} className="font-semibold underline">
                Obre l’editor
              </Link>
              .
            </p>
          </div>
        </div>
      ) : null}

      <header className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <ToolMonogram name={tool.name} color={tool.color} size="xl" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <ToolStatusBadge status={tool.status} />
                {tool.featured ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">
                    <BadgeCheck className="size-3.5" aria-hidden="true" />
                    Destacada
                  </span>
                ) : null}
              </div>
              <h1 className="mt-2 text-balance font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                {tool.name}
              </h1>
              {category ? (
                <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-slate-600">
                  <CategoryIcon name={category.icon} className="size-4" />
                  {category.name}
                </p>
              ) : null}
              <p className="mt-3 max-w-2xl text-pretty text-base leading-relaxed text-slate-600">
                {tool.shortDescription}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:w-52">
            <a
              href={tool.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses('primary', 'lg', 'w-full')}
            >
              Accedeix a l’eina
              <ExternalLink className="size-4" aria-hidden="true" />
            </a>
            <div className="grid grid-cols-2 gap-2">
              <ShareButton
                title={`${tool.name} · Edueines`}
                text={tool.shortDescription}
                url={window.location.href}
                variant="outline"
                className="w-full"
              />
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className={buttonClasses('outline', 'md', 'w-full')}
              >
                <AlertTriangle className="size-4" aria-hidden="true" />
                Ha canviat
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-100 pt-4 text-sm">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 font-semibold',
              state === 'ok' && 'text-emerald-700',
              state === 'due-soon' && 'text-amber-700',
              state === 'overdue' && 'text-orange-700',
              state === 'never' && 'text-slate-600',
            )}
          >
            {state === 'ok' ? (
              <ShieldCheck className="size-4" aria-hidden="true" />
            ) : state === 'never' ? (
              <CircleHelp className="size-4" aria-hidden="true" />
            ) : (
              <CalendarClock className="size-4" aria-hidden="true" />
            )}
            {reviewLabel(tool)}
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <CalendarCheck className="size-4 text-slate-400" aria-hidden="true" />
            Darrera verificació: {formatDate(tool.lastVerifiedAt)}
          </span>
          {due ? (
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              <CalendarClock className="size-4 text-slate-400" aria-hidden="true" />
              Propera revisió: {formatDate(due)}
            </span>
          ) : null}
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          {overdue ? (
            <div className="flex items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
              <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-semibold">Aquesta fitxa necessita una revisió</p>
                <p className="mt-0.5 leading-relaxed">
                  La darrera verificació supera el període recomanat de sis mesos. Les condicions
                  poden haver canviat: consulta sempre la font oficial abans de contractar res.
                </p>
              </div>
            </div>
          ) : null}

          <section
            aria-labelledby="descripcio"
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 id="descripcio" className="font-display text-xl font-bold text-ink">
              Què és i per a què serveix
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">
              {tool.fullDescription}
            </p>

            <h3 className="mt-6 font-display text-base font-bold text-ink">
              Utilitats educatives
            </h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
              {tool.educationalUses}
            </p>
          </section>

          <section
            aria-labelledby="avantatge"
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 id="avantatge" className="font-display text-xl font-bold text-ink">
              Llicència i avantatge
            </h2>
            <div className="mt-3 rounded-xl border border-slate-200 bg-cream/60 p-4">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
                  benefit.badge,
                )}
              >
                <BenefitIcon name={benefit.icon} className="size-3.5" />
                {benefit.label}
              </span>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                {benefit.description}
              </p>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <h3 className="flex items-center gap-1.5 font-display text-sm font-bold text-ink">
                  <ScrollText className="size-4 text-brand-700" aria-hidden="true" />
                  Condicions d’accés
                </h3>
                <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                  {tool.accessConditions}
                </p>
              </div>
              <div>
                <h3 className="flex items-center gap-1.5 font-display text-sm font-bold text-ink">
                  <Info className="size-4 text-brand-700" aria-hidden="true" />
                  Com s’hi accedeix
                </h3>
                <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                  {tool.accessMethod}
                </p>
              </div>
            </div>

            <h3 className="mt-5 font-display text-sm font-bold text-ink">
              Passos per registrar-s’hi
            </h3>
            <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-600">
              {tool.signupInstructions}
            </p>
          </section>

          <section
            aria-labelledby="verificacio"
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 id="verificacio" className="font-display text-xl font-bold text-ink">
              Verificació de la informació
            </h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Estat
                </dt>
                <dd className="mt-1">
                  <ToolStatusBadge status={tool.status} />
                </dd>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Darrera verificació
                </dt>
                <dd className="mt-1 text-sm font-semibold text-ink">
                  {formatDate(tool.lastVerifiedAt)}
                </dd>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Propera revisió
                </dt>
                <dd className="mt-1 text-sm font-semibold text-ink">{formatDate(due)}</dd>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Font oficial
                </dt>
                <dd className="mt-1 text-sm">
                  <a
                    href={tool.officialSource}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-brand-800 hover:underline"
                  >
                    Consulta la font
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                  </a>
                </dd>
              </div>
            </dl>
            {tool.verificationNotes ? (
              <div className="mt-4 rounded-xl border border-slate-200 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Notes de verificació
                </p>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                  {tool.verificationNotes}
                </p>
              </div>
            ) : null}
            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              Edueines revisa periòdicament les condicions, però no té cap vincle comercial amb
              les eines del catàleg. La font oficial sempre té prioritat.
            </p>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-display text-base font-bold text-ink">Dades ràpides</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Categoria
                </dt>
                <dd className="mt-1 flex items-center gap-1.5 font-medium text-ink">
                  {category ? (
                    <>
                      <CategoryIcon name={category.icon} className="size-4 text-brand-700" />
                      {category.name}
                    </>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Nivells educatius
                </dt>
                <dd className="mt-1.5">
                  <LevelList levels={tool.levels} />
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Correu institucional
                </dt>
                <dd className="mt-1 flex items-center gap-1.5 text-slate-700">
                  {tool.requiresInstitutionalEmail === true ? (
                    <>
                      <MailCheck className="size-4 text-emerald-600" aria-hidden="true" />
                      Necessari
                    </>
                  ) : tool.requiresInstitutionalEmail === false ? (
                    <>
                      <CheckCircle2 className="size-4 text-slate-400" aria-hidden="true" />
                      No cal
                    </>
                  ) : (
                    <>
                      <CircleHelp className="size-4 text-amber-600" aria-hidden="true" />
                      No confirmat
                    </>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Verificació docent
                </dt>
                <dd className="mt-1 flex items-center gap-1.5 text-slate-700">
                  {tool.requiresTeacherVerification === true ? (
                    <>
                      <UserCheck className="size-4 text-emerald-600" aria-hidden="true" />
                      Necessària
                    </>
                  ) : tool.requiresTeacherVerification === false ? (
                    <>
                      <GraduationCap className="size-4 text-slate-400" aria-hidden="true" />
                      No cal
                    </>
                  ) : (
                    <>
                      <CircleHelp className="size-4 text-amber-600" aria-hidden="true" />
                      No confirmat
                    </>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Enllaç oficial
                </dt>
                <dd className="mt-1">
                  <a
                    href={tool.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 break-all font-medium text-brand-800 hover:underline"
                  >
                    {tool.domain}
                    <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
                  </a>
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-brand-200 bg-brand-50/70 p-5">
            <h2 className="font-display text-base font-bold text-ink">Coneixes canvis?</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
              Si les condicions han canviat o l’enllaç ja no funciona, avisa’ns. Ho revisarem
              abans de modificar la fitxa.
            </p>
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className={buttonClasses('outline', 'md', 'mt-3 w-full')}
            >
              <AlertTriangle className="size-4" aria-hidden="true" />
              Avisa d’un canvi
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
            <h2 className="font-display text-base font-bold text-ink">Com verifiquem</h2>
            <p className="mt-1.5 leading-relaxed">
              Consultem la pàgina oficial, comprovem les condicions i registrem la data. Cada sis
              mesos tornem a revisar la fitxa.
            </p>
            <Link
              to="/com-funciona"
              className="mt-3 inline-flex items-center gap-1.5 font-semibold text-brand-800 hover:underline"
            >
              Més informació
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </aside>
      </div>

      {related.length > 0 ? (
        <section aria-labelledby="relacionades" className="mt-10">
          <h2 id="relacionades" className="font-display text-2xl font-extrabold text-ink">
            Eines relacionades
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ToolCard
                key={item.id}
                tool={item}
                category={categories.find((categoryItem) => categoryItem.id === item.categoryId)}
              />
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-10">
        <Link
          to="/cataleg"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-800 hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Torna al catàleg
        </Link>
      </div>

      <ReportChangeModal tool={tool} open={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  )
}
