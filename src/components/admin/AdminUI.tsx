import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldAlert } from 'lucide-react'
import { cn } from '../../lib/utils'

export function AdminPageHeader({
  title,
  description,
  actions,
  backTo,
  backLabel,
}: {
  title: string
  description?: string
  actions?: ReactNode
  backTo?: string
  backLabel?: string
}) {
  return (
    <div className="mb-6">
      {backTo ? (
        <Link
          to={backTo}
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-brand-800"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {backLabel ?? 'Torna'}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-slate-600">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  )
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'brand',
  to,
}: {
  label: string
  value: string | number
  hint?: string
  icon?: ReactNode
  tone?: 'brand' | 'emerald' | 'amber' | 'rose' | 'sky' | 'slate'
  to?: string
}) {
  const tones: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
    sky: 'bg-sky-50 text-sky-700',
    slate: 'bg-slate-100 text-slate-600',
  }

  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        {icon ? (
          <span className={cn('flex size-9 items-center justify-center rounded-xl', tones[tone])}>
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-3 font-display text-3xl font-extrabold text-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs leading-relaxed text-slate-500">{hint}</p> : null}
    </>
  )

  if (to) {
    return (
      <Link
        to={to}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 sm:p-5"
      >
        {body}
      </Link>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">{body}</div>
  )
}

export function AdminCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn('rounded-2xl border border-slate-200 bg-white shadow-sm', className)}
    >
      {title ? (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-display text-base font-bold text-ink">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{description}</p>
            ) : null}
          </div>
          {action}
        </div>
      ) : null}
      <div className={title ? 'p-5' : 'p-5'}>{children}</div>
    </section>
  )
}

export function PermissionNote({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
      {children}
    </p>
  )
}

export function AdminAccessDenied({
  title = 'Accés restringit',
  description = 'El teu rol no permet obrir aquesta secció. Si necessites accés, demana’l a un superadministrador.',
}: {
  title?: string
  description?: string
}) {
  return (
    <div>
      <AdminPageHeader title={title} />
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-semibold">No tens permís per veure aquesta pàgina</p>
          <p className="mt-1 leading-relaxed">{description}</p>
          <Link
            to="/admin"
            className="mt-3 inline-flex items-center gap-1.5 font-semibold underline"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Torna al tauler
          </Link>
        </div>
      </div>
    </div>
  )
}
