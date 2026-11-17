import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

/**
 * Firebase aún no se usa en iOS/Android (requiere development build): siempre null.
 * Misma firma que firebase.web.ts (TypeScript revisa contra este archivo).
 */
export const USE_EMULATORS = false;

type FirebaseInstances = { app: FirebaseApp; auth: Auth; db: Firestore };

export function initFirebase(): FirebaseInstances | null {
  return null;
}

export function getFirebase(): FirebaseInstances | null {
  return null;
}
