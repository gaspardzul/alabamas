import { shareText, type ShareResult } from '@/utils/share';
import allHimnos from '@/assets/himnos/allHimnos.json';
import { generateAndSharePDF, generateHimnoHTML } from '@/utils/pdfGenerator';
import { FONT_SIZE_DEFAULT } from '@/hooks/useSettings';
import type { HymnNumber } from '@/utils/hymnNumber';

/**
 * Acciones sobre un himno compartidas por el menú de la lista (HymnActionsSheet) y el lector
 * (HimnoDetail): compartir letra y PDF. Las listas están en utils/lists.
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

export type { ShareResult } from '@/utils/share';

/** Comparte la letra (o la copia al portapapeles en navegadores sin Web Share). */
export async function shareHymnText(number: HymnNumber): Promise<ShareResult> {
  const hymn = getHymnWithLyrics(number);
  if (!hymn) return 'failed';
  return shareText(buildHymnText(hymn), `Himno ${hymn.number} - ${hymn.title}`);
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
