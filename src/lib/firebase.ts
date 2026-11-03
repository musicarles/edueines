import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  setDoc,
  updateDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore'
import { FIREBASE_CONFIG, IS_FIREBASE_CONFIGURED } from './env'

let appInstance: FirebaseApp | null = null
let dbInstance: Firestore | null = null
let authInstance: Auth | null = null

function requireConfig() {
  if (!IS_FIREBASE_CONFIGURED) {
    throw new Error(
      'Falta la configuració de Firebase. Revisa les variables VITE_FIREBASE_* del fitxer .env.',
    )
  }
}

export function getFirebaseApp(): FirebaseApp {
  requireConfig()
  if (!appInstance) {
    appInstance = initializeApp(FIREBASE_CONFIG)
  }
  return appInstance
}

export function getDb(): Firestore {
  if (!dbInstance) dbInstance = getFirestore(getFirebaseApp())
  return dbInstance
}

export function getFirebaseAuth(): Auth {
  if (!authInstance) authInstance = getAuth(getFirebaseApp())
  return authInstance
}

export {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
}
