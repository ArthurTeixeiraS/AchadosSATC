import {
  collection,
  deleteField,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";

import { db } from "../firebase/firebaseConfig";
import { AppUser } from "../../types/User";
import {
  Occurrence,
  OccurrenceEvent,
  OccurrenceEventType,
  OccurrenceStatus,
} from "../../types/Occurrence";
import { Resource } from "../../types/Resources";
import { AUDIT_COLLECTION_NAME } from "../solicitations/solicitationAuditServices";

const COLLECTION_NAME = "ocorrencias";
const RESOURCE_COLLECTION_NAME = "recursos";
const SOLICITATION_COLLECTION_NAME = "solicitacoes";

export class OccurrenceBusinessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OccurrenceBusinessError";
  }
}

function getActor(user: AppUser) {
  return {
    id: user.id,
    nome: user.nomeCompleto,
    perfil: user.tipoUsuario,
  };
}

function assertEmployee(user: AppUser) {
  if (user.tipoUsuario !== "FUNCIONARIO") {
    throw new OccurrenceBusinessError(
      "Apenas funcionários podem realizar esta operação."
    );
  }
}

function mapOccurrence(id: string, data: DocumentData) {
  return { id, ...data } as Occurrence;
}

function getTimestampMillis(value?: Occurrence["createdAt"]) {
  if (!value) return 0;
  return value.toDate
    ? value.toDate().getTime()
    : value.seconds * 1000;
}

function createEventData({
  occurrenceId,
  occurrence,
  type,
  user,
  summary,
  observation,
  previousStatus,
  newStatus,
}: {
  occurrenceId: string;
  occurrence: Pick<Occurrence, "recurso">;
  type: OccurrenceEventType;
  user: AppUser;
  summary: string;
  observation?: string;
  previousStatus?: OccurrenceStatus;
  newStatus?: OccurrenceStatus;
}) {
  return {
    entidadeTipo: "OCORRENCIA" as const,
    entidadeId: occurrenceId,
    tipo: type,
    resumo: summary,
    responsavel: getActor(user),
    recursoId: occurrence.recurso.id,
    recursoNome: occurrence.recurso.nome,
    recursoTipo: occurrence.recurso.tipo,
    ...(observation ? { observacao: observation } : {}),
    ...(previousStatus ? { statusAnterior: previousStatus } : {}),
    ...(newStatus ? { statusNovo: newStatus } : {}),
  };
}

function hasReservations(data: DocumentData) {
  const machineReservations = Object.keys(data.reservas ?? {}).length > 0;
  const stockReservations = Object.values(
    data.reservasEstoque ?? {}
  ).some(
    (period) =>
      period &&
      typeof period === "object" &&
      Object.keys(period as Record<string, number>).length > 0
  );
  const total = Number(data.quantidadeTotal);
  const available = Number(data.quantidadeDisponivel);
  const hasWithdrawnStock =
    Number.isFinite(total) &&
    Number.isFinite(available) &&
    available < total;

  return machineReservations || stockReservations || hasWithdrawnStock;
}

function hasActiveSolicitationAllocation(
  solicitationDocuments: DocumentData[],
  resourceId: string
) {
  return solicitationDocuments.some((solicitation) => {
    if (
      !["APROVADA", "ALTERACAO_PENDENTE", "EM_USO"].includes(
        solicitation.status
      )
    ) {
      return false;
    }

    const hasMachine = (solicitation.maquinas ?? []).some(
      (machine: DocumentData) =>
        machine.recursoId === resourceId &&
        (solicitation.status !== "EM_USO" || machine.devolvida !== true)
    );
    const hasTool = (solicitation.ferramentas ?? []).some(
      (tool: DocumentData) =>
        tool.recursoId === resourceId &&
        Number(tool.quantidade ?? 0) -
          Number(tool.quantidadeDevolvida ?? 0) >
          0
    );
    const hasLaboratory = (solicitation.laboratoriosIds ?? []).includes(
      resourceId
    );

    return hasMachine || hasTool || hasLaboratory;
  });
}

export async function listOccurrences(user: AppUser) {
  const reference = collection(db, COLLECTION_NAME);
  const occurrencesQuery =
    user.tipoUsuario === "FUNCIONARIO"
      ? reference
      : query(reference, where("autor.id", "==", user.id));
  const snapshot = await getDocs(occurrencesQuery);

  return snapshot.docs
    .map((document) => mapOccurrence(document.id, document.data()))
    .sort(
      (a, b) =>
        getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt)
    );
}

export async function getOccurrenceById(id: string) {
  const snapshot = await getDoc(doc(db, COLLECTION_NAME, id));
  return snapshot.exists()
    ? mapOccurrence(snapshot.id, snapshot.data())
    : null;
}

