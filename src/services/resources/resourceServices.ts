import {
  collection,
  getDocs,
  query,
  serverTimestamp,
  doc,
  where,
  getDoc,
  runTransaction,
  writeBatch,
} from "firebase/firestore";

import { db } from "../firebase/firebaseConfig";
import { CreateResourceDTO, Resource } from "../../types/Resources";
import { AppUser } from "../../types/User";
import { AUDIT_COLLECTION_NAME } from "../solicitations/solicitationAuditServices";
import {
  createResourceAuditEventData,
  getResourceAuditChanges,
} from "./resourceAuditServices";

const COLLECTION_NAME = "recursos";

function removeUndefinedFields<T extends Record<string, any>>(data: T) {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  );
}


function getActor(user: AppUser) {
  return {
    id: user.id,
    nome: user.nomeCompleto,
    perfil: user.tipoUsuario,
  };
}

export async function createResource(
  data: CreateResourceDTO,
  user: AppUser
): Promise<string> {
  const recursosRef = collection(db, COLLECTION_NAME);
  const resourceRef = doc(recursosRef);
  const auditRef = doc(collection(resourceRef, AUDIT_COLLECTION_NAME));
  const cleanData = removeUndefinedFields(data);
  const batch = writeBatch(db);

  batch.set(resourceRef, {
    ...cleanData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(auditRef, {
    ...createResourceAuditEventData({
      resourceId: resourceRef.id,
      resourceName: data.nome,
      resourceType: data.tipo,
      type: "RECURSO_CRIACAO",
      actor: getActor(user),
      summary: `${data.nome} foi cadastrado no inventário.`,
    }),
    createdAt: serverTimestamp(),
  });
  await batch.commit();

  return resourceRef.id;
}

export async function updateResource(
  id: string,
  data: Partial<CreateResourceDTO>,
  user: AppUser
): Promise<void> {
  const resourceRef = doc(db, COLLECTION_NAME, id);
  const editAuditRef = doc(collection(resourceRef, AUDIT_COLLECTION_NAME));
  const stockAuditRef = doc(collection(resourceRef, AUDIT_COLLECTION_NAME));
  const cleanData = removeUndefinedFields(data);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(resourceRef);

    if (!snapshot.exists()) {
      throw new Error("Recurso não encontrado.");
    }

    const previous = {
      id: snapshot.id,
      ...snapshot.data(),
    } as Resource;
    const changes = getResourceAuditChanges(previous, cleanData);
    const stockChanges = changes.filter((change) =>
      ["Quantidade total", "Quantidade disponível"].includes(change.campo)
    );
    const resourceChanges = changes.filter(
      (change) =>
        !["Quantidade total", "Quantidade disponível"].includes(
          change.campo
        )
    );

    transaction.update(resourceRef, {
      ...cleanData,
      updatedAt: serverTimestamp(),
    });

    if (resourceChanges.length > 0) {
      transaction.set(editAuditRef, {
        ...createResourceAuditEventData({
          resourceId: id,
          resourceName: data.nome ?? previous.nome,
          resourceType: previous.tipo,
          type: "RECURSO_EDICAO",
          actor: getActor(user),
          summary: `${data.nome ?? previous.nome} teve seus dados atualizados.`,
          changes: resourceChanges,
        }),
        createdAt: serverTimestamp(),
      });
    }

    if (stockChanges.length > 0) {
      transaction.set(stockAuditRef, {
        ...createResourceAuditEventData({
          resourceId: id,
          resourceName: data.nome ?? previous.nome,
          resourceType: previous.tipo,
          type: "ESTOQUE_AJUSTE",
          actor: getActor(user),
          summary: `O estoque de ${data.nome ?? previous.nome} foi ajustado manualmente.`,
          changes: stockChanges,
        }),
        createdAt: serverTimestamp(),
      });
    }
  });
}

export async function listResources(): Promise<Resource[]> {
  const recursosRef = collection(db, "recursos");

  const snapshot = await getDocs(recursosRef);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Resource[];
}


export async function listLaboratories(): Promise<Resource[]> {
  const recursosRef = collection(db, COLLECTION_NAME);

  const q = query(
    recursosRef,
    where("tipo", "==", "LABORATORIO")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Resource[];
}

export async function getResourceById(
  id: string
): Promise<Resource | null> {
  const resourceRef = doc(db, COLLECTION_NAME, id);

  const snapshot = await getDoc(resourceRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as Resource;
}

export async function deleteResource(
  id: string,
  user: AppUser
): Promise<void> {
  const resourceRef = doc(db, COLLECTION_NAME, id);
  const auditRef = doc(collection(resourceRef, AUDIT_COLLECTION_NAME));

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(resourceRef);

    if (!snapshot.exists()) {
      throw new Error("Recurso não encontrado.");
    }

    const resource = {
      id: snapshot.id,
      ...snapshot.data(),
    } as Resource;

    transaction.set(auditRef, {
      ...createResourceAuditEventData({
        resourceId: id,
        resourceName: resource.nome,
        resourceType: resource.tipo,
        type: "RECURSO_REMOCAO",
        actor: getActor(user),
        summary: `${resource.nome} foi removido do inventário.`,
      }),
      createdAt: serverTimestamp(),
    });
    transaction.delete(resourceRef);
  });
}
