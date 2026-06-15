import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp, 
  deleteDoc,
  DocumentData
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


async function verificarCodigoDuplicado(codigo: string): Promise<boolean> {
  const chavesRef = collection(db, NOME_COLECAO);
  const q = query(chavesRef, where("codigo", "==", codigo.trim().toUpperCase()));
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
}


export async function cadastrarChave(data: CreateChaveDTO): Promise<void> {
  const codigoFormatado = data.codigo.trim().toUpperCase(); 

  const isDuplicado = await verificarCodigoDuplicado(codigoFormatado);
  if (isDuplicado) {
    throw new Error("DUPLICATE_CODE"); 
  }

  const chavesRef = collection(db, NOME_COLECAO);

  await addDoc(chavesRef, {
    codigo: codigoFormatado,
    descricao: data.descricao.trim(),
    localizacao: data.localizacao.trim(),
    isArquivado: false, 
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function listarChaves(trazerArquivadas: boolean = false): Promise<Chave[]> {
  try {
    console.log("=== INICIANDO BUSCA NO FIRESTORE ===");
    console.log("Buscando chaves com isArquivado igual a:", trazerArquivadas);

    const chavesRef = collection(db, NOME_COLECAO);
    const q = query(chavesRef, where("isArquivado", "==", trazerArquivadas));
    
    const querySnapshot = await getDocs(q);
    
    console.log("Quantidade de documentos encontrados no banco:", querySnapshot.size);

    const chaves = querySnapshot.docs.map(doc => {
      const dados = doc.data();
      console.log(`Documento ID [${doc.id}] conteúdo:`, dados);
      
      return {
        id: doc.id,
        codigo: dados.codigo || "",
        localizacao: dados.localizacao || "",
        descricao: dados.descricao || "",
        isArquivado: !!dados.isArquivado, // Força a virar booleano puro (true/false)
        createdAt: dados.createdAt || null,
        updatedAt: dados.updatedAt || null,
      };
    }) as Chave[];

    console.log("Total de chaves mapeadas com sucesso:", chaves.length);
    console.log("====================================");
    
    return chaves;
  } catch (error) {
    console.error("ERRO CRÍTICO DENTRO DE listarChaves:", error);
    throw error;
  }
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


export async function excluirChave(id: string): Promise<void> {
  try {
    const chaveRef = doc(db, NOME_COLECAO, id);
    await deleteDoc(chaveRef);
  } catch (error) {
    console.error("Erro ao excluir chave no serviço:", error);
    throw error;
  }
}


export async function arquivarChave(chaveId: string): Promise<void> {
  return alternarArquivamentoChave(chaveId, true);
}

export async function desarquivarChave(chaveId: string): Promise<void> {
  return alternarArquivamentoChave(chaveId, false);
}