interface Himno {
    title: string;
    number: number;
    group?: string[];
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