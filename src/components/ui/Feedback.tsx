import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-14 text-center',
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          {icon}
        </div>
      ) : null}
      <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}

export function LoadingBlock({ label = 'Carregant…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500" role="status">
      <span className="size-7 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  )
}

export function LoadingScreen() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4" role="status">
      <span className="size-9 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700" />
      <p className="text-sm font-medium text-slate-500">Carregant Edueines…</p>
    </div>
  )
}
