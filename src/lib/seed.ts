import { CATEGORIES } from './constants'
import { SEED_TOOLS, SEED_VERIFICATION_ACTOR } from './seed-data'
import { getStore } from './store'
import type { HistoryEntry, Tool, Verification } from './types'
import { makeId, nowIso } from './utils'

export interface SeedActor {
  uid: string
  name: string
}

export async function writeInitialCatalog(actor: SeedActor): Promise<void> {
  const store = await getStore()

  for (const category of CATEGORIES) {
    await store.put('categories', category.id, category)
  }

  for (const tool of SEED_TOOLS) {
    await store.put('tools', tool.id, tool)
  }

  for (const tool of SEED_TOOLS) {
    if (!tool.lastVerifiedAt || !tool.nextReviewAt) continue
    const verificationId = makeId('ver')
    const verification: Verification = {
      id: verificationId,
      toolId: tool.id,
      toolName: tool.name,
      verifiedAt: tool.lastVerifiedAt,
      nextReviewAt: tool.nextReviewAt,
      source: tool.officialSource,
      notes: tool.verificationNotes,
      adminUid: actor.uid,
      adminName: actor.name,
      createdAt: tool.lastVerifiedAt,
    }
    await store.put('verifications', verificationId, verification)
  }

  const historyId = makeId('hist')
  const entry: HistoryEntry = {
    id: historyId,
    entityType: 'sistema',
    entityId: 'cataleg',
    entityName: 'Catàleg',
    action: 'import',
    summary: `Importació inicial de ${SEED_TOOLS.length} eines i ${CATEGORIES.length} categories.`,
    actorUid: actor.uid,
    actorName: actor.name,
    createdAt: nowIso(),
    changes: [],
  }
  await store.put('history', historyId, entry)
}

/**
 * En React StrictMode l'efecte de càrrega s'executa dues vegades. Sense aquesta
 * guarda, les dues execucions podrien veure el catàleg buit i escriure la
 * importació inicial (i les verificacions) per duplicat.
 */
let seedPromise: Promise<void> | null = null

async function runLocalSeed(): Promise<void> {
  const store = await getStore()
  if (store.mode !== 'local') return

  const marker = await store.get<{ id: string }>('meta', 'seed')
  if (marker) return

  const existing = await store.getAll<Tool>('tools')
  if (existing.length === 0) {
    await writeInitialCatalog(SEED_VERIFICATION_ACTOR)
  }
  await store.put('meta', 'seed', { id: 'seed', createdAt: nowIso() })
}

/**
 * Local mode: seeds the browser database the first time the app is opened.
 */
export function seedLocalData(): Promise<void> {
  if (!seedPromise) {
    seedPromise = runLocalSeed().catch((error) => {
      // Permet tornar-ho a provar si la primera càrrega falla.
      seedPromise = null
      throw error
    })
  }
  return seedPromise
}

/**
 * Firebase mode: an administrator can load the initial catalog explicitly.
 */
export async function seedCatalogManually(actor: SeedActor): Promise<number> {
  const store = await getStore()
  const existing = await store.getAll<Tool>('tools')
  if (existing.length > 0) {
    throw new Error('El catàleg ja conté eines. No s’ha carregat res.')
  }
  await writeInitialCatalog(actor)
  return SEED_TOOLS.length
}

export async function resetLocalCatalog(actor: SeedActor): Promise<void> {
  const store = await getStore()
  if (store.mode !== 'local') {
    throw new Error('Aquesta acció només està disponible en mode local.')
  }
  const collections = [
    'tools',
    'categories',
    'proposals',
    'verifications',
    'history',
    'reports',
    'locks',
  ] as const
  for (const collection of collections) {
    const items = await store.getAll<{ id: string }>(collection)
    for (const item of items) {
      await store.remove(collection, item.id)
    }
  }
  await store.remove('meta', 'seed')
  await writeInitialCatalog(actor)
  await store.put('meta', 'seed', { id: 'seed', createdAt: nowIso() })
}
