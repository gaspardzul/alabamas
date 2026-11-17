/**
 * Amigos: aún no disponibles en iOS/Android (requieren cuenta, que por ahora es solo web).
 * Misma interfaz que friends.web.ts.
 */
export interface Friend {
  uid: string;
  name: string | null;
  photoURL: string | null;
  since: string;
}

export interface Invite {
  code: string;
  uid: string;
  name: string | null;
  photoURL: string | null;
}

export const friendsAvailable = false;

const unavailable = () => Promise.reject(new Error('Los amigos aún no están disponibles en la app del teléfono.'));

export function useFriends() {
  return { friends: [] as Friend[], loading: false };
}

export const inviteUrl = (code: string) => `https://alabamas.org/invitar/${code}`;
export const getInviteLink = (): Promise<string> => unavailable();
export const resetInviteLink = (): Promise<string> => unavailable();
export const getInvite = (_code: string): Promise<Invite | null> => unavailable();
export const acceptInvite = (_code: string): Promise<Invite> => unavailable();
export const removeFriend = (_uid: string): Promise<void> => unavailable();
