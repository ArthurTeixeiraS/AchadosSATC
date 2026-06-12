import {
  collection,
  DocumentData,
  DocumentReference,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
  writeBatch,
  doc,
  getDoc,
} from "firebase/firestore";

import { db } from "../firebase/firebaseConfig";
import { AppUser } from "../../types/User";
import {
  Solicitation,
  SolicitationDraft,
  SolicitationShift,
  SolicitationStatus,
  SolicitationReturnInput,
  SolicitationTool,
} from "../../types/Solicitation";
import {
  AUDIT_COLLECTION_NAME,
  createAuditEventData,
  getSolicitationAuditItems,
} from "./solicitationAuditServices";

const COLLECTION_NAME = "solicitacoes";
const RESOURCE_COLLECTION_NAME = "recursos";

export type DashboardStats = {
  pendentes: number;
  novas: number;
  encerradas: number;
};

const SHIFT_END_TIME: Record<
  SolicitationShift,
  { hours: number; minutes: number }
> = {
  TARDE: { hours: 18, minutes: 0 },
  NOITE: { hours: 22, minutes: 0 },
};

type BusinessErrorCode =
  | "INVALID_STATUS"
  | "NO_RESOURCES"
  | "MACHINE_CONFLICT"
  | "INSUFFICIENT_STOCK"
  | "RESOURCE_NOT_FOUND"
  | "INVALID_RETURN";

export class SolicitationBusinessError extends Error {
  constructor(
    public code: BusinessErrorCode,
    message: string,
    public items: string[] = []
  ) {
    super(message);
    this.name = "SolicitationBusinessError";
  }
}

function parseBrazilianDate(date: string): Date {
  const [day, month, year] = date.split("/").map(Number);

  return new Date(year, month - 1, day, 23, 59, 59);
}

function calculateSolicitationPriority(dataUtilizacao: string) {
  const now = new Date();
  const useDate = parseBrazilianDate(dataUtilizacao);

  const diffInMs = useDate.getTime() - now.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);

  return diffInHours < 48 ? "IMEDIATA" : "NORMAL";
}

function getShiftEndDate(
  dataUtilizacao: string,
  turno: SolicitationShift
): Date | null {
  const [day, month, year] = dataUtilizacao.split("/").map(Number);
  const endTime = SHIFT_END_TIME[turno];

  if (!day || !month || !year || !endTime) {
    return null;
  }

  return new Date(
    year,
    month - 1,
    day,
    endTime.hours,
    endTime.minutes,
    0
  );
}

export function isSolicitationOverdue(
  solicitation: Pick<Solicitation, "status" | "dataUtilizacao" | "turno">,
  now = new Date()
): boolean {
  if (solicitation.status !== "EM_USO") {
    return false;
  }

  const shiftEndDate = getShiftEndDate(
    solicitation.dataUtilizacao,
    solicitation.turno
  );

  return shiftEndDate ? now.getTime() > shiftEndDate.getTime() : false;
}

function mapSolicitation(id: string, data: DocumentData): Solicitation {
  const solicitation = {
    id,
    ...data,
  } as Solicitation;
  const isLegacyFinished = solicitation.status === "ENCERRADA";

  return {
    ...solicitation,
    maquinas: (solicitation.maquinas ?? []).map((machine) => ({
      ...machine,
      devolvida: machine.devolvida ?? isLegacyFinished,
    })),
    ferramentas: (solicitation.ferramentas ?? []).map((tool) => ({
      ...tool,
      quantidadeDevolvida:
        tool.quantidadeDevolvida ??
        (isLegacyFinished ? Number(tool.quantidade) || 0 : 0),
    })),
    atrasada: isSolicitationOverdue(solicitation),
  };
}

function assertStatus(
  currentStatus: SolicitationStatus,
  expectedStatus: SolicitationStatus,
  action: string
) {
  if (currentStatus !== expectedStatus) {
    throw new SolicitationBusinessError(
      "INVALID_STATUS",
      `A solicitação precisa estar com status ${expectedStatus} para ${action}.`
    );
  }
}

function formatValidationItems(title: string, items: string[]) {
  return `${title}\n\n${items.map((item) => `• ${item}`).join("\n")}`;
}

function getToolReferences(tools: SolicitationTool[]) {
  return tools.map((tool) => ({
    tool,
    reference: doc(
      db,
      RESOURCE_COLLECTION_NAME,
      tool.recursoId
    ) as DocumentReference<DocumentData>,
  }));
}

