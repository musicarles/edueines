import type { CollectionName, DataMode } from '../types'

export interface Store {
  readonly mode: DataMode
  getAll<T>(collection: CollectionName): Promise<T[]>
  get<T>(collection: CollectionName, id: string): Promise<T | null>
  put<T>(collection: CollectionName, id: string, data: T): Promise<void>
  patch<T>(collection: CollectionName, id: string, data: Partial<T>): Promise<void>
  remove(collection: CollectionName, id: string): Promise<void>
  /**
   * Reserves unique keys for duplicate prevention. Returns the keys that were
   * already taken by someone else.
   */
  reserveKeys(keys: string[], owner: string): Promise<string[]>
  releaseKeys(keys: string[]): Promise<void>
}
