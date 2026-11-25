import allHimnos from '@/assets/himnos/allHimnos.json';
import { BloquePredica, Predica } from '@/ts/interfaces';
import type { ThemeColors } from '@/constants/Colors';

/**
 * Datos derivados de una prédica: tipos de bloque, himnos resueltos, conteo de
 * palabras y texto plano para compartir. Sin estado ni red: todo es local.
 */

/** Metadatos de cada tipo de bloque: etiqueta y colores del tema (Sanctuary Warmth). */
export const BLOCK_TYPE_META: Record<
  BloquePredica['type'],
  { label: string; color: keyof ThemeColors; soft: keyof ThemeColors }
> = {
  intro: { label: 'Introducción', color: 'primary', soft: 'chip' },
  punto: { label: 'Punto', color: 'secondary', soft: 'secondarySoft' },
  ilustracion: { label: 'Ilustración', color: 'tertiary', soft: 'chip' },
  aplicacion: { label: 'Aplicación', color: 'secondary', soft: 'secondarySoft' },
  conclusion: { label: 'Conclusión', color: 'primary', soft: 'chip' },
  cita: { label: 'Cita', color: 'chorus', soft: 'chorusSoft' },
};

export const BLOCK_TYPES = Object.keys(BLOCK_TYPE_META) as BloquePredica['type'][];

export interface HimnoResuelto {
  number: number | string;
  title: string;
  lyrics: { verse: number; text: string }[];
}

/** Resuelve un número de himno guardado ("19", "556-A") contra allHimnos.json. */
export function resolveHymn(number: string | undefined): HimnoResuelto | null {
  if (!number) return null;
  const data = (allHimnos as Record<string, HimnoResuelto | undefined>)[number];
  return data ?? null;
}

export function hymnTitle(number: string | undefined): string | null {
  return resolveHymn(number)?.title ?? null;
}

/** Himnos de la prédica en orden: apertura, intermedios, cierre, con su papel. */
export function predicaHymns(predica: Predica): { role: string; himno: HimnoResuelto }[] {
  const out: { role: string; himno: HimnoResuelto }[] = [];
  const apertura = resolveHymn(predica.hymnApertura);
  if (apertura) out.push({ role: 'Himno de apertura', himno: apertura });
  for (const n of predica.hymnIntermedios ?? []) {
    const h = resolveHymn(n);
    if (h) out.push({ role: 'Himno intermedio', himno: h });
  }
  const cierre = resolveHymn(predica.hymnCierre);
  if (cierre) out.push({ role: 'Himno de cierre', himno: cierre });
  return out;
}

export const countWords = (text: string) => text.split(/\s+/).filter(Boolean).length;

export function predicaWordCount(predica: Predica): number {
  let words = countWords(predica.passageText ?? '');
  for (const b of predica.blocks) words += countWords(b.title ?? '') + countWords(b.text);
  return words;
}

/** Minutos estimados de predicación (~130 palabras por minuto). Es un estimado, no una promesa. */
export function predicaEstimatedMinutes(predica: Predica): number {
  return Math.max(1, Math.round(predicaWordCount(predica) / 130));
}

/** "2026-12-07" → fecha corta del dispositivo; si no es fecha válida, tal cual. */
export const formatFecha = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString();
};

export const puntosCount = (predica: Predica) =>
  predica.blocks.filter((b) => b.type === 'punto').length;

/** Texto plano de la prédica completa, para compartir por WhatsApp o donde sea. */
export function buildPredicaText(predica: Predica): string {
  const lines: string[] = [];
  lines.push(predica.title || 'Prédica sin título');
  if (predica.passage) lines.push(predica.passage);
  if (predica.series) lines.push(`Serie: ${predica.series}`);
  if (predica.date) lines.push(`Fecha: ${formatFecha(predica.date)}`);
  lines.push('');
  if (predica.passageText) {
    lines.push(predica.passageText);
    lines.push('');
  }
  for (const b of predica.blocks) {
    const label = BLOCK_TYPE_META[b.type].label;
    lines.push(b.title ? `${label}: ${b.title}` : label);
    if (b.verseRef) lines.push(b.verseRef);
    if (b.text) lines.push(b.text);
    lines.push('');
  }
  for (const { role, himno } of predicaHymns(predica)) {
    lines.push(`${role}: Himno #${himno.number} - ${himno.title}`);
    lines.push('');
    for (const verso of himno.lyrics) {
      lines.push(verso.verse === 0 ? 'Coro:' : `Verso ${verso.verse}:`);
      lines.push(verso.text);
      lines.push('');
    }
  }
  return lines.join('\n').trim();
}
