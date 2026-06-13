import {
  collection,
  DocumentData,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "../firebase/firebaseConfig";
import {
  AuditActor,
  Solicitation,
  SolicitationAuditEvent,
  SolicitationAuditEventType,
  SolicitationAuditItem,
  SolicitationStatus,
  SolicitationTimestamp,
} from "../../types/Solicitation";

export const AUDIT_COLLECTION_NAME = "eventosAuditoria";

const eventLabels: Record<SolicitationAuditEventType, string> = {
  CRIACAO: "Solicitação criada",
  ALTERACAO: "Solicitação alterada",
  ALTERACAO_ITEM_APROVADO: "Item da alteração aprovado",
  ALTERACAO_ITEM_RECUSADO: "Item da alteração recusado",
  APROVACAO: "Solicitação aprovada",
  RECUSA: "Solicitação recusada",
  CANCELAMENTO: "Solicitação cancelada",
  RETIRADA: "Retirada registrada",
  DEVOLUCAO_PARCIAL: "Devolução parcial registrada",
  DEVOLUCAO_INTEGRAL: "Devolução integral registrada",
};

export function getAuditEventLabel(type: SolicitationAuditEventType) {
  return eventLabels[type];
}

export function getSolicitationAuditItems(
  solicitation: Pick<Solicitation, "maquinas" | "ferramentas">
): SolicitationAuditItem[] {
  return [
    ...(solicitation.maquinas ?? []).map((machine) => ({
      recursoId: machine.recursoId,
      nome: machine.nome,
      tipo: "MAQUINA" as const,
      quantidade: 1,
    })),
    ...(solicitation.ferramentas ?? []).map((tool) => ({
      recursoId: tool.recursoId,
      nome: tool.nome,
      tipo: "FERRAMENTA" as const,
      quantidade: Number(tool.quantidade) || 0,
    })),
  ];
}

export function createAuditEventData({
  solicitationId,
  type,
  actor,
  summary,
  previousStatus,
  newStatus,
  items,
  reason,
}: {
  solicitationId: string;
  type: SolicitationAuditEventType;
  actor: AuditActor;
  summary?: string;
  previousStatus?: SolicitationStatus;
  newStatus?: SolicitationStatus;
  items?: SolicitationAuditItem[];
  reason?: string;
}) {
  return {
    solicitacaoId: solicitationId,
    tipo: type,
    resumo: summary ?? getAuditEventLabel(type),
    responsavel: actor,
    ...(previousStatus ? { statusAnterior: previousStatus } : {}),
    ...(newStatus ? { statusNovo: newStatus } : {}),
    ...(items?.length ? { itens: items } : {}),
    ...(reason ? { motivo: reason } : {}),
  };
}

function mapAuditEvent(id: string, data: DocumentData) {
  return {
    id,
    ...data,
  } as SolicitationAuditEvent;
}

function getTimestampMillis(timestamp?: SolicitationTimestamp | null) {
  if (!timestamp) return 0;
  if (timestamp.toDate) return timestamp.toDate().getTime();
  return timestamp.seconds * 1000;
}

function createLegacyEvent(
  solicitation: Solicitation,
  type: SolicitationAuditEventType,
  timestamp: SolicitationTimestamp | undefined,
  actor: AuditActor,
  options: {
    previousStatus?: SolicitationStatus;
    newStatus?: SolicitationStatus;
    reason?: string;
    items?: SolicitationAuditItem[];
  } = {}
): SolicitationAuditEvent | null {
  if (!timestamp) return null;

  return {
    id: `legacy-${type}`,
    solicitacaoId: solicitation.id,
    tipo: type,
    resumo: getAuditEventLabel(type),
    responsavel: actor,
    statusAnterior: options.previousStatus,
    statusNovo: options.newStatus,
    motivo: options.reason,
    itens: options.items,
    createdAt: timestamp,
    derivado: true,
  };
}

function getLegacyEvents(solicitation: Solicitation) {
  const professor: AuditActor = {
    id: solicitation.professorId,
    nome: solicitation.professorNome,
    perfil: "PROFESSOR",
  };
  const employee = (id?: string, name?: string): AuditActor => ({
    id: id ?? "desconhecido",
    nome: name ?? "Funcionário não identificado",
    perfil: "FUNCIONARIO",
  });
  const items = getSolicitationAuditItems(solicitation);

  return [
    createLegacyEvent(
      solicitation,
      "CRIACAO",
      solicitation.createdAt,
      professor,
      { newStatus: "PENDENTE", items }
    ),
    createLegacyEvent(
      solicitation,
      "APROVACAO",
      solicitation.aprovadaEm,
      employee(solicitation.aprovadaPorId, solicitation.aprovadaPorNome),
      { previousStatus: "PENDENTE", newStatus: "APROVADA" }
    ),
    createLegacyEvent(
      solicitation,
      "RECUSA",
      solicitation.recusadaEm,
      employee(solicitation.recusadaPorId, solicitation.recusadaPorNome),
      {
        previousStatus: "PENDENTE",
        newStatus: "RECUSADA",
        reason: solicitation.motivoRecusa,
      }
    ),
    createLegacyEvent(
      solicitation,
      "CANCELAMENTO",
      solicitation.canceladaEm,
      {
        id: solicitation.canceladaPorId ?? solicitation.professorId,
        nome: solicitation.canceladaPorNome ?? solicitation.professorNome,
        perfil: "PROFESSOR",
      },
      { previousStatus: "PENDENTE", newStatus: "CANCELADA" }
    ),
    createLegacyEvent(
      solicitation,
      "RETIRADA",
      solicitation.retiradaEm,
      employee(solicitation.retiradaPorId, solicitation.retiradaPorNome),
      {
        previousStatus: "APROVADA",
        newStatus: "EM_USO",
        items,
      }
    ),
    createLegacyEvent(
      solicitation,
      "DEVOLUCAO_INTEGRAL",
      solicitation.devolvidaEm,
      employee(solicitation.devolvidaPorId, solicitation.devolvidaPorNome),
      {
        previousStatus: "EM_USO",
        newStatus: "ENCERRADA",
        items,
      }
    ),
  ].filter(Boolean) as SolicitationAuditEvent[];
}

export async function listSolicitationAuditEvents(
  solicitation: Solicitation
): Promise<SolicitationAuditEvent[]> {
  const auditRef = collection(
    db,
    "solicitacoes",
    solicitation.id,
    AUDIT_COLLECTION_NAME
  );
  const snapshot = await getDocs(query(auditRef, orderBy("createdAt", "asc")));
  const persistedEvents = snapshot.docs.map((document) =>
    mapAuditEvent(document.id, document.data())
  );
  const persistedTypes = new Set(persistedEvents.map((event) => event.tipo));
  const legacyEvents = getLegacyEvents(solicitation).filter(
    (event) => !persistedTypes.has(event.tipo)
  );

  return [...persistedEvents, ...legacyEvents].sort(
    (a, b) =>
      getTimestampMillis(a.createdAt) - getTimestampMillis(b.createdAt)
  );
}
