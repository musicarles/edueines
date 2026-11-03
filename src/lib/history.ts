import { getStore } from './store'
import type { HistoryEntry } from './types'
import { makeId, nowIso } from './utils'

interface Change {
  field: string
  from: string
  to: string
}

export async function addHistory(
  entry: Omit<HistoryEntry, 'id' | 'createdAt'> & { createdAt?: string },
): Promise<void> {
  const store = await getStore()
  const id = makeId('hist')
  const record: HistoryEntry = {
    ...entry,
    id,
    createdAt: entry.createdAt ?? nowIso(),
  }
  await store.put('history', id, record)
}

export function formatChangeValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : '—'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export function diffValues<T extends Record<string, unknown>>(
  before: T,
  after: Partial<T>,
  labels: Record<string, string>,
): Change[] {
  const changes: Change[] = []
  for (const [field, label] of Object.entries(labels)) {
    if (!(field in after)) continue
    const previous = formatChangeValue(before[field])
    const next = formatChangeValue(after[field])
    if (previous !== next) {
      changes.push({ field: label, from: previous, to: next })
    }
  }
  return changes
}

export function changesSummary(changes: Change[]): string {
  if (changes.length === 0) return 'Sense canvis de contingut.'
  return `S’han modificat ${changes.length} ${changes.length === 1 ? 'camp' : 'camps'}: ${changes
    .map((change) => change.field)
    .join(', ')}.`
}
