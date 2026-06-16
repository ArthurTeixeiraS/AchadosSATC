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
import { AppUser } from "../../types/User";
import {
  CreateKeyDTO,
  Key,
  KeyMovement,
  KeyMovementActor,
  UpdateKeyDTO,
} from "../../types/Key";

const COLLECTION_NAME = "chaves";
const MOVEMENT_COLLECTION_NAME = "movimentacoes";
const USER_COLLECTION_NAME = "usuarios";

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
    emprestada: data.emprestada === true,
    movimentacaoAbertaId: data.movimentacaoAbertaId ?? null,
    professorAtualId: data.professorAtualId ?? null,
    professorAtualNome: data.professorAtualNome ?? null,
    professorAtualCracha: data.professorAtualCracha ?? null,
    retiradaEm: data.retiradaEm ?? null,
    retiradaPorId: data.retiradaPorId ?? null,
    retiradaPorNome: data.retiradaPorNome ?? null,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
}

function mapMovement(id: string, data: Record<string, any>): KeyMovement {
  return {
    id,
    tipo: data.tipo || "CHAVE",
    chaveId: data.chaveId || "",
    chaveCodigo: data.chaveCodigo || "",
    chaveLocalizacao: data.chaveLocalizacao || "",
    professor: data.professor || { id: "", nome: "" },
    retiradaPor: data.retiradaPor || { id: "", nome: "" },
    retiradaEm: data.retiradaEm || null,
    devolvidaPor: data.devolvidaPor || null,
    devolvidaEm: data.devolvidaEm || null,
    status: data.status || "EM_ABERTO",
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
}

function getActor(user: AppUser): KeyMovementActor {
  return {
    id: user.id,
    nome: user.nomeCompleto,
    cracha: user.cracha ?? null,
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
      emprestada: false,
      movimentacaoAbertaId: null,
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
    await runTransaction(db, async (transaction) => {
      const keySnapshot = await transaction.get(keyRef);

      if (!keySnapshot.exists()) {
        throw new Error("KEY_NOT_FOUND");
      }

      const key = mapKey(keySnapshot.id, keySnapshot.data());

      if (isArchived && key.emprestada) {
        throw new Error("KEY_BORROWED");
      }

      transaction.update(keyRef, {
        isArquivado: isArchived,
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    console.error("Erro ao alterar arquivamento da chave:", error);
    throw error;
  }
}

export async function listProfessors(): Promise<KeyMovementActor[]> {
  const professorQuery = query(
    collection(db, USER_COLLECTION_NAME),
    where("tipoUsuario", "==", "PROFESSOR")
  );
  const snapshot = await getDocs(professorQuery);

  return snapshot.docs
    .map((document) => {
      const data = document.data();
      return {
        id: document.id,
        nome: data.nomeCompleto || "",
        cracha: data.cracha || null,
        statusConta: data.statusConta ?? "ATIVO",
      };
    })
    .filter((professor) => professor.statusConta === "ATIVO")
    .map(({ statusConta, ...professor }) => professor)
    .sort((a, b) => a.nome.localeCompare(b.nome));
}

export async function withdrawKey(
  keyId: string,
  professor: KeyMovementActor,
  employee: AppUser
): Promise<string> {
  const keyRef = doc(db, COLLECTION_NAME, keyId);
  const movementRef = doc(collection(db, MOVEMENT_COLLECTION_NAME));
  const employeeActor = getActor(employee);

  await runTransaction(db, async (transaction) => {
    const keySnapshot = await transaction.get(keyRef);

    if (!keySnapshot.exists()) {
      throw new Error("KEY_NOT_FOUND");
    }

    const key = mapKey(keySnapshot.id, keySnapshot.data());

    if (key.isArquivado) {
      throw new Error("KEY_ARCHIVED");
    }

    if (key.emprestada || key.movimentacaoAbertaId) {
      throw new Error("KEY_ALREADY_BORROWED");
    }

    transaction.set(movementRef, {
      tipo: "CHAVE",
      chaveId: key.id,
      chaveCodigo: key.codigo,
      chaveLocalizacao: key.localizacao,
      professor,
      retiradaPor: employeeActor,
      retiradaEm: serverTimestamp(),
      devolvidaPor: null,
      devolvidaEm: null,
      status: "EM_ABERTO",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    transaction.update(keyRef, {
      emprestada: true,
      movimentacaoAbertaId: movementRef.id,
      professorAtualId: professor.id,
      professorAtualNome: professor.nome,
      professorAtualCracha: professor.cracha ?? null,
      retiradaEm: serverTimestamp(),
      retiradaPorId: employee.id,
      retiradaPorNome: employee.nomeCompleto,
      updatedAt: serverTimestamp(),
    });
  });

  return movementRef.id;
}

export async function returnKey(
  keyId: string,
  employee: AppUser
): Promise<void> {
  const keyRef = doc(db, COLLECTION_NAME, keyId);
  const employeeActor = getActor(employee);

  await runTransaction(db, async (transaction) => {
    const keySnapshot = await transaction.get(keyRef);

    if (!keySnapshot.exists()) {
      throw new Error("KEY_NOT_FOUND");
    }

    const key = mapKey(keySnapshot.id, keySnapshot.data());

    if (!key.emprestada || !key.movimentacaoAbertaId) {
      throw new Error("KEY_NOT_BORROWED");
    }

    const movementRef = doc(
      db,
      MOVEMENT_COLLECTION_NAME,
      key.movimentacaoAbertaId
    );
    const movementSnapshot = await transaction.get(movementRef);

    if (!movementSnapshot.exists()) {
      throw new Error("MOVEMENT_NOT_FOUND");
    }

    const movement = mapMovement(
      movementSnapshot.id,
      movementSnapshot.data()
    );

    if (movement.status === "DEVOLVIDA" || movement.devolvidaEm) {
      throw new Error("KEY_ALREADY_RETURNED");
    }

    transaction.update(movementRef, {
      devolvidaPor: employeeActor,
      devolvidaEm: serverTimestamp(),
      status: "DEVOLVIDA",
      updatedAt: serverTimestamp(),
    });
    transaction.update(keyRef, {
      emprestada: false,
      movimentacaoAbertaId: null,
      professorAtualId: null,
      professorAtualNome: null,
      professorAtualCracha: null,
      retiradaEm: null,
      retiradaPorId: null,
      retiradaPorNome: null,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function listKeyMovements(
  keyId?: string
): Promise<KeyMovement[]> {
  const snapshot = await getDocs(collection(db, MOVEMENT_COLLECTION_NAME));
  const movements = snapshot.docs
    .filter((document) => document.data().tipo === "CHAVE")
    .map((document) => mapMovement(document.id, document.data()))
    .filter((movement) => !keyId || movement.chaveId === keyId);

  return movements.sort(
    (a, b) =>
      (b.retiradaEm?.toMillis?.() ?? b.createdAt?.toMillis?.() ?? 0) -
      (a.retiradaEm?.toMillis?.() ?? a.createdAt?.toMillis?.() ?? 0)
  );
}