function getMachineReservationReferences(solicitation: Solicitation) {
  return solicitation.maquinas.map((machine) => ({
    machine,
    reservationKey: getReservationKey(
      solicitation.dataUtilizacao,
      solicitation.turno
    ),
    reference: doc(
      db,
      RESOURCE_COLLECTION_NAME,
      machine.recursoId
    ),
  }));
}

function getReservationKey(
  dataUtilizacao: string,
  turno: SolicitationShift
) {
  const dateKey = dataUtilizacao.replace(/\D/g, "");

  return `${dateKey}_${turno}`;
}

function getStockReservations(
  data: DocumentData,
  reservationKey: string
): Record<string, number> {
  const reservations = data.reservasEstoque?.[reservationKey];

  if (!reservations || typeof reservations !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(reservations).map(([solicitationId, quantity]) => [
      solicitationId,
      Number(quantity) || 0,
    ])
  );
}

export async function validateDraftMachineAvailability(
  draft: SolicitationDraft
): Promise<void> {
  if (!draft.turno || draft.maquinasSelecionadas.length === 0) {
    return;
  }

  const snapshot = await getDocs(collection(db, COLLECTION_NAME));
  const requestedMachineIds = new Set(
    draft.maquinasSelecionadas.map((item) => item.resource.id)
  );
  const conflictingMachineNames = new Set<string>();

  snapshot.docs.forEach((document) => {
    const solicitation = document.data();
    const isSamePeriod =
      solicitation.dataUtilizacao === draft.dataUtilizacao &&
      solicitation.turno === draft.turno;
    const occupiesResources = ["APROVADA", "EM_USO"].includes(
      solicitation.status
    );

    if (!isSamePeriod || !occupiesResources) {
      return;
    }

    const machines =
      (solicitation.maquinas as Solicitation["maquinas"]) ?? [];

    machines.forEach((machine) => {
      if (requestedMachineIds.has(machine.recursoId)) {
        conflictingMachineNames.add(machine.nome);
      }
    });
  });

  if (conflictingMachineNames.size > 0) {
    const items = [...conflictingMachineNames];

    throw new SolicitationBusinessError(
      "MACHINE_CONFLICT",
      formatValidationItems("Máquinas indisponíveis no período:", items),
      items
    );
  }
}

export async function validateDraftToolAvailability(
  draft: SolicitationDraft
): Promise<void> {
  if (!draft.turno || draft.ferramentasSelecionadas.length === 0) {
    return;
  }

  const solicitationsSnapshot = await getDocs(
    collection(db, COLLECTION_NAME)
  );
  const reservedToolsByResourceId = new Map<string, number>();

  solicitationsSnapshot.docs.forEach((document) => {
    const solicitation = document.data();
    const isSamePeriod =
      solicitation.dataUtilizacao === draft.dataUtilizacao &&
      solicitation.turno === draft.turno;

    if (!isSamePeriod || solicitation.status !== "APROVADA") {
      return;
    }

    const tools =
      (solicitation.ferramentas as Solicitation["ferramentas"]) ?? [];

    tools.forEach((tool) => {
      reservedToolsByResourceId.set(
        tool.recursoId,
        (reservedToolsByResourceId.get(tool.recursoId) ?? 0) +
          Number(tool.quantidade ?? 0)
      );
    });
  });

  const reservationKey = getReservationKey(
    draft.dataUtilizacao,
    draft.turno
  );
  const toolReferences = draft.ferramentasSelecionadas.map((item) => ({
    selectedTool: item,
    reference: doc(db, RESOURCE_COLLECTION_NAME, item.resource.id),
  }));
  const toolSnapshots = await Promise.all(
    toolReferences.map(({ reference }) => getDoc(reference))
  );
  const unavailableTools: string[] = [];

  toolSnapshots.forEach((toolSnapshot, index) => {
    const toolReference = toolReferences[index];

    if (!toolReference) {
      return;
    }

    if (!toolSnapshot.exists()) {
      unavailableTools.push(
        `${toolReference.selectedTool.resource.nome} (recurso não encontrado)`
      );
      return;
    }

    const availableQuantity = Number(
      toolSnapshot.data().quantidadeDisponivel ?? 0
    );
    const stockReservations = getStockReservations(
      toolSnapshot.data(),
      reservationKey
    );
    const reservedQuantity = Math.max(
      Object.values(stockReservations).reduce(
        (total, quantity) => total + quantity,
        0
      ),
      reservedToolsByResourceId.get(
        toolReference.selectedTool.resource.id
      ) ?? 0
    );
    const quantityForPeriod = availableQuantity - reservedQuantity;

    if (quantityForPeriod < toolReference.selectedTool.quantidade) {
      unavailableTools.push(
        `${toolReference.selectedTool.resource.nome} (disponível no período: ${Math.max(
          quantityForPeriod,
          0
        )}, solicitada: ${toolReference.selectedTool.quantidade})`
      );
    }
  });

  if (unavailableTools.length > 0) {
    throw new SolicitationBusinessError(
      "INSUFFICIENT_STOCK",
      formatValidationItems("Estoque insuficiente:", unavailableTools),
      unavailableTools
    );
  }
}

