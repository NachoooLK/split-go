import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

function getEnv(name) {
  return import.meta.env?.[name]
}

const requiredKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
]

const missing = requiredKeys.filter((k) => !getEnv(k))
export const isFirebaseConfigured = missing.length === 0

let app = null
let authInstance = null
let dbInstance = null

if (!isFirebaseConfigured) {
  const msg = `Firebase config missing: ${missing.join(', ')}`
  if (import.meta.env.PROD) {
    // En producción no usamos valores de demo para evitar errores 400
    console.error(msg)
  } else {
    console.warn(msg)
  }
} else {
  const firebaseConfig = {
    apiKey: getEnv('VITE_FIREBASE_API_KEY'),
    authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: getEnv('VITE_FIREBASE_APP_ID'),
    ...(getEnv('VITE_FIREBASE_MEASUREMENT_ID')
      ? { measurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID') }
      : {})
  }
  app = initializeApp(firebaseConfig)
  authInstance = getAuth(app)
  dbInstance = getFirestore(app)

  // Logs informativos en desarrollo para verificar configuración
  if (import.meta.env.DEV) {
    // Evitar imprimir la API key completa
    const apiKey = String(getEnv('VITE_FIREBASE_API_KEY') || '')
    const apiKeyMasked = apiKey ? `${apiKey.slice(0, 6)}…${apiKey.slice(-4)}` : '(missing)'
    /* eslint-disable no-console */
    console.log('Firebase initialized with project:', getEnv('VITE_FIREBASE_PROJECT_ID'))
    console.log('Firebase auth domain:', getEnv('VITE_FIREBASE_AUTH_DOMAIN'))
    console.log('Firebase API key:', apiKey ? `✅ Present (${apiKeyMasked})` : '❌ Missing')
    /* eslint-enable no-console */
  }
}

export const auth = authInstance
export const db = dbInstance


