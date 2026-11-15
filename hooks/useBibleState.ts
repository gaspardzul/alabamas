import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_TRANSLATION } from '@/utils/bibleApi';

const STORAGE_KEY = 'bibleState';

export interface LastRead {
  translationId: string;
  bookId: string;
  bookName: string;
  chapter: number;
}

interface BibleState {
  translationId: string;
  lastRead: LastRead | null;
}

const initialState: BibleState = { translationId: DEFAULT_TRANSLATION, lastRead: null };

/** Traducción elegida y último capítulo leído (clave propia, separada de userSettings). */
export const useBibleState = () => {
  const [state, setState] = useState<BibleState>(initialState);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setState({ ...initialState, ...JSON.parse(stored) });
    } catch (error) {
      console.error('Error al cargar el estado de la Biblia:', error);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const persist = async (patch: Partial<BibleState>) => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const current: BibleState = stored ? { ...initialState, ...JSON.parse(stored) } : initialState;
      const next = { ...current, ...patch };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setState(next);
    } catch (error) {
      console.error('Error al guardar el estado de la Biblia:', error);
    }
  };

  return {
    ...state,
    loaded,
    reload: load,
    setTranslation: (translationId: string) => persist({ translationId }),
    setLastRead: (lastRead: LastRead) => persist({ lastRead }),
  };
};
