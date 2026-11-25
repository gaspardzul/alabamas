interface Himno {
    title: string;
    number: number | string; // 35 o "35-A" (ver utils/hymnNumber.ts)
    group?: string[] | string;
    isFavorite?: boolean;
  }

  interface Lista {
    id: number;
    name: string;
    himnos: string[];
    createdAt: Date;
    updatedAt: Date;
  }

  interface listaDetail {
    name: string;
    himnos: string[];
  }

  interface BloquePredica {
    id: string;
    type: 'intro' | 'punto' | 'ilustracion' | 'aplicacion' | 'conclusion' | 'cita';
    title?: string;
    text: string;
    verseRef?: string; // versículo de apoyo del punto, ej. "Juan 3:16"
  }

  interface Predica {
    id: string;
    title: string;
    passage: string; // ej. "Salmo 23:1-6"
    passageText?: string; // texto del pasaje, escrito a mano por el predicador
    date?: string; // fecha en que se predica (AAAA-MM-DD)
    series?: string;
    blocks: BloquePredica[];
    hymnApertura?: string; // número de himno como texto, ej. "19"
    hymnCierre?: string;
    hymnIntermedios?: string[];
    createdAt: Date;
    updatedAt: Date;
  }

  export {Himno, Lista, listaDetail, BloquePredica, Predica}
