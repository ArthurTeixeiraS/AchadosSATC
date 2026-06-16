import {
  collection,
  DocumentData,
  DocumentReference,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  deleteField,
  where,
  writeBatch,
  doc,
  getDoc,
  Timestamp,
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
  SolicitationChangeMachine,
  SolicitationChangeTool,
} from "../../types/Solicitation";
import { Resource } from "../../types/Resources";
import {
  AUDIT_COLLECTION_NAME,
  createAuditEventData,
  getSolicitationAuditItems,
} from "./solicitationAuditServices";
import {
  getActiveEmployeeIds,
  setNotifications,
} from "../notifications/notificationServices";
import { createResourceAuditEventData } from "../resources/resourceAuditServices";

const COLLECTION_NAME = "solicitacoes";
const RESOURCE_COLLECTION_NAME = "recursos";

export type DashboardStats = {
  pendentes: number;
  novas: number;
  encerradas: number;
  emUso: number;
  atrasadas: number;
};

export type ToolPeriodAvailability = {
  resourceId: string;
  totalQuantity: number;
  allocatedQuantity: number;
  availableQuantity: number;
};

export type MachinePeriodAvailability = {
  resourceId: string;
  available: boolean;
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
  | "INVALID_CHANGE"
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
  data: DocumentData | Resource,
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

function getToolCapacity(data: DocumentData | Resource): number {
  const totalQuantity = Number(data.quantidadeTotal);

  if (Number.isFinite(totalQuantity) && totalQuantity >= 0) {
    return totalQuantity;
  }

  const availableQuantity = Number(data.quantidadeDisponivel);

  return Number.isFinite(availableQuantity) && availableQuantity >= 0
    ? availableQuantity
    : 0;
}

function getPendingToolQuantity(tool: SolicitationTool): number {
  const requestedQuantity = Math.max(Number(tool.quantidade) || 0, 0);
  const returnedQuantity = Math.max(
    Number(tool.quantidadeDevolvida) || 0,
    0
  );

  return Math.max(requestedQuantity - returnedQuantity, 0);
}

function getToolAllocationsByResourceId(
  documents: { id: string; data: () => DocumentData }[],
  dataUtilizacao: string,
  turno: SolicitationShift,
  excludedSolicitationId?: string
): Map<string, number> {
  const allocations = new Map<string, number>();

  documents.forEach((document) => {
    if (document.id === excludedSolicitationId) {
      return;
    }

    const solicitation = document.data();
    const isSamePeriod =
      solicitation.dataUtilizacao === dataUtilizacao &&
      solicitation.turno === turno;

    if (
      !isSamePeriod ||
      !["APROVADA", "EM_USO"].includes(solicitation.status)
    ) {
      return;
    }

    const tools =
      (solicitation.ferramentas as Solicitation["ferramentas"]) ?? [];

    tools.forEach((tool) => {
      const quantity =
        solicitation.status === "EM_USO"
          ? getPendingToolQuantity(tool)
          : Math.max(Number(tool.quantidade) || 0, 0);

      allocations.set(
        tool.recursoId,
        (allocations.get(tool.recursoId) ?? 0) + quantity
      );
    });
  });

  return allocations;
}

function getAllocatedMachineIds(
  documents: { id: string; data: () => DocumentData }[],
  dataUtilizacao: string,
  turno: SolicitationShift,
  excludedSolicitationId?: string
): Set<string> {
  const allocatedMachineIds = new Set<string>();

  documents.forEach((document) => {
    if (document.id === excludedSolicitationId) {
      return;
    }

    const solicitation = document.data();
    const isSamePeriod =
      solicitation.dataUtilizacao === dataUtilizacao &&
      solicitation.turno === turno;

    if (
      !isSamePeriod ||
      !["APROVADA", "EM_USO"].includes(solicitation.status)
    ) {
      return;
    }

    const machines =
      (solicitation.maquinas as Solicitation["maquinas"]) ?? [];

    machines.forEach((machine) => {
      if (solicitation.status !== "EM_USO" || !machine.devolvida) {
        allocatedMachineIds.add(machine.recursoId);
      }
    });
  });

  return allocatedMachineIds;
}

function calculateToolPeriodAvailability(
  resourceId: string,
  resourceData: DocumentData | Resource,
  reservationKey: string,
  allocatedBySolicitations: number,
  excludedSolicitationId?: string
): ToolPeriodAvailability {
  const totalQuantity = getToolCapacity(resourceData);
  if (resourceData.status === "MANUTENCAO") {
    return {
      resourceId,
      totalQuantity,
      allocatedQuantity: totalQuantity,
      availableQuantity: 0,
    };
  }
  const stockReservations = getStockReservations(
    resourceData,
    reservationKey
  );
  const reservedByStock = Object.entries(stockReservations).reduce(
    (total, [solicitationId, quantity]) =>
      solicitationId === excludedSolicitationId
        ? total
        : total + quantity,
    0
  );
  const allocatedQuantity = Math.max(
    reservedByStock,
    allocatedBySolicitations
  );

  return {
    resourceId,
    totalQuantity,
    allocatedQuantity,
    availableQuantity: Math.max(totalQuantity - allocatedQuantity, 0),
  };
}

export async function getToolsAvailabilityForPeriod(
  tools: Resource[],
  dataUtilizacao: string,
  turno: SolicitationShift,
  excludedSolicitationId?: string
): Promise<Record<string, ToolPeriodAvailability>> {
  if (!dataUtilizacao || !turno || tools.length === 0) {
    return {};
  }

  const solicitationsSnapshot = await getDocs(
    collection(db, COLLECTION_NAME)
  );
  const allocations = getToolAllocationsByResourceId(
    solicitationsSnapshot.docs,
    dataUtilizacao,
    turno,
    excludedSolicitationId
  );
  const reservationKey = getReservationKey(dataUtilizacao, turno);

  return Object.fromEntries(
    tools.map((tool) => [
      tool.id,
      calculateToolPeriodAvailability(
        tool.id,
        tool,
        reservationKey,
        allocations.get(tool.id) ?? 0,
        excludedSolicitationId
      ),
    ])
  );
}

export async function getMachinesAvailabilityForPeriod(
  machines: Resource[],
  dataUtilizacao: string,
  turno: SolicitationShift,
  excludedSolicitationId?: string
): Promise<Record<string, MachinePeriodAvailability>> {
  if (!dataUtilizacao || !turno || machines.length === 0) {
    return {};
  }

  const solicitationsSnapshot = await getDocs(
    collection(db, COLLECTION_NAME)
  );
  const machineSnapshots = await Promise.all(
    machines.map((machine) =>
      getDoc(doc(db, RESOURCE_COLLECTION_NAME, machine.id))
    )
  );
  const allocatedMachineIds = getAllocatedMachineIds(
    solicitationsSnapshot.docs,
    dataUtilizacao,
    turno,
    excludedSolicitationId
  );
  const reservationKey = getReservationKey(dataUtilizacao, turno);

  return Object.fromEntries(
    machines.map((machine, index) => {
      const machineSnapshot = machineSnapshots[index];
      const machineData = machineSnapshot?.exists()
        ? machineSnapshot.data()
        : null;
      const reservedSolicitationId =
        machineData?.reservas?.[reservationKey];

      return [
        machine.id,
        {
          resourceId: machine.id,
          available:
            machineData !== null &&
            machineData.status !== "MANUTENCAO" &&
            !allocatedMachineIds.has(machine.id) &&
            (!reservedSolicitationId ||
              reservedSolicitationId === excludedSolicitationId),
        },
      ];
    })
  );
}

export async function validateDraftMachineAvailability(
  draft: SolicitationDraft
): Promise<void> {
  if (!draft.turno || draft.maquinasSelecionadas.length === 0) {
    return;
  }

  const requestedMachines = draft.maquinasSelecionadas.map(
    (item) => item.resource
  );
  const availabilityByMachineId =
    await getMachinesAvailabilityForPeriod(
      requestedMachines,
      draft.dataUtilizacao,
      draft.turno
    );
  const conflictingMachineNames = new Set<string>();

  draft.maquinasSelecionadas.forEach(({ resource }) => {
    if (!availabilityByMachineId[resource.id]?.available) {
      conflictingMachineNames.add(resource.nome);
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
  const allocatedToolsByResourceId = getToolAllocationsByResourceId(
    solicitationsSnapshot.docs,
    draft.dataUtilizacao,
    draft.turno
  );

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

    const availability = calculateToolPeriodAvailability(
      toolSnapshot.id,
      toolSnapshot.data(),
      reservationKey,
      allocatedToolsByResourceId.get(
        toolReference.selectedTool.resource.id
      ) ?? 0
    );

    if (
      availability.availableQuantity <
      toolReference.selectedTool.quantidade
    ) {
      unavailableTools.push(
        `${toolReference.selectedTool.resource.nome} (disponível no período: ${Math.max(
          availability.availableQuantity,
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
  const employeeIds = await getActiveEmployeeIds(professor.id);

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
  setNotifications(batch, employeeIds, auditRef.id, {
    tipo: "NOVA_SOLICITACAO",
    solicitacaoId: solicitationRef.id,
    titulo: "Nova solicitação",
    mensagem: `${professor.nomeCompleto} enviou uma nova solicitação para análise.`,
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
  documents: readonly { id: string; data: () => DocumentData }[]
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

  const now = new Date();
  let emUso = 0;
  let atrasadas = 0;

  documents.forEach((document) => {
    const data = document.data();
    if (data.status === "EM_USO") {
      emUso++;
      if (isSolicitationOverdue(data as any, now)) {
        atrasadas++;
      }
    }
  });

  return {
    pendentes: currentWeek.filter(
      (document) =>
        document.data().status === "PENDENTE" ||
        document.data().status === "ALTERACAO_PENDENTE"
    ).length,
    novas: currentWeek.filter(
      (document) => document.data().status === "APROVADA"
    ).length,
    encerradas: currentWeek.filter(
      (document) => document.data().status === "ENCERRADA"
    ).length,
    emUso,
    atrasadas,
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
  const employeeIds = await getActiveEmployeeIds(professor.id);

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
    setNotifications(transaction, employeeIds, auditRef.id, {
      tipo: "SOLICITACAO_CANCELADA",
      solicitacaoId: solicitation.id,
      titulo: "Solicitação cancelada",
      mensagem: `${professor.nomeCompleto} cancelou uma solicitação.`,
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

export async function updateApprovedSolicitation(
  id: string,
  draft: SolicitationDraft,
  professor: AppUser
): Promise<void> {
  const solicitationRef = doc(db, COLLECTION_NAME, id);
  const auditRef = doc(
    collection(solicitationRef, AUDIT_COLLECTION_NAME)
  );
  const employeeIds = await getActiveEmployeeIds(professor.id);
  const occupiedSolicitationsSnapshot = await getDocs(
    collection(db, COLLECTION_NAME)
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

    assertStatus(solicitation.status, "APROVADA", "alterar");

    if (solicitation.professorId !== professor.id) {
      throw new SolicitationBusinessError(
        "INVALID_CHANGE",
        "Somente o professor responsável pode alterar esta solicitação."
      );
    }

    if (
      draft.dataUtilizacao !== solicitation.dataUtilizacao ||
      draft.turno !== solicitation.turno
    ) {
      throw new SolicitationBusinessError(
        "INVALID_CHANGE",
        "A data e o turno de uma solicitação aprovada não podem ser alterados."
      );
    }

    const originalMachines = new Map(
      solicitation.maquinas.map((machine) => [machine.recursoId, machine])
    );
    const originalTools = new Map(
      solicitation.ferramentas.map((tool) => [tool.recursoId, tool])
    );
    const desiredMachines = new Map(
      draft.maquinasSelecionadas.map(({ resource }) => [resource.id, resource])
    );
    const desiredTools = new Map(
      draft.ferramentasSelecionadas.map(({ resource, quantidade }) => [
        resource.id,
        { resource, quantidade },
      ])
    );

    const retainedMachines = solicitation.maquinas.filter((machine) =>
      desiredMachines.has(machine.recursoId)
    );
    const retainedTools = solicitation.ferramentas
      .map((tool) => ({
        ...tool,
        quantidade: Math.min(
          Number(tool.quantidade) || 0,
          desiredTools.get(tool.recursoId)?.quantidade ?? 0
        ),
      }))
      .filter((tool) => tool.quantidade > 0);

    if (retainedMachines.length === 0 && retainedTools.length === 0) {
      throw new SolicitationBusinessError(
        "INVALID_CHANGE",
        "Mantenha ao menos um recurso previamente aprovado na solicitação."
      );
    }

    const addedMachines: SolicitationChangeMachine[] = [
      ...desiredMachines.values(),
    ]
      .filter((resource) => !originalMachines.has(resource.id))
      .map((resource) => ({
        recursoId: resource.id,
        nome: resource.nome,
        laboratorioId: resource.laboratorioId ?? null,
        status: "PENDENTE",
      }));
    const increasedTools: SolicitationChangeTool[] = [
      ...desiredTools.values(),
    ].flatMap(({ resource, quantidade }) => {
      const originalQuantity = Number(
        originalTools.get(resource.id)?.quantidade ?? 0
      );
      const additionalQuantity = quantidade - originalQuantity;

      return additionalQuantity > 0
        ? [{
            recursoId: resource.id,
            nome: resource.nome,
            quantidadeAdicional: additionalQuantity,
            status: "PENDENTE" as const,
          }]
        : [];
    });
    const removedMachines = solicitation.maquinas.filter(
      (machine) => !desiredMachines.has(machine.recursoId)
    );
    const changedToolIds = solicitation.ferramentas
      .filter(
        (tool) =>
          (desiredTools.get(tool.recursoId)?.quantidade ?? 0) <
          Number(tool.quantidade)
      )
      .map((tool) => tool.recursoId);
    const reducedTools = solicitation.ferramentas.flatMap((tool) => {
      const desiredQuantity =
        desiredTools.get(tool.recursoId)?.quantidade ?? 0;
      const reduction = Number(tool.quantidade) - desiredQuantity;

      return reduction > 0
        ? [{ ...tool, reduction }]
        : [];
    });
    const resourceIds = new Set([
      ...addedMachines.map((machine) => machine.recursoId),
      ...removedMachines.map((machine) => machine.recursoId),
      ...increasedTools.map((tool) => tool.recursoId),
      ...changedToolIds,
    ]);
    const resourceReferences = [...resourceIds].map((resourceId) => ({
      resourceId,
      reference: doc(db, RESOURCE_COLLECTION_NAME, resourceId),
    }));
    const resourceSnapshots = await Promise.all(
      resourceReferences.map(({ reference }) => transaction.get(reference))
    );
    const resourcesById = new Map(
      resourceReferences.map(({ resourceId }, index) => [
        resourceId,
        resourceSnapshots[index],
      ])
    );
    const reservationKey = getReservationKey(
      solicitation.dataUtilizacao,
      solicitation.turno
    );
    const allocatedMachineIds = getAllocatedMachineIds(
      occupiedSolicitationsSnapshot.docs,
      solicitation.dataUtilizacao,
      solicitation.turno,
      solicitation.id
    );
    const allocatedToolsByResourceId = getToolAllocationsByResourceId(
      occupiedSolicitationsSnapshot.docs,
      solicitation.dataUtilizacao,
      solicitation.turno,
      solicitation.id
    );
    const unavailableItems: string[] = [];

    addedMachines.forEach((machine) => {
      const snapshot = resourcesById.get(machine.recursoId);
      const reservedBy = snapshot?.data()?.reservas?.[reservationKey];

      if (
        !snapshot?.exists() ||
        allocatedMachineIds.has(machine.recursoId) ||
        (reservedBy && reservedBy !== solicitation.id)
      ) {
        unavailableItems.push(machine.nome);
      }
    });

    increasedTools.forEach((tool) => {
      const snapshot = resourcesById.get(tool.recursoId);

      if (!snapshot?.exists()) {
        unavailableItems.push(tool.nome);
        return;
      }

      const approvedQuantity = Number(
        originalTools.get(tool.recursoId)?.quantidade ?? 0
      );
      const availability = calculateToolPeriodAvailability(
        tool.recursoId,
        snapshot.data(),
        reservationKey,
        allocatedToolsByResourceId.get(tool.recursoId) ?? 0,
        solicitation.id
      );

      if (
        approvedQuantity + tool.quantidadeAdicional >
        availability.availableQuantity
      ) {
        unavailableItems.push(tool.nome);
      }
    });

    if (unavailableItems.length > 0) {
      throw new SolicitationBusinessError(
        "INSUFFICIENT_STOCK",
        formatValidationItems(
          "Recursos indisponíveis para a alteração:",
          unavailableItems
        ),
        unavailableItems
      );
    }

    removedMachines.forEach((machine) => {
      const snapshot = resourcesById.get(machine.recursoId);

      if (!snapshot?.exists()) return;

      const reservations = { ...(snapshot.data().reservas ?? {}) };

      if (reservations[reservationKey] === solicitation.id) {
        delete reservations[reservationKey];
      }

      transaction.update(snapshot.ref, {
        reservas: reservations,
        updatedAt: serverTimestamp(),
      });
    });

    changedToolIds.forEach((resourceId) => {
      const snapshot = resourcesById.get(resourceId);

      if (!snapshot?.exists()) return;

      const stockReservations = {
        ...(snapshot.data().reservasEstoque ?? {}),
      };
      const periodReservations = {
        ...getStockReservations(snapshot.data(), reservationKey),
      };
      const newQuantity =
        retainedTools.find((tool) => tool.recursoId === resourceId)
          ?.quantidade ?? 0;

      if (newQuantity > 0) {
        periodReservations[solicitation.id] = newQuantity;
      } else {
        delete periodReservations[solicitation.id];
      }

      if (Object.keys(periodReservations).length > 0) {
        stockReservations[reservationKey] = periodReservations;
      } else {
        delete stockReservations[reservationKey];
      }

      transaction.update(snapshot.ref, {
        reservasEstoque: stockReservations,
        updatedAt: serverTimestamp(),
      });
    });

    const hasPendingItems =
      addedMachines.length > 0 || increasedTools.length > 0;
    const changeRequestedAt = Timestamp.now();
    const laboratoriosIds = [
      ...new Set(
        retainedMachines
          .map((machine) => machine.laboratorioId)
          .filter(Boolean)
      ),
    ];

    transaction.update(solicitationRef, {
      atividade: draft.atividade,
      observacoes: draft.observacoes,
      maquinas: retainedMachines,
      ferramentas: retainedTools,
      laboratoriosIds,
      prioridade: calculateSolicitationPriority(
        solicitation.dataUtilizacao
      ),
      status: hasPendingItems ? "ALTERACAO_PENDENTE" : "APROVADA",
      analiseAlteracao: hasPendingItems
        ? {
            solicitadaPorId: professor.id,
            solicitadaPorNome: professor.nomeCompleto,
            solicitadaEm: changeRequestedAt,
            maquinas: addedMachines,
            ferramentas: increasedTools,
          }
        : deleteField(),
      updatedAt: serverTimestamp(),
    });

    transaction.set(auditRef, {
      ...createAuditEventData({
        solicitationId: solicitation.id,
        type: "ALTERACAO",
        actor: {
          id: professor.id,
          nome: professor.nomeCompleto,
          perfil: professor.tipoUsuario,
        },
        summary: hasPendingItems
          ? `Solicitação alterada: ${addedMachines.length + increasedTools.length} acréscimo(s) enviado(s) para análise e ${removedMachines.length + reducedTools.length} redução(ões) aplicada(s)`
          : `Solicitação aprovada alterada com ${removedMachines.length + reducedTools.length} redução(ões)`,
        previousStatus: solicitation.status,
        newStatus: hasPendingItems
          ? "ALTERACAO_PENDENTE"
          : "APROVADA",
        items: [
          ...addedMachines.map((machine) => ({
            recursoId: machine.recursoId,
            nome: machine.nome,
            tipo: "MAQUINA" as const,
            quantidade: 1,
          })),
          ...increasedTools.map((tool) => ({
            recursoId: tool.recursoId,
            nome: tool.nome,
            tipo: "FERRAMENTA" as const,
            quantidade: tool.quantidadeAdicional,
          })),
          ...removedMachines.map((machine) => ({
            recursoId: machine.recursoId,
            nome: machine.nome,
            tipo: "MAQUINA" as const,
            quantidade: 1,
          })),
          ...reducedTools.map((tool) => ({
            recursoId: tool.recursoId,
            nome: tool.nome,
            tipo: "FERRAMENTA" as const,
            quantidade: tool.reduction,
          })),
        ],
      }),
      createdAt: serverTimestamp(),
    });
    if (hasPendingItems) {
      setNotifications(transaction, employeeIds, auditRef.id, {
        tipo: "ALTERACAO_PENDENTE",
        solicitacaoId: solicitation.id,
        titulo: "Alteração aguardando análise",
        mensagem: `${professor.nomeCompleto} adicionou ${
          addedMachines.length + increasedTools.length
        } recurso(s) para reaprovação.`,
      });
    }
  });
}

export async function decideSolicitationChangeItem(
  id: string,
  itemType: "MAQUINA" | "FERRAMENTA",
  resourceId: string,
  approved: boolean,
  funcionario: AppUser,
  reason?: string
): Promise<void> {
  if (!approved && !reason?.trim()) {
    throw new SolicitationBusinessError(
      "INVALID_CHANGE",
      "Informe o motivo da recusa."
    );
  }

  const solicitationRef = doc(db, COLLECTION_NAME, id);
  const auditRef = doc(
    collection(solicitationRef, AUDIT_COLLECTION_NAME)
  );
  const occupiedSolicitationsSnapshot = await getDocs(
    collection(db, COLLECTION_NAME)
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

    assertStatus(
      solicitation.status,
      "ALTERACAO_PENDENTE",
      "analisar a alteração"
    );

    const review = solicitation.analiseAlteracao;

    if (!review) {
      throw new SolicitationBusinessError(
        "INVALID_CHANGE",
        "Esta solicitação não possui alteração pendente."
      );
    }

    const items =
      itemType === "MAQUINA" ? review.maquinas : review.ferramentas;
    const item = items.find(
      (candidate) => candidate.recursoId === resourceId
    );

    if (!item || item.status !== "PENDENTE") {
      throw new SolicitationBusinessError(
        "INVALID_CHANGE",
        "Este item já foi analisado ou não está mais disponível."
      );
    }

    const resourceRef = doc(db, RESOURCE_COLLECTION_NAME, resourceId);
    const resourceSnapshot = approved
      ? await transaction.get(resourceRef)
      : null;
    const reservationKey = getReservationKey(
      solicitation.dataUtilizacao,
      solicitation.turno
    );
    let approvedMachines = [...solicitation.maquinas];
    let approvedTools = [...solicitation.ferramentas];

    if (approved) {
      if (!resourceSnapshot?.exists()) {
        throw new SolicitationBusinessError(
          "RESOURCE_NOT_FOUND",
          "O recurso não foi encontrado."
        );
      }

      if (resourceSnapshot.data().status === "MANUTENCAO") {
        throw new SolicitationBusinessError(
          itemType === "MAQUINA"
            ? "MACHINE_CONFLICT"
            : "INSUFFICIENT_STOCK",
          `${item.nome} está em manutenção e não pode ser aprovado.`,
          [item.nome]
        );
      }

      if (itemType === "MAQUINA") {
        const machine = item as SolicitationChangeMachine;
        const allocatedMachineIds = getAllocatedMachineIds(
          occupiedSolicitationsSnapshot.docs,
          solicitation.dataUtilizacao,
          solicitation.turno,
          solicitation.id
        );
        const reservations = {
          ...(resourceSnapshot.data().reservas ?? {}),
        };
        const reservedBy = reservations[reservationKey];

        if (
          allocatedMachineIds.has(resourceId) ||
          (reservedBy && reservedBy !== solicitation.id)
        ) {
          throw new SolicitationBusinessError(
            "MACHINE_CONFLICT",
            `A máquina ${machine.nome} não está mais disponível neste período.`,
            [machine.nome]
          );
        }

        reservations[reservationKey] = solicitation.id;
        transaction.update(resourceRef, {
          reservas: reservations,
          updatedAt: serverTimestamp(),
        });
        approvedMachines.push({
          recursoId: machine.recursoId,
          nome: machine.nome,
          laboratorioId: machine.laboratorioId ?? null,
          devolvida: false,
        });
      } else {
        const tool = item as SolicitationChangeTool;
        const approvedQuantity = Number(
          approvedTools.find(
            (approvedTool) =>
              approvedTool.recursoId === tool.recursoId
          )?.quantidade ?? 0
        );
        const allocatedToolsByResourceId =
          getToolAllocationsByResourceId(
            occupiedSolicitationsSnapshot.docs,
            solicitation.dataUtilizacao,
            solicitation.turno,
            solicitation.id
          );
        const availability = calculateToolPeriodAvailability(
          resourceId,
          resourceSnapshot.data(),
          reservationKey,
          allocatedToolsByResourceId.get(resourceId) ?? 0,
          solicitation.id
        );
        const newQuantity =
          approvedQuantity + tool.quantidadeAdicional;

        if (newQuantity > availability.availableQuantity) {
          throw new SolicitationBusinessError(
            "INSUFFICIENT_STOCK",
            `A ferramenta ${tool.nome} não possui mais quantidade suficiente neste período.`,
            [tool.nome]
          );
        }

        const stockReservations = {
          ...(resourceSnapshot.data().reservasEstoque ?? {}),
        };
        const periodReservations = {
          ...getStockReservations(
            resourceSnapshot.data(),
            reservationKey
          ),
          [solicitation.id]: newQuantity,
        };

        transaction.update(resourceRef, {
          reservasEstoque: {
            ...stockReservations,
            [reservationKey]: periodReservations,
          },
          updatedAt: serverTimestamp(),
        });

        const existingToolIndex = approvedTools.findIndex(
          (approvedTool) => approvedTool.recursoId === resourceId
        );

        if (existingToolIndex >= 0) {
          approvedTools[existingToolIndex] = {
            ...approvedTools[existingToolIndex],
            quantidade: newQuantity,
          };
        } else {
          approvedTools.push({
            recursoId: tool.recursoId,
            nome: tool.nome,
            quantidade: tool.quantidadeAdicional,
            quantidadeDevolvida: 0,
          });
        }
      }
    }

    const decision = {
      responsavelId: funcionario.id,
      responsavelNome: funcionario.nomeCompleto,
      decididaEm: Timestamp.now(),
      ...(approved ? {} : { motivo: reason?.trim() }),
    };
    const updatedMachines = review.maquinas.map((machine) =>
      itemType === "MAQUINA" && machine.recursoId === resourceId
        ? {
            ...machine,
            status: approved ? "APROVADO" as const : "RECUSADO" as const,
            decisao: decision,
          }
        : machine
    );
    const updatedTools = review.ferramentas.map((tool) =>
      itemType === "FERRAMENTA" && tool.recursoId === resourceId
        ? {
            ...tool,
            status: approved ? "APROVADO" as const : "RECUSADO" as const,
            decisao: decision,
          }
        : tool
    );
    const hasPendingItems = [...updatedMachines, ...updatedTools].some(
      (changeItem) => changeItem.status === "PENDENTE"
    );
    const laboratoriosIds = [
      ...new Set(
        approvedMachines
          .map((machine) => machine.laboratorioId)
          .filter(Boolean)
      ),
    ];

    transaction.update(solicitationRef, {
      maquinas: approvedMachines,
      ferramentas: approvedTools,
      laboratoriosIds,
      analiseAlteracao: {
        ...review,
        maquinas: updatedMachines,
        ferramentas: updatedTools,
      },
      status: hasPendingItems ? "ALTERACAO_PENDENTE" : "APROVADA",
      updatedAt: serverTimestamp(),
    });

    transaction.set(auditRef, {
      ...createAuditEventData({
        solicitationId: solicitation.id,
        type: approved
          ? "ALTERACAO_ITEM_APROVADO"
          : "ALTERACAO_ITEM_RECUSADO",
        actor: {
          id: funcionario.id,
          nome: funcionario.nomeCompleto,
          perfil: funcionario.tipoUsuario,
        },
        summary: approved
          ? "Item da alteração aprovado"
          : "Item da alteração recusado",
        previousStatus: solicitation.status,
        newStatus: hasPendingItems
          ? "ALTERACAO_PENDENTE"
          : "APROVADA",
        reason: approved ? undefined : reason?.trim(),
        items: [{
          recursoId: resourceId,
          nome: item.nome,
          tipo: itemType,
          quantidade:
            itemType === "MAQUINA"
              ? 1
              : (item as SolicitationChangeTool).quantidadeAdicional,
        }],
      }),
      createdAt: serverTimestamp(),
    });

    if (solicitation.professorId !== funcionario.id) {
      setNotifications(
        transaction,
        [solicitation.professorId],
        auditRef.id,
        {
          tipo: approved
            ? "ALTERACAO_ITEM_APROVADO"
            : "ALTERACAO_ITEM_RECUSADO",
          solicitacaoId: solicitation.id,
          titulo: approved
            ? "Item da alteração aprovado"
            : "Item da alteração recusado",
          mensagem: approved
            ? `${item.nome} foi aprovado e incorporado à solicitação.`
            : `${item.nome} foi recusado. Motivo: ${reason?.trim()}`,
        }
      );
    }
  });
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
    const conflictingMachineNames = new Set<string>();
    const allocatedMachineIds = getAllocatedMachineIds(
      occupiedSolicitationsSnapshot.docs,
      solicitation.dataUtilizacao,
      solicitation.turno,
      solicitation.id
    );

    solicitation.maquinas.forEach((machine) => {
      if (allocatedMachineIds.has(machine.recursoId)) {
        conflictingMachineNames.add(machine.nome);
      }
    });

    const allocatedToolsByResourceId = getToolAllocationsByResourceId(
      occupiedSolicitationsSnapshot.docs,
      solicitation.dataUtilizacao,
      solicitation.turno,
      solicitation.id
    );

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

      if (reservationSnapshot.data().status === "MANUTENCAO") {
        conflictingMachineNames.add(
          `${reservation.machine.nome} (em manutenção)`
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

      if (toolSnapshot.data().status === "MANUTENCAO") {
        unavailableTools.push(`${requestedTool.nome} (em manutenção)`);
        return;
      }

      const availability = calculateToolPeriodAvailability(
        toolSnapshot.id,
        toolSnapshot.data(),
        reservationKey,
        allocatedToolsByResourceId.get(requestedTool.recursoId) ?? 0
      );

      if (availability.availableQuantity < requestedTool.quantidade) {
        unavailableTools.push(
          `${requestedTool.nome} (disponível no período: ${Math.max(
            availability.availableQuantity,
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
    if (solicitation.professorId !== funcionario.id) {
      setNotifications(
        transaction,
        [solicitation.professorId],
        auditRef.id,
        {
          tipo: "SOLICITACAO_APROVADA",
          solicitacaoId: solicitation.id,
          titulo: "Solicitação aprovada",
          mensagem: "Sua solicitação foi aprovada pela ferramentaria.",
        }
      );
    }
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
    if (solicitation.professorId !== funcionario.id) {
      setNotifications(
        transaction,
        [solicitation.professorId],
        auditRef.id,
        {
          tipo: "SOLICITACAO_RECUSADA",
          solicitacaoId: solicitation.id,
          titulo: "Solicitação recusada",
          mensagem: `Sua solicitação foi recusada. Motivo: ${motivo}`,
        }
      );
    }
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
      transaction.set(
        doc(collection(toolReference.reference, AUDIT_COLLECTION_NAME)),
        {
          ...createResourceAuditEventData({
            resourceId: requestedTool.recursoId,
            resourceName: requestedTool.nome,
            resourceType: "FERRAMENTA",
            type: "ESTOQUE_SAIDA",
            actor: {
              id: funcionario.id,
              nome: funcionario.nomeCompleto,
              perfil: funcionario.tipoUsuario,
            },
            summary: `${requestedTool.quantidade} unidade(s) de ${requestedTool.nome} foram retiradas.`,
            changes: [
              {
                campo: "Quantidade disponível",
                valorAnterior: availableQuantity,
                valorNovo: availableQuantity - requestedTool.quantidade,
              },
            ],
            quantity: requestedTool.quantidade,
            solicitationId: solicitation.id,
          }),
          createdAt: serverTimestamp(),
        }
      );
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
    if (solicitation.professorId !== funcionario.id) {
      setNotifications(
        transaction,
        [solicitation.professorId],
        auditRef.id,
        {
          tipo: "RETIRADA_REGISTRADA",
          solicitacaoId: solicitation.id,
          titulo: "Retirada registrada",
          mensagem:
            "A retirada dos recursos da sua solicitação foi registrada.",
        }
      );
    }
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
      const newAvailableQuantity = Math.min(
        availableQuantity + returnedTool.quantity,
        totalQuantity
      );

      transaction.set(
        doc(collection(toolReference.reference, AUDIT_COLLECTION_NAME)),
        {
          ...createResourceAuditEventData({
            resourceId: requestedTool.recursoId,
            resourceName: requestedTool.nome,
            resourceType: "FERRAMENTA",
            type: "ESTOQUE_ENTRADA",
            actor: {
              id: funcionario.id,
              nome: funcionario.nomeCompleto,
              perfil: funcionario.tipoUsuario,
            },
            summary: `${returnedTool.quantity} unidade(s) de ${requestedTool.nome} retornaram ao estoque.`,
            changes: [
              {
                campo: "Quantidade disponível",
                valorAnterior: availableQuantity,
                valorNovo: newAvailableQuantity,
              },
            ],
            quantity: returnedTool.quantity,
            solicitationId: solicitation.id,
          }),
          createdAt: serverTimestamp(),
        }
      );
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
    if (solicitation.professorId !== funcionario.id) {
      setNotifications(
        transaction,
        [solicitation.professorId],
        auditRef.id,
        {
          tipo: allReturned
            ? "DEVOLUCAO_INTEGRAL"
            : "DEVOLUCAO_PARCIAL",
          solicitacaoId: solicitation.id,
          titulo: allReturned
            ? "Devolução concluída"
            : "Devolução parcial registrada",
          mensagem: allReturned
            ? "Todos os recursos foram devolvidos e a solicitação foi encerrada."
            : "Parte dos recursos foi devolvida. Ainda existem itens pendentes.",
        }
      );
    }
  });
}

export type ProfessorHomeData = {
  pendentes: Solicitation[];
  emUso: Solicitation[];
  proximasAprovadas: Solicitation[];
};

function parseDateBR(value: string) {
  if (!value) return 0;
  const parts = value.split("/");
  if (parts.length !== 3) return 0;
  return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
}

export async function getProfessorHomeData(
  professorId: string
): Promise<ProfessorHomeData> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("professorId", "==", professorId)
  );

  const snapshot = await getDocs(q);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const todayTime = now.getTime();
  
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
  const nextWeekTime = todayTime + sevenDaysInMs;

  const pendentes: Solicitation[] = [];
  const emUso: Solicitation[] = [];
  const proximasAprovadas: Solicitation[] = [];

  snapshot.docs.forEach((docSnap) => {
    const solicitation = mapSolicitation(docSnap.id, docSnap.data());
    const useDate = parseDateBR(solicitation.dataUtilizacao);

    if (solicitation.status === "EM_USO") {
      emUso.push(solicitation);
    }

    if (solicitation.status === "PENDENTE" || solicitation.status === "ALTERACAO_PENDENTE") {
      if (useDate >= todayTime && useDate <= nextWeekTime) {
        pendentes.push(solicitation);
      }
    }

    if (solicitation.status === "APROVADA") {
      if (useDate >= todayTime && useDate <= nextWeekTime) {
        proximasAprovadas.push(solicitation);
      }
    }
  });

  const sortByUseDate = (a: Solicitation, b: Solicitation) =>
    parseDateBR(a.dataUtilizacao) - parseDateBR(b.dataUtilizacao);

  const sortByCreatedAtDesc = (a: Solicitation, b: Solicitation) => {
    const aTime = (a.createdAt as any)?.seconds || 0;
    const bTime = (b.createdAt as any)?.seconds || 0;
    return bTime - aTime;
  };

  pendentes.sort(sortByCreatedAtDesc);
  proximasAprovadas.sort(sortByUseDate);
  emUso.sort((a, b) => {
    if (a.atrasada && !b.atrasada) return -1;
    if (!a.atrasada && b.atrasada) return 1;
    return sortByUseDate(a, b);
  });

  return { pendentes, emUso, proximasAprovadas };
}
