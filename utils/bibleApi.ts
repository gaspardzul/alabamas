import { isDownloaded, readOfflineBook, readOfflineBooks } from '@/utils/bibleOffline';
import { cacheGet, cacheSet } from '@/utils/bibleStorage';

/**
 * Cliente de la Free Use Bible API (https://bible.helloao.org/docs/es/).
 * Sin API key ni límites. Orden de lectura:
 *  1. Traducción descargada (utils/bibleOffline.ts) → sin red.
 *  2. Caché de lo ya leído (archivos en el teléfono, IndexedDB en web); los capítulos son inmutables.
 *  3. Red.
 */

const BASE_URL = 'https://bible.helloao.org/api';

export interface BibleTranslation {
  id: string;
  shortName: string;
  name: string;
}

/** Traducciones en español de dominio público o libre uso disponibles en la API. */
export const SPANISH_TRANSLATIONS: BibleTranslation[] = [
  { id: 'spa_r09', shortName: 'RV1909', name: 'Reina-Valera 1909' },
  { id: 'spa_rvg', shortName: 'RVG', name: 'Reina-Valera Gómez' },
  { id: 'spa_v2p', shortName: 'V1602P', name: 'Valera 1602 Purificada' },
  { id: 'spa_pdt', shortName: 'PDT', name: 'Palabra de Dios para Ti' },
  { id: 'spa_bes', shortName: 'BES', name: 'Biblia en Español Sencillo' },
];

/**
 * Traducciones que se mostrarán como "Próximamente" en el selector.
 * La RVR1960 requiere licencia de las Sociedades Bíblicas (licensing@americanbible.org);
 * cuando se obtenga, moverla a SPANISH_TRANSLATIONS con su fuente de datos.
 */
export const COMING_SOON_TRANSLATIONS: BibleTranslation[] = [
  { id: 'spa_rvr1960', shortName: 'RVR1960', name: 'Reina-Valera 1960' },
];

export const DEFAULT_TRANSLATION = SPANISH_TRANSLATIONS[0].id;

export const getTranslation = (id: string) =>
  SPANISH_TRANSLATIONS.find((t) => t.id === id) ?? SPANISH_TRANSLATIONS[0];

export interface BibleBook {
  id: string;
  name: string;
  commonName: string;
  order: number;
  numberOfChapters: number;
  isApocryphal?: boolean;
}

export interface FormattedText {
  text: string;
  poem?: number;
  wordsOfJesus?: boolean;
}

export type VerseContentItem =
  | string
  | FormattedText
  | { heading: string }
  | { lineBreak: true; paragraph?: string }
  | { noteId: number };

export type ChapterContentItem =
  | { type: 'heading'; content: string[] }
  | { type: 'line_break'; paragraph?: string }
  | { type: 'hebrew_subtitle'; content: VerseContentItem[] }
  | { type: 'verse'; number: number; content: VerseContentItem[] };

export interface Footnote {
  noteId: number;
  text: string;
  caller: string | null;
  reference?: { chapter: number; verse: number };
}

export interface ChapterReference {
  translationId: string;
  book: string;
  chapter: number;
}

export interface BibleChapter {
  book: { id: string; name: string; commonName: string; numberOfChapters: number };
  chapter: {
    number: number;
    content: ChapterContentItem[];
    footnotes: Footnote[];
  };
  numberOfVerses: number;
  nextChapterReference: ChapterReference | null;
  previousChapterReference: ChapterReference | null;
}

async function fetchCached<T>(path: string): Promise<T> {
  const cached = await cacheGet(path);
  if (cached) {
    try {
      return JSON.parse(cached) as T;
    } catch {
      // Caché corrupta: seguimos con la red.
    }
  }

  const response = await fetch(`${BASE_URL}/${path}`);
  if (!response.ok) {
    throw new Error(response.status === 404 ? 'Capítulo no encontrado' : `Error ${response.status}`);
  }
  const text = await response.text();
  cacheSet(path, text);
  return JSON.parse(text) as T;
}

export async function getBooks(translationId: string): Promise<BibleBook[]> {
  if (isDownloaded(translationId)) return readOfflineBooks(translationId);

  const data = await fetchCached<{ books: BibleBook[] }>(`${translationId}/books.json`);
  return data.books
    .filter((b) => !b.isApocryphal)
    .map(({ id, name, commonName, order, numberOfChapters }) => ({
      id,
      name,
      commonName,
      order,
      numberOfChapters,
    }));
}

async function getOfflineChapter(translationId: string, bookId: string, chapter: number): Promise<BibleChapter> {
  const books = await readOfflineBooks(translationId);
  const index = books.findIndex((b) => b.id === bookId);
  const book = books[index];
  const chapters = book ? await readOfflineBook(translationId, bookId) : [];
  const current = chapters.find((c) => c.number === chapter);
  if (!book || !current) throw new Error('Capítulo no encontrado');

  const ref = (b: BibleBook, n: number): ChapterReference => ({ translationId, book: b.id, chapter: n });
  const prevBook = books[index - 1];
  const nextBook = books[index + 1];

  return {
    book: { id: book.id, name: book.name, commonName: book.commonName, numberOfChapters: book.numberOfChapters },
    chapter: { number: current.number, content: current.content, footnotes: current.footnotes },
    numberOfVerses: current.numberOfVerses,
    previousChapterReference:
      chapter > 1 ? ref(book, chapter - 1) : prevBook ? ref(prevBook, prevBook.numberOfChapters) : null,
    nextChapterReference:
      chapter < book.numberOfChapters ? ref(book, chapter + 1) : nextBook ? ref(nextBook, 1) : null,
  };
}

export async function getChapter(translationId: string, bookId: string, chapter: number): Promise<BibleChapter> {
  if (isDownloaded(translationId)) return getOfflineChapter(translationId, bookId, chapter);

  const data = await fetchCached<BibleChapter>(`${translationId}/${bookId}/${chapter}.json`);
  // Solo conservamos lo que la app usa.
  return {
    book: data.book,
    chapter: data.chapter,
    numberOfVerses: data.numberOfVerses,
    nextChapterReference: data.nextChapterReference,
    previousChapterReference: data.previousChapterReference,
  };
}

/** Los 39 primeros libros (por `order`) son el Antiguo Testamento. */
export const isOldTestament = (book: BibleBook) => book.order <= 39;
