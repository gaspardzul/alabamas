import { listaDetail } from "./interfaces";

type RootStackParamList = {
    HimnoDetail?: { number: number };
    ListDetail?: { lista: listaDetail};
    PresentationMode?: { lista: listaDetail };
}

  export {RootStackParamList}