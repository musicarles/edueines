import { IS_FIREBASE } from '../env'
import type { Store } from './types'

let storePromise: Promise<Store> | null = null

export function getStore(): Promise<Store> {
  if (!storePromise) {
    storePromise = IS_FIREBASE
      ? import('./firebase').then((module) => module.firebaseStore)
      : import('./local').then((module) => module.localStore)
  }
  return storePromise
}
