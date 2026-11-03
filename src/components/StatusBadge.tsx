import { Badge } from './ui/Badge'
import { PROPOSAL_STATUSES, TOOL_STATUSES } from '../lib/constants'
import type { ProposalStatus, ToolStatus } from '../lib/types'
import { cn } from '../lib/utils'

export function ToolStatusBadge({
  status,
  className,
}: {
  status: ToolStatus
  className?: string
}) {
  const info = TOOL_STATUSES[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        info.badge,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', info.dot)} aria-hidden="true" />
      {info.label}
    </span>
  )
}

export function ProposalStatusBadge({
  status,
  className,
}: {
  status: ProposalStatus
  className?: string
}) {
  const info = PROPOSAL_STATUSES[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        info.badge,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', info.dot)} aria-hidden="true" />
      {info.label}
    </span>
  )
}

export function BenefitBadge({ label, className }: { label: string; className?: string }) {
  return (
    <Badge tone="brand" className={className}>
      {label}
    </Badge>
  )
}
