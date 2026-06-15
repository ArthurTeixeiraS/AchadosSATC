import {
  Solicitation,
  SolicitationAuditEvent,
  SolicitationTimestamp,
} from "./Solicitation";

export type ResourceAllocationStatus = "RESERVADO" | "RETIRADO";

export interface ResourceAllocation {
  id: string;
  recursoId: string;
  recursoNome: string;
  recursoTipo: "MAQUINA" | "FERRAMENTA";
  quantidade: number;
  situacao: ResourceAllocationStatus;
  solicitacaoId: string;
  professorId: string;
  professorNome: string;
  dataUtilizacao: string;
  turno: Solicitation["turno"];
  atrasado: boolean;
}

export interface SolicitationHistoryEntry {
  solicitation: Solicitation;
  auditEvents: SolicitationAuditEvent[];
  responsibleNames: string[];
  terminalEvent?: SolicitationAuditEvent;
  terminalAt?: SolicitationTimestamp | null;
  terminalResponsibleName: string;
}
