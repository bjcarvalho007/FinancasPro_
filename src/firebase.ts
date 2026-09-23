import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import firebaseConfigJson from '../firebase-applet-config.json';

// Validador de credenciais reais para evitar substituição por placeholders ou valores truncados
const isValidKey = (val?: string) => Boolean(val && typeof val === 'string' && val.trim().length > 15 && !val.includes('MY_') && !['fire', 'proj', 'ap', 'at', 'st', 'ms', 'mea', 'bd'].includes(val.trim()));
const isValidDomain = (val?: string) => Boolean(val && typeof val === 'string' && val.includes('.') && val.trim().length > 5 && !['at', 'fire', 'proj'].includes(val.trim()));
const isValidId = (val?: string) => Boolean(val && typeof val === 'string' && val.trim().length > 5 && !['proj', 'fire', 'ap', 'at', 'st', 'ms', 'bd'].includes(val.trim()));

const env = ((import.meta as any).env) || {};

// Suporta variáveis de ambiente (Vercel/GitHub/Produção) com fallback garantido para o arquivo de configuração oficial
const firebaseConfig = {
  apiKey: isValidKey(env.VITE_FIREBASE_API_KEY) ? env.VITE_FIREBASE_API_KEY : (firebaseConfigJson.apiKey || 'AIzaSyCJBEyT3saaWEdNhABwnLvGvPcgDJy18j0'),
  authDomain: isValidDomain(env.VITE_FIREBASE_AUTH_DOMAIN) ? env.VITE_FIREBASE_AUTH_DOMAIN : (firebaseConfigJson.authDomain || 'financaspro-bcbb4.firebaseapp.com'),
  projectId: isValidId(env.VITE_FIREBASE_PROJECT_ID) ? env.VITE_FIREBASE_PROJECT_ID : (firebaseConfigJson.projectId || 'financaspro-bcbb4'),
  storageBucket: isValidDomain(env.VITE_FIREBASE_STORAGE_BUCKET) ? env.VITE_FIREBASE_STORAGE_BUCKET : (firebaseConfigJson.storageBucket || 'financaspro-bcbb4.firebasestorage.app'),
  messagingSenderId: isValidId(env.VITE_FIREBASE_MESSAGING_SENDER_ID) ? env.VITE_FIREBASE_MESSAGING_SENDER_ID : (firebaseConfigJson.messagingSenderId || '838794865527'),
  appId: isValidKey(env.VITE_FIREBASE_APP_ID) ? env.VITE_FIREBASE_APP_ID : (firebaseConfigJson.appId || '1:838794865527:web:d3af0d4c3d85f594e5cf72'),
  measurementId: isValidKey(env.VITE_FIREBASE_MEASUREMENT_ID) ? env.VITE_FIREBASE_MEASUREMENT_ID : (firebaseConfigJson.measurementId || 'G-XG2YC8QZJC'),
  firestoreDatabaseId: (firebaseConfigJson.firestoreDatabaseId && firebaseConfigJson.firestoreDatabaseId !== 'bd') ? firebaseConfigJson.firestoreDatabaseId : '(default)'
};

const app = initializeApp(firebaseConfig);

let firestoreLocalCache;
try {
  firestoreLocalCache = persistentLocalCache({ tabManager: persistentMultipleTabManager() });
} catch (e) {
  console.warn("Firestore persistent cache fallback:", e);
}

const firestoreOptions: any = {
  ignoreUndefinedProperties: true
};
if (firestoreLocalCache) {
  firestoreOptions.localCache = firestoreLocalCache;
}

export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)' 
  ? initializeFirestore(app, firestoreOptions, firebaseConfig.firestoreDatabaseId) 
  : initializeFirestore(app, firestoreOptions);
export const auth = getAuth();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
