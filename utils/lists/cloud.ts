import type { ListsBackend } from './types';

/** En iOS/Android aún no hay cuentas: las listas son locales. Misma firma que cloud.web.ts. */
export function createCloudBackend(): ListsBackend | null {
  return null;
}

export async function migrateLegacyLists(
  _uid: string,
  _legacy: { id: number | string; name: string }[],
  _hadCloudField: boolean
): Promise<void> {}
