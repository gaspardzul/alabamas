import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onDataReloaded, syncedSetItem, SYNCED_KEYS } from '@/utils/syncedStorage';
import { BloquePredica, Predica } from '@/ts/interfaces';

const KEY = SYNCED_KEYS.predicas;

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/** Bloque nuevo, vacío, del tipo elegido. */
export const newBloquePredica = (type: BloquePredica['type']): BloquePredica => ({
  id: newId(),
  type,
  title: '',
  text: '',
});

const emptyPredica = (): Predica => {
  const now = new Date();
  return {
    id: newId(),
    title: '',
    passage: '',
    passageText: '',
    date: '',
    series: '',
    blocks: [newBloquePredica('intro')],
    hymnIntermedios: [],
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * Prédicas guardadas en AsyncStorage (llave `predicas`) y sincronizadas con la
 * cuenta de Google cuando hay sesión (utils/syncedStorage.ts, utils/cloudData.ts).
 * Patrón parecido a useStorage('favoritos').
 */
export function usePredicas() {
  const [predicas, setPredicas] = useState<Predica[]>([]);
  // false hasta la primera lectura: evita mostrar "Aún no tienes prédicas" mientras carga.
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      setPredicas(raw ? (JSON.parse(raw) as Predica[]) : []);
    } catch (error) {
      console.error('Error al cargar las prédicas:', error);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Recargar si los datos cambian desde la nube o al iniciar/cerrar sesión.
  useEffect(() => onDataReloaded(() => { load(); }), [load]);

  const persist = async (next: Predica[]) => {
    setPredicas(next);
    try {
      await syncedSetItem(KEY, JSON.stringify(next));
    } catch (error) {
      console.error('Error al guardar las prédicas:', error);
    }
  };

  /** Crea una prédica vacía y la devuelve (para navegar al editor). */
  const create = async (): Promise<Predica> => {
    const predica = emptyPredica();
    await persist([predica, ...predicas]);
    return predica;
  };

  /** Guarda una prédica completa (el editor la pasa ya con updatedAt actualizado). */
  const save = async (predica: Predica) => {
    await persist(predicas.map((p) => (p.id === predica.id ? predica : p)));
  };

  /** Cambia campos de una prédica y actualiza su fecha de edición. */
  const update = async (id: string, patch: Partial<Predica>) => {
    await persist(
      predicas.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: new Date() } : p))
    );
  };

  const remove = async (id: string) => {
    await persist(predicas.filter((p) => p.id !== id));
  };

  /**
   * Reutilizar una prédica: copia todo el contenido para una nueva fecha, sin tocar
   * el original. La copia queda sin fecha, para que se ponga la nueva al editarla.
   */
  const duplicate = async (id: string): Promise<Predica | null> => {
    const original = predicas.find((p) => p.id === id);
    if (!original) return null;
    const now = new Date();
    const copy: Predica = {
      ...original,
      id: newId(),
      date: '',
      blocks: original.blocks.map((b) => ({ ...b, id: newId() })),
      hymnIntermedios: [...(original.hymnIntermedios ?? [])],
      createdAt: now,
      updatedAt: now,
    };
    await persist([copy, ...predicas]);
    return copy;
  };

  const getById = (id: string | undefined) => predicas.find((p) => p.id === id);

  return { predicas, loaded, reload: load, create, save, update, remove, duplicate, getById };
}

export default usePredicas;
