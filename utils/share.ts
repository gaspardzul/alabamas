import { Platform, Share } from 'react-native';

export type ShareResult = 'shared' | 'copied' | 'failed';

/**
 * Comparte texto con el menú del sistema. En navegadores sin Web Share (p. ej. Chrome de
 * escritorio) lo copia al portapapeles: el llamador avisa "copiado".
 */
export async function shareText(message: string, title?: string): Promise<ShareResult> {
  try {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && !navigator.share) {
      await navigator.clipboard.writeText(message);
      return 'copied';
    }
    await Share.share({ message, title });
    return 'shared';
  } catch (error) {
    // El usuario cerró el menú de compartir: no es un error que haya que mostrar.
    if ((error as { name?: string }).name === 'AbortError') return 'shared';
    console.error('Error al compartir:', error);
    return 'failed';
  }
}
