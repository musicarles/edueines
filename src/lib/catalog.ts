import { BENEFITS, LEVELS, PUBLIC_TOOL_STATUSES, REVIEW_MONTHS, REVIEW_WARNING_DAYS } from './constants'
import type {
  BenefitType,
  Category,
  EducationLevel,
  Tool,
  ToolStatus,
} from './types'
import { addMonths, daysBetween, normalizeText } from './utils'

export type SortKey = 'az' | 'nous' | 'popular'
export type ReviewFilter = 'totes' | 'verificades' | 'pendents'
export type VerificationState = 'ok' | 'due-soon' | 'overdue' | 'never'

export interface CatalogFilters {
  q: string
  categories: string[]
  benefits: BenefitType[]
  levels: EducationLevel[]
  review: ReviewFilter
  sort: SortKey
}

export const EMPTY_FILTERS: CatalogFilters = {
  q: '',
  categories: [],
  benefits: [],
  levels: [],
  review: 'totes',
  sort: 'az',
}

export const SORT_LABELS: Record<SortKey, string> = {
  az: 'Ordre alfabètic',
  nous: 'Més recents',
  popular: 'Més populars',
}

const collator = new Intl.Collator('ca', { sensitivity: 'base' })

export function isPublicTool(tool: Tool): boolean {
  return (
    PUBLIC_TOOL_STATUSES.includes(tool.status) &&
    !tool.mergedIntoId &&
    Boolean(tool.name)
  )
}

export function toolReviewDue(tool: Tool): string | null {
  if (tool.nextReviewAt) return tool.nextReviewAt
  if (tool.lastVerifiedAt) return addMonths(tool.lastVerifiedAt, REVIEW_MONTHS)
  return null
}

export function verificationState(tool: Tool, now: Date = new Date()): VerificationState {
  if (!tool.lastVerifiedAt) return 'never'
  const due = toolReviewDue(tool)
  if (!due) return 'never'
  const dueDate = new Date(due)
  if (Number.isNaN(dueDate.getTime())) return 'never'
  if (dueDate.getTime() < now.getTime()) return 'overdue'
  if (daysBetween(now, dueDate) <= REVIEW_WARNING_DAYS) return 'due-soon'
  return 'ok'
}

export function isVerifiedFresh(tool: Tool, now: Date = new Date()): boolean {
  const state = verificationState(tool, now)
  return state === 'ok' || state === 'due-soon'
}

export function isReviewOverdue(tool: Tool, now: Date = new Date()): boolean {
  return verificationState(tool, now) === 'overdue'
}

export function canPublish(tool: Tool, now: Date = new Date()): boolean {
  return Boolean(tool.lastVerifiedAt) && isVerifiedFresh(tool, now)
}

export function reviewLabel(tool: Tool, now: Date = new Date()): string {
  const state = verificationState(tool, now)
  if (state === 'never') return 'Sense verificar'
  if (state === 'overdue') return 'Revisió vençuda'
  if (state === 'due-soon') return 'Revisió propera'
  return 'Revisió al dia'
}

function searchBlob(tool: Tool, categories: Category[]): string {
  const category = categories.find((item) => item.id === tool.categoryId)
  const levels = tool.levels
    .map((level) => LEVELS.find((item) => item.value === level)?.label ?? level)
    .join(' ')
  return normalizeText(
    [
      tool.name,
      tool.shortDescription,
      tool.fullDescription,
      tool.educationalUses,
      tool.accessConditions,
      category?.name ?? '',
      BENEFITS[tool.benefitType]?.label ?? '',
      levels,
    ].join(' '),
  )
}

