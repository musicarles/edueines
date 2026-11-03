import type { CollectionName } from '../types'
import type { Store } from './types'
import { nowIso } from '../utils'

const DB_NAME = 'edueines'
const DB_VERSION = 1

const COLLECTIONS: CollectionName[] = [
  'tools',
  'categories',
  'proposals',
  'admins',
  'users',
  'verifications',
  'history',
  'reports',
  'invites',
  'locks',
  'credentials',
  'meta',
]

let databasePromise: Promise<IDBDatabase> | null = null

function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise
  databasePromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(
        new Error(
          'Aquest navegador no permet desar dades locals. Prova un navegador actualitzat o activa el mode Firebase.',
        ),
      )
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const database = request.result
      for (const collection of COLLECTIONS) {
        if (!database.objectStoreNames.contains(collection)) {
          database.createObjectStore(collection, { keyPath: 'id' })
        }
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(request.error ?? new Error('No s’ha pogut obrir la base de dades local.'))
    request.onblocked = () =>
      reject(new Error('La base de dades local està bloquejada per una altra pestanya.'))
  })
  return databasePromise
}

function requestToPromise<T>(
  collection: CollectionName,
  mode: IDBTransactionMode,
  build: (store: IDBObjectStore) => IDBRequest,
): Promise<T> {
  return openDatabase().then(
    (database) =>
      new Promise<T>((resolve, reject) => {
        const transaction = database.transaction(collection, mode)
        const store = transaction.objectStore(collection)
        const request = build(store)
        let result: T
        request.onsuccess = () => {
          result = request.result as T
        }
        request.onerror = () =>
          reject(request.error ?? new Error('Error en la base de dades local.'))
        transaction.oncomplete = () => resolve(result)
        transaction.onerror = () =>
          reject(transaction.error ?? new Error('Error en la base de dades local.'))
        transaction.onabort = () =>
          reject(transaction.error ?? new Error('Operació cancel·lada.'))
      }),
  )
}

export const localStore: Store = {
  mode: 'local',

  async getAll<T>(collection: CollectionName): Promise<T[]> {
    const result = await requestToPromise<T[]>(collection, 'readonly', (store) =>
      store.getAll(),
    )
    return result ?? []
  },

  async get<T>(collection: CollectionName, id: string): Promise<T | null> {
    const result = await requestToPromise<T | undefined>(collection, 'readonly', (store) =>
      store.get(id),
    )
    return result ?? null
  },

  async put<T>(collection: CollectionName, id: string, data: T): Promise<void> {
    await requestToPromise<IDBValidKey>(collection, 'readwrite', (store) =>
      store.put({ ...(data as object), id }),
    )
  },

  async patch<T>(collection: CollectionName, id: string, data: Partial<T>): Promise<void> {
    const current = await this.get<T>(collection, id)
    if (!current) {
      throw new Error('El registre que vols modificar ja no existeix.')
    }
    await this.put<T>(collection, id, { ...current, ...data })
  },

  async remove(collection: CollectionName, id: string): Promise<void> {
    await requestToPromise<undefined>(collection, 'readwrite', (store) =>
      store.delete(id),
    )
  },

  async reserveKeys(keys: string[], owner: string): Promise<string[]> {
    const unique = [...new Set(keys)]
    const taken: string[] = []
    for (const key of unique) {
      const existing = await this.get<{ id: string }>('locks', key)
      if (existing) taken.push(key)
    }
    if (taken.length > 0) return taken
    for (const key of unique) {
      await this.put('locks', key, {
        id: key,
        owner,
        createdAt: nowIso(),
      })
    }
    return []
  },

  async releaseKeys(keys: string[]): Promise<void> {
    for (const key of [...new Set(keys)]) {
      await this.remove('locks', key)
    }
  },
}
