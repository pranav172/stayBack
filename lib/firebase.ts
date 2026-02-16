import { initializeApp, getApps } from 'firebase/app'
import { getDatabase } from 'firebase/database'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Fallback for build time if env vars are missing
if (!firebaseConfig.projectId) {
  console.warn('⚠️ Firebase config missing. Using mock config for build.');
  Object.assign(firebaseConfig, {
    apiKey: 'mock_key',
    authDomain: 'mock_domain',
    databaseURL: 'https://mock.firebaseio.com',
    projectId: 'mock_project',
    storageBucket: 'mock_bucket',
    messagingSenderId: 'mock_sender',
    appId: 'mock_app_id'
  });
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const database = getDatabase(app)
const auth = getAuth(app)

const isMockConfig = !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

export { app, database, auth, isMockConfig }
