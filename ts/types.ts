import { listaDetail } from "./interfaces";

type RootStackParamList = {
    HimnoDetail?: { number: number | string };
    ListDetail?: { listId: string; name?: string };
    PresentationMode?: { lista: listaDetail };
    BibleReader?: { translationId: string; bookId: string; chapter: number; verse?: number };
}

  export {RootStackParamList}