export async function listOccurrenceEvents(id: string) {
  const snapshot = await getDocs(
    query(
      collection(db, COLLECTION_NAME, id, AUDIT_COLLECTION_NAME),
      orderBy("createdAt", "asc")
    )
  );

  return snapshot.docs.map(
    (document) =>
      ({ id: document.id, ...document.data() }) as OccurrenceEvent
  );
}

export async function createOccurrence(
  resource: Resource,
  description: string,
  user: AppUser
) {
  const trimmedDescription = description.trim();

  if (!trimmedDescription) {
    throw new OccurrenceBusinessError("Informe a descrição do problema.");
  }

  const occurrenceRef = doc(collection(db, COLLECTION_NAME));
  const eventRef = doc(
    collection(occurrenceRef, AUDIT_COLLECTION_NAME)
  );
  const occurrence = {
    recurso: {
      id: resource.id,
      nome: resource.nome,
      tipo: resource.tipo,
      status: resource.status,
      ...(resource.patrimonio
        ? { patrimonio: resource.patrimonio }
        : {}),
      ...(resource.localizacao
        ? { localizacao: resource.localizacao }
        : {}),
    },
    descricao: trimmedDescription,
    status: "ABERTA" as const,
    autor: getActor(user),
  };
  const batch = writeBatch(db);

  batch.set(occurrenceRef, {
    ...occurrence,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(eventRef, {
    ...createEventData({
      occurrenceId: occurrenceRef.id,
      occurrence,
      type: "OCORRENCIA_CRIACAO",
      user,
      summary: `Ocorrência aberta para ${resource.nome}.`,
      newStatus: "ABERTA",
      observation: trimmedDescription,
    }),
    createdAt: serverTimestamp(),
  });
  await batch.commit();

  return occurrenceRef.id;
}

export async function addOccurrenceComment(
  id: string,
  observation: string,
  user: AppUser
) {
  assertEmployee(user);
  const text = observation.trim();
  if (!text) {
    throw new OccurrenceBusinessError("Informe uma observação.");
  }

  const occurrenceRef = doc(db, COLLECTION_NAME, id);
  const eventRef = doc(
    collection(occurrenceRef, AUDIT_COLLECTION_NAME)
  );

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(occurrenceRef);
    if (!snapshot.exists()) {
      throw new OccurrenceBusinessError("Ocorrência não encontrada.");
    }

    const occurrence = mapOccurrence(snapshot.id, snapshot.data());
    if (occurrence.status === "ENCERRADA") {
      throw new OccurrenceBusinessError(
        "Não é possível comentar uma ocorrência encerrada."
      );
    }

    transaction.update(occurrenceRef, { updatedAt: serverTimestamp() });
    transaction.set(eventRef, {
      ...createEventData({
        occurrenceId: id,
        occurrence,
        type: "OCORRENCIA_COMENTARIO",
        user,
        summary: "Observação administrativa adicionada.",
        observation: text,
      }),
      createdAt: serverTimestamp(),
    });
  });
}

export async function advanceOccurrenceStatus(
  id: string,
  observation: string,
  user: AppUser
) {
  assertEmployee(user);
  const text = observation.trim();
  if (!text) {
    throw new OccurrenceBusinessError(
      "Informe uma observação para alterar o status."
    );
  }

  const occurrenceRef = doc(db, COLLECTION_NAME, id);
  const eventRef = doc(
    collection(occurrenceRef, AUDIT_COLLECTION_NAME)
  );

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(occurrenceRef);
    if (!snapshot.exists()) {
      throw new OccurrenceBusinessError("Ocorrência não encontrada.");
    }

    const occurrence = mapOccurrence(snapshot.id, snapshot.data());
    const newStatus =
      occurrence.status === "ABERTA"
        ? "EM_ANALISE"
        : occurrence.status === "EM_ANALISE"
          ? "ENCERRADA"
          : null;

    if (!newStatus) {
      throw new OccurrenceBusinessError(
        "A ocorrência já está encerrada."
      );
    }

    const actor = getActor(user);
    transaction.update(occurrenceRef, {
      status: newStatus,
      ...(newStatus === "EM_ANALISE"
        ? {
            emAnalisePor: actor,
            emAnaliseEm: serverTimestamp(),
          }
        : {
            encerradaPor: actor,
            encerradaEm: serverTimestamp(),
          }),
      updatedAt: serverTimestamp(),
    });
    transaction.set(eventRef, {
      ...createEventData({
        occurrenceId: id,
        occurrence,
        type: "OCORRENCIA_STATUS_ALTERADO",
        user,
        summary:
          newStatus === "EM_ANALISE"
            ? "Ocorrência encaminhada para análise."
            : "Ocorrência encerrada.",
        observation: text,
        previousStatus: occurrence.status,
        newStatus,
      }),
      createdAt: serverTimestamp(),
    });
  });
}

