import { Link } from 'react-router-dom'
import { ArrowRight, CalendarCheck, Clock3 } from 'lucide-react'
import { BENEFITS, LEVELS } from '../lib/constants'
import { isReviewOverdue, verificationState } from '../lib/catalog'
import type { Category, Tool } from '../lib/types'
import { cn, formatDate } from '../lib/utils'
import { ToolMonogram } from './ToolMonogram'
import { ToolStatusBadge } from './StatusBadge'
import { BenefitIcon } from './icons'

export function ToolCard({
  tool,
  category,
  className,
}: {
  tool: Tool
  category?: Category
  className?: string
}) {
  const benefit = BENEFITS[tool.benefitType]
  const visibleLevels = tool.levels.slice(0, 3)
  const remaining = tool.levels.length - visibleLevels.length
  const overdue = isReviewOverdue(tool)
  const state = verificationState(tool)

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <ToolMonogram name={tool.name} color={tool.color} />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-bold leading-snug text-ink">
            {tool.name}
          </h3>
          <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
            {category?.name ?? 'Sense categoria'}
          </p>
        </div>
        <ToolStatusBadge status={tool.status} className="shrink-0" />
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600">
        {tool.shortDescription}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset',
            benefit.badge,
          )}
        >
          <BenefitIcon name={benefit.icon} className="size-3.5" />
          {benefit.short}
        </span>
        {visibleLevels.map((level) => (
          <span
            key={level}
            className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600"
          >
            {LEVELS.find((item) => item.value === level)?.short ?? level}
          </span>
        ))}
        {remaining > 0 ? (
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
            +{remaining}
          </span>
        ) : null}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          {overdue || state === 'never' ? (
            <Clock3 className="size-3.5 text-orange-600" aria-hidden="true" />
          ) : (
            <CalendarCheck className="size-3.5 text-emerald-600" aria-hidden="true" />
          )}
          {tool.lastVerifiedAt ? (
            <span className={cn(overdue && 'font-medium text-orange-700')}>
              Revisió: {formatDate(tool.lastVerifiedAt)}
            </span>
          ) : (
            <span className="font-medium text-amber-700">Sense verificar</span>
          )}
        </span>
        <span className="inline-flex items-center gap-1 font-semibold text-brand-700 transition-all group-hover:gap-2">
          Veure fitxa
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </span>
      </div>

      <Link
        to={`/eines/${tool.slug}`}
        className="absolute inset-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
        aria-label={`Veure la fitxa de ${tool.name}`}
      />
    </article>
  )
}
