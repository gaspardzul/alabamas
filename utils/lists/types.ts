/**
 * Modelo de listas de alabanzas común a invitados (AsyncStorage) y cuentas (Firestore).
 * Las pantallas solo usan esto a través de utils/lists/index.ts.
 */
export type ListRole = 'owner' | 'editor' | 'viewer';

export interface MemberInfo {
  name: string | null;
  photoURL: string | null;
}

export interface HymnList {
  id: string;
  name: string;
  /** Números de himno como texto ("35", "35-A"), en el orden del culto. */
  himnos: string[];
  createdAt: string;
  updatedAt: string;
  /** Mi permiso sobre la lista. */
  role: ListRole;
  ownerId: string | null;
  members: Record<string, ListRole>;
  memberInfo: Record<string, MemberInfo>;
}

export interface ListsBackend {
  subscribe(callback: (lists: HymnList[]) => void): () => void;
  create(name: string, himnos: string[]): Promise<string>;
  rename(id: string, name: string): Promise<void>;
  remove(id: string): Promise<void>;
  setHymns(id: string, himnos: string[]): Promise<void>;
  /** members: uid → permiso (null = quitar acceso); info: nombre/foto para mostrar. */
  share(id: string, members: Record<string, Exclude<ListRole, 'owner'> | null>, info: Record<string, MemberInfo>): Promise<void>;
  leave(id: string): Promise<void>;
}

export const ownerName = (list: HymnList) =>
  (list.ownerId && list.memberInfo[list.ownerId]?.name) || 'Otra persona';
