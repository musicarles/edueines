import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, Filter, Layers3, Plus, Search, SlidersHorizontal, X } from 'lucide-react'
import { useData } from '../lib/data-context'
import { BENEFITS, LEVELS } from '../lib/constants'
import {
  countActiveFilters,
  EMPTY_FILTERS,
  filterTools,
  filtersToParams,
  parseCatalogFilters,
  SORT_LABELS,
  type CatalogFilters as Filters,
  type SortKey,
} from '../lib/catalog'
import { cn } from '../lib/utils'
import { buttonClasses } from '../components/ui/Button'
import { LoadingBlock, EmptyState } from '../components/ui/Feedback'
import { CatalogFilters } from '../components/CatalogFilters'
import { ToolCard } from '../components/ToolCard'

export default function CatalogPage() {
  const { tools, categories, loading, error } = useData()
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => parseCatalogFilters(searchParams), [searchParams])
  const [searchValue, setSearchValue] = useState(filters.q)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  useEffect(() => {
    setSearchValue(filters.q)
  }, [filters.q])

  const results = useMemo(
    () => filterTools(tools, filters, categories),
    [tools, filters, categories],
  )

  function applyFilters(next: Filters) {
    setSearchParams(filtersToParams(next), { replace: true })
  }

  function patchFilters(patch: Partial<Filters>) {
    applyFilters({ ...filters, ...patch })
  }

  function clearFilters() {
    setSearchValue('')
    applyFilters(EMPTY_FILTERS)
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    patchFilters({ q: searchValue })
  }

  const activeCount = countActiveFilters(filters)
  const chips: Array<{ key: string; label: string; onRemove: () => void }> = []

  if (filters.q.trim()) {
    chips.push({
      key: 'q',
      label: `«${filters.q.trim()}»`,
      onRemove: () => {
        setSearchValue('')
        patchFilters({ q: '' })
      },
    })
  }
  for (const categoryId of filters.categories) {
    const category = categories.find((item) => item.id === categoryId)
    if (!category) continue
    chips.push({
      key: `cat-${categoryId}`,
      label: category.name,
      onRemove: () =>
        patchFilters({
          categories: filters.categories.filter((item) => item !== categoryId),
        }),
    })
  }
  for (const benefitKey of filters.benefits) {
    chips.push({
      key: `ben-${benefitKey}`,
      label: BENEFITS[benefitKey].short,
      onRemove: () =>
        patchFilters({
          benefits: filters.benefits.filter((item) => item !== benefitKey),
        }),
    })
  }
  for (const level of filters.levels) {
    const info = LEVELS.find((item) => item.value === level)
    if (!info) continue
    chips.push({
      key: `lvl-${level}`,
      label: info.short,
      onRemove: () =>
        patchFilters({ levels: filters.levels.filter((item) => item !== level) }),
    })
  }
  if (filters.review !== 'totes') {
    chips.push({
      key: 'review',
      label: filters.review === 'verificades' ? 'Verificació vigent' : 'Cal revisar',
      onRemove: () => patchFilters({ review: 'totes' }),
    })
  }

  const filterPanel = (
    <CatalogFilters
      filters={filters}
      categories={categories}
      onChange={patchFilters}
      onClear={clearFilters}
    />
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <nav aria-label="Fil d’Ariadna" className="text-sm text-slate-500">
        <Link to="/" className="hover:text-brand-800 hover:underline">
          Inici
        </Link>{' '}
        <span aria-hidden="true">/</span>{' '}
        <span className="font-medium text-slate-700">Catàleg</span>
      </nav>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Catàleg d’eines
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
            Filtra per categoria, tipus d’avantatge, nivell educatiu i estat de verificació.
            Només mostrem fitxes publicades.
          </p>
        </div>
        <Link to="/proposa" className={buttonClasses('primary', 'md')}>
          <Plus className="size-4" aria-hidden="true" />
          Proposa una eina
        </Link>
      </div>

      <form
        role="search"
        onSubmit={handleSearch}
        className="mt-6 flex flex-col gap-2 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <label htmlFor="cerca-cataleg" className="sr-only">
            Cerca eines
          </label>
          <input
            id="cerca-cataleg"
            type="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Cerca per nom, descripció, categoria o utilitat…"
            className="min-h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-sm text-ink shadow-sm placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
          />
        </div>
        <button type="submit" className={buttonClasses('secondary', 'md', 'sm:px-6')}>
          Cerca
        </button>
        <label htmlFor="ordre-cataleg" className="sr-only">
          Ordena els resultats
        </label>
        <select
          id="ordre-cataleg"
          value={filters.sort}
          onChange={(event) => patchFilters({ sort: event.target.value as SortKey })}
          className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-ink shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
        >
          {Object.entries(SORT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setMobileFiltersOpen((value) => !value)}
          aria-expanded={mobileFiltersOpen}
          aria-controls="filtres-mobil"
          className={buttonClasses('outline', 'md', 'lg:hidden')}
        >
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          Filtres
          {activeCount > 0 ? (
            <span className="ml-1 rounded-full bg-brand-700 px-1.5 py-0.5 text-[11px] font-bold text-white">
              {activeCount}
            </span>
          ) : null}
        </button>
      </form>

      {mobileFiltersOpen ? (
        <div
          id="filtres-mobil"
          className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:hidden"
        >
          {filterPanel}
        </div>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[17rem_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {filterPanel}
          </div>
        </aside>

        <section aria-labelledby="resultats" className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="resultats" className="font-display text-lg font-bold text-ink">
              {loading
                ? 'Carregant eines…'
                : `${results.length} ${results.length === 1 ? 'eina' : 'eines'}`}
            </h2>
            {activeCount > 0 ? (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-brand-800 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
              >
                <X className="size-3.5" aria-hidden="true" />
                Neteja tots els filtres
              </button>
            ) : null}
          </div>

          {chips.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Filtres actius">
              {chips.map((chip) => (
                <li key={chip.key}>
                  <button
                    type="button"
                    onClick={chip.onRemove}
                    className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-900 transition hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                    aria-label={`Treu el filtre ${chip.label}`}
                  >
                    {chip.label}
                    <X className="size-3" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {error ? (
            <p
              role="alert"
              className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
            >
              {error}
            </p>
          ) : null}

          {loading ? (
            <LoadingBlock label="Carregant el catàleg…" />
          ) : results.length === 0 ? (
            <EmptyState
              className="mt-5"
              icon={<Search className="size-5" />}
              title="No hi ha cap eina amb aquests filtres"
              description="Prova de treure algun filtre o cerca un altre terme. Si l’eina que busques no hi és, pots proposar-la."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className={buttonClasses('outline', 'md')}
                  >
                    <Filter className="size-4" aria-hidden="true" />
                    Neteja els filtres
                  </button>
                  <Link to="/proposa" className={buttonClasses('primary', 'md')}>
                    <Plus className="size-4" aria-hidden="true" />
                    Proposa una eina
                  </Link>
                </div>
              }
            />
          ) : (
            <>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((tool) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    category={categories.find((category) => category.id === tool.categoryId)}
                  />
                ))}
              </div>

              <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
                <p className="inline-flex items-center gap-2 font-semibold text-ink">
                  <Layers3 className="size-4 text-brand-700" aria-hidden="true" />
                  No trobes el que busques?
                </p>
                <p className="mt-1 leading-relaxed">
                  El catàleg creix amb les aportacions del professorat. Proposa una eina i
                  l’equip administrador en verificarà les condicions abans de publicar-la.
                </p>
                <Link
                  to="/proposa"
                  className="mt-3 inline-flex items-center gap-1.5 font-semibold text-brand-800 hover:underline"
                >
                  Proposa una eina
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
