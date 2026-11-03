import { contrastText, cn, initials } from '../lib/utils'

const sizes = {
  sm: 'size-9 rounded-xl text-xs',
  md: 'size-12 rounded-2xl text-sm',
  lg: 'size-16 rounded-2xl text-lg',
  xl: 'size-20 rounded-3xl text-2xl',
}

export function ToolMonogram({
  name,
  color,
  size = 'md',
  className,
}: {
  name: string
  color?: string
  size?: keyof typeof sizes
  className?: string
}) {
  const background = color || '#0f766e'
  return (
    <span
      aria-hidden="true"
      style={{ backgroundColor: background, color: contrastText(background) }}
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-display font-extrabold tracking-tight shadow-sm ring-1 ring-inset ring-black/10',
        sizes[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}
