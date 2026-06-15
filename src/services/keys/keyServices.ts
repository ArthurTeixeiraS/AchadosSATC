import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../firebase/firebaseConfig";
import { CreateKeyDTO, Key, UpdateKeyDTO } from "../../types/Key";

const COLLECTION_NAME = "chaves";

function normalizeKeyCode(codigo: string) {
  return codigo.normalize("NFKC").trim().toUpperCase();
}

function getKeyIdByCode(codigo: string) {
  return `codigo_${encodeURIComponent(codigo)}`;
}

function mapKey(id: string, data: Record<string, any>): Key {
  return {
    id,
    codigo: data.codigo || "",
    localizacao: data.localizacao || "",
    descricao: data.descricao || "",
    isArquivado: data.isArquivado === true,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
}

async function keyCodeExists(codigo: string): Promise<boolean> {
  const keysRef = collection(db, COLLECTION_NAME);
  const keyQuery = query(keysRef, where("codigo", "==", codigo));
  const snapshot = await getDocs(keyQuery);
  return !snapshot.empty;
}

export async function createKey(data: CreateKeyDTO): Promise<void> {
  const normalizedCode = normalizeKeyCode(data.codigo);

  // Mantem compatibilidade com registros antigos que possuem ID automatico.
  if (await keyCodeExists(normalizedCode)) {
    throw new Error("DUPLICATE_CODE");
  }

  const keyRef = doc(
    db,
    COLLECTION_NAME,
    getKeyIdByCode(normalizedCode)
  );

  await runTransaction(db, async (transaction) => {
    const keySnapshot = await transaction.get(keyRef);

    if (keySnapshot.exists()) {
      throw new Error("DUPLICATE_CODE");
    }

    transaction.set(keyRef, {
      codigo: normalizedCode,
      descricao: data.descricao.trim(),
      localizacao: data.localizacao.trim(),
      isArquivado: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}

export async function listKeys(
  archived?: boolean
): Promise<Key[]> {
  const snapshot = await getDocs(collection(db, COLLECTION_NAME));
  const keys = snapshot.docs.map((document) =>
    mapKey(document.id, document.data())
  );

  if (archived === undefined) {
    return keys;
  }

  return keys.filter((key) => key.isArquivado === archived);
}

export async function getKeyById(
  keyId: string
): Promise<Key | null> {
  const snapshot = await getDoc(doc(db, COLLECTION_NAME, keyId));

  if (!snapshot.exists()) {
    return null;
  }

  return mapKey(snapshot.id, snapshot.data());
}

export async function updateKey(
  keyId: string,
  data: UpdateKeyDTO
): Promise<void> {
  try {
    const keyRef = doc(db, COLLECTION_NAME, keyId);
    await updateDoc(keyRef, {
      descricao: data.descricao.trim(),
      localizacao: data.localizacao.trim(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Erro ao editar chave no servico:", error);
    throw error;
  }
}

export async function setKeyArchived(
  keyId: string,
  isArchived: boolean
): Promise<void> {
  try {
    const keyRef = doc(db, COLLECTION_NAME, keyId);
    await updateDoc(keyRef, {
      isArquivado: isArchived,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Erro ao alterar arquivamento da chave:", error);
    throw error;
  }
}
