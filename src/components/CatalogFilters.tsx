import type { ReactNode } from 'react'
import { Check, RotateCcw } from 'lucide-react'
import { BENEFITS, BENEFIT_KEYS, LEVELS } from '../lib/constants'
import type { CatalogFilters as Filters, ReviewFilter } from '../lib/catalog'
import type { Category } from '../lib/types'
import { cn } from '../lib/utils'
import { BenefitIcon } from './icons'

function FilterButton({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600',
        active
          ? 'border-brand-600 bg-brand-50 font-semibold text-brand-900'
          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
        className,
      )}
    >
      <span
        className={cn(
          'flex size-4 shrink-0 items-center justify-center rounded border',
          active ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-300 bg-white',
        )}
        aria-hidden="true"
      >
        {active ? <Check className="size-3" strokeWidth={3} /> : null}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  )
}

export function CatalogFilters({
  filters,
  categories,
  onChange,
  onClear,
}: {
  filters: Filters
  categories: Category[]
  onChange: (patch: Partial<Filters>) => void
  onClear: () => void
}) {
  const toggle = <T extends string>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value]

  const reviewOptions: Array<{ value: ReviewFilter; label: string }> = [
    { value: 'totes', label: 'Totes les eines' },
    { value: 'verificades', label: 'Verificació vigent' },
    { value: 'pendents', label: 'Cal revisar' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-base font-bold text-ink">Filtres</h2>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-brand-800 transition hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          Neteja
        </button>
      </div>

      <fieldset>
        <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
          Categoria
        </legend>
        <div className="space-y-1.5">
          {categories
            .filter((category) => category.active)
            .map((category) => (
              <FilterButton
                key={category.id}
                active={filters.categories.includes(category.id)}
                onClick={() =>
                  onChange({ categories: toggle(filters.categories, category.id) })
                }
              >
                <span className="flex items-center gap-2">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: category.color }}
                    aria-hidden="true"
                  />
                  {category.name}
                </span>
              </FilterButton>
            ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
          Tipus d’avantatge
        </legend>
        <div className="space-y-1.5">
          {BENEFIT_KEYS.map((key) => {
            const benefit = BENEFITS[key]
            return (
              <FilterButton
                key={key}
                active={filters.benefits.includes(key)}
                onClick={() => onChange({ benefits: toggle(filters.benefits, key) })}
              >
                <span className="flex items-center gap-2">
                  <BenefitIcon name={benefit.icon} className="size-3.5 shrink-0" />
                  {benefit.short}
                </span>
              </FilterButton>
            )
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
          Nivell educatiu
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {LEVELS.map((level) => {
            const active = filters.levels.includes(level.value)
            return (
              <button
                key={level.value}
                type="button"
                aria-pressed={active}
                onClick={() => onChange({ levels: toggle(filters.levels, level.value) })}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600',
                  active
                    ? 'border-brand-600 bg-brand-700 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                )}
              >
                {level.short}
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
          Estat de verificació
        </legend>
        <div className="space-y-1.5">
          {reviewOptions.map((option) => (
            <label
              key={option.value}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition',
                filters.review === option.value
                  ? 'border-brand-600 bg-brand-50 font-semibold text-brand-900'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300',
              )}
            >
              <input
                type="radio"
                name="estat"
                value={option.value}
                checked={filters.review === option.value}
                onChange={() => onChange({ review: option.value })}
                className="size-4 accent-brand-700"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  )
}
