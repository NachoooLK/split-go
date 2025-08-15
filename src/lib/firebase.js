import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA8HSgpzSRgHlg32OaRJSh-PydheyZQ5J0",
  authDomain: "tricount-a6a39.firebaseapp.com",
  projectId: "tricount-a6a39",
  storageBucket: "tricount-a6a39.firebasestorage.app",
  messagingSenderId: "329511591491",
  appId: "1:329511591491:web:874c1ed13e7c63b0157ef6",
  measurementId: "G-46YEHC42KY"
};

// Verificar que la configuración esté completa
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  console.error('Firebase configuration is incomplete');
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Configurar API key de Google AI automáticamente
const GEMINI_API_KEY = 'AIzaSyBiqzHaZCUe-BwncpSqh5hBZL4RaXdAiQY';

// Forzar actualización de la API key (limpiar cache)
localStorage.setItem('gemini_api_key', GEMINI_API_KEY);
console.log('✅ Google AI API Key actualizada:', GEMINI_API_KEY.slice(0, 10) + '...' + GEMINI_API_KEY.slice(-4));

// Verificar que Firebase se inicializó correctamente
console.log('Firebase initialized with project:', firebaseConfig.projectId);
console.log('Firebase auth domain:', firebaseConfig.authDomain);
console.log('Firebase API key:', firebaseConfig.apiKey ? '✅ Present' : '❌ Missing');
console.log('Firebase storage bucket:', firebaseConfig.storageBucket);