export async function createSolicitation(
  draft: SolicitationDraft,
  professor: AppUser
): Promise<string> {
  const hasResources =
    draft.maquinasSelecionadas.length > 0 ||
    draft.ferramentasSelecionadas.length > 0;

  if (!hasResources) {
    throw new SolicitationBusinessError(
      "NO_RESOURCES",
      "Adicione pelo menos uma máquina ou ferramenta antes de enviar."
    );
  }

  await Promise.all([
    validateDraftMachineAvailability(draft),
    validateDraftToolAvailability(draft),
  ]);

  const solicitacoesRef = collection(db, COLLECTION_NAME);

  const laboratoriosIds = [
    ...new Set(
      draft.maquinasSelecionadas
        .map((item) => item.resource.laboratorioId)
        .filter(Boolean)
    ),
  ];

  const maquinas = draft.maquinasSelecionadas.map((item) => ({
    recursoId: item.resource.id,
    nome: item.resource.nome,
    laboratorioId: item.resource.laboratorioId ?? null,
    devolvida: false,
  }));

  const ferramentas = draft.ferramentasSelecionadas.map((item) => ({
    recursoId: item.resource.id,
    nome: item.resource.nome,
    quantidade: item.quantidade,
    quantidadeDevolvida: 0,
  }));

  const solicitationRef = doc(solicitacoesRef);
  const auditRef = doc(
    collection(solicitationRef, AUDIT_COLLECTION_NAME)
  );
  const batch = writeBatch(db);

  batch.set(solicitationRef, {
    professorId: professor.id,
    professorNome: professor.nomeCompleto,
    professorCracha: professor.cracha,
    status: "PENDENTE",
    prioridade: calculateSolicitationPriority(draft.dataUtilizacao),
    dataUtilizacao: draft.dataUtilizacao,
    turno: draft.turno,
    atividade: draft.atividade,
    observacoes: draft.observacoes,
    laboratoriosIds,
    maquinas,
    ferramentas,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.set(auditRef, {
    ...createAuditEventData({
      solicitationId: solicitationRef.id,
      type: "CRIACAO",
      actor: {
        id: professor.id,
        nome: professor.nomeCompleto,
        perfil: professor.tipoUsuario,
      },
      newStatus: "PENDENTE",
      items: [
        ...maquinas.map((machine) => ({
          recursoId: machine.recursoId,
          nome: machine.nome,
          tipo: "MAQUINA" as const,
          quantidade: 1,
        })),
        ...ferramentas.map((tool) => ({
          recursoId: tool.recursoId,
          nome: tool.nome,
          tipo: "FERRAMENTA" as const,
          quantidade: tool.quantidade,
        })),
      ],
    }),
    createdAt: serverTimestamp(),
  });

  await batch.commit();

  return solicitationRef.id;
}

export async function listSolicitations(): Promise<Solicitation[]> {
  const solicitacoesRef = collection(db, COLLECTION_NAME);

  const snapshot = await getDocs(solicitacoesRef);

  return snapshot.docs.map((snapshot) =>
    mapSolicitation(snapshot.id, snapshot.data())
  );
}

function getCurrentWeekRange() {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return { startOfWeek, endOfWeek };
}

function calculateDashboardStats(
  documents: readonly { data: () => DocumentData }[]
): DashboardStats {
  const { startOfWeek, endOfWeek } = getCurrentWeekRange();
  const currentWeek = documents.filter((document) => {
    const data = document.data();

    if (!data.createdAt) {
      return false;
    }

    const createdAt = data.createdAt.toDate();
    return createdAt >= startOfWeek && createdAt <= endOfWeek;
  });

  return {
    pendentes: currentWeek.filter(
      (document) => document.data().status === "PENDENTE"
    ).length,
    novas: currentWeek.filter(
      (document) => document.data().status === "APROVADA"
    ).length,
    encerradas: currentWeek.filter(
      (document) => document.data().status === "ENCERRADA"
    ).length,
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const snapshot = await getDocs(collection(db, COLLECTION_NAME));

  return calculateDashboardStats(snapshot.docs);
}

export function subscribeDashboardStats(
  callback: (stats: DashboardStats) => void
) {
  const solicitacoesRef = collection(db, COLLECTION_NAME);

  return onSnapshot(solicitacoesRef, (snapshot) => {
    callback(calculateDashboardStats(snapshot.docs));
  });
}

export async function cancelSolicitation(
  id: string,
  professor: AppUser
): Promise<void> {
  const solicitationRef = doc(db, COLLECTION_NAME, id);
  const auditRef = doc(
    collection(solicitationRef, AUDIT_COLLECTION_NAME)
  );

  await runTransaction(db, async (transaction) => {
    const solicitationSnapshot = await transaction.get(solicitationRef);

    if (!solicitationSnapshot.exists()) {
      throw new SolicitationBusinessError(
        "RESOURCE_NOT_FOUND",
        "Solicitação não encontrada."
      );
    }

    const solicitation = mapSolicitation(
      solicitationSnapshot.id,
      solicitationSnapshot.data()
    );

    assertStatus(solicitation.status, "PENDENTE", "cancelar");

    transaction.update(solicitationRef, {
      status: "CANCELADA",
      canceladaEm: serverTimestamp(),
      canceladaPorId: professor.id,
      canceladaPorNome: professor.nomeCompleto,
      updatedAt: serverTimestamp(),
    });

    transaction.set(auditRef, {
      ...createAuditEventData({
        solicitationId: solicitation.id,
        type: "CANCELAMENTO",
        actor: {
          id: professor.id,
          nome: professor.nomeCompleto,
          perfil: professor.tipoUsuario,
        },
        previousStatus: solicitation.status,
        newStatus: "CANCELADA",
      }),
      createdAt: serverTimestamp(),
    });
  });
}

export async function listSolicitationsByProfessor(
  professorId: string
): Promise<Solicitation[]> {
  const solicitacoesRef = collection(db, COLLECTION_NAME);

  const q = query(
    solicitacoesRef,
    where("professorId", "==", professorId)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((document) =>
    mapSolicitation(document.id, document.data())
  );
}

export async function getSolicitationById(
  id: string
): Promise<Solicitation | null> {
  const solicitationRef = doc(db, COLLECTION_NAME, id);

  const snapshot = await getDoc(solicitationRef);

  if (!snapshot.exists()) {
    return null;
  }

  return mapSolicitation(snapshot.id, snapshot.data());
}

export async function approveSolicitation(
  id: string,
  funcionario: AppUser
): Promise<void> {
  const solicitationRef = doc(db, COLLECTION_NAME, id);
  const auditRef = doc(
    collection(solicitationRef, AUDIT_COLLECTION_NAME)
  );

  await runTransaction(db, async (transaction) => {
    const solicitationSnapshot = await transaction.get(solicitationRef);

    if (!solicitationSnapshot.exists()) {
      throw new SolicitationBusinessError(
        "RESOURCE_NOT_FOUND",
        "Solicitação não encontrada."
      );
    }

    const solicitation = mapSolicitation(
      solicitationSnapshot.id,
      solicitationSnapshot.data()
    );

    assertStatus(solicitation.status, "PENDENTE", "aprovar");

    const occupiedSolicitationsSnapshot = await getDocs(
      collection(db, COLLECTION_NAME)
    );
    const requestedMachineIds = new Set(
      solicitation.maquinas.map((machine) => machine.recursoId)
    );
    const conflictingMachineNames = new Set<string>();
    const reservedToolsByResourceId = new Map<string, number>();

    occupiedSolicitationsSnapshot.docs.forEach((occupiedDocument) => {
      if (occupiedDocument.id === solicitation.id) {
        return;
      }

      const occupiedSolicitation = occupiedDocument.data();
      const isSamePeriod =
        occupiedSolicitation.dataUtilizacao === solicitation.dataUtilizacao &&
        occupiedSolicitation.turno === solicitation.turno;
      const occupiesResources = ["APROVADA", "EM_USO"].includes(
        occupiedSolicitation.status
      );

      if (!isSamePeriod || !occupiesResources) {
        return;
      }

      const occupiedMachines =
        (occupiedSolicitation.maquinas as Solicitation["maquinas"]) ?? [];

      occupiedMachines.forEach((machine) => {
        if (requestedMachineIds.has(machine.recursoId)) {
          conflictingMachineNames.add(machine.nome);
        }
      });

      if (occupiedSolicitation.status === "APROVADA") {
        const occupiedTools =
          (occupiedSolicitation.ferramentas as Solicitation["ferramentas"]) ??
          [];

        occupiedTools.forEach((tool) => {
          reservedToolsByResourceId.set(
            tool.recursoId,
            (reservedToolsByResourceId.get(tool.recursoId) ?? 0) +
              Number(tool.quantidade ?? 0)
          );
        });
      }
    });

    if (conflictingMachineNames.size > 0) {
      const items = [...conflictingMachineNames];

      throw new SolicitationBusinessError(
        "MACHINE_CONFLICT",
        formatValidationItems("Máquinas indisponíveis no período:", items),
        items
      );
    }

    const toolReferences = getToolReferences(solicitation.ferramentas);
    const machineReservationReferences =
      getMachineReservationReferences(solicitation);
    const toolSnapshots = await Promise.all(
      toolReferences.map(({ reference }) => transaction.get(reference))
    );
    const machineReservationSnapshots = await Promise.all(
      machineReservationReferences.map(({ reference }) =>
        transaction.get(reference)
      )
    );
    const unavailableTools: string[] = [];
    const reservationKey = getReservationKey(
      solicitation.dataUtilizacao,
      solicitation.turno
    );

    machineReservationSnapshots.forEach((reservationSnapshot, index) => {
      const reservation = machineReservationReferences[index];

      if (!reservation) {
        return;
      }

      if (!reservationSnapshot.exists()) {
        conflictingMachineNames.add(
          `${reservation.machine.nome} (recurso não encontrado)`
        );
        return;
      }

      const reservations = reservationSnapshot.data().reservas ?? {};
      const reservedSolicitationId =
        reservations[reservation.reservationKey];

      if (
        reservedSolicitationId &&
        reservedSolicitationId !== solicitation.id
      ) {
        conflictingMachineNames.add(reservation.machine.nome);
      }
    });

    if (conflictingMachineNames.size > 0) {
      const items = [...conflictingMachineNames];

      throw new SolicitationBusinessError(
        "MACHINE_CONFLICT",
        formatValidationItems("Máquinas indisponíveis no período:", items),
        items
      );
    }

    toolSnapshots.forEach((toolSnapshot, index) => {
      const toolReference = toolReferences[index];

      if (!toolReference) {
        return;
      }

      const requestedTool = toolReference.tool;

      if (!toolSnapshot.exists()) {
        unavailableTools.push(`${requestedTool.nome} (recurso não encontrado)`);
        return;
      }

      const availableQuantity = Number(
        toolSnapshot.data().quantidadeDisponivel ?? 0
      );
      const stockReservations = getStockReservations(
        toolSnapshot.data(),
        reservationKey
      );
      const reservedQuantity = Math.max(
        Object.values(stockReservations).reduce(
          (total, quantity) => total + quantity,
          0
        ),
        reservedToolsByResourceId.get(requestedTool.recursoId) ?? 0
      );
      const quantityForPeriod = availableQuantity - reservedQuantity;

      if (quantityForPeriod < requestedTool.quantidade) {
        unavailableTools.push(
          `${requestedTool.nome} (disponível no período: ${Math.max(
            quantityForPeriod,
            0
          )}, solicitada: ${requestedTool.quantidade})`
        );
      }
    });

    if (unavailableTools.length > 0) {
      throw new SolicitationBusinessError(
        "INSUFFICIENT_STOCK",
        formatValidationItems("Estoque insuficiente:", unavailableTools),
        unavailableTools
      );
    }

    machineReservationReferences.forEach((reservation, index) => {
      const reservationSnapshot = machineReservationSnapshots[index];

      if (!reservationSnapshot?.exists()) {
        return;
      }

      transaction.update(reservation.reference, {
        reservas: {
          ...(reservationSnapshot.data().reservas ?? {}),
          [reservation.reservationKey]: solicitation.id,
        },
        updatedAt: serverTimestamp(),
      });
    });

    toolReferences.forEach((toolReference, index) => {
      const toolSnapshot = toolSnapshots[index];

      if (!toolSnapshot?.exists()) {
        return;
      }

      const stockReservations = {
        ...(toolSnapshot.data().reservasEstoque ?? {}),
      };
      const periodReservations = {
        ...getStockReservations(toolSnapshot.data(), reservationKey),
        [solicitation.id]: toolReference.tool.quantidade,
      };

      transaction.update(toolReference.reference, {
        reservasEstoque: {
          ...stockReservations,
          [reservationKey]: periodReservations,
        },
        updatedAt: serverTimestamp(),
      });
    });

    transaction.update(solicitationRef, {
      status: "APROVADA",
      aprovadaEm: serverTimestamp(),
      aprovadaPorId: funcionario.id,
      aprovadaPorNome: funcionario.nomeCompleto,
      updatedAt: serverTimestamp(),
    });

    transaction.set(auditRef, {
      ...createAuditEventData({
        solicitationId: solicitation.id,
        type: "APROVACAO",
        actor: {
          id: funcionario.id,
          nome: funcionario.nomeCompleto,
          perfil: funcionario.tipoUsuario,
        },
        previousStatus: solicitation.status,
        newStatus: "APROVADA",
      }),
      createdAt: serverTimestamp(),
    });
  });
}

export async function rejectSolicitation(
  id: string,
  funcionario: AppUser,
  motivo: string
): Promise<void> {
  const solicitationRef = doc(db, COLLECTION_NAME, id);
  const auditRef = doc(
    collection(solicitationRef, AUDIT_COLLECTION_NAME)
  );

  await runTransaction(db, async (transaction) => {
    const solicitationSnapshot = await transaction.get(solicitationRef);

    if (!solicitationSnapshot.exists()) {
      throw new SolicitationBusinessError(
        "RESOURCE_NOT_FOUND",
        "Solicitação não encontrada."
      );
    }

    const solicitation = mapSolicitation(
      solicitationSnapshot.id,
      solicitationSnapshot.data()
    );

    assertStatus(solicitation.status, "PENDENTE", "recusar");

    transaction.update(solicitationRef, {
      status: "RECUSADA",
      motivoRecusa: motivo,
      recusadaEm: serverTimestamp(),
      recusadaPorId: funcionario.id,
      recusadaPorNome: funcionario.nomeCompleto,
      updatedAt: serverTimestamp(),
    });

    transaction.set(auditRef, {
      ...createAuditEventData({
        solicitationId: solicitation.id,
        type: "RECUSA",
        actor: {
          id: funcionario.id,
          nome: funcionario.nomeCompleto,
          perfil: funcionario.tipoUsuario,
        },
        previousStatus: solicitation.status,
        newStatus: "RECUSADA",
        reason: motivo,
      }),
      createdAt: serverTimestamp(),
    });
  });
}

export async function registerSolicitationWithdrawal(
  id: string,
  funcionario: AppUser
): Promise<void> {
  const solicitationRef = doc(db, COLLECTION_NAME, id);
  const auditRef = doc(
    collection(solicitationRef, AUDIT_COLLECTION_NAME)
  );

  await runTransaction(db, async (transaction) => {
    const solicitationSnapshot = await transaction.get(solicitationRef);

    if (!solicitationSnapshot.exists()) {
      throw new SolicitationBusinessError(
        "RESOURCE_NOT_FOUND",
        "Solicitação não encontrada."
      );
    }

    const solicitation = mapSolicitation(
      solicitationSnapshot.id,
      solicitationSnapshot.data()
    );

    assertStatus(solicitation.status, "APROVADA", "registrar a retirada");

    const toolReferences = getToolReferences(solicitation.ferramentas);
    const reservationKey = getReservationKey(
      solicitation.dataUtilizacao,
      solicitation.turno
    );
    const toolSnapshots = await Promise.all(
      toolReferences.map(({ reference }) => transaction.get(reference))
    );
    const unavailableTools: string[] = [];

    toolSnapshots.forEach((toolSnapshot, index) => {
      const toolReference = toolReferences[index];

      if (!toolReference) {
        return;
      }

      const requestedTool = toolReference.tool;

      if (!toolSnapshot.exists()) {
        unavailableTools.push(`${requestedTool.nome} (recurso não encontrado)`);
        return;
      }

      const availableQuantity = Number(
        toolSnapshot.data().quantidadeDisponivel ?? 0
      );

      if (availableQuantity < requestedTool.quantidade) {
        unavailableTools.push(
          `${requestedTool.nome} (disponível: ${availableQuantity}, solicitada: ${requestedTool.quantidade})`
        );
      }
    });

    if (unavailableTools.length > 0) {
      throw new SolicitationBusinessError(
        "INSUFFICIENT_STOCK",
        formatValidationItems(
          "Não foi possível registrar a retirada. Estoque insuficiente:",
          unavailableTools
        ),
        unavailableTools
      );
    }

    toolSnapshots.forEach((toolSnapshot, index) => {
      const toolReference = toolReferences[index];

      if (!toolReference || !toolSnapshot.exists()) {
        return;
      }

      const requestedTool = toolReference.tool;
      const availableQuantity = Number(
        toolSnapshot.data().quantidadeDisponivel ?? 0
      );
      const stockReservations = {
        ...(toolSnapshot.data().reservasEstoque ?? {}),
      };
      const periodReservations = {
        ...getStockReservations(toolSnapshot.data(), reservationKey),
      };

      delete periodReservations[solicitation.id];

      if (Object.keys(periodReservations).length === 0) {
        delete stockReservations[reservationKey];
      } else {
        stockReservations[reservationKey] = periodReservations;
      }

      transaction.update(toolReference.reference, {
        quantidadeDisponivel: availableQuantity - requestedTool.quantidade,
        reservasEstoque: stockReservations,
        updatedAt: serverTimestamp(),
      });
    });

    transaction.update(solicitationRef, {
      status: "EM_USO",
      retiradaEm: serverTimestamp(),
      retiradaPorId: funcionario.id,
      retiradaPorNome: funcionario.nomeCompleto,
      updatedAt: serverTimestamp(),
    });

    transaction.set(auditRef, {
      ...createAuditEventData({
        solicitationId: solicitation.id,
        type: "RETIRADA",
        actor: {
          id: funcionario.id,
          nome: funcionario.nomeCompleto,
          perfil: funcionario.tipoUsuario,
        },
        previousStatus: solicitation.status,
        newStatus: "EM_USO",
        items: getSolicitationAuditItems(solicitation),
      }),
      createdAt: serverTimestamp(),
    });
  });
}

export async function registerSolicitationReturn(
  id: string,
  funcionario: AppUser,
  input: SolicitationReturnInput
): Promise<void> {
  const solicitationRef = doc(db, COLLECTION_NAME, id);
  const auditRef = doc(
    collection(solicitationRef, AUDIT_COLLECTION_NAME)
  );

  await runTransaction(db, async (transaction) => {
    const solicitationSnapshot = await transaction.get(solicitationRef);

    if (!solicitationSnapshot.exists()) {
      throw new SolicitationBusinessError(
        "RESOURCE_NOT_FOUND",
        "Solicitação não encontrada."
      );
    }

    const solicitation = mapSolicitation(
      solicitationSnapshot.id,
      solicitationSnapshot.data()
    );

    assertStatus(solicitation.status, "EM_USO", "registrar a devolução");

    const uniqueMachineIds = new Set(input.maquinasIds);
    const uniqueToolIds = new Set(
      input.ferramentas.map((tool) => tool.recursoId)
    );

    if (
      input.maquinasIds.length !== uniqueMachineIds.size ||
      input.ferramentas.length !== uniqueToolIds.size
    ) {
      throw new SolicitationBusinessError(
        "INVALID_RETURN",
        "Existem recursos repetidos nesta devolução."
      );
    }

    if (uniqueMachineIds.size === 0 && input.ferramentas.length === 0) {
      throw new SolicitationBusinessError(
        "INVALID_RETURN",
        "Selecione pelo menos um recurso para devolver."
      );
    }

    const selectedMachines = solicitation.maquinas.filter((machine) =>
      uniqueMachineIds.has(machine.recursoId)
    );

    if (selectedMachines.length !== uniqueMachineIds.size) {
      throw new SolicitationBusinessError(
        "INVALID_RETURN",
        "Uma ou mais máquinas selecionadas não pertencem à solicitação."
      );
    }

    const alreadyReturnedMachine = selectedMachines.find(
      (machine) => machine.devolvida
    );

    if (alreadyReturnedMachine) {
      throw new SolicitationBusinessError(
        "INVALID_RETURN",
        `A máquina ${alreadyReturnedMachine.nome} já foi devolvida.`
      );
    }

    const selectedTools = input.ferramentas.map((returnedTool) => {
      const requestedTool = solicitation.ferramentas.find(
        (tool) => tool.recursoId === returnedTool.recursoId
      );

      if (!requestedTool) {
        throw new SolicitationBusinessError(
          "INVALID_RETURN",
          "Uma ou mais ferramentas selecionadas não pertencem à solicitação."
        );
      }

      const quantity = Number(returnedTool.quantidade);
      const returnedQuantity = Number(
        requestedTool.quantidadeDevolvida ?? 0
      );
      const pendingQuantity =
        Number(requestedTool.quantidade) - returnedQuantity;

      if (
        !Number.isInteger(quantity) ||
        quantity <= 0 ||
        quantity > pendingQuantity
      ) {
        throw new SolicitationBusinessError(
          "INVALID_RETURN",
          `Quantidade inválida para ${requestedTool.nome}. Pendente: ${pendingQuantity}.`
        );
      }

      return {
        requestedTool,
        quantity,
      };
    });

    const toolReferences = selectedTools.map(({ requestedTool }) => ({
      tool: requestedTool,
      reference: doc(
        db,
        RESOURCE_COLLECTION_NAME,
        requestedTool.recursoId
      ) as DocumentReference<DocumentData>,
    }));
    const machineReservationReferences = selectedMachines.map((machine) => ({
      machine,
      reservationKey: getReservationKey(
        solicitation.dataUtilizacao,
        solicitation.turno
      ),
      reference: doc(db, RESOURCE_COLLECTION_NAME, machine.recursoId),
    }));
    const toolSnapshots = await Promise.all(
      toolReferences.map(({ reference }) => transaction.get(reference))
    );
    const machineReservationSnapshots = await Promise.all(
      machineReservationReferences.map(({ reference }) =>
        transaction.get(reference)
      )
    );

    toolSnapshots.forEach((toolSnapshot, index) => {
      const toolReference = toolReferences[index];

      if (!toolReference) {
        return;
      }

      if (!toolSnapshot.exists()) {
        throw new SolicitationBusinessError(
          "RESOURCE_NOT_FOUND",
          `A ferramenta ${toolReference.tool.nome} não foi encontrada.`
        );
      }
    });

    machineReservationSnapshots.forEach((machineSnapshot, index) => {
      const reservation = machineReservationReferences[index];

      if (reservation && !machineSnapshot.exists()) {
        throw new SolicitationBusinessError(
          "RESOURCE_NOT_FOUND",
          `A máquina ${reservation.machine.nome} não foi encontrada.`
        );
      }
    });

    toolSnapshots.forEach((toolSnapshot, index) => {
      const toolReference = toolReferences[index];

      if (!toolReference || !toolSnapshot.exists()) {
        return;
      }

      const requestedTool = toolReference.tool;
      const returnedTool = selectedTools[index];

      if (!returnedTool) {
        return;
      }
      const availableQuantity = Number(
        toolSnapshot.data().quantidadeDisponivel ?? 0
      );
      const totalQuantity = Number(
        toolSnapshot.data().quantidadeTotal ??
          availableQuantity + requestedTool.quantidade
      );

      transaction.update(toolReference.reference, {
        quantidadeDisponivel: Math.min(
          availableQuantity + returnedTool.quantity,
          totalQuantity
        ),
        updatedAt: serverTimestamp(),
      });
    });

    machineReservationReferences.forEach((reservation, index) => {
      const reservationSnapshot = machineReservationSnapshots[index];

      if (!reservationSnapshot?.exists()) {
        return;
      }

      const reservations = {
        ...(reservationSnapshot.data().reservas ?? {}),
      };

      if (reservations[reservation.reservationKey] === solicitation.id) {
        delete reservations[reservation.reservationKey];
      }

      transaction.update(reservation.reference, {
        reservas: reservations,
        updatedAt: serverTimestamp(),
      });
    });

    const updatedMachines = solicitation.maquinas.map((machine) =>
      uniqueMachineIds.has(machine.recursoId)
        ? { ...machine, devolvida: true }
        : machine
    );
    const returnedToolsById = new Map(
      selectedTools.map(({ requestedTool, quantity }) => [
        requestedTool.recursoId,
        quantity,
      ])
    );
    const updatedTools = solicitation.ferramentas.map((tool) => ({
      ...tool,
      quantidadeDevolvida:
        Number(tool.quantidadeDevolvida ?? 0) +
        (returnedToolsById.get(tool.recursoId) ?? 0),
    }));
    const allReturned =
      updatedMachines.every((machine) => machine.devolvida) &&
      updatedTools.every(
        (tool) =>
          Number(tool.quantidadeDevolvida ?? 0) >= Number(tool.quantidade)
      );
    const newStatus: SolicitationStatus = allReturned
      ? "ENCERRADA"
      : "EM_USO";
    const returnedItems = [
      ...selectedMachines.map((machine) => ({
        recursoId: machine.recursoId,
        nome: machine.nome,
        tipo: "MAQUINA" as const,
        quantidade: 1,
      })),
      ...selectedTools.map(({ requestedTool, quantity }) => ({
        recursoId: requestedTool.recursoId,
        nome: requestedTool.nome,
        tipo: "FERRAMENTA" as const,
        quantidade: quantity,
      })),
    ];

    transaction.update(solicitationRef, {
      maquinas: updatedMachines,
      ferramentas: updatedTools,
      status: newStatus,
      ...(allReturned
        ? {
            devolvidaEm: serverTimestamp(),
            devolvidaPorId: funcionario.id,
            devolvidaPorNome: funcionario.nomeCompleto,
          }
        : {}),
      updatedAt: serverTimestamp(),
    });

    transaction.set(auditRef, {
      ...createAuditEventData({
        solicitationId: solicitation.id,
        type: allReturned
          ? "DEVOLUCAO_INTEGRAL"
          : "DEVOLUCAO_PARCIAL",
        actor: {
          id: funcionario.id,
          nome: funcionario.nomeCompleto,
          perfil: funcionario.tipoUsuario,
        },
        previousStatus: solicitation.status,
        newStatus,
        items: returnedItems,
      }),
      createdAt: serverTimestamp(),
    });
  });
}
