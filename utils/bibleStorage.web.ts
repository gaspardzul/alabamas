/**
 * Almacenamiento de la Biblia en web (PWA): IndexedDB para el contenido y
 * localStorage para el marcador síncrono de "traducción descargada".
 * Misma interfaz que bibleStorage.ts (nativo). expo-file-system no existe en web.
 */

const DB_NAME = 'alabanzas-bible';
const STORE = 'kv';
const READY_PREFIX = 'bible-offline-ready:';

let dbPromise: Promise<IDBDatabase> | null = null;

function db(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

async function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  const database = await db();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE, mode);
    const request = run(transaction.objectStore(STORE));
    transaction.oncomplete = () => resolve(request ? request.result : undefined);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

const get = async (key: string) => ((await tx('readonly', (s) => s.get(key))) as string | undefined) ?? null;
const put = (key: string, value: string) => tx('readwrite', (s) => s.put(value, key));
const removePrefix = (prefix: string) =>
  tx('readwrite', (s) => s.delete(IDBKeyRange.bound(prefix, `${prefix}￿`)));

export async function cacheGet(path: string): Promise<string | null> {
  try {
    return await get(`cache:${path}`);
  } catch {
    return null;
  }
}

export async function cacheSet(path: string, text: string): Promise<void> {
  try {
    await put(`cache:${path}`, text);
  } catch {
    // Sin caché no pasa nada.
  }
}

export function offlineIsReady(id: string): boolean {
  try {
    return localStorage.getItem(READY_PREFIX + id) === '1';
  } catch {
    return false;
  }
}

export async function offlineRead(id: string, name: string): Promise<string> {
  const text = await get(`offline:${id}:${name}`);
  if (text === null) throw new Error('Capítulo no encontrado');
  return text;
}

export async function offlineBegin(id: string): Promise<void> {
  await offlineRemove(id);
}

export async function offlineWrite(id: string, name: string, text: string): Promise<void> {
  await put(`offline:${id}:${name}`, text);
}

export async function offlineMarkReady(id: string): Promise<void> {
  localStorage.setItem(READY_PREFIX + id, '1');
  // Pedir al navegador que no borre estos datos por falta de espacio (si lo permite).
  try {
    await navigator.storage?.persist?.();
  } catch {}
}

export async function offlineRemove(id: string): Promise<void> {
  try {
    localStorage.removeItem(READY_PREFIX + id);
  } catch {}
  await removePrefix(`offline:${id}:`);
}

export async function downloadText(
  url: string,
  onProgress: (bytes: number, total: number) => void
): Promise<string> {
  const response = await fetch(url);
  if (!response.ok || !response.body) throw new Error(`Error ${response.status}`);
  // Content-Length suele ser el tamaño comprimido; si no coincide, el progreso es aproximado.
  const total = Number(response.headers.get('content-length') ?? -1);
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    bytes += value.length;
    onProgress(bytes, total);
  }
  const merged = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder().decode(merged);
}
