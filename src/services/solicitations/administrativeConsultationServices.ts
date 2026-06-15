import {
  ResourceAllocation,
  SolicitationHistoryEntry,
} from "../../types/AdministrativeConsultation";
import {
  Solicitation,
  SolicitationAuditEvent,
  SolicitationAuditEventType,
  SolicitationTimestamp,
} from "../../types/Solicitation";
import { listSolicitationAuditEvents } from "./solicitationAuditServices";
import {
  isSolicitationOverdue,
  listSolicitations,
} from "./solicitationServices";

const ALLOCATION_STATUSES = new Set([
  "APROVADA",
  "ALTERACAO_PENDENTE",
  "EM_USO",
]);

const HISTORY_STATUSES = new Set(["ENCERRADA", "RECUSADA", "CANCELADA"]);

const TERMINAL_EVENT_BY_STATUS: Partial<
  Record<Solicitation["status"], SolicitationAuditEventType>
> = {
  ENCERRADA: "DEVOLUCAO_INTEGRAL",
  RECUSADA: "RECUSA",
  CANCELADA: "CANCELAMENTO",
};

export function getSolicitationCode(id: string) {
  return `SL-${id.slice(0, 4).toUpperCase()}`;
}

export function parseBrazilianDate(value: string) {
  const [day, month, year] = value.split("/").map(Number);
  const timestamp = new Date(year, month - 1, day).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function getTimestampMillis(
  timestamp?: SolicitationTimestamp | null
) {
  if (!timestamp) return 0;
  if (timestamp.toDate) return timestamp.toDate().getTime();
  return timestamp.seconds * 1000;
}

function getFallbackTerminalData(solicitation: Solicitation) {
  if (solicitation.status === "ENCERRADA") {
    return {
      timestamp: solicitation.devolvidaEm,
      responsibleName:
        solicitation.devolvidaPorNome ?? "Funcionário não identificado",
    };
  }

  if (solicitation.status === "RECUSADA") {
    return {
      timestamp: solicitation.recusadaEm,
      responsibleName:
        solicitation.recusadaPorNome ?? "Funcionário não identificado",
    };
  }

  return {
    timestamp: solicitation.canceladaEm,
    responsibleName:
      solicitation.canceladaPorNome ?? solicitation.professorNome,
  };
}

function findTerminalEvent(
  solicitation: Solicitation,
  events: SolicitationAuditEvent[]
) {
  const terminalType = TERMINAL_EVENT_BY_STATUS[solicitation.status];

  return [...events]
    .reverse()
    .find((event) => event.tipo === terminalType);
}

export function buildResourceAllocations(
  solicitations: readonly Solicitation[],
  now = new Date()
): ResourceAllocation[] {
  return solicitations.flatMap((solicitation) => {
    if (!ALLOCATION_STATUSES.has(solicitation.status)) {
      return [];
    }

    const situacao =
      solicitation.status === "EM_USO" ? "RETIRADO" : "RESERVADO";
    const atrasado = isSolicitationOverdue(solicitation, now);
    const common = {
      situacao,
      solicitacaoId: solicitation.id,
      professorId: solicitation.professorId,
      professorNome: solicitation.professorNome,
      dataUtilizacao: solicitation.dataUtilizacao,
      turno: solicitation.turno,
      atrasado,
    } as const;

    const machines: ResourceAllocation[] = solicitation.maquinas
      .filter(
        (machine) =>
          solicitation.status !== "EM_USO" || machine.devolvida !== true
      )
      .map((machine) => ({
        ...common,
        id: `${solicitation.id}-MAQUINA-${machine.recursoId}`,
        recursoId: machine.recursoId,
        recursoNome: machine.nome,
        recursoTipo: "MAQUINA",
        quantidade: 1,
      }));

    const tools: ResourceAllocation[] = solicitation.ferramentas.flatMap(
      (tool) => {
        const total = Number(tool.quantidade) || 0;
        const returned =
          solicitation.status === "EM_USO"
            ? Number(tool.quantidadeDevolvida ?? 0)
            : 0;
        const remaining = Math.max(0, total - returned);

        if (remaining === 0) {
          return [];
        }

        return [
          {
            ...common,
            id: `${solicitation.id}-FERRAMENTA-${tool.recursoId}`,
            recursoId: tool.recursoId,
            recursoNome: tool.nome,
            recursoTipo: "FERRAMENTA",
            quantidade: remaining,
          },
        ];
      }
    );

    return [...machines, ...tools];
  });
}

export async function buildSolicitationHistory(
  solicitations: readonly Solicitation[]
): Promise<SolicitationHistoryEntry[]> {
  const historicalSolicitations = solicitations.filter((solicitation) =>
    HISTORY_STATUSES.has(solicitation.status)
  );

  return Promise.all(
    historicalSolicitations.map(async (solicitation) => {
      const auditEvents = await listSolicitationAuditEvents(solicitation);
      const terminalEvent = findTerminalEvent(solicitation, auditEvents);
      const fallback = getFallbackTerminalData(solicitation);
      const responsibleNames = [
        ...new Set(
          auditEvents
            .map((event) => event.responsavel?.nome)
            .filter((name): name is string => Boolean(name))
        ),
      ];

      return {
        solicitation,
        auditEvents,
        responsibleNames,
        terminalEvent,
        terminalAt: terminalEvent?.createdAt ?? fallback.timestamp,
        terminalResponsibleName:
          terminalEvent?.responsavel?.nome ?? fallback.responsibleName,
      };
    })
  );
}

export async function loadAdministrativeConsultationData() {
  return listSolicitations();
}
