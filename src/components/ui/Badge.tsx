import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export function Badge({
  children,
  className,
  tone = 'slate',
}: {
  children: ReactNode
  className?: string
  tone?: 'slate' | 'brand' | 'amber' | 'rose' | 'sky'
}) {
  const tones: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-700 ring-slate-200',
    brand: 'bg-brand-50 text-brand-800 ring-brand-200',
    amber: 'bg-amber-50 text-amber-800 ring-amber-200',
    rose: 'bg-rose-50 text-rose-800 ring-rose-200',
    sky: 'bg-sky-50 text-sky-800 ring-sky-200',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
