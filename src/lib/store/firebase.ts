import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
} from '../firebase'
import { getDb } from '../firebase'
import type { CollectionName } from '../types'
import type { Store } from './types'
import { nowIso } from '../utils'

export const firebaseStore: Store = {
  mode: 'firebase',

  async getAll<T>(collectionName: CollectionName): Promise<T[]> {
    const snapshot = await getDocs(collection(getDb(), collectionName))
    return snapshot.docs.map((item) => ({ ...(item.data() as T), id: item.id }))
  },

  async get<T>(collectionName: CollectionName, id: string): Promise<T | null> {
    const snapshot = await getDoc(doc(getDb(), collectionName, id))
    if (!snapshot.exists()) return null
    return { ...(snapshot.data() as T), id: snapshot.id }
  },

  async put<T>(collectionName: CollectionName, id: string, data: T): Promise<void> {
    await setDoc(doc(getDb(), collectionName, id), { ...(data as object), id })
  },

  async patch<T>(
    collectionName: CollectionName,
    id: string,
    data: Partial<T>,
  ): Promise<void> {
    await updateDoc(doc(getDb(), collectionName, id), data as Record<string, unknown>)
  },

  async remove(collectionName: CollectionName, id: string): Promise<void> {
    await deleteDoc(doc(getDb(), collectionName, id))
  },

  async reserveKeys(keys: string[], owner: string): Promise<string[]> {
    const unique = [...new Set(keys)]
    const taken: string[] = []
    for (const key of unique) {
      const snapshot = await getDoc(doc(getDb(), 'locks', key))
      if (snapshot.exists()) taken.push(key)
    }
    if (taken.length > 0) return taken

    try {
      const batch = writeBatch(getDb())
      for (const key of unique) {
        batch.set(doc(getDb(), 'locks', key), {
          id: key,
          owner,
          createdAt: nowIso(),
        })
      }
      await batch.commit()
      return []
    } catch {
      const retaken: string[] = []
      for (const key of unique) {
        const snapshot = await getDoc(doc(getDb(), 'locks', key))
        if (snapshot.exists()) retaken.push(key)
      }
      return retaken.length > 0 ? retaken : unique
    }
  },

  async releaseKeys(keys: string[]): Promise<void> {
    const batch = writeBatch(getDb())
    for (const key of [...new Set(keys)]) {
      batch.delete(doc(getDb(), 'locks', key))
    }
    await batch.commit()
  },
}
