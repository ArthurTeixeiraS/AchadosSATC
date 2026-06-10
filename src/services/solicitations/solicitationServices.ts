import {
  addDoc,
  collection,
  DocumentData,
  DocumentReference,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
  updateDoc,
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
  SolicitationTool,
} from "../../types/Solicitation";

const COLLECTION_NAME = "solicitacoes";
const RESOURCE_COLLECTION_NAME = "recursos";

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
  | "RESOURCE_NOT_FOUND";

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

  return {
    ...solicitation,
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
      `Máquinas indisponíveis no período: ${items.join(", ")}.`,
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
      `Estoque insuficiente: ${unavailableTools.join("; ")}.`,
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
  }));

  const ferramentas = draft.ferramentasSelecionadas.map((item) => ({
    recursoId: item.resource.id,
    nome: item.resource.nome,
    quantidade: item.quantidade,
  }));

  const docRef = await addDoc(solicitacoesRef, {
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

  return docRef.id;
}

export async function listSolicitations(): Promise<Solicitation[]> {
  const solicitacoesRef = collection(db, COLLECTION_NAME);

  const snapshot = await getDocs(solicitacoesRef);

  return snapshot.docs.map((snapshot) =>
    mapSolicitation(snapshot.id, snapshot.data())
  );
}

export function subscribeDashboardStats(
  callback: (stats: { pendentes: number; novas: number; encerradas: number }) => void
) {
  const solicitacoesRef = collection(db, COLLECTION_NAME);

  const hoje = new Date();
  const inicioDaSemana = new Date(hoje);
  inicioDaSemana.setDate(hoje.getDate() - hoje.getDay());
  inicioDaSemana.setHours(0, 0, 0, 0);

  const fimDaSemana = new Date(inicioDaSemana);
  fimDaSemana.setDate(inicioDaSemana.getDate() + 6);
  fimDaSemana.setHours(23, 59, 59, 999);

  return onSnapshot(solicitacoesRef, (snapshot) => {
    const daSemana = snapshot.docs.filter((doc) => {
      const data = doc.data();
      if (!data.createdAt) return false;
      const createdAt = data.createdAt.toDate();
      return createdAt >= inicioDaSemana && createdAt <= fimDaSemana;
    });

    const pendentes = daSemana.filter(
      (doc) => doc.data().status === "PENDENTE"
    ).length;

    const novas = daSemana.filter(
      (doc) => doc.data().status === "APROVADA"
    ).length;

    const encerradas = daSemana.filter(
      (doc) => doc.data().status === "ENCERRADA"
    ).length;

    callback({ pendentes, novas, encerradas });
  });
}

export async function cancelSolicitation(id: string): Promise<void> {
  const solicitationRef = doc(db, COLLECTION_NAME, id);

  await updateDoc(solicitationRef, {
    status: "CANCELADA",
    canceladaEm: serverTimestamp(),
    updatedAt: serverTimestamp(),
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
  funcionarioId: string,
  funcionarioNome: string
): Promise<void> {
  const solicitationRef = doc(db, COLLECTION_NAME, id);

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
        `Máquinas indisponíveis no período: ${items.join(", ")}.`,
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
        `Máquinas indisponíveis no período: ${items.join(", ")}.`,
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
        `Estoque insuficiente: ${unavailableTools.join("; ")}.`,
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
      aprovadaPorId: funcionarioId,
      aprovadaPorNome: funcionarioNome,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function rejectSolicitation(
  id: string,
  funcionarioId: string,
  funcionarioNome: string,
  motivo: string
): Promise<void> {
  const solicitationRef = doc(db, COLLECTION_NAME, id);

  await updateDoc(solicitationRef, {
    status: "RECUSADA",
    motivoRecusa: motivo,
    recusadaEm: serverTimestamp(),
    recusadaPorId: funcionarioId,
    recusadaPorNome: funcionarioNome,
    updatedAt: serverTimestamp(),
  });
}

export async function registerSolicitationWithdrawal(
  id: string,
  funcionarioId: string,
  funcionarioNome: string
): Promise<void> {
  const solicitationRef = doc(db, COLLECTION_NAME, id);

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
        `Não foi possível registrar a retirada. Estoque insuficiente: ${unavailableTools.join("; ")}.`,
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
      retiradaPorId: funcionarioId,
      retiradaPorNome: funcionarioNome,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function registerSolicitationReturn(
  id: string,
  funcionarioId: string,
  funcionarioNome: string
): Promise<void> {
  const solicitationRef = doc(db, COLLECTION_NAME, id);

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

    toolSnapshots.forEach((toolSnapshot, index) => {
      const toolReference = toolReferences[index];

      if (!toolReference || !toolSnapshot.exists()) {
        return;
      }

      const requestedTool = toolReference.tool;
      const availableQuantity = Number(
        toolSnapshot.data().quantidadeDisponivel ?? 0
      );
      const totalQuantity = Number(
        toolSnapshot.data().quantidadeTotal ??
          availableQuantity + requestedTool.quantidade
      );

      transaction.update(toolReference.reference, {
        quantidadeDisponivel: Math.min(
          availableQuantity + requestedTool.quantidade,
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

    transaction.update(solicitationRef, {
      status: "ENCERRADA",
      devolvidaEm: serverTimestamp(),
      devolvidaPorId: funcionarioId,
      devolvidaPorNome: funcionarioNome,
      updatedAt: serverTimestamp(),
    });
  });
}