export function filterTools(
  tools: Tool[],
  filters: CatalogFilters,
  categories: Category[],
  now: Date = new Date(),
): Tool[] {
  const query = normalizeText(filters.q)
  const onlyPublic = tools.filter(isPublicTool)

  const filtered = onlyPublic.filter((tool) => {
    if (query && !searchBlob(tool, categories).includes(query)) return false
    if (filters.categories.length > 0 && !filters.categories.includes(tool.categoryId)) {
      return false
    }
    if (filters.benefits.length > 0 && !filters.benefits.includes(tool.benefitType)) {
      return false
    }
    if (
      filters.levels.length > 0 &&
      !tool.levels.some((level) => filters.levels.includes(level))
    ) {
      return false
    }
    if (filters.review === 'verificades' && !isVerifiedFresh(tool, now)) return false
    if (filters.review === 'pendents' && isVerifiedFresh(tool, now)) return false
    return true
  })

  return sortTools(filtered, filters.sort)
}

export function sortTools(tools: Tool[], sort: SortKey): Tool[] {
  const copy = [...tools]
  if (sort === 'popular') {
    return copy.sort(
      (a, b) => b.popularity - a.popularity || collator.compare(a.name, b.name),
    )
  }
  if (sort === 'nous') {
    return copy.sort((a, b) => {
      const aDate = a.publishedAt ?? a.createdAt
      const bDate = b.publishedAt ?? b.createdAt
      return bDate.localeCompare(aDate) || collator.compare(a.name, b.name)
    })
  }
  return copy.sort((a, b) => collator.compare(a.name, b.name))
}

export function parseCatalogFilters(params: URLSearchParams): CatalogFilters {
  const categories = (params.get('categoria') ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  const benefits = (params.get('avantatge') ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter((value): value is BenefitType => value in BENEFITS)
  const levels = (params.get('nivell') ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter((value): value is EducationLevel =>
      LEVELS.some((level) => level.value === value),
    )
  const reviewParam = params.get('estat')
  const review: ReviewFilter =
    reviewParam === 'verificades' || reviewParam === 'pendents' ? reviewParam : 'totes'
  const sortParam = params.get('ordre')
  const sort: SortKey =
    sortParam === 'nous' || sortParam === 'popular' ? sortParam : 'az'

  return {
    q: params.get('q') ?? '',
    categories,
    benefits,
    levels,
    review,
    sort,
  }
}

export function filtersToParams(filters: CatalogFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.q.trim()) params.set('q', filters.q.trim())
  if (filters.categories.length) params.set('categoria', filters.categories.join(','))
  if (filters.benefits.length) params.set('avantatge', filters.benefits.join(','))
  if (filters.levels.length) params.set('nivell', filters.levels.join(','))
  if (filters.review !== 'totes') params.set('estat', filters.review)
  if (filters.sort !== 'az') params.set('ordre', filters.sort)
  return params
}

export function countActiveFilters(filters: CatalogFilters): number {
  return (
    filters.categories.length +
    filters.benefits.length +
    filters.levels.length +
    (filters.review !== 'totes' ? 1 : 0) +
    (filters.q.trim() ? 1 : 0)
  )
}

export function computeStats(tools: Tool[], categories: Category[], now: Date = new Date()) {
  const visible = tools.filter(isPublicTool)
  const verified = visible.filter((tool) => isVerifiedFresh(tool, now))
  const pending = tools.filter(
    (tool) =>
      tool.status === 'pendent' ||
      tool.status === 'cal_actualitzar' ||
      isReviewOverdue(tool, now),
  )
  const usedCategories = new Set(visible.map((tool) => tool.categoryId))
  const activeCategories = categories.filter((category) => category.active)
  const availableCategories = activeCategories.filter((category) =>
    usedCategories.has(category.id),
  )

  return {
    total: visible.length,
    verified: verified.length,
    pending: pending.length,
    categories: activeCategories.length,
    usedCategories: availableCategories.length,
    visible,
  }
}

export function toPublicSlug(name: string, slug: string): string {
  return slug || normalizeText(name).replace(/\s+/g, '-')
}

export const TOOL_STATUS_ORDER: ToolStatus[] = [
  'pendent',
  'verificada',
  'publicada',
  'cal_actualitzar',
  'no_vigent',
]
