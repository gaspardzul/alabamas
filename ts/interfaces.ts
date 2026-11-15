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

  export {Himno, Lista, listaDetail}