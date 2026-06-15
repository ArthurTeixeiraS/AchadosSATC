import {
  collection,
  doc,
  getDocs,
  updateDoc,
  query,
  where,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/firebaseConfig";


export interface Chave {
  id: string;
  codigo: string;
  descricao: string;
  localizacao: string;
  isArquivado: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface CreateChaveDTO {
  codigo: string;
  descricao: string;
  localizacao: string;
}

export interface UpdateChaveDTO {
  descricao: string;
  localizacao: string;
}

const NOME_COLECAO = "chaves";

function normalizarCodigo(codigo: string) {
  return codigo.normalize("NFKC").trim().toUpperCase();
}

function getChaveIdPorCodigo(codigo: string) {
  return `codigo_${encodeURIComponent(codigo)}`;
}

async function verificarCodigoDuplicado(codigo: string): Promise<boolean> {
  const chavesRef = collection(db, NOME_COLECAO);
  const q = query(chavesRef, where("codigo", "==", codigo));
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
}

export async function cadastrarChave(data: CreateChaveDTO): Promise<void> {
  const codigoFormatado = normalizarCodigo(data.codigo);

  // Mantém compatibilidade com registros antigos que possuem ID automático.
  const isDuplicado = await verificarCodigoDuplicado(codigoFormatado);
  if (isDuplicado) {
    throw new Error("DUPLICATE_CODE");
  }

  const chaveRef = doc(
    db,
    NOME_COLECAO,
    getChaveIdPorCodigo(codigoFormatado)
  );

  await runTransaction(db, async (transaction) => {
    const chaveSnapshot = await transaction.get(chaveRef);

    if (chaveSnapshot.exists()) {
      throw new Error("DUPLICATE_CODE");
    }

    transaction.set(chaveRef, {
      codigo: codigoFormatado,
      descricao: data.descricao.trim(),
      localizacao: data.localizacao.trim(),
      isArquivado: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}

export async function listarChaves(
  trazerArquivadas?: boolean
): Promise<Chave[]> {
  const snapshot = await getDocs(collection(db, NOME_COLECAO));
  const chaves = snapshot.docs.map((document) => {
    const dados = document.data();

    return {
      id: document.id,
      codigo: dados.codigo || "",
      localizacao: dados.localizacao || "",
      descricao: dados.descricao || "",
      // Registros anteriores ao arquivamento lógico continuam ativos.
      isArquivado: dados.isArquivado === true,
      createdAt: dados.createdAt || null,
      updatedAt: dados.updatedAt || null,
    } as Chave;
  });

  if (trazerArquivadas === undefined) {
    return chaves;
  }

  return chaves.filter(
    (chave) => chave.isArquivado === trazerArquivadas
  );
}


export async function editarChave(chaveId: string, data: UpdateChaveDTO): Promise<void> {
  try {
    const chaveRef = doc(db, NOME_COLECAO, chaveId);
    await updateDoc(chaveRef, {
      descricao: data.descricao.trim(),
      localizacao: data.localizacao.trim(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Erro ao editar chave no serviço:", error);
    throw error;
  }
}


export async function alternarArquivamentoChave(id: string, novoStatus: boolean): Promise<void> {
  try {
    const chaveRef = doc(db, NOME_COLECAO, id); 
    await updateDoc(chaveRef, {
      isArquivado: novoStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Erro ao alternar arquivamento da chave no serviço:", error);
    throw error;
  }
}


export async function arquivarChave(chaveId: string): Promise<void> {
  return alternarArquivamentoChave(chaveId, true);
}

export async function desarquivarChave(chaveId: string): Promise<void> {
  return alternarArquivamentoChave(chaveId, false);
}
