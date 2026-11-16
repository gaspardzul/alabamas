import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Share } from 'react-native';
import allHimnos from '@/assets/himnos/allHimnos.json';
import { generateAndSharePDF, generateHimnoHTML } from '@/utils/pdfGenerator';
import { syncedSetItem, SYNCED_KEYS } from '@/utils/syncedStorage';
import { FONT_SIZE_DEFAULT } from '@/hooks/useSettings';
import type { Lista } from '@/ts/interfaces';
import type { HymnNumber } from '@/utils/hymnNumber';

/**
 * Acciones sobre un himno compartidas por el menú de la lista (HymnActionsSheet) y el lector
 * (HimnoDetail): compartir letra/PDF y agregar a listas del usuario.
 */

interface Verse {
  verse: number;
  text: string;
  repeat?: number;
}

interface HymnWithLyrics {
  title: string;
  number: HymnNumber;
  lyrics: Verse[];
}

export function getHymnWithLyrics(number: HymnNumber): HymnWithLyrics | null {
  const data = (allHimnos as Record<string, HymnWithLyrics>)[String(number)];
  return data?.lyrics ? data : null;
}

export function buildHymnText(hymn: HymnWithLyrics): string {
  let text = `${hymn.title}\n\n`;
  hymn.lyrics.forEach((verse) => {
    text += verse.verse === 0 ? 'Coro:\n' : `Verso ${verse.verse}:\n`;
    text += `${verse.text}\n`;
    if (verse.repeat) text += `(Repetir ${verse.repeat} veces)\n`;
    text += '\n';
  });
  return text;
}

export type ShareResult = 'shared' | 'copied' | 'failed';

/**
 * Comparte la letra con el menú del sistema. En navegadores sin Web Share (p. ej. Chrome de
 * escritorio) la copia al portapapeles: el llamador debe avisar "Letra copiada".
 */
export async function shareHymnText(number: HymnNumber): Promise<ShareResult> {
  const hymn = getHymnWithLyrics(number);
  if (!hymn) return 'failed';
  const message = buildHymnText(hymn);
  try {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && !navigator.share) {
      await navigator.clipboard.writeText(message);
      return 'copied';
    }
    await Share.share({ message, title: `Himno ${hymn.number} - ${hymn.title}` });
    return 'shared';
  } catch (error) {
    // El usuario cerró el menú de compartir: no es un error que haya que mostrar.
    if ((error as { name?: string }).name === 'AbortError') return 'shared';
    console.error('Error al compartir:', error);
    return 'failed';
  }
}

export async function shareHymnPdf(number: HymnNumber, fontSize: number = FONT_SIZE_DEFAULT): Promise<boolean> {
  const hymn = getHymnWithLyrics(number);
  if (!hymn) return false;
  try {
    await generateAndSharePDF(generateHimnoHTML(hymn, fontSize), `${hymn.title}.pdf`);
    return true;
  } catch (error) {
    console.error('Error al generar el PDF:', error);
    return false;
  }
}

// ---------- Listas del usuario (viven en userSettings.userLists) ----------

async function readSettings(): Promise<Record<string, unknown>> {
  try {
    const raw = await AsyncStorage.getItem(SYNCED_KEYS.settings);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function getUserLists(): Promise<Lista[]> {
  return ((await readSettings()).userLists as Lista[] | undefined) ?? [];
}

async function saveUserLists(lists: Lista[]) {
  const settings = await readSettings();
  await syncedSetItem(SYNCED_KEYS.settings, JSON.stringify({ ...settings, userLists: lists }));
}

/** Agrega el himno a la lista. Devuelve false si ya estaba. */
export async function addHymnToList(listId: number, number: HymnNumber): Promise<boolean> {
  const lists = await getUserLists();
  const key = String(number);
  let added = false;
  const updated = lists.map((list) => {
    if (list.id !== listId || list.himnos.includes(key)) return list;
    added = true;
    return { ...list, himnos: [...list.himnos, key], updatedAt: new Date() };
  });
  if (added) await saveUserLists(updated);
  return added;
}

export async function createListWithHymn(name: string, number: HymnNumber): Promise<Lista> {
  const lists = await getUserLists();
  const now = new Date();
  const list: Lista = { id: Date.now(), name: name.trim(), himnos: [String(number)], createdAt: now, updatedAt: now };
  await saveUserLists([...lists, list]);
  return list;
}
