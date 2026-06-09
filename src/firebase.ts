import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import firebaseConfigJson from '../firebase-applet-config.json';

// Suporta variáveis de ambiente (Vercel/GitHub/Produção) com fallback para o arquivo de configuração
const firebaseConfig = {
  apiKey: ((import.meta as any).env?.VITE_FIREBASE_API_KEY as string) || firebaseConfigJson.apiKey || '',
  authDomain: ((import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN as string) || firebaseConfigJson.authDomain || '',
  projectId: ((import.meta as any).env?.VITE_FIREBASE_PROJECT_ID as string) || firebaseConfigJson.projectId || '',
  storageBucket: ((import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET as string) || firebaseConfigJson.storageBucket || '',
  messagingSenderId: ((import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || firebaseConfigJson.messagingSenderId || '',
  appId: ((import.meta as any).env?.VITE_FIREBASE_APP_ID as string) || firebaseConfigJson.appId || '',
  measurementId: ((import.meta as any).env?.VITE_FIREBASE_MEASUREMENT_ID as string) || firebaseConfigJson.measurementId || '',
  firestoreDatabaseId: ((import.meta as any).env?.VITE_FIREBASE_DATABASE_ID as string) || firebaseConfigJson.firestoreDatabaseId || '(default)'
};

const app = initializeApp(firebaseConfig);
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)' 
  ? initializeFirestore(app, { ignoreUndefinedProperties: true }, firebaseConfig.firestoreDatabaseId) 
  : initializeFirestore(app, { ignoreUndefinedProperties: true });
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
