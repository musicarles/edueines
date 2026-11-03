import {
  BadgeCheck,
  BookOpen,
  Clapperboard,
  ClipboardCheck,
  Crown,
  Gamepad2,
  Gift,
  LayoutDashboard,
  ListChecks,
  Palette,
  PenTool,
  Percent,
  Presentation,
  Shapes,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '../lib/utils'

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  palette: Palette,
  presentation: Presentation,
  gamepad: Gamepad2,
  'clipboard-check': ClipboardCheck,
  'pen-tool': PenTool,
  'check-square': ListChecks,
  users: Users,
  clapperboard: Clapperboard,
  'layout-dashboard': LayoutDashboard,
  'book-open': BookOpen,
  shapes: Shapes,
}

const BENEFIT_ICONS: Record<string, LucideIcon> = {
  crown: Crown,
  'badge-check': BadgeCheck,
  gift: Gift,
  percent: Percent,
  sparkle: Sparkles,
}

export function CategoryIcon({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const Icon = CATEGORY_ICONS[name] ?? Shapes
  return <Icon className={cn('size-5', className)} aria-hidden="true" />
}

export function BenefitIcon({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const Icon = BENEFIT_ICONS[name] ?? Sparkles
  return <Icon className={cn('size-4', className)} aria-hidden="true" />
}

export { CATEGORY_ICONS, BENEFIT_ICONS }
