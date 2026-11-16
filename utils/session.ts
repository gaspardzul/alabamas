import { useSyncExternalStore } from 'react';

/**
 * Estado de sesión compartido por toda la app.
 * Lo actualizan utils/auth.ts (iOS/Android) y utils/auth.web.ts (web, Firebase).
 */
export type SessionMode = 'guest' | 'google';
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

export interface SessionUser {
  uid: string;
  name: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface SessionState {
  /** false hasta saber si hay sesión guardada (evita parpadeo de la bienvenida). */
  ready: boolean;
  /** null = todavía no eligió (se muestra la pantalla de bienvenida). */
  mode: SessionMode | null;
  user: SessionUser | null;
  sync: SyncStatus;
  /** Si el inicio de sesión con Google está disponible en esta plataforma/configuración. */
  googleAvailable: boolean;
}

let state: SessionState = { ready: false, mode: null, user: null, sync: 'idle', googleAvailable: false };
const listeners = new Set<() => void>();

export function getSession() {
  return state;
}

export function setSession(patch: Partial<SessionState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function useSession(): SessionState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => state
  );
}

export const SESSION_MODE_KEY = 'sessionMode';
