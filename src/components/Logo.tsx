import { Link } from 'react-router-dom'
import { cn } from '../lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn('size-9', className)}
      role="img"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="edueines-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#14b8a6" />
          <stop offset="1" stopColor="#0f766e" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#edueines-logo)" />
      <path
        d="M16 20.5c4.6-1.6 8.5-1.4 12 1.1v24c-3.5-2.5-7.4-2.7-12-1.1v-24Z"
        fill="#fff"
        opacity=".95"
      />
      <path
        d="M48 20.5c-4.6-1.6-8.5-1.4-12 1.1v24c3.5-2.5 7.4-2.7 12-1.1v-24Z"
        fill="#fff"
        opacity=".8"
      />
      <path d="M32 21.6v24" stroke="#0f766e" strokeWidth="2.4" strokeLinecap="round" />
      <path
        d="M44 12.5l1.6 3.4 3.4 1.6-3.4 1.6L44 22.5l-1.6-3.4L39 17.5l3.4-1.6L44 12.5Z"
        fill="#fde68a"
      />
    </svg>
  )
}

export function Logo({
  className,
  markClassName,
  textClassName,
}: {
  className?: string
  markClassName?: string
  textClassName?: string
}) {
  return (
    <Link
      to="/"
      className={cn(
        'inline-flex items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2',
        className,
      )}
      aria-label="Edueines, torna a l'inici"
    >
      <LogoMark className={markClassName} />
      <span
        className={cn(
          'font-display text-xl font-extrabold tracking-tight text-ink',
          textClassName,
        )}
      >
        Edueines
      </span>
    </Link>
  )
}
