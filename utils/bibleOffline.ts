import { useSyncExternalStore } from 'react';
import type { BibleBook, ChapterContentItem, Footnote } from '@/utils/bibleApi';
import {
  downloadText,
  offlineBegin,
  offlineIsReady,
  offlineMarkReady,
  offlineRead,
  offlineRemove,
  offlineWrite,
} from '@/utils/bibleStorage';

/**
 * Descarga de traducciones completas para leer sin conexión.
 *
 * La API ofrece /api/{traducción}/complete.json (~1.4 MB comprimido, ~5.5 MB descomprimido).
 * Se descarga una vez y se guarda un registro por libro (más `books`), para que abrir un
 * capítulo solo lea su libro. El almacenamiento concreto (archivos en el teléfono,
 * IndexedDB en web) vive en utils/bibleStorage(.web).ts.
 */

const BASE_URL = 'https://bible.helloao.org/api';
export const APPROX_DOWNLOAD_MB = 5.5;
const APPROX_BYTES = APPROX_DOWNLOAD_MB * 1024 * 1024;

export interface OfflineChapter {
  number: number;
  numberOfVerses: number;
  content: ChapterContentItem[];
  footnotes: Footnote[];
}

export const isDownloaded = (id: string) => offlineIsReady(id);

export async function readOfflineBooks(id: string): Promise<BibleBook[]> {
  return JSON.parse(await offlineRead(id, 'books'));
}

export async function readOfflineBook(id: string, bookId: string): Promise<OfflineChapter[]> {
  return JSON.parse(await offlineRead(id, bookId));
}

// ---------- Estado de descargas compartido entre pantallas ----------

export type DownloadStatus =
  | { state: 'idle' }
  | { state: 'downloading'; progress: number; label: string }
  | { state: 'error'; message: string };

let statuses: Record<string, DownloadStatus> = {};
let version = 0;
const listeners = new Set<() => void>();

const setStatus = (id: string, status: DownloadStatus) => {
  statuses = { ...statuses, [id]: status };
  version++;
  listeners.forEach((l) => l());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Estado de la descarga de una traducción; se re-renderiza cuando cambia. */
export function useOfflineStatus(id: string) {
  useSyncExternalStore(subscribe, () => version);
  return {
    downloaded: isDownloaded(id),
    status: statuses[id] ?? ({ state: 'idle' } as DownloadStatus),
  };
}

export async function downloadTranslation(id: string) {
  if (statuses[id]?.state === 'downloading') return;

  try {
    setStatus(id, { state: 'downloading', progress: 0, label: 'Descargando…' });

    const text = await downloadText(`${BASE_URL}/${id}/complete.json`, (bytes, total) => {
      // El total puede faltar o ser el tamaño comprimido; en ese caso usamos el aproximado.
      const denominator = total > 0 && bytes <= total ? total : APPROX_BYTES;
      setStatus(id, {
        state: 'downloading',
        progress: Math.min(bytes / denominator, 1) * 0.8, // la descarga ocupa el 80 % de la barra
        label: `Descargando… ${(bytes / 1024 / 1024).toFixed(1)} MB`,
      });
    });

    setStatus(id, { state: 'downloading', progress: 0.8, label: 'Guardando libros…' });
    const data = JSON.parse(text) as {
      books: (BibleBook & {
        chapters: { numberOfVerses: number; chapter: { number: number; content: ChapterContentItem[]; footnotes: Footnote[] } }[];
      })[];
    };

    await offlineBegin(id);
    const books = data.books.filter((b) => !b.isApocryphal);
    for (let i = 0; i < books.length; i++) {
      const book = books[i];
      const chapters: OfflineChapter[] = book.chapters.map((c) => ({
        number: c.chapter.number,
        numberOfVerses: c.numberOfVerses,
        content: c.chapter.content,
        footnotes: c.chapter.footnotes,
      }));
      await offlineWrite(id, book.id, JSON.stringify(chapters));
      if (i % 6 === 0) {
        setStatus(id, {
          state: 'downloading',
          progress: 0.8 + (0.2 * i) / books.length,
          label: `Guardando libros… ${i + 1}/${books.length}`,
        });
      }
    }

    await offlineWrite(
      id,
      'books',
      JSON.stringify(
        books.map(({ id: bookId, name, commonName, order, numberOfChapters }) => ({
          id: bookId,
          name,
          commonName,
          order,
          numberOfChapters,
        }))
      )
    );
    await offlineMarkReady(id);
    setStatus(id, { state: 'idle' });
  } catch (error) {
    console.error('Error al descargar la traducción:', error);
    try {
      await offlineRemove(id);
    } catch {}
    setStatus(id, { state: 'error', message: 'No se pudo descargar. Revisa tu conexión e inténtalo de nuevo.' });
  }
}

export async function removeTranslation(id: string) {
  try {
    await offlineRemove(id);
  } finally {
    setStatus(id, { state: 'idle' });
  }
}
