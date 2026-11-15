import { Directory, File, Paths } from 'expo-file-system';

/**
 * Almacenamiento de la Biblia en iOS/Android (archivos).
 * La versión web está en bibleStorage.web.ts (IndexedDB); ambas exponen la misma interfaz.
 *  - cache*: copia de lo ya leído (Paths.cache, el sistema puede limpiarla).
 *  - offline*: traducciones descargadas (Paths.document/bible-offline/{id}/), con marcador `.ready`.
 */

const pathFile = (root: Directory, path: string) => new File(root, ...path.split('/'));

const ensureParent = (root: Directory, path: string) => {
  const parts = path.split('/').slice(0, -1);
  if (parts.length === 0) return;
  const dir = new Directory(root, ...parts);
  if (!dir.exists) dir.create({ intermediates: true });
};

export async function cacheGet(path: string): Promise<string | null> {
  try {
    const file = pathFile(Paths.cache, `bible/${path}`);
    return file.exists ? await file.text() : null;
  } catch {
    return null;
  }
}

export async function cacheSet(path: string, text: string): Promise<void> {
  try {
    ensureParent(Paths.cache, `bible/${path}`);
    pathFile(Paths.cache, `bible/${path}`).write(text);
  } catch {
    // Sin caché no pasa nada.
  }
}

const offlineDir = (id: string) => new Directory(Paths.document, 'bible-offline', id);

export function offlineIsReady(id: string): boolean {
  try {
    return new File(offlineDir(id), '.ready').exists;
  } catch {
    return false;
  }
}

export async function offlineRead(id: string, name: string): Promise<string> {
  return new File(offlineDir(id), `${name}.json`).text();
}

/** Prepara una descarga nueva: borra lo anterior de esa traducción. */
export async function offlineBegin(id: string): Promise<void> {
  const dir = offlineDir(id);
  if (dir.exists) dir.delete();
  dir.create({ intermediates: true });
}

export async function offlineWrite(id: string, name: string, text: string): Promise<void> {
  new File(offlineDir(id), `${name}.json`).write(text);
}

export async function offlineMarkReady(id: string): Promise<void> {
  new File(offlineDir(id), '.ready').write('1');
}

export async function offlineRemove(id: string): Promise<void> {
  const dir = offlineDir(id);
  if (dir.exists) dir.delete();
}

/** Descarga `url` reportando progreso (0..1, o -1 si no se conoce el total) y devuelve el texto. */
export async function downloadText(
  url: string,
  onProgress: (bytes: number, total: number) => void
): Promise<string> {
  const tmp = new File(Paths.cache, `bible-download-${Date.now()}.json`);
  try {
    const task = File.createDownloadTask(url, tmp, {
      onProgress: ({ bytesWritten, totalBytes }) => onProgress(bytesWritten, totalBytes),
    });
    const result = await task.downloadAsync();
    if (!result) throw new Error('Descarga cancelada');
    return await tmp.text();
  } finally {
    try {
      if (tmp.exists) tmp.delete();
    } catch {}
  }
}
