import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  Layers3,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Wand2,
} from 'lucide-react'
import { useData } from '../lib/data-context'
import { BENEFITS, BENEFIT_KEYS, LEVELS } from '../lib/constants'
import { computeStats, isPublicTool } from '../lib/catalog'
import { formatDate } from '../lib/utils'
import { buttonClasses } from '../components/ui/Button'
import { LoadingBlock } from '../components/ui/Feedback'
import { ToolCard } from '../components/ToolCard'
import { CategoryIcon, BenefitIcon } from '../components/icons'
import { EmptyState } from '../components/ui/Feedback'

export default function HomePage() {
  const { tools, categories, loading, error } = useData()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const stats = useMemo(() => computeStats(tools, categories), [tools, categories])
  const visibleTools = useMemo(() => tools.filter(isPublicTool), [tools])
  const featured = useMemo(
    () =>
      visibleTools
        .filter((tool) => tool.featured)
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 3),
    [visibleTools],
  )
  const latest = useMemo(
    () =>
      [...visibleTools]
        .sort((a, b) => {
          const aDate = a.publishedAt ?? a.createdAt
          const bDate = b.publishedAt ?? b.createdAt
          return bDate.localeCompare(aDate)
        })
        .slice(0, 6),
    [visibleTools],
  )
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const tool of visibleTools) {
      counts.set(tool.categoryId, (counts.get(tool.categoryId) ?? 0) + 1)
    }
    return counts
  }, [visibleTools])

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = query.trim()
    navigate(trimmed ? `/cataleg?q=${encodeURIComponent(trimmed)}` : '/cataleg')
  }

  return (
    <>
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-brand-50/70 via-cream to-cream">
        <div
          className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-brand-200/40 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-28 left-1/3 size-72 rounded-full bg-amber-100/50 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3 py-1 text-xs font-semibold text-brand-800 shadow-sm">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              Catàleg revisat per l’equip Edueines
            </p>
            <h1 className="mt-5 text-balance text-4xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Troba eines digitals amb{' '}
              <span className="text-brand-700">avantatges per al professorat</span>
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-slate-600 sm:text-lg">
              Un catàleg col·laboratiu on cada fitxa explica què ofereix l’eina, com hi pots
              accedir i quines condicions cal complir. Cap dada es publica sense verificació.
            </p>

            <form
              onSubmit={handleSearch}
              role="search"
              className="mt-8 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg shadow-brand-900/5 sm:flex-row sm:items-center"
            >
              <div className="flex flex-1 items-center gap-2 px-3">
                <Search className="size-5 shrink-0 text-slate-400" aria-hidden="true" />
                <label htmlFor="cerca-principal" className="sr-only">
                  Cerca eines per nom, categoria o avantatge
                </label>
                <input
                  id="cerca-principal"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Cerca per nom, categoria o avantatge…"
                  className="min-h-11 w-full bg-transparent text-sm text-ink placeholder:text-slate-400 focus:outline-none"
                />
              </div>
              <button type="submit" className={buttonClasses('primary', 'lg', 'sm:px-6')}>
                <Search className="size-4" aria-hidden="true" />
                Cerca eines
              </button>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <BadgeCheck className="size-4 text-emerald-600" aria-hidden="true" />
                {stats.verified} eines amb verificació vigent
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Layers3 className="size-4 text-brand-700" aria-hidden="true" />
                {stats.usedCategories} categories amb contingut
              </span>
              <Link
                to="/cataleg"
                className="inline-flex items-center gap-1 font-semibold text-brand-800 hover:underline"
              >
                Veure tot el catàleg
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="xifres" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 id="xifres" className="sr-only">
          Xifres del catàleg
        </h2>
        <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {[
            {
              label: 'Eines publicades',
              value: stats.total,
              icon: Layers3,
              tone: 'text-brand-700 bg-brand-50',
            },
            {
              label: 'Verificació vigent',
              value: stats.verified,
              icon: BadgeCheck,
              tone: 'text-emerald-700 bg-emerald-50',
            },
            {
              label: 'Pendents de revisar',
              value: stats.pending,
              icon: CalendarClock,
              tone: 'text-amber-700 bg-amber-50',
            },
            {
              label: 'Categories actives',
              value: stats.categories,
              icon: Sparkles,
              tone: 'text-sky-700 bg-sky-50',
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {item.label}
                </dt>
                <span
                  className={`flex size-9 items-center justify-center rounded-xl ${item.tone}`}
                >
                  <item.icon className="size-4.5" aria-hidden="true" />
                </span>
              </div>
              <dd className="mt-3 font-display text-3xl font-extrabold text-ink">
                {loading ? '—' : item.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {error ? (
        <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <p
            role="alert"
            className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
          >
            {error}
          </p>
        </div>
      ) : null}

      {loading ? (
        <LoadingBlock label="Carregant el catàleg…" />
      ) : (
        <>
          {featured.length > 0 ? (
            <section
              aria-labelledby="destacades"
              className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
            >
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-brand-700">
                    Selecció de l’equip
                  </p>
                  <h2 id="destacades" className="mt-1 font-display text-2xl font-extrabold text-ink">
                    Eines destacades
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Fitxes verificades recentment i especialment útils per començar.
                  </p>
                </div>
                <Link
                  to="/cataleg?ordre=popular"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-800 hover:underline"
                >
                  Més populars
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((tool) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    category={categories.find((category) => category.id === tool.categoryId)}
                  />
                ))}
              </div>
            </section>
          ) : null}

          <section
            aria-labelledby="categories"
            className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-brand-700">
                  Explora per temàtica
                </p>
                <h2 id="categories" className="mt-1 font-display text-2xl font-extrabold text-ink">
                  Categories
                </h2>
              </div>
              <Link
                to="/cataleg"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-800 hover:underline"
              >
                Totes les eines
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {categories.filter((category) => category.active).map((category) => {
                const count = categoryCounts.get(category.id) ?? 0
                return (
                  <Link
                    key={category.id}
                    to={`/cataleg?categoria=${category.id}`}
                    className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                  >
                    <span
                      className="flex size-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${category.color}1a`, color: category.color }}
                    >
                      <CategoryIcon name={category.icon} />
                    </span>
                    <span className="font-display text-sm font-bold leading-snug text-ink">
                      {category.name}
                    </span>
                    <span className="mt-auto text-xs font-medium text-slate-500">
                      {count} {count === 1 ? 'eina' : 'eines'}
                    </span>
                  </Link>
                )
              })}
            </div>
          </section>

          <section
            aria-labelledby="novetats"
            className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-brand-700">
                  Acabades d’afegir
                </p>
                <h2 id="novetats" className="mt-1 font-display text-2xl font-extrabold text-ink">
                  Últimes eines
                </h2>
              </div>
              <Link
                to="/cataleg?ordre=nous"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-800 hover:underline"
              >
                Veure les novetats
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            {latest.length === 0 ? (
              <EmptyState
                className="mt-6"
                icon={<Layers3 className="size-5" />}
                title="Encara no hi ha eines publicades"
                description="Pots proposar la primera eina del catàleg. L’equip administrador la revisarà abans de publicar-la."
                action={
                  <Link to="/proposa" className={buttonClasses('primary', 'md')}>
                    <Plus className="size-4" aria-hidden="true" />
                    Proposa una eina
                  </Link>
                }
              />
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {latest.map((tool) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    category={categories.find((category) => category.id === tool.categoryId)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <section
        aria-labelledby="avantatges"
        className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
      >
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-700">
              Què hi trobaràs
            </p>
            <h2 id="avantatges" className="mt-1 font-display text-2xl font-extrabold text-ink">
              Cinc tipus d’avantatge, explicats sense ambigüitats
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Cada fitxa indica quin avantatge ofereix l’eina i quines condicions cal complir.
              No totes les eines són gratuïtes: també hi ha plans limitats i descomptes.
            </p>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFIT_KEYS.map((key) => {
              const benefit = BENEFITS[key]
              return (
                <Link
                  key={key}
                  to={`/cataleg?avantatge=${key}`}
                  className="group rounded-2xl border border-slate-200 bg-cream/60 p-4 transition hover:border-brand-300 hover:bg-brand-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                >
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${benefit.badge}`}
                  >
                    <BenefitIcon name={benefit.icon} className="size-3.5" />
                    {benefit.short}
                  </span>
                  <h3 className="mt-3 font-display text-sm font-bold text-ink">
                    {benefit.label}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    {benefit.description}
                  </p>
                </Link>
              )
            })}
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">
                <Wand2 className="size-3.5" aria-hidden="true" />
                Criteri Edueines
              </span>
              <h3 className="mt-3 font-display text-sm font-bold text-ink">
                Sempre amb data de revisió
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Cada fitxa mostra quan es va verificar i quan toca tornar-la a revisar. Si la
                revisió venç, ho indiquem clarament al catàleg.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 font-display text-lg font-bold text-ink">Cap publicació automàtica</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Tota proposta passa per revisió, verificació i aprovació. Si no es pot confirmar la
              informació, la fitxa no es publica.
            </p>
            <Link
              to="/com-funciona"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-800 hover:underline"
            >
              Com funciona el procés
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <span className="flex size-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
              <BookOpenCheck className="size-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 font-display text-lg font-bold text-ink">
              Pensat per al dia a dia
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Descripció, utilitats educatives, condicions d’accés, passos de registre, nivells i
              font oficial: tot a la mateixa fitxa.
            </p>
            <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500">
              <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />
              {LEVELS.length} nivells educatius coberts
            </p>
          </div>

          <div className="rounded-2xl border border-brand-200 bg-brand-800 p-6 text-white shadow-sm">
            <span className="flex size-10 items-center justify-center rounded-xl bg-white/15">
              <Plus className="size-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 font-display text-lg font-bold text-white">
              Coneixes una eina que hi falta?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-brand-50">
              Proposa-la sense crear cap compte. Només cal el nom, l’enllaç oficial i una
              explicació de la seva utilitat educativa.
            </p>
            <Link
              to="/proposa"
              className={buttonClasses('outline', 'md', 'mt-4 border-white/30 bg-white text-brand-900 hover:bg-brand-50')}
            >
              Proposa una eina
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <p className="mt-8 text-center text-xs leading-relaxed text-slate-500">
          Darrera importació de dades:{' '}
          {formatDate(
            visibleTools
              .map((tool) => tool.updatedAt)
              .sort()
              .at(-1) ?? null,
          )}{' '}
          · Les condicions de cada eina es poden consultar sempre a la font oficial enllaçada.
        </p>
      </section>
    </>
  )
}
