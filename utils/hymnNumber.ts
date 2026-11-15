/**
 * Los himnos se numeran con enteros (35) o con texto para variantes (`"35-A"`, `"214-B"`).
 * No uses aritmética ni parseInt directamente sobre `number`; usa estas funciones.
 */
export type HymnNumber = number | string;

/** Parte numérica: 35 para "35-A". */
export const hymnBase = (n: HymnNumber): number => parseInt(String(n), 10) || 0;

/** Sufijo de la variante: "A" para "35-A", "" para 35. */
const hymnSuffix = (n: HymnNumber): string => String(n).replace(/^\d+-?/, '');

/** Orden natural: 35, 35-A, 35-B, 36… */
export const compareHymnNumbers = (a: HymnNumber, b: HymnNumber): number =>
  hymnBase(a) - hymnBase(b) || hymnSuffix(a).localeCompare(hymnSuffix(b));

/** Igualdad tolerante a tipos ("35" de una URL vs 35 del JSON). */
export const sameHymn = (a: HymnNumber | undefined, b: HymnNumber | undefined) =>
  a !== undefined && b !== undefined && String(a) === String(b);

/** Para mostrar en la caja de número: "035", "035-A". */
export const formatHymnNumber = (n: HymnNumber): string => {
  const suffix = hymnSuffix(n);
  return String(hymnBase(n)).padStart(3, '0') + (suffix ? `-${suffix}` : '');
};
