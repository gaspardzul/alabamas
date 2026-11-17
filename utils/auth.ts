import { setSession } from '@/utils/session';

/**
 * Sesión en iOS/Android: por ahora solo modo invitado (datos en el dispositivo).
 * El inicio de sesión con Google en nativo requiere una development build de EAS
 * (@react-native-google-signin) y vive en auth.web.ts solo para web por ahora.
 * Debe exportar lo mismo que auth.web.ts.
 */

export async function initAuth() {
  setSession({ ready: true, mode: 'guest', googleAvailable: false });
}

export async function signInWithGoogle(): Promise<void> {
  throw new Error('El inicio de sesión con Google aún no está disponible en la app del teléfono.');
}

export async function continueAsGuest() {
  setSession({ mode: 'guest' });
}

export function stopAccountSync() {}

export async function signOut() {
  setSession({ mode: 'guest', user: null, sync: 'idle' });
}