export async function setOccurrenceMaintenance(
  id: string,
  enabled: boolean,
  user: AppUser
) {
  assertEmployee(user);
  const occurrenceRef = doc(db, COLLECTION_NAME, id);
  const eventRef = doc(
    collection(occurrenceRef, AUDIT_COLLECTION_NAME)
  );
  const [occurrenceBeforeTransaction, solicitationSnapshot] = enabled
    ? await Promise.all([
        getDoc(occurrenceRef),
        getDocs(collection(db, SOLICITATION_COLLECTION_NAME)),
      ])
    : [null, null];

  if (enabled && !occurrenceBeforeTransaction?.exists()) {
    throw new OccurrenceBusinessError("Ocorrência não encontrada.");
  }

  const occurrenceResource =
    occurrenceBeforeTransaction?.exists()
      ? occurrenceBeforeTransaction.data().recurso
      : undefined;
  const activeSolicitations =
    solicitationSnapshot?.docs.map((document) => document.data()) ?? [];
  const linkedMachineSnapshot =
    enabled && occurrenceResource?.tipo === "LABORATORIO"
      ? await getDocs(
          query(
            collection(db, RESOURCE_COLLECTION_NAME),
            where("laboratorioId", "==", occurrenceResource.id)
          )
        )
      : null;
  const linkedMachineRefs =
    linkedMachineSnapshot?.docs.map((document) => document.ref) ?? [];

  await runTransaction(db, async (transaction) => {
    const occurrenceSnapshot = await transaction.get(occurrenceRef);
    if (!occurrenceSnapshot.exists()) {
      throw new OccurrenceBusinessError("Ocorrência não encontrada.");
    }

    const occurrence = mapOccurrence(
      occurrenceSnapshot.id,
      occurrenceSnapshot.data()
    );

    if (
      enabled &&
      occurrenceResource &&
      occurrence.recurso.id !== occurrenceResource.id
    ) {
      throw new OccurrenceBusinessError(
        "O recurso relacionado à ocorrência foi alterado. Tente novamente."
      );
    }

    const resourceRef = doc(
      db,
      RESOURCE_COLLECTION_NAME,
      occurrence.recurso.id
    );
    const resourceSnapshot = await transaction.get(resourceRef);
    const linkedMachineSnapshots = enabled
      ? await Promise.all(
          linkedMachineRefs.map((reference) =>
            transaction.get(reference)
          )
        )
      : [];

    if (!resourceSnapshot.exists()) {
      throw new OccurrenceBusinessError("Recurso não encontrado.");
    }

    const resourceData = resourceSnapshot.data();

    if (enabled) {
      if (occurrence.status !== "EM_ANALISE") {
        throw new OccurrenceBusinessError(
          "A ocorrência precisa estar em análise para ativar a manutenção."
        );
      }
      if (resourceData.status === "MANUTENCAO") {
        throw new OccurrenceBusinessError(
          "O recurso já está em manutenção."
        );
      }
      if (resourceData.status !== "DISPONIVEL") {
        throw new OccurrenceBusinessError(
          "O recurso precisa estar disponível para entrar em manutenção."
        );
      }
      if (
        hasReservations(resourceData) ||
        linkedMachineSnapshots.some(
          (snapshot) =>
            snapshot.exists() && hasReservations(snapshot.data())
        ) ||
        hasActiveSolicitationAllocation(
          activeSolicitations,
          occurrence.recurso.id
        )
      ) {
        throw new OccurrenceBusinessError(
          "O recurso possui reservas ou itens em uso e não pode entrar em manutenção."
        );
      }

      transaction.update(resourceRef, {
        status: "MANUTENCAO",
        manutencaoOcorrenciaId: id,
        updatedAt: serverTimestamp(),
      });
      transaction.update(occurrenceRef, {
        manutencaoAtiva: true,
        updatedAt: serverTimestamp(),
      });
    } else {
      if (resourceData.manutencaoOcorrenciaId !== id) {
        throw new OccurrenceBusinessError(
          "A manutenção deste recurso pertence a outra ocorrência."
        );
      }

      transaction.update(resourceRef, {
        status: "DISPONIVEL",
        manutencaoOcorrenciaId: deleteField(),
        updatedAt: serverTimestamp(),
      });
      transaction.update(occurrenceRef, {
        manutencaoAtiva: false,
        updatedAt: serverTimestamp(),
      });
    }

    transaction.set(eventRef, {
      ...createEventData({
        occurrenceId: id,
        occurrence,
        type: enabled
          ? "MANUTENCAO_ATIVADA"
          : "MANUTENCAO_DESATIVADA",
        user,
        summary: enabled
          ? `${occurrence.recurso.nome} foi colocado em manutenção.`
          : `${occurrence.recurso.nome} foi retirado da manutenção.`,
      }),
      createdAt: serverTimestamp(),
    });
  });
}
