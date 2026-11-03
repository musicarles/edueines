import type { DataMode } from './types'

const rawMode = import.meta.env.VITE_DATA_MODE

export const DATA_MODE: DataMode = rawMode === 'firebase' ? 'firebase' : 'local'
export const IS_FIREBASE = DATA_MODE === 'firebase'

export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
}

export const IS_FIREBASE_CONFIGURED = Boolean(
  FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId && FIREBASE_CONFIG.appId,
)

export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@edueines.cat'

export const SESSION_STORAGE_KEY = 'edueines:session'

export const DATA_MODE_DESCRIPTION =
  DATA_MODE === 'firebase'
    ? 'Firestore i Firebase Authentication'
    : 'Dades locals del navegador (IndexedDB)'